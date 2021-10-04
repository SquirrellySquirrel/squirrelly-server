import { Service } from 'typedi';
import { EntityRepository, Repository } from 'typeorm';
import Comment from '../entity/comment';

@Service()
@EntityRepository(Comment)
export default class CommentRepository extends Repository<Comment> {
    findOneWithCreator(commentId: string): Promise<Comment | undefined> {
        return this.findOne({ where: { id: commentId }, relations: ['creator'] });
    }
}