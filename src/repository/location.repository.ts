import { Service } from 'typedi';
import { EntityRepository, Repository } from "typeorm";
import Location from "../entity/location";

@Service()
@EntityRepository(Location)
export default class LocationRepository extends Repository<Location> {
}