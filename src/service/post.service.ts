import { Service } from 'typedi';
import { InjectRepository } from 'typeorm-typedi-extensions';
import Location from "../entity/location";
import Photo from "../entity/photo";
import Post from "../entity/post";
import NotFoundException from '../exception/not-found.exception';
import TypeORMException from '../exception/typeorm.exception';
import PostRepository from "../repository/post.repository";
import LocationService from './location.service';
import PhotoService from "./photo.service";
import PostLikeService from "./post-like.service";

@Service()
export default class PostService {
    constructor(
        @InjectRepository() private readonly postRepository: PostRepository,
        private readonly photoService: PhotoService,
        private readonly postLikeService: PostLikeService,
        private readonly locationService: LocationService
    ) { }

    async getPosts(count?: number, withCover = true): Promise<Post[]> {
        const posts = await this.postRepository.findLatest(count);
        if (withCover) {
            for (const post of posts) {
                const cover = await this.photoService.getPostCover(post.id);
                if (cover) {
                    post.cover = cover;
                }
            }
        }
        return posts;
    }

    async getPostsByUser(userId: string, count?: number, withCover = true): Promise<Post[]> {
        const posts = await this.postRepository.findByUser(userId, count);
        if (withCover) {
            for (const post of posts) {
                const cover = await this.photoService.getPostCover(post.id);
                if (cover) {
                    post.cover = cover;
                }
            }
        }
        return posts;
    }

    async getPostsByLocation(locationId: string, count?: number, withCover = true): Promise<Post[]> {
        const posts = await this.postRepository.findByLocation(locationId, count);
        if (withCover) {
            for (const post of posts) {
                const cover = await this.photoService.getPostCover(post.id);
                if (cover) {
                    post.cover = cover;
                }
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

    async createPostAndPhotos(userId: string, location: Location, isPublic: boolean, created: Date, description: string, photos: Photo[]): Promise<any> {
        const postId = (await this.createPost(userId, location, isPublic, created, description, photos)).id;
        await this.savePhotos(photos, postId);
        return { id: postId };
    }

    async createPost(userId: string, location: Location, isPublic: boolean, created: Date, description: string, photos: Photo[]): Promise<Post> {
        const locationId = await this.getLocationId(location);

        return await this.postRepository.save({
            location: { id: locationId },
            creator: { id: userId },
            public: isPublic,
            created: created,
            updated: new Date(),
            description: description,
            photos: photos
        }).catch((err: Error) => {
            throw new TypeORMException(err.message);
        });
    }

    private async savePhotos(photos: Photo[], postId: string) {
        const photoPaths = photos.map(photo => photo.path);
        await this.photoService.addPhotosToStorage(photoPaths).catch((err: Error) => {
            console.warn("Saving photos to storage failed, deleting post.");
            this.deletePostAndPhotos(postId);
        });
    }

    async updatePostAndPhotos(postId: string, location: Location, isPublic: boolean, created: Date, description: string, photos: Photo[]) {
        const post = await this.getPost(postId);

        await this.updatePost(postId, location, isPublic, created, description);

        await this.updatePhotos(post, photos);

        this.cleanupLocationFromDB(post.location.id);
    }

    async updatePost(postId: string, location: Location, isPublic: boolean, created: Date, description: string) {
        const locationId = await this.getLocationId(location);

        await this.postRepository.save({
            id: postId,
            location: { id: locationId },
            public: isPublic,
            created: created,
            updated: new Date(),
            description: description
        }).catch((err: Error) => {
            throw new TypeORMException(err.message);
        });
    }

    async updatePhotos(post: Post, photos: Photo[]) {
        const photosToAdd = this.photoService.identifyPhotosToAdd(post, photos);
        const photosToRemove = await this.photoService.identifyPhotosToRemove(post.id, photos);

        await this.updateDBPhotos(photosToAdd, photosToRemove);

        await this.updateStoragePhotos(photosToAdd, photosToRemove);
    }

    async updateDBPhotos(photosToAdd: Photo[], photosToRemove: Photo[]) {
        await this.photoService.updatePhotos(photosToAdd, photosToRemove);
    }

    private async updateStoragePhotos(photosToAdd: Photo[], photosToRemove: Photo[]) {
        await this.photoService.addPhotosToStorage(photosToAdd.map(photo => photo.path))
            .catch((err: Error) => console.log("Saving photos to storage failed"));
        this.photoService.removePhotosFromStorage(photosToRemove.map(photo => photo.path))
            .catch((err: Error) => console.log("Removing photos from storage failed"));
    }

    // ignore if post does not exist
    async deletePostAndPhotos(postId: string) {
        const post = await this.getPostUnsafe(postId);
        if (!post) return;

        await this.deletePost(post.id);

        if (post.photos) {
            this.removePhotos(post.photos);
        }
    }

    async deletePost(postId: string) {
        await this.postRepository.delete(postId);
    }

    private removePhotos(photos: Photo[]) {
        this.photoService.removePhotosFromStorage(photos.map(photo => photo.path))
            .catch((err: Error) => console.log("Removing photos from storage failed"));
    }

    private async getLocationId(location: Location): Promise<string> {
        if (location.id) {
            return location.id;
        }
        const existingLocation = await this.locationService.getLocationByCoordinate(location.latitude, location.longitude);
        return existingLocation ? existingLocation.id : (await this.locationService.saveLocation(location)).id;
    }

    private async cleanupLocationFromDB(locationId: string) {
        if ((await this.getPostsByLocation(locationId, undefined, false)).length == 0) {
            this.locationService.deleteLocation(locationId);
        }
    }
}