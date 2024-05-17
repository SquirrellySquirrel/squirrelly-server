import { Comment } from '@prisma/client';
import { Service } from 'typedi';
import prisma from '../prisma';

@Service()
export default class CommentDao {
    async findById(id: string): Promise<Comment | null> {
        return prisma.comment.findUnique({ where: { id } });
    }

    async findByPostId(postId: string): Promise<Comment[]> {
        return prisma.comment.findMany({
            where: { post: { id: postId } }, orderBy: { created: 'desc' },
        });
    }

    async create(postId: string, creatorId: string, content: string): Promise<Comment> {
        return prisma.comment.create({
            data: {
                content,
                creatorId,
                postId,
            },
        });
    }

    async delete(id: string) {
        await prisma.comment.delete({
            where: { id },
        });
    }
}