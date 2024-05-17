import { Inject, Service } from 'typedi';
import PostLikeDao from '../db/dao/post-like.dao';
import { mapError } from './service-error-handler';

type PostLikes = {
    likes: number,
    likers: string[]
}

@Service()
export default class PostLikeService {
    constructor(
        @Inject()
        private readonly postLikeDao: PostLikeDao
    ) { }

    async getPostLikes(postId: string): Promise<PostLikes> {
        const postLikes = await this.postLikeDao.findByPost(postId);
        return {
            likes: postLikes.length,
            likers: postLikes.map((postLike) => postLike.userId),
        };
    }

    async addPostLike(postId: string, userId: string) {
        try {
            if (!(await this.getPostLikes(postId)).likers.includes(userId)) {
                await this.postLikeDao.create(postId, userId);
            }
        } catch (err) {
            throw mapError(err);
        }
    }

    async deletePostLike(postId: string, userId: string) {
        try {
            if ((await this.getPostLikes(postId)).likers.includes(userId)) {
                await this.postLikeDao.delete(postId, userId);
            }
        } catch (err) {
            throw mapError(err);
        }
    }
}