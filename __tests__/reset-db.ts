import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async () => {
    await prisma.$transaction([
        prisma.comment.deleteMany(),
        prisma.postLike.deleteMany(),
        prisma.photo.deleteMany(),
        prisma.post.deleteMany(),
        prisma.location.deleteMany(),
        prisma.collection.deleteMany(),
        prisma.user.deleteMany(),
    ]);
};