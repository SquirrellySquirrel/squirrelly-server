import { Location } from '@prisma/client';
import { Inject, Service } from 'typedi';
import LocationDao from '../db/dao/location.dao';
import { LocationParams } from './model/location';

@Service()
export default class LocationService {
    constructor(
        @Inject()
        private readonly locationDao: LocationDao
    ) { }

    async getLocationById(id: string): Promise<Location | null> {
        return await this.locationDao.findById(id);
    }

    async getLocationByCoordinate(latitude: number, longitude: number): Promise<Location | null> {
        return await this.locationDao.findByLatAndLong(latitude, longitude);
    }

    async saveLocationIfNotExists(location: LocationParams): Promise<Location> {
        return (await this.locationDao.findByLatAndLong(location.latitude, location.longitude))
            ?? this.locationDao.create(location.latitude, location.longitude, location.address);
    }

    async deleteLocationIfExists(id: string) {
        const location = await this.locationDao.findById(id);
        if (!location) {
            return;
        }

        this.locationDao.delete(id);
    }
}