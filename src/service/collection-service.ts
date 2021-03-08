import { DeleteResult } from "typeorm";
import { Collection } from "../entity/collection";
import { Post } from "../entity/post";
import { CollectionRepository } from "../repository/collection-repository";

type CollectionParams = Pick<Collection, 'name' | 'description'>;

export class CollectionService {
    public constructor(
        private readonly collectionRepository: CollectionRepository
    ) { }

    getCollection(collectionId: string): Promise<Collection | undefined> {
        return this.collectionRepository.findOne({ where: { id: collectionId }, relations: ["creator", "posts"] });
    }

    getCollectionsByUser(userId: string): Promise<Collection[]> {
        return this.collectionRepository.find({ where: { creator: { id: userId } } });
    }

    createCollection(posts: Post[], userId: string, collectionParams: CollectionParams): Promise<Collection> {
        return this.collectionRepository.save({
            creator: { id: userId },
            posts: posts,
            name: collectionParams.name,
            description: collectionParams.description
        });
    }

    updateCollection(collectionId: string, posts: Post[], collectionParams: CollectionParams): Promise<Collection> {
        return this.collectionRepository.save({
            id: collectionId,
            posts: posts,
            name: collectionParams.name,
            description: collectionParams.description
        });
    }

    deleteCollection(collectionId: string): Promise<DeleteResult> {
        return this.collectionRepository.delete(collectionId);
    }
}