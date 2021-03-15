import { Service } from 'typedi';
import { EntityRepository, Repository } from "typeorm";
import Post from "../entity/post";

@Service()
@EntityRepository(Post)
export default class PostRepository extends Repository<Post> {
}