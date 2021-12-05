import jwt from 'jsonwebtoken';
import ms from 'ms';
import { Service } from 'typedi';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { JWT_SECRET, TOKEN_TTL } from '../config';
import { EntityType } from '../entity/entity-type';
import User from '../entity/user';
import ConflictingDataException from '../exception/conflicting-data.exception';
import InvalidCredentialsException from '../exception/invalid-credentials.exception';
import NotFoundException from '../exception/not-found.exception';
import TokenData from '../interfaces/token-data.interface';
import Token from '../interfaces/token.interface';
import UserRepository from '../repository/user.repository';
import { mapError } from './service-error-handler';

const bcrypt = require('bcrypt');

export type UserToken = {
    id: string,
    token: Token
};

@Service()
export default class UserService {
    constructor(
        @InjectRepository()
        private readonly userRepository: UserRepository
    ) { }

    async getUserByIdOrEmail(idOrEmail: string): Promise<User> {
        if (idOrEmail.includes('@')) {
            return this.getUserByEmail(idOrEmail);
        } else {
            return this.getUserById(idOrEmail);
        }
    }

    async getUserById(userId: string): Promise<User> {
        const user = await this.userRepository.findOne(userId);
        if (!user) {
            throw new NotFoundException(EntityType.USER, { key: 'id', value: userId });
        }
        return user;
    }

    async getUserByIdUnsafe(userId: string): Promise<Partial<User> | undefined> {
        return await this.userRepository.findOne(userId);
    }

    async getUserByEmail(email: string): Promise<User> {
        const user = await this.userRepository.findOne({ where: { email: email } });
        if (!user) {
            throw new NotFoundException(EntityType.USER, { key: 'email', value: email });
        }
        return user;
    }

    async authenticate(email: string, pass: string): Promise<UserToken> {
        const user = await this.userRepository.findByEmailForAuthentication(email);
        if (!user) {
            throw new InvalidCredentialsException();
        }

        const matching = await bcrypt.compare(pass, user.password);
        if (matching) {
            try {
                await this.userRepository.save({
                    id: user.id,
                    lastLogin: new Date(),
                });
            } catch (err) {
                mapError(err);
            }

            const token = this.createToken(user);
            return { id: user.id, token };
        } else {
            throw new InvalidCredentialsException();
        }
    }

    async createUser(email: string, pass: string): Promise<UserToken> {
        const userByEmail = await this.userRepository.findByEmail(email);
        if (userByEmail) {
            throw new ConflictingDataException(EntityType.USER, { key: 'email', value: email });
        }

        const encryptedPassword = await bcrypt.hash(pass, 10);
        try {
            const savedUser = await this.userRepository.save({
                email: email,
                password: encryptedPassword,
                created: new Date(),
                displayName: this.generateDisplayName(email),
                role: 'contributor',

            });
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
        const user = await this.userRepository.findByDisplayName(displayName);
        if (user && user.id != userId) {
            throw new ConflictingDataException(EntityType.USER, { key: 'displayName', value: displayName });
        }

        try {
            await this.userRepository.save({
                id: userId,
                displayName: displayName,
            });
        } catch (err) {
            throw mapError(err);
        }
    }

    // ignore if user does not exist
    async deleteUser(userId: string) {
        try {
            await this.userRepository.delete(userId);
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