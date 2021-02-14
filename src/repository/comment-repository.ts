import { EntityRepository, Repository } from "typeorm";
import { Comment } from "../entity/comment";

@EntityRepository(Comment)
export class CollectionRepository extends Repository<Comment> {
}