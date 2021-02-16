import { getCustomRepository } from "typeorm";
import { Device } from "../entity/device";
import { DeviceRepository } from "../repository/device-repository";
import { UserRepository } from "../repository/user-repository";

type AddDeviceParams = Omit<Device, 'id' | 'owner'>;

export class DeviceService {
    deviceRepository = getCustomRepository(DeviceRepository);
    userRepository = getCustomRepository(UserRepository);

    async addDevice(userId: string, params: AddDeviceParams): Promise<Device | undefined> {
        const user = await this.userRepository.findOne(userId);
        if (!user) {
            return undefined;
        }

        const device = new Device();
        device.type = params.type;
        device.deviceId = params.deviceId;
        device.owner = user;
        return this.deviceRepository.save(device);
    }
}