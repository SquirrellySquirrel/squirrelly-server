import { Service } from 'typedi';
import { Double, getConnection } from "typeorm";
import { InjectRepository } from 'typeorm-typedi-extensions';
import Location from "../entity/location";
import LocationRepository from "../repository/location.repository";

type SaveLocationParams = Omit<Location, 'id' | 'posts'>;

@Service()
export default class LocationService {
    constructor(
        @InjectRepository()
        private readonly locationRepository: LocationRepository
    ) { }

    getLocationByCoordinate(latitude: Double, longitude: Double): Promise<Location | undefined> {
        return this.locationRepository.findOne({ where: { latitude: latitude, longitude: longitude } });
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
            .orIgnore() // ignore duplicate entry
            .execute();
        return result.generatedMaps[0] as Location;
    }
} 