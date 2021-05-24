import { Service } from 'typedi';
import { DeleteResult } from "typeorm";
import { InjectRepository } from 'typeorm-typedi-extensions';
import Device from "../entity/device";
import User from "../entity/user";
import TypeORMException from "../exception/typeorm.exception";
import UserRepository from "../repository/user.repository";

@Service()
export default class UserService {
    constructor(
        @InjectRepository()
        private readonly userRepository: UserRepository
    ) { }

    async getUserById(userId: string): Promise<User | undefined> {
        const user = await this.userRepository.findOne(userId, { relations: ['devices'] });
        if (user) {
            const { password, ...foundUser } = user;
            return foundUser;
        }
        return undefined;
    }

    async getUserByEmail(email: string): Promise<User | undefined> {
        return await this.userRepository.findOne({ where: { email: email }, relations: ['devices'] });
    }

    async createGhostUser(deviceId: string, deviceType: string): Promise<User> {
        const device = new Device();
        device.type = deviceType;
        device.deviceId = deviceId;
        const user = new User();
        user.devices = new Array();
        user.devices.push(device);
        const { password, ...savedUser } = await this.userRepository.save(user)
            .catch((err: Error) => {
                throw new TypeORMException(err.message);
            });;
        return savedUser;
    }

    async upgradeGhostUser(userId: string, email: string, pass: string, displayName: string): Promise<User> {
        const { password, ...savedUser } = await this.userRepository.save({
            id: userId,
            email: email,
            password: pass,
            displayName: displayName
        }).catch((err: Error) => {
            throw new TypeORMException(err.message);
        });;
        return savedUser;
    }

    async updateUser(userId: string, displayName: string): Promise<User> {
        const { email, password, ...savedUser } = await this.userRepository.save({
            id: userId,
            displayName: displayName
        }).catch((err: Error) => {
            throw new TypeORMException(err.message);
        });;
        return savedUser;
    }

    async deleteUser(userId: string): Promise<DeleteResult> {
        return this.userRepository.delete(userId)
            .catch((err: Error) => {
                throw new TypeORMException(err.message);
            });;
    }
}