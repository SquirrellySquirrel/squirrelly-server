import { EntityRepository, Repository } from "typeorm";
import { Device } from "../entity/device";

@EntityRepository(Device)
export class DeviceRepository extends Repository<Device> {
}