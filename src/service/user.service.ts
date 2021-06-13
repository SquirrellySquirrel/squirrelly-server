import { Service } from 'typedi';
import { DeleteResult } from "typeorm";
import { InjectRepository } from 'typeorm-typedi-extensions';
import User from "../entity/user";
import DuplicateDataException from '../exception/duplicate-data.exception';
import NotFoundException from '../exception/not-found.exception';
import TypeORMException from "../exception/typeorm.exception";
import UnauthorizedException from '../exception/unauthorized.exception';
import UserRepository from "../repository/user.repository";

const bcrypt = require('bcrypt');

@Service()
export default class UserService {
    constructor(
        @InjectRepository()
        private readonly userRepository: UserRepository
    ) { }

    async getUserById(userId: string): Promise<Partial<User>> {
        const user = await this.userRepository.findOne(userId);
        if (!user) {
            throw new NotFoundException('User', userId);
        }
        const { password, ...foundUser } = user;
        return foundUser;
    }

    async getUserByIdUnsafe(userId: string): Promise<Partial<User> | undefined> {
        const user = await this.userRepository.findOne(userId);
        if (!user) {
            return undefined;
        }
        const { password, ...foundUser } = user;
        return foundUser;
    }

    async getUserByEmail(email: string): Promise<Partial<User>> {
        const user = await this.userRepository.findOne({ where: { email: email } });
        if (!user) {
            throw new NotFoundException('User', email);
        }
        const { password, ...foundUser } = user;
        return foundUser;
    }

    async getUserByEmailUnsafe(email: string): Promise<Partial<User> | undefined> {
        const user = await this.userRepository.findOne({ where: { email: email } });
        if (!user) {
            return undefined;
        }
        const { password, ...foundUser } = user;
        return foundUser;
    }

    async authenticate(email: string, pass: string) {
        const userByEmail = await this.userRepository.findOne({ where: { email: email } });
        if (!userByEmail) {
            throw new UnauthorizedException();
        }

        const matching = await bcrypt.compare(pass, userByEmail.password);
        if (matching) {
            await this.userRepository.save({
                id: userByEmail.id,
                lastLogin: new Date()
            }).catch((err: Error) => {
                throw new TypeORMException(err.message);
            });
        } else {
            throw new UnauthorizedException();
        }
    }

    async createUser(email: string, pass: string): Promise<any> {
        const userByEmail = await this.getUserByEmailUnsafe(email);
        if (userByEmail) {
            throw new DuplicateDataException({ email: email });
        }

        const encryptedPassword = await bcrypt.hash(pass, 10);
        const { password, ...savedUser } = await this.userRepository.save({
            email: email,
            password: encryptedPassword,
            created: new Date(),
            displayName: email.split('@', 1)[0]
        }).catch((err: Error) => {
            throw new TypeORMException(err.message);
        });
        return { id: savedUser.id };
    }

    async updateUser(userId: string, displayName: string) {
        await this.getUserById(userId);
        const user = await this.userRepository.findOne({ where: { displayName: displayName } });
        if (user && user.id != userId) {
            throw new DuplicateDataException({ displayName: displayName });
        }

        await this.userRepository.save({
            id: userId,
            displayName: displayName
        }).catch((err: Error) => {
            throw new TypeORMException(err.message);
        });
    }

    async deleteUser(userId: string): Promise<DeleteResult> {
        await this.getUserById(userId);

        return this.userRepository.delete(userId)
            .catch((err: Error) => {
                throw new TypeORMException(err.message);
            });
    }
}