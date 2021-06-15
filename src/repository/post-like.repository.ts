import { Service } from 'typedi';
import { EntityRepository, Repository } from 'typeorm';
import PostLike from '../entity/post-like';

@Service()
@EntityRepository(PostLike)
export default class PostLikeRepository extends Repository<PostLike> {
}