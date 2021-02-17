import { getCustomRepository } from "typeorm";
import { PostLike } from "../entity/post-like";
import { PostLikeRepository } from "../repository/post-like-repository";

export class PostLikeService {
    postLikeRepository = getCustomRepository(PostLikeRepository);

    getPostLikes(postId: string): Promise<PostLike[]> {
        return this.postLikeRepository.find({ where: { post: { id: postId } }, relations: ["post"] });
    }

    addPostLike(postId: string, userId: string) {
        return this.postLikeRepository.save({
            user: { id: userId },
            post: { id: postId }
        });
    }

    deletePostLike(postId: string, userId: string) {
        return this.postLikeRepository.delete({
            user: { id: userId },
            post: { id: postId }
        });
    }
} 