import { Service } from 'typedi';
import { InjectRepository } from 'typeorm-typedi-extensions';
import Device from "../entity/device";
import DeviceRepository from "../repository/device.repository";

type AddDeviceParams = Omit<Device, 'id' | 'owner'>;

@Service()
export default class DeviceService {
    constructor(
        @InjectRepository()
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