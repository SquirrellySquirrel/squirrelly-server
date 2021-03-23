require('dotenv').config({ path: `./.env.${process.env.NODE_ENV}` });
require("reflect-metadata");
import { useContainer } from 'typeorm';
import { Container } from 'typeorm-typedi-extensions';
import connection from '../../src/database';
import Location from '../../src/entity/location';
import LocationService from '../../src/service/location.service';
import { MockData } from '../../__mocks__/mock-data';

let locationService: LocationService;
let location: Location;

beforeAll(async () => {
    useContainer(Container);

    await connection.create();

    locationService = Container.get(LocationService);
});

beforeEach(async () => {
    await connection.clear();

    location = MockData.location1();
    location.id = (await locationService.saveLocation(location)).id;
});

afterAll(async () => {
    await connection.close();
});

it('gets an exiting location by coordinate', async () => {
    expect((await locationService.getLocationByCoordinate(1.2, -2.3))).toEqual(location);
});