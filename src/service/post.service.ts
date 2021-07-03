import { Service } from 'typedi';
import { DeleteResult } from 'typeorm';
import { InjectRepository } from 'typeorm-typedi-extensions';
import Location from '../entity/location';
import Post from '../entity/post';
import NotFoundException from '../exception/not-found.exception';
import TypeORMException from '../exception/typeorm.exception';
import PostRepository from '../repository/post.repository';
import LocationService from './location.service';
import PhotoService from './photo.service';
import PostLikeService from './post-like.service';

type PostId = Pick<Post, 'id'>;

@Service()
export default class PostService {
    constructor(
        @InjectRepository() private readonly postRepository: PostRepository,
        private readonly photoService: PhotoService,
        private readonly postLikeService: PostLikeService,
        private readonly locationService: LocationService
    ) { }

    async getPosts(userId?: string, locationId?: string, count?: number, withCover = true): Promise<Post[]> {
        if (!userId && !locationId) {
            const posts = await this.postRepository.findLatest(count);
            if (withCover) {
                this.setPostCovers(posts);
            }
            return posts;
        }

        if (userId && locationId) {
            const posts = await this.postRepository.findByUserAndLocation(userId, locationId, count);
            if (withCover) {
                this.setPostCovers(posts);
            }
            return posts;
        }

        if (userId) {
            return await this.getPostsByUser(userId, count, withCover);
        }

        if (locationId) {
            return await this.getPostsByLocation(locationId, count, withCover);
        }

        return [];
    }

    private async getPostsByUser(userId: string, count?: number, withCover = true): Promise<Post[]> {
        const posts = await this.postRepository.findByUser(userId, count);
        if (withCover) {
            if (withCover) {
                this.setPostCovers(posts);
            }
        }
        return posts;
    }

    private async getPostsByLocation(locationId: string, count?: number, withCover = true): Promise<Post[]> {
        const posts = await this.postRepository.findByLocation(locationId, count);
        if (withCover) {
            this.setPostCovers(posts);
        }
        return posts;
    }

    async setPostCovers(posts: Post[]): Promise<Post[]> {
        for (const post of posts) {
            const cover = await this.photoService.getPostCover(post.id);
            if (cover) {
                post.cover = cover;
            }
        }
        return posts;
    }

    async getPost(postId: string): Promise<Post> {
        const post = await this.postRepository.findOneWithRelations(postId);
        if (!post) {
            throw new NotFoundException('Post', postId);
        }

        post.likes = (await this.postLikeService.getPostLikes(postId)).length;
        return post;
    }

    async getPostUnsafe(postId: string): Promise<Post | undefined> {
        const post = await this.postRepository.findOneWithRelations(postId);
        if (!post) {
            return undefined;
        }

        post.likes = (await this.postLikeService.getPostLikes(postId)).length;
        return post;
    }

    async savePost(userId: string, location: Location, isPublic: boolean, created: Date, description: string):
        Promise<PostId> {
        const locationId = await this.getLocationId(location);

        const post = await this.postRepository.save({
            location: { id: locationId },
            creator: { id: userId },
            public: isPublic,
            created: created,
            updated: new Date(),
            description: description,
        }).catch((err: Error) => {
            throw new TypeORMException(err.message);
        });
        return { id: post.id };
    }

    async updatePost(postId: string, location: Location, isPublic: boolean, created: Date, description: string):
        Promise<PostId> {
        const locationId = await this.getLocationId(location);

        const post = await this.postRepository.save({
            id: postId,
            location: { id: locationId },
            public: isPublic,
            created: created,
            updated: new Date(),
            description: description,
        }).catch((err: Error) => {
            throw new TypeORMException(err.message);
        });
        return { id: post.id };
    }

    // ignore if post does not exist
    async deletePostAndPhotos(postId: string) {
        const post = await this.getPostUnsafe(postId);
        if (!post) return;

        await this.deletePost(post.id);

        if (post.photos) {
            this.photoService.removePhotosFromStorage(post.photos.map((photo) => photo.path))
                .catch((err: Error) => console.log('Removing photos from storage failed: ' + err.message));
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