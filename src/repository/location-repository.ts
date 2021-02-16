import { EntityRepository, Repository } from "typeorm";
import { Location } from "../entity/location";

@EntityRepository(Location)
export class LocationRepository extends Repository<Location> {
}