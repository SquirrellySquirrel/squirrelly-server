import { Post } from '@prisma/client';
import { Inject, Service } from 'typedi';
import PostDao from '../db/dao/post.dao';
import NotFoundException from '../exception/not-found.exception';
import LocationService from './location.service';
import { LocationParams } from './model/location';
import { ExtendedPost, PostParams } from './model/post';
import PhotoService from './photo.service';
import PostLikeService from './post-like.service';
import { mapError } from './service-error-handler';

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
        @Inject() private readonly postDao: PostDao,
        @Inject() private readonly photoService: PhotoService,
        @Inject() private readonly postLikeService: PostLikeService,
        @Inject() private readonly locationService: LocationService,
    ) { }

    async getPosts(params: GetPostsParams): Promise<ExtendedPost[]> {
        if (!params.userId && !params.locationId) {
            const posts = await this.postDao.findLatest(params.publicOnly, params.count);
            if (params.withCover) {
                return this.extendPosts(posts);
            }
            return posts;
        }

        if (params.userId && params.locationId) {
            const posts = await this.postDao
                .findByUserAndLocation(params.userId, params.locationId, params.publicOnly, params.count);
            if (params.withCover) {
                return this.extendPosts(posts);
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

    private async getPostsByUser(userId: string, withCover: boolean, publicOnly: boolean, count?: number):
        Promise<ExtendedPost[]> {
        const posts = await this.postDao.findByUser(userId, publicOnly, count);
        if (withCover) {
            return this.extendPosts(posts);
        }
        return posts;
    }

    private async getPostsByLocation(locationId: string, withCover: boolean, publicOnly: boolean, count?: number):
        Promise<ExtendedPost[]> {
        const posts = await this.postDao.findByLocation(locationId, publicOnly, count);
        if (withCover) {
            return this.extendPosts(posts);
        }
        return posts;
    }

    async extendPosts(posts: Post[]): Promise<ExtendedPost[]> {
        return await Promise.all(posts.map(async (post) => {
            const cover = await this.photoService.getPostCover(post.id);
            const likes = (await this.postLikeService.getPostLikes(post.id)).likes;
            if (cover) {
                return { ...post, cover, likes };
            }
            return { ...post, likes };
        }));
    }

    async getPost(postId: string): Promise<ExtendedPost> {
        const post = await this.postDao.findById(postId);
        if (!post) {
            throw new NotFoundException('POST', { key: 'id', value: postId });
        }

        return { ...post, likes: (await this.postLikeService.getPostLikes(postId)).likes };
    }

    async getPostUnsafe(postId: string): Promise<ExtendedPost | null> {
        const post = await this.postDao.findById(postId);
        if (!post) {
            return null;
        }

        return { ...post, likes: (await this.postLikeService.getPostLikes(postId)).likes };
    }

    async savePost(userId: string, location: LocationParams, postParams: PostParams) {
        const locationId = await this.getLocationId(location);

        try {
            const post = await this.postDao.create(locationId, userId, postParams.occurred, postParams.public,
                postParams.description);
            return { id: post.id };
        } catch (err) {
            throw mapError(err);
        }
    }

    async updatePost(postId: string, location: LocationParams, postParams: PostParams) {
        await this.getPost(postId);

        const locationId = await this.getLocationId(location);

        try {
            await this.postDao.update(postId, locationId, postParams.occurred, postParams.public, postParams.description);
        } catch (err) {
            throw mapError(err);
        }
    }

    async deletePostAndPhotos(postId: string) {
        const post = await this.getPostUnsafe(postId);
        if (!post) return;

        this.deletePost(post.id);

        const photos = await this.photoService.getPhotosByPost(postId);
        if (photos) {
            try {
                this.photoService.removePhotosFromStorage(photos.map((photo) => photo.name));
            } catch (err) {
                console.log('Removing photos from storage failed.', err);
            }
        }
    }

    async deletePost(postId: string) {
        await this.postDao.delete(postId);
    }

    private async getLocationId(location: LocationParams): Promise<string> {
        const existingLocation = await this.locationService.getLocationByCoordinate(
            location.latitude, location.longitude);
        return existingLocation ? existingLocation.id : (await this.locationService.saveLocationIfNotExists(location)).id;
    }
}
