import { User } from '@prisma/client';
import jwt from 'jsonwebtoken';
import ms from 'ms';
import { Inject, Service } from 'typedi';
import { JWT_SECRET, TOKEN_TTL } from '../config';
import UserDao from '../db/dao/user.dao';
import ConflictingDataException from '../exception/conflicting-data.exception';
import InvalidCredentialsException from '../exception/invalid-credentials.exception';
import NotFoundException from '../exception/not-found.exception';
import TokenData from '../interfaces/token-data.interface';
import Token from '../interfaces/token.interface';
import { UserParams, UserToken } from './model/user';
import { mapError } from './service-error-handler';

const bcrypt = require('bcrypt');

@Service()
export default class UserService {
    constructor(
        @Inject()
        private readonly userDao: UserDao
    ) { }

    async getUserByIdOrEmail(idOrEmail: string): Promise<User> {
        if (idOrEmail.includes('@')) {
            return this.getUserByEmail(idOrEmail);
        } else {
            return this.getUserById(idOrEmail);
        }
    }

    async getUserById(userId: string): Promise<User> {
        const user = await this.userDao.findById(userId);
        if (!user) {
            throw new NotFoundException('USER', { key: 'id', value: userId });
        }
        return user;
    }

    async getUserByIdUnsafe(userId: string): Promise<User | null> {
        return await this.userDao.findById(userId);
    }

    async getUserByEmail(email: string): Promise<User> {
        const user = await this.userDao.findByEmail(email);
        if (!user) {
            throw new NotFoundException('USER', { key: 'email', value: email });
        }
        return user;
    }

    async authenticate(userParams: UserParams): Promise<UserToken> {
        const email = userParams.email;
        const pass = userParams.password;
        const user = await this.userDao.findByEmail(email);
        if (!user) {
            throw new InvalidCredentialsException();
        }

        const matching = await bcrypt.compare(pass, user.password);
        if (matching) {
            try {
                await this.userDao.updateLastLogin(user.id);
            } catch (err) {
                mapError(err);
            }

            const token = this.createToken(user);
            return { id: user.id, token };
        } else {
            throw new InvalidCredentialsException();
        }
    }

    async createUser(userParams: UserParams): Promise<UserToken> {
        const email = userParams.email;
        const pass = userParams.password;
        const userByEmail = await this.userDao.findByEmail(email);
        if (userByEmail) {
            throw new ConflictingDataException('USER', { key: 'email', value: email });
        }

        const encryptedPassword = await bcrypt.hash(pass, 10);
        try {
            const savedUser = await this.userDao.create(
                email,
                encryptedPassword,
                this.generateDisplayName(email),
            );
            const token = this.createToken(savedUser);
            return { id: savedUser.id, token };
        } catch (err) {
            throw mapError(err);
        }
    }

    private generateDisplayName(email: string) {
        return email.split('@', 1)[0] + ~~(Math.random() * 1000);
    }

    async updateUser(userId: string, displayName: string) {
        await this.getUserById(userId);
        const user = await this.userDao.findByDisplayName(displayName);
        if (user && user.id != userId) {
            throw new ConflictingDataException('USER', { key: 'displayName', value: displayName });
        }

        try {
            await this.userDao.updateDisplayName(userId, displayName);
        } catch (err) {
            throw mapError(err);
        }
    }

    // ignore if user does not exist
    async deleteUser(userId: string) {
        try {
            await this.userDao.delete(userId);
        } catch (err) {
            mapError(err);
        }
    }

    private createToken(user: User): Token {
        const data: TokenData = {
            _id: user.id,
            role: user.role,
        };
        const expiresIn = TOKEN_TTL;
        return {
            token: jwt.sign(data, JWT_SECRET, { expiresIn }),
            ttl: ms(expiresIn) / 1000,
        };
    }
}