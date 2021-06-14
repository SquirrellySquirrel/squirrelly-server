import { Service } from 'typedi';
import { DeleteResult, Double, getConnection } from "typeorm";
import { InjectRepository } from 'typeorm-typedi-extensions';
import Location from "../entity/location";
import TypeORMException from "../exception/typeorm.exception";
import LocationRepository from "../repository/location.repository";

type SaveLocationParams = Omit<Location, 'id' | 'posts'>;

@Service()
export default class LocationService {
    constructor(
        @InjectRepository()
        private readonly locationRepository: LocationRepository
    ) { }

    getLocationByCoordinate(latitude: Double, longitude: Double): Promise<Location | undefined> {
        return this.locationRepository.findByLatAndLong(latitude, longitude);
    }

    async saveLocation(params: SaveLocationParams): Promise<Location> {
        let result = await getConnection().createQueryBuilder()
            .insert()
            .into(Location)
            .values({
                latitude: params.latitude,
                longitude: params.longitude,
                address: params.address
            })
            .onConflict(`("latitude","longitude") DO NOTHING`) // ignore duplicate entry
            .execute()
            .catch((err: Error) => { throw new TypeORMException(err.message); });
        return result.generatedMaps[0] as Location;
    }

    // ignore if location does not exist
    async deleteLocation(id: string): Promise<DeleteResult> {
        return this.locationRepository.delete(id)
            .catch((err: Error) => {
                throw new TypeORMException(err.message);
            });;
    }
}