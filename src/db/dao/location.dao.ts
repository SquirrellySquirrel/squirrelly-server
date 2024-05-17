import { Location } from '@prisma/client';
import { Service } from 'typedi';
import prisma from '../prisma';

@Service()
export default class LocationDao {
    async findById(id: string): Promise<Location | null> {
        return prisma.location.findUnique({ where: { id } });
    }

    async findByLatAndLong(latitude: number, longitude: number): Promise<Location | null> {
        return prisma.location.findUnique({ where: { location_coordinate: { latitude, longitude } } });
    }

    async create(latitude: number, longitude: number, address: string | null): Promise<Location> {
        return prisma.location.create({
            data: {
                latitude,
                longitude,
                address,
            },
        });
    }

    async delete(id: string) {
        await prisma.location.delete({ where: { id } });
    }
}