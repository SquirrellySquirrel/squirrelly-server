import { DeleteResult } from "typeorm";
import { Comment } from "../entity/comment";
import { CommentRepository } from "../repository/comment.repository";

export class CommentService {
    public constructor(
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