import { Service } from 'typedi';
import { EntityRepository, Repository } from "typeorm";
import Device from "../entity/device";

@Service()
@EntityRepository(Device)
export default class DeviceRepository extends Repository<Device> {
}