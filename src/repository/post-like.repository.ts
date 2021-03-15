import { EntityRepository, Repository } from "typeorm";
import { PostLike } from "../entity/post-like";

@EntityRepository(PostLike)
export class PostLikeRepository extends Repository<PostLike> {
}