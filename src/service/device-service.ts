import { getCustomRepository } from "typeorm";
import { Device } from "../entity/device";
import { DeviceRepository } from "../repository/device-repository";

type AddDeviceParams = Omit<Device, 'id' | 'owner'>;

export class DeviceService {
    deviceRepository = getCustomRepository(DeviceRepository);

    addDevice(userId: string, params: AddDeviceParams): Promise<Device | undefined> {
        return this.deviceRepository.save({
            type: params.type,
            deviceId: params.deviceId,
            owner: { id: userId }
        });
    }
}