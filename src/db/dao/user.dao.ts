import { User } from '@prisma/client';
import { Service } from 'typedi';
import prisma from '../prisma';

@Service()
export default class UserDao {
    async findById(id: string): Promise<User | null> {
        return prisma.user.findUnique({ where: { id } });
    }

    async findByEmail(email: string): Promise<User | null> {
        return prisma.user.findUnique({ where: { email } });
    }

    async findByDisplayName(displayName: string): Promise<User | null> {
        return prisma.user.findUnique({ where: { displayName } });
    }

    async create(email: string, password: string, displayName: string): Promise<User> {
        return prisma.user.create({
            data: {
                email,
                password,
                displayName,
            },
        });
    }

    async updateLastLogin(id: string) {
        await prisma.user.update({
            where: {
                id,
            },
            data: {
                lastLogin: new Date(),
            },
        });
    }

    async updateDisplayName(id: string, displayName: string) {
        await prisma.user.update({
            where: {
                id,
            },
            data: {
                displayName,
            },
        });
    }

    async delete(id: string) {
        await prisma.user.delete({ where: { id } });
    }
}