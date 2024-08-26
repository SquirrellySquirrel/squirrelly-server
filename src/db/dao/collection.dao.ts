import { Collection } from '@prisma/client';
import { Service } from 'typedi';
import { CollectionWithPosts } from '../../service/model/collection';
import { ExtendedPost } from '../../service/model/post';
import prisma from '../prisma';

@Service()
export default class CollectionDao {
    async findById(id: string): Promise<Collection | null> {
        return prisma.collection.findUnique({
            where: { id },
        });
    }

    async findByIdWithPosts(id: string): Promise<CollectionWithPosts | null> {
        return prisma.collection.findUnique({
            where: { id }, include: {
                posts: true,
            },
        });
    }

    async findByUserWithPosts(userId: string): Promise<CollectionWithPosts[]> {
        return prisma.collection.findMany({ where: { creator: { id: userId } }, include: { posts: true } });
    }

    async create(creatorId: string, posts: ExtendedPost[], name: string, description: string | null): Promise<Collection> {
        return prisma.collection.create({
            data: {
                creatorId,
                name,
                description,
                posts: {
                    connect: posts.map((p) => ({ id: p.id })),
                },
            },
        });
    }

    async update(id: string, posts: ExtendedPost[], name: string, description: string | null) {
        await prisma.collection.update({
            where: {
                id,
            },
            data: {
                name,
                description,
                posts: {
                    set: posts.map((p) => ({ id: p.id })),
                },
            },
        });
    }

    async delete(id: string) {
        await prisma.collection.delete({
            where: { id },
        });
    }
}