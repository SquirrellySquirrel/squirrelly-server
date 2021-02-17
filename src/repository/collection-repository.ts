import { EntityRepository, Repository } from "typeorm";
import { Collection } from "../entity/collection";

@EntityRepository(Collection)
export class CollectionRepository extends Repository<Collection> {
}