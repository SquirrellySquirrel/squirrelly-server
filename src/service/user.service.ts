import { Service } from 'typedi';
import { DeleteResult } from "typeorm";
import { InjectRepository } from 'typeorm-typedi-extensions';
import Device from "../entity/device";
import User from "../entity/user";
import UserRepository from "../repository/user.repository";

@Service()
export default class UserService {
    constructor(
        @InjectRepository()
        private readonly userRepository: UserRepository
    ) { }

    async getUser(userId: string): Promise<User | undefined> {
        const user = await this.userRepository.findOne(userId, { relations: ['devices'] });
        if (user) {
            const { password, ...foundUser } = user;
            return foundUser;
        }
        return undefined;
    }

    async createGhostUser(deviceId: string, deviceType: string): Promise<User> {
        const device = new Device();
        device.type = deviceType;
        device.deviceId = deviceId;
        const user = new User();
        user.devices = new Array();
        user.devices.push(device);
        const { password, ...savedUser } = await this.userRepository.save(user);
        return savedUser;
    }

    async upgradeGhostUser(userId: string, email: string, pass: string, displayName: string): Promise<User> {
        const { password, ...savedUser } = await this.userRepository.save({
            id: userId,
            email: email,
            password: pass,
            displayName: displayName
        });
        return savedUser;
    }

    async updateUser(userId: string, displayName: string): Promise<User> {
        const { email, password, ...savedUser } = await this.userRepository.save({
            id: userId,
            displayName: displayName
        });
        return savedUser;
    }

    deleteUser(userId: string): Promise<DeleteResult> {
        return this.userRepository.delete(userId);
    }
}