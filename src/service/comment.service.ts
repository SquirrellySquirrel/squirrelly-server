import { Service } from 'typedi';
import { DeleteResult } from "typeorm";
import { InjectRepository } from 'typeorm-typedi-extensions';
import Comment from "../entity/comment";
import CommentRepository from "../repository/comment.repository";

@Service()
export default class CommentService {
    constructor(
        @InjectRepository()
        private readonly commentRepository: CommentRepository
    ) { }

    addComment(postId: string, userId: string, content: string): Promise<Comment> {
        return this.commentRepository.save({
            post: { id: postId },
            creator: { id: userId },
            created: new Date(),
            content: content
        });
    }

    deleteComment(commentId: string): Promise<DeleteResult> {
        return this.commentRepository.delete(commentId);
    }
}