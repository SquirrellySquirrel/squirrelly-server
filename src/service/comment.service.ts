import { Comment } from '@prisma/client';
import { Inject, Service } from 'typedi';
import CommentDao from '../db/dao/comment.dao';
import { mapError } from './service-error-handler';

@Service()
export default class CommentService {
    constructor(
        @Inject()
        private readonly commentDao: CommentDao
    ) { }

    async getComments(postId: string): Promise<Comment[]> {
        return await this.commentDao.findByPostId(postId);
    }

    async addComment(postId: string, userId: string, content: string) {
        try {
            const comment = await this.commentDao.create(postId, userId, content);
            return { id: comment.id };
        } catch (err) {
            throw mapError(err);
        }
    }

    async deleteComment(commentId: string) {
        try {
            await this.commentDao.delete(commentId);
        } catch (err) {
            throw mapError(err);
        }
    }
}