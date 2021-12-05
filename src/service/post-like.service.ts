import { Service } from 'typedi';
import { InjectRepository } from 'typeorm-typedi-extensions';
import TypeORMException from '../exception/typeorm.exception';
import PostLikeRepository from '../repository/post-like.repository';

type PostLikes = {
    likes: number,
    likers: string[]
}

@Service()
export default class PostLikeService {
    constructor(
        @InjectRepository()
        private readonly postLikeRepository: PostLikeRepository,
    ) { }

    async getPostLikes(postId: string): Promise<PostLikes> {
        const postLikes = await this.postLikeRepository.find({ where: { post: { id: postId } }, relations: ['post', 'user'] });
        return {
            likes: postLikes.length,
            likers: postLikes.map((postLike) => postLike.user.id),
        };
    }

    async addPostLike(postId: string, userId: string) {
        try {
            await this.postLikeRepository.save({
                user: { id: userId },
                post: { id: postId },
            });
        } catch (err) {
            if (typeof err === 'string') {
                throw new TypeORMException(err);
            }

            if (err instanceof Error) {
                throw new TypeORMException(err.message);
            }
        }
    }

    async deletePostLike(postId: string, userId: string) {
        try {
            await this.postLikeRepository.delete({
                user: { id: userId },
                post: { id: postId },
            });
        } catch (err) {
            if (typeof err === 'string') {
                throw new TypeORMException(err);
            }

            if (err instanceof Error) {
                throw new TypeORMException(err.message);
            }
        }
    }
}