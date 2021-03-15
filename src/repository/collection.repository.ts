import { Service } from 'typedi';
import { EntityRepository, Repository } from "typeorm";
import Collection from "../entity/collection";

@Service()
@EntityRepository(Collection)
export default class CollectionRepository extends Repository<Collection> {
}