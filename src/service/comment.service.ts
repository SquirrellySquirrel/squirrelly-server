import { Service } from 'typedi';
import { InjectRepository } from 'typeorm-typedi-extensions';
import Comment from '../entity/comment';
import CommentRepository from '../repository/comment.repository';
import { mapError } from './service-error-handler';

type CommentId = Pick<Comment, 'id'>;

@Service()
export default class CommentService {
    constructor(
        @InjectRepository()
        private readonly commentRepository: CommentRepository
    ) { }

    async getComments(postId: string): Promise<Comment[]> {
        return await this.commentRepository.findByPostId(postId);
    }

    async addComment(postId: string, userId: string, content: string): Promise<CommentId> {
        try {
            const comment = await this.commentRepository.save({
                post: { id: postId },
                creator: { id: userId },
                created: new Date(),
                content: content,
            });
            return { id: comment.id };
        } catch (err) {
            throw mapError(err);
        }
    }

    async deleteComment(commentId: string) {
        try {
            await this.commentRepository.delete(commentId);
        } catch (err) {
            throw mapError(err);
        }
    }
}