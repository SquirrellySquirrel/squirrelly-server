import { Service } from 'typedi';
import { DeleteResult } from 'typeorm';
import { InjectRepository } from 'typeorm-typedi-extensions';
import Collection from '../entity/collection';
import NotFoundException from '../exception/not-found.exception';
import TypeORMException from '../exception/typeorm.exception';
import CollectionRepository from '../repository/collection.repository';
import PostService from './post.service';
import UserService from './user.service';

type CollectionParams = Pick<Collection, 'name' | 'description'>;

@Service()
export default class CollectionService {
    constructor(
        @InjectRepository()
        private readonly collectionRepository: CollectionRepository,
        private readonly userService: UserService,
        private readonly postService: PostService
    ) { }

    async getCollection(collectionId: string): Promise<Collection> {
        const collection = await this.collectionRepository.findOneWithRelations(collectionId);
        if (!collection) {
            throw new NotFoundException('Collection', collectionId);
        }
        return collection;
    }

    async getCollectionsByUser(userId: string): Promise<Collection[]> {
        await this.verifyUser(userId);

        return await this.collectionRepository.findByUser(userId);
    }

    async createCollection(postIds: string[], userId: string, collectionParams: CollectionParams): Promise<Collection> {
        await this.verifyUser(userId);
        await this.verifyPosts(postIds);

        return this.collectionRepository.save({
            creator: { id: userId },
            posts: postIds.map((id) => ({ id: id })),
            name: collectionParams.name,
            description: collectionParams.description,
        }).catch((err: Error) => {
            throw new TypeORMException(err.message);
        });
    }

    async updateCollection(collectionId: string, postIds: string[],
        collectionParams: CollectionParams): Promise<Collection> {
        await this.verifyPosts(postIds);

        return this.collectionRepository.save({
            id: collectionId,
            posts: postIds.map((id) => ({ id: id })),
            name: collectionParams.name,
            description: collectionParams.description,
        }).catch((err: Error) => {
            throw new TypeORMException(err.message);
        });
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