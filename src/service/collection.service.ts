import { Service } from 'typedi';
import { DeleteResult } from 'typeorm';
import { InjectRepository } from 'typeorm-typedi-extensions';
import Collection from '../entity/collection';
import { EntityType } from '../entity/entity-type';
import NotFoundException from '../exception/not-found.exception';
import CollectionRepository from '../repository/collection.repository';
import PostService from './post.service';
import { mapError } from './service-error-handler';
import UserService from './user.service';

type CollectionParams = Pick<Collection, 'name' | 'description'>;
type CollectionId = Pick<Collection, 'id'>;

@Service()
export default class CollectionService {
    constructor(
        @InjectRepository()
        private readonly collectionRepository: CollectionRepository,
        private readonly userService: UserService,
        private readonly postService: PostService
    ) { }

    async getCollection(collectionId: string, publicOnly: boolean): Promise<Collection> {
        const collection = await this.collectionRepository.findOneWithRelations(collectionId);
        if (!collection) {
            throw new NotFoundException(EntityType.COLLECTION, { key: 'id', value: collectionId });
        }
        if (publicOnly) {
            const publicPosts = collection.posts.filter((post) => post.public);
            collection.posts = publicPosts;
        }
        return collection;
    }

    async getCollectionsByUser(userId: string, publicOnly: boolean): Promise<Collection[]> {
        await this.verifyUser(userId);

        const collections = await this.collectionRepository.findByUser(userId);
        if (publicOnly) {
            collections.map((collection) => {
                const publicPosts = collection.posts.filter((post) => post.public);
                collection.posts = publicPosts;
                return collection;
            });
        }
        return collections;
    }

    async createCollection(postIds: string[], userId: string, collectionParams: CollectionParams):
        Promise<CollectionId> {
        await this.verifyUser(userId);
        await this.verifyPosts(postIds);

        try {
            const collection = await this.collectionRepository.save({
                creator: { id: userId },
                posts: postIds.map((id) => ({ id: id })),
                name: collectionParams.name,
                description: collectionParams.description,
            });
            return { id: collection.id };
        } catch (err) {
            throw mapError(err);
        }
    }

    async updateCollection(collectionId: string, postIds: string[], collectionParams: CollectionParams) {
        await this.verifyPosts(postIds);

        try {
            await this.collectionRepository.save({
                id: collectionId,
                posts: postIds.map((id) => ({ id: id })),
                name: collectionParams.name,
                description: collectionParams.description,
            });
        } catch (err) {
            throw mapError(err);
        }
    }

    // ignore if collection does not exist
    async deleteCollection(collectionId: string): Promise<DeleteResult> {
        return this.collectionRepository.delete(collectionId);
    }

    private async verifyUser(userId: string) {
        await this.userService.getUserById(userId);
    }

    private async verifyPosts(postIds: string[]) {
        postIds.forEach(async (id) => {
            await this.postService.getPost(id);
        });
    }
}