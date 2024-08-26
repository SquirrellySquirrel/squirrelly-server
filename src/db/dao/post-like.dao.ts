import { PostLike } from '@prisma/client';
import { Service } from 'typedi';
import prisma from '../prisma';

@Service()
export default class PostLikeDao {
    async findByPost(postId: string): Promise<PostLike[]> {
        return prisma.postLike.findMany({ where: { post: { id: postId } } });
    }

    async create(postId: string, userId: string): Promise<PostLike> {
        return prisma.postLike.create({
            data: {
                postId,
                userId,
            },
        });
    }

    async delete(postId: string, userId: string) {
        await prisma.postLike.delete({
            where: {
                userId_postId: {
                    postId,
                    userId,
                },
            },
        });
    }
}