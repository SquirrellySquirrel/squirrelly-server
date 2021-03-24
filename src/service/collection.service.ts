import { Service } from 'typedi';
import { DeleteResult } from "typeorm";
import { InjectRepository } from 'typeorm-typedi-extensions';
import Collection from "../entity/collection";
import CollectionRepository from "../repository/collection.repository";

type CollectionParams = Pick<Collection, 'name' | 'description'>;

@Service()
export default class CollectionService {
    constructor(
        @InjectRepository()
        private readonly collectionRepository: CollectionRepository
    ) { }

    getCollection(collectionId: string): Promise<Collection | undefined> {
        return this.collectionRepository.findOne({ where: { id: collectionId }, relations: ["creator", "posts"] });
    }

    getCollectionsByUser(userId: string): Promise<Collection[]> {
        return this.collectionRepository.find({ where: { creator: { id: userId } } });
    }

    createCollection(postIds: string[], userId: string, collectionParams: CollectionParams): Promise<Collection> {
        return this.collectionRepository.save({
            creator: { id: userId },
            posts: postIds.map(id => ({ id: id })),
            name: collectionParams.name,
            description: collectionParams.description
        });
    }

    updateCollection(collectionId: string, postIds: string[], collectionParams: CollectionParams): Promise<Collection> {
        return this.collectionRepository.save({
            id: collectionId,
            posts: postIds.map(id => ({ id: id })),
            name: collectionParams.name,
            description: collectionParams.description
        });
    }

    deleteCollection(collectionId: string): Promise<DeleteResult> {
        return this.collectionRepository.delete(collectionId);
    }
}