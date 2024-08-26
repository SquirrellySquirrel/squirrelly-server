import { User } from '@prisma/client';
import Token from '../../interfaces/token.interface';

export enum UserRole {
    ADMIN = 'ADMIN',
    USER = 'USER',
}

export type UserToken = {
    id: string,
    token: Token,
};

export type UserParams = Pick<User, 'email' | 'password'>;