import { AbstractRepository, EntityRepository } from "typeorm";
import { Device } from "../entity/device";
import { User } from "../entity/user";

@EntityRepository(User)
export class UserRepository extends AbstractRepository<User> {

    findById(userId: string) {
        return this.repository.findOne(userId);
    }

    createGhostUser(deviceId: string, deviceType: string) {
        const device = new Device();
        device.type = deviceType;
        device.deviceId = deviceId;

        const user = new User();
        user.devices = new Array();
        user.devices.push(device);
        return this.manager.save(user);
    }

    upgradeGhostUser(userId: string, email: string, password: string, displayName: string) {
        return this.repository.save({
            id: userId,
            email: email,
            password: password,
            displayName: displayName
        });
    }

    updateUser(userId: string, displayName: string) {
        return this.repository.save({
            id: userId,
            displayName: displayName
        });
    }

    deleteUser(userId: string) {
        this.repository.delete(userId);
    }

}