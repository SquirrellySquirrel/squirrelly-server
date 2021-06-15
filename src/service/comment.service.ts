import { Service } from 'typedi';
import { DeleteResult } from 'typeorm';
import { InjectRepository } from 'typeorm-typedi-extensions';
import Comment from '../entity/comment';
import TypeORMException from '../exception/typeorm.exception';
import CommentRepository from '../repository/comment.repository';

@Service()
export default class CommentService {
    constructor(
        @InjectRepository()
        private readonly commentRepository: CommentRepository
    ) { }

    async addComment(postId: string, userId: string, content: string): Promise<Comment> {
        return this.commentRepository.save({
            post: { id: postId },
            creator: { id: userId },
            created: new Date(),
            content: content,
        }).catch((err: Error) => {
            throw new TypeORMException(err.message);
        });
    }

    async deleteComment(commentId: string): Promise<DeleteResult> {
        return this.commentRepository.delete(commentId)
            .catch((err: Error) => {
                throw new TypeORMException(err.message);
            });
    }
}