import { Service } from 'typedi';
import { EntityRepository, Repository } from 'typeorm';
import Collection from '../entity/collection';

@Service()
@EntityRepository(Collection)
export default class CollectionRepository extends Repository<Collection> {
    findOneWithCreator(collectionId: string): Promise<Collection | undefined> {
        return this.findOne({ where: { id: collectionId }, relations: ['creator'] });
    }

    findOneWithRelations(collectionId: string): Promise<Collection | undefined> {
        return this.findOne({ where: { id: collectionId }, relations: ['creator', 'posts'] });
    }

    findByUser(userId: string): Promise<Collection[]> {
        return this.find({ where: { creator: { id: userId } } });
    }
}