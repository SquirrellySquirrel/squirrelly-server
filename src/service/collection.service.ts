import { Inject, Service } from 'typedi';
import CollectionDao from '../db/dao/collection.dao';
import NotFoundException from '../exception/not-found.exception';
import { CollectionParams, CollectionWithPosts } from './model/collection';
import { ExtendedPost } from './model/post';
import PostService from './post.service';
import { mapError } from './service-error-handler';
import UserService from './user.service';

@Service()
export default class CollectionService {
    constructor(
        @Inject()
        private readonly collectionDao: CollectionDao,
        private readonly userService: UserService,
        private readonly postService: PostService
    ) { }

    async getCollection(collectionId: string, publicOnly: boolean): Promise<CollectionWithPosts> {
        const collection = await this.collectionDao.findByIdWithPosts(collectionId);
        if (!collection) {
            throw new NotFoundException('COLLECTION', { key: 'id', value: collectionId });
        }
        if (publicOnly) {
            const publicPosts = collection.posts.filter((post) => post.public);
            collection.posts = publicPosts;
        }
        return collection;
    }

    async getCollectionsByUser(userId: string, publicOnly: boolean): Promise<CollectionWithPosts[]> {
        await this.verifyUser(userId);

        const collections = await this.collectionDao.findByUserWithPosts(userId);
        if (publicOnly) {
            collections.map((collection) => {
                const publicPosts = collection.posts.filter((post) => post.public);
                collection.posts = publicPosts;
                return collection;
            });
        }
        return collections;
    }

    async createCollection(postIds: string[], userId: string, collectionParams: CollectionParams) {
        await this.verifyUser(userId);
        const posts = await (Promise.all((await this.getPosts(postIds))));

        try {
            const collection = await this.collectionDao.create(userId, posts, collectionParams.name,
                collectionParams.description);
            return { id: collection.id };
        } catch (err) {
            throw mapError(err);
        }
    }

    async updateCollection(collectionId: string, postIds: string[], collectionParams: CollectionParams) {
        const posts = await (Promise.all((await this.getPosts(postIds))));

        try {
            await this.collectionDao.update(collectionId, posts, collectionParams.name, collectionParams.description);
        } catch (err) {
            throw mapError(err);
        }
    }

    async deleteCollection(collectionId: string) {
        const collection = this.collectionDao.findById(collectionId);
        if (!collection) {
            return;
        }

        await this.collectionDao.delete(collectionId);
    }

    private async verifyUser(userId: string) {
        await this.userService.getUserById(userId);
    }

    private async getPosts(postIds: string[]): Promise<Promise<ExtendedPost>[]> {
        return postIds.map(async (id) => {
            return this.postService.getPost(id);
        });
    }
}