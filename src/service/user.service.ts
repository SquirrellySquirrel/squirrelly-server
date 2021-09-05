import jwt from 'jsonwebtoken';
import ms from 'ms';
import { Service } from 'typedi';
import { DeleteResult } from 'typeorm';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { JWT_SECRET, TOKEN_TTL } from '../config';
import User from '../entity/user';
import ConflictingDataException from '../exception/conflicting-data.exception';
import NotFoundException from '../exception/not-found.exception';
import TypeORMException from '../exception/typeorm.exception';
import InvalidCredentialsException from '../exception/invalid-credentials.exception';
import TokenData from '../interfaces/token-data.interface';
import Token from '../interfaces/token.interface';
import UserRepository from '../repository/user.repository';

const bcrypt = require('bcrypt');

type UserToken = {
    id: string,
    token: Token
};

@Service()
export default class UserService {
    constructor(
        @InjectRepository()
        private readonly userRepository: UserRepository
    ) { }

    async getUserById(userId: string): Promise<User> {
        const user = await this.userRepository.findOne(userId);
        if (!user) {
            throw new NotFoundException('User', userId);
        }
        return user;
    }

    async getUserByIdUnsafe(userId: string): Promise<Partial<User> | undefined> {
        return await this.userRepository.findOne(userId);
    }

    async authenticate(email: string, pass: string): Promise<UserToken> {
        const user = await this.userRepository.findByEmailWithPassword(email);
        if (!user) {
            throw new InvalidCredentialsException();
        }

        const matching = await bcrypt.compare(pass, user.password);
        if (matching) {
            await this.userRepository.save({
                id: user.id,
                lastLogin: new Date(),
            }).catch((err: Error) => {
                throw new TypeORMException(err.message);
            });

            const token = this.createToken(user.id);
            return { id: user.id, token };
        } else {
            throw new InvalidCredentialsException();
        }
    }

    async createUser(email: string, pass: string): Promise<UserToken> {
        const userByEmail = await this.userRepository.findByEmail(email);
        if (userByEmail) {
            throw new ConflictingDataException('email', email);
        }

        const encryptedPassword = await bcrypt.hash(pass, 10);
        const savedUser = await this.userRepository.save({
            email: email,
            password: encryptedPassword,
            created: new Date(),
            displayName: email.split('@', 1)[0],
        }).catch((err: Error) => {
            throw new TypeORMException(err.message);
        });

        const token = this.createToken(savedUser.id);
        return { id: savedUser.id, token };
    }

    async updateUser(userId: string, displayName: string) {
        await this.getUserById(userId);
        const user = await this.userRepository.findByDisplayName(displayName);
        if (user && user.id != userId) {
            throw new ConflictingDataException('displayName', displayName);
        }

        await this.userRepository.save({
            id: userId,
            displayName: displayName,
        }).catch((err: Error) => {
            throw new TypeORMException(err.message);
        });
    }

    // ignore if user does not exist
    async deleteUser(userId: string): Promise<DeleteResult> {
        return this.userRepository.delete(userId)
            .catch((err: Error) => {
                throw new TypeORMException(err.message);
            });
    }

    private createToken(userId: string): Token {
        const data: TokenData = {
            _id: userId,
        };
        const expiresIn = TOKEN_TTL;
        return {
            token: jwt.sign(data, JWT_SECRET, { expiresIn }),
            ttl: ms(expiresIn) / 1000,
        };
    }
}