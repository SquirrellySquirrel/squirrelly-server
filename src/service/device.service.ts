import { Service } from 'typedi';
import { InjectRepository } from 'typeorm-typedi-extensions';
import Device from "../entity/device";
import InvalidInputDataException from '../exception/invalid-input-data.exception';
import TypeORMException from "../exception/typeorm.exception";
import DeviceRepository from "../repository/device.repository";

@Service()
export default class DeviceService {
    constructor(
        @InjectRepository()
        private readonly deviceRepository: DeviceRepository
    ) { }

    async getDevice(deviceId: string, systemName: string): Promise<Device | undefined> {
        return await this.deviceRepository.findOne({ where: { deviceId: deviceId, system: this.parseSystemName(systemName) }, relations: ['owner'] });
    }

    async addDevice(userId: string, deviceId: string, systemName: string): Promise<Device | undefined> {
        return this.deviceRepository.save({
            system: this.parseSystemName(systemName),
            deviceId: deviceId,
            owner: { id: userId }
        }).catch((err: Error) => {
            throw new TypeORMException(err.message);
        });;
    }

    private parseSystemName(systemName: string): string {
        const system = Device.mapSystem(systemName);
        if (!system) {
            throw new InvalidInputDataException({ systemName: systemName });
        }
        return system;
    }
}