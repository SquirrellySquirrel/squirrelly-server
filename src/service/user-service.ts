import { DeleteResult, getCustomRepository } from "typeorm";
import { Device } from "../entity/device";
import { User } from "../entity/user";
import { UserRepository } from "../repository/user-repository";

export class UserService {
    userRepository = getCustomRepository(UserRepository);

    getUser(userId: string): Promise<User | undefined> {
        return this.userRepository.findOne(userId);
    }

    createGhostUser(deviceId: string, deviceType: string): Promise<User | undefined> {
        const device = new Device();
        device.type = deviceType;
        device.deviceId = deviceId;
        const user = new User();
        user.devices = new Array();
        user.devices.push(device);
        return this.userRepository.save(user);
    }

    upgradeGhostUser(userId: string, email: string, password: string, displayName: string): Promise<User | undefined> {
        return this.userRepository.save({
            id: userId,
            email: email,
            password: password,
            displayName: displayName
        });
    }

    updateUser(userId: string, displayName: string): Promise<User | undefined> {
        return this.userRepository.save({
            id: userId,
            displayName: displayName
        });
    }

    deleteUser(userId: string): Promise<DeleteResult> {
        return this.userRepository.delete(userId);
    }
}