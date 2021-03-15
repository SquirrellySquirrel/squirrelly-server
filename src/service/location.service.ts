import { getConnection } from "typeorm";
import { Location } from "../entity/location";
import { LocationRepository } from "../repository/location.repository";

type SaveLocationParams = Omit<Location, 'id' | 'posts'>;

export class LocationService {
    public constructor(
        private readonly LocationRepository: LocationRepository
    ) { }

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