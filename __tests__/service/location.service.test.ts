require('dotenv').config({ path: `./.env.${process.env.NODE_ENV}` });
require('reflect-metadata');
import Container from 'typedi';
import { MockData } from '../../__mocks__/mock-data';
import LocationService from '../../src/service/location.service';
import { LocationParams } from '../../src/service/model/location';
import resetDb from '../reset-db';
let locationService: LocationService;
let location: LocationParams;

beforeAll(async () => {
    locationService = Container.get(LocationService);
});

beforeEach(async () => {
    await resetDb();

    location = MockData.location1();
});

it('saves a location if it doesn\'t exist', async () => {
    const savedLocation = await locationService.saveLocationIfNotExists(location);
    expect(savedLocation.id).toBeDefined();
    expect(savedLocation).toEqual(
        expect.objectContaining({
            latitude: location.latitude,
            longitude: location.longitude,
            address: location.address,
        }));
});

it('gets an existing location by coordinate', async () => {
    await locationService.saveLocationIfNotExists(location);
    expect((await locationService.getLocationByCoordinate(location.latitude, location.longitude))).toEqual(
        expect.objectContaining({
            latitude: location.latitude,
            longitude: location.longitude,
            address: location.address,
        }));
});