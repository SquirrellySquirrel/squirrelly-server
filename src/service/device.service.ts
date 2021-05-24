import { Service } from 'typedi';
import { InjectRepository } from 'typeorm-typedi-extensions';
import Device from "../entity/device";
import TypeORMException from "../exception/typeorm.exception";
import DeviceRepository from "../repository/device.repository";

type AddDeviceParams = Omit<Device, 'id' | 'owner'>;

@Service()
export default class DeviceService {
    constructor(
        @InjectRepository()
        private readonly deviceRepository: DeviceRepository
    ) { }

    async addDevice(userId: string, params: AddDeviceParams): Promise<Device | undefined> {
        return this.deviceRepository.save({
            type: params.type,
            deviceId: params.deviceId,
            owner: { id: userId }
        }).catch((err: Error) => {
            throw new TypeORMException(err.message);
        });;
    }
}