import { Service } from 'typedi';
import { DeleteResult } from "typeorm";
import { InjectRepository } from 'typeorm-typedi-extensions';
import PostLike from "../entity/post-like";
import PostLikeRepository from "../repository/post-like.repository";

@Service()
export default class PostLikeService {
    constructor(
        @InjectRepository()
        private readonly postLikeRepository: PostLikeRepository
    ) { }

    getPostLikes(postId: string): Promise<PostLike[]> {
        return this.postLikeRepository.find({ where: { post: { id: postId } }, relations: ["post"] });
    }

    addPostLike(postId: string, userId: string): Promise<PostLike> {
        return this.postLikeRepository.save({
            user: { id: userId },
            post: { id: postId }
        });
    }

    deletePostLike(postId: string, userId: string): Promise<DeleteResult> {
        return this.postLikeRepository.delete({
            user: { id: userId },
            post: { id: postId }
        });
    }
} 