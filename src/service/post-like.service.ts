import { Service } from 'typedi';
import { DeleteResult } from 'typeorm';
import { InjectRepository } from 'typeorm-typedi-extensions';
import PostLike from '../entity/post-like';
import TypeORMException from '../exception/typeorm.exception';
import PostLikeRepository from '../repository/post-like.repository';

@Service()
export default class PostLikeService {
    constructor(
        @InjectRepository()
        private readonly postLikeRepository: PostLikeRepository
    ) { }

    async getPostLikes(postId: string): Promise<number> {
        return (await this.postLikeRepository.find({ where: { post: { id: postId } }, relations: ['post'] })).length;
    }

    async addPostLike(postId: string, userId: string): Promise<PostLike> {
        return this.postLikeRepository.save({
            user: { id: userId },
            post: { id: postId },
        }).catch((err: Error) => {
            throw new TypeORMException(err.message);
        });
    }

    async deletePostLike(postId: string, userId: string): Promise<DeleteResult> {
        return this.postLikeRepository.delete({
            user: { id: userId },
            post: { id: postId },
        }).catch((err: Error) => {
            throw new TypeORMException(err.message);
        });
    }
}