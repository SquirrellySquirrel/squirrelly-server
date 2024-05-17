import { Post } from '@prisma/client';
import { Service } from 'typedi';
import prisma from '../prisma';

@Service()
export default class PostDao {
    async findById(id: string): Promise<Post | null> {
        return prisma.post.findUnique({
            where: { id },
        });
    }

    async findLatest(publicOnly: boolean, count?: number): Promise<Post[]> {
        const where = publicOnly ? { public: true } : undefined;
        return prisma.post.findMany({
            where,
            take: count,
            orderBy: { created: 'desc' },
        });
    }

    async findByUser(userId: string, publicOnly: boolean, count?: number): Promise<Post[]> {
        const where = publicOnly ? { creatorId: userId, public: true } : { creatorId: userId };
        return prisma.post.findMany({
            where,
            take: count,
            orderBy: { created: 'desc' },
        });
    }

    async findByLocation(locationId: string, publicOnly: boolean, count?: number): Promise<Post[]> {
        const where = publicOnly ? { locationId, public: true } : { locationId };
        return prisma.post.findMany({
            where,
            take: count,
            orderBy: { created: 'desc' },
        });
    }

    async findByUserAndLocation(userId: string, locationId: string, publicOnly: boolean, count?: number): Promise<Post[]> {
        const where = publicOnly
            ? { creatorId: userId, locationId, public: true }
            : { creatorId: userId, locationId };
        return prisma.post.findMany({
            where,
            take: count,
            orderBy: { created: 'desc' },
        });
    }

    async create(locationId: string, creatorId: string, occurred: Date, isPublic: boolean, description: string | null):
        Promise<Post> {
        return prisma.post.create({
            data: {
                locationId,
                creatorId,
                occurred,
                public: isPublic,
                description,
            },
        });
    }

    async update(id: string, locationId: string, occurred: Date, isPublic: boolean, description: string | null) {
        await prisma.post.update({
            where: {
                id,
            },
            data: {
                locationId,
                occurred,
                public: isPublic,
                description,
            },
        });
    }

    async delete(id: string) {
        await prisma.post.delete({ where: { id } });
    }
}