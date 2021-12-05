import { Service } from 'typedi';
import { DeleteResult } from 'typeorm';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { EntityType } from '../entity/entity-type';
import Location from '../entity/location';
import Post from '../entity/post';
import NotFoundException from '../exception/not-found.exception';
import PostRepository from '../repository/post.repository';
import LocationService from './location.service';
import PhotoService from './photo.service';
import PostLikeService from './post-like.service';
import { mapError } from './service-error-handler';

type PostId = Pick<Post, 'id'>;

type GetPostsParams = {
    userId?: string;
    locationId?: string;
    count?: number;
    withCover: boolean;
    publicOnly: boolean;
}

@Service()
export default class PostService {
    constructor(
        @InjectRepository() private readonly postRepository: PostRepository,
        private readonly photoService: PhotoService,
        private readonly postLikeService: PostLikeService,
        private readonly locationService: LocationService,
    ) { }

    async getPosts(params: GetPostsParams): Promise<Post[]> {
        if (!params.userId && !params.locationId) {
            const posts = await this.postRepository.findLatest(params.publicOnly, params.count);
            if (params.withCover) {
                return this.withPostCovers(posts);
            }
            return posts;
        }

        if (params.userId && params.locationId) {
            const posts = await this.postRepository
                .findByUserAndLocation(params.userId, params.locationId, params.publicOnly, params.count);
            if (params.withCover) {
                return this.withPostCovers(posts);
            }
            return posts;
        }

        if (params.userId) {
            return await this.getPostsByUser(params.userId, params.withCover, params.publicOnly, params.count);
        }

        if (params.locationId) {
            return await this.getPostsByLocation(params.locationId, params.withCover, params.publicOnly, params.count);
        }

        return [];
    }

    private async getPostsByUser(userId: string, withCover: boolean, publicOnly: boolean, count?: number): Promise<Post[]> {
        const posts = await this.postRepository.findByUser(userId, publicOnly, count);
        if (withCover) {
            return this.withPostCovers(posts);
        }
        return posts;
    }

    private async getPostsByLocation(locationId: string, withCover: boolean, publicOnly: boolean, count?: number)
        : Promise<Post[]> {
        const posts = await this.postRepository.findByLocation(locationId, publicOnly, count);
        if (withCover) {
            return this.withPostCovers(posts);
        }
        return posts;
    }

    async withPostCovers(posts: Post[]): Promise<Post[]> {
        return await Promise.all(posts.map(async (post) => {
            const cover = await this.photoService.getPostCover(post.id);
            if (cover) {
                post.cover = cover;
            }
            return post;
        }));
    }

    async getPost(postId: string): Promise<Post> {
        const post = await this.postRepository.findOneWithRelations(postId);
        if (!post) {
            throw new NotFoundException(EntityType.POST, { key: 'id', value: postId });
        }

        post.likes = (await this.postLikeService.getPostLikes(postId)).likes;
        return post;
    }

    async getPostUnsafe(postId: string): Promise<Post | undefined> {
        const post = await this.postRepository.findOneWithRelations(postId);
        if (!post) {
            return undefined;
        }

        post.likes = (await this.postLikeService.getPostLikes(postId)).likes;
        return post;
    }

    async savePost(userId: string, location: Location, isPublic: boolean, created: Date, description: string):
        Promise<PostId> {
        const locationId = await this.getLocationId(location);

        try {
            const post = await this.postRepository.save({
                location: { id: locationId },
                creator: { id: userId },
                public: isPublic,
                created: created,
                updated: new Date(),
                description: description,
            });
            return { id: post.id };
        } catch (err) {
            throw mapError(err);
        }
    }

    async updatePost(postId: string, location: Location, isPublic: boolean, created: Date, description: string) {
        const locationId = await this.getLocationId(location);

        try {
            await this.postRepository.save({
                id: postId,
                location: { id: locationId },
                public: isPublic,
                created: created,
                updated: new Date(),
                description: description,
            });
        } catch (err) {
            throw mapError(err);
        }
    }

    // ignore if post does not exist
    async deletePostAndPhotos(postId: string) {
        const post = await this.getPostUnsafe(postId);
        if (!post) return;

        await this.deletePost(post.id);

        if (post.photos) {
            try {
                this.photoService.removePhotosFromStorage(post.photos.map((photo) => photo.name));
            } catch (err) {
                console.log('Removing photos from storage failed.', err);
            }
        }
    }

    async deletePost(postId: string): Promise<DeleteResult> {
        return await this.postRepository.delete(postId);
    }

    private async getLocationId(location: Location): Promise<string> {
        if (location.id) {
            return location.id;
        }
        const existingLocation = await this.locationService.getLocationByCoordinate(
            location.latitude, location.longitude);
        return existingLocation ? existingLocation.id : (await this.locationService.saveLocation(location)).id;
    }
}