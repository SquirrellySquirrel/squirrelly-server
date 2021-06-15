import { Service } from 'typedi';
import { EntityRepository, Repository } from 'typeorm';
import Comment from '../entity/comment';

@Service()
@EntityRepository(Comment)
export default class CommentRepository extends Repository<Comment> {
}