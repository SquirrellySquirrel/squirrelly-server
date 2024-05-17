import { Photo } from '@prisma/client';
import { Service } from 'typedi';
import { PhotoParams } from '../../service/model/photo';
import prisma from '../prisma';

@Service()
export default class PhotoDao {
    async findById(id: string): Promise<Photo | null> {
        return prisma.photo.findUnique({ where: { id } });
    }

    async findByPost(postId: string): Promise<Photo[]> {
        return prisma.photo.findMany({ where: { post: { id: postId } }, orderBy: { order: 'asc' } });
    }

    async create(postId: string, photoParams: PhotoParams): Promise<Photo> {
        return prisma.photo.create({
            data: {
                name: photoParams.name,
                type: photoParams.type,
                order: photoParams.order,
                postId,
            },
        });
    }

    async updateOrder(id: string, order: number) {
        await prisma.photo.update({
            where: { id },
            data: {
                order,
            },
        });
    }

    async delete(id: string) {
        await prisma.photo.delete({
            where: {
                id,
            },
        });
    }
}