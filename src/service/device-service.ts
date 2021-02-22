import { Device } from "../entity/device";
import { DeviceRepository } from "../repository/device-repository";

type AddDeviceParams = Omit<Device, 'id' | 'owner'>;

export class DeviceService {
    public constructor(
        private readonly deviceRepository: DeviceRepository
    ) { }

    addDevice(userId: string, params: AddDeviceParams): Promise<Device | undefined> {
        return this.deviceRepository.save({
            type: params.type,
            deviceId: params.deviceId,
            owner: { id: userId }
        });
    }
}