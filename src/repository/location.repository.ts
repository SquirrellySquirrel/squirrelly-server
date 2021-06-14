import { Service } from 'typedi';
import { Double, EntityRepository, Repository } from "typeorm";
import Location from "../entity/location";

@Service()
@EntityRepository(Location)
export default class LocationRepository extends Repository<Location> {
    findByLatAndLong(latitude: Double, longitude: Double) {
        return this.findOne({ where: { latitude: latitude, longitude: longitude } });
    }
}