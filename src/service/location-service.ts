import { Location } from "../entity/location";
import { LocationRepository } from "../repository/location-repository";

type SaveLocationParams = Omit<Location, 'id' | 'posts'>;

export class LocationService {
    public constructor(
        private readonly LocationRepository: LocationRepository
    ) { }

    saveLocation(params: SaveLocationParams): Promise<Location> {
        return this.LocationRepository.save({
            latitude: params.latitude,
            longitude: params.longitude,
            address: params.address
        });
    }
} 