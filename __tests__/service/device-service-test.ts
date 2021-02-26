require('dotenv').config({ path: `./.env.${process.env.NODE_ENV}` });
require("reflect-metadata");
import { getCustomRepository } from 'typeorm';
import connection from '../../src/database';
import { DeviceRepository } from '../../src/repository/device-repository';
import { UserRepository } from '../../src/repository/user-repository';
import { DeviceService } from '../../src/service/device-service';
import { UserService } from '../../src/service/user-service';

let deviceService: DeviceService;
let userService: UserService;

beforeAll(async () => {
    await connection.create();
    deviceService = new DeviceService(getCustomRepository(DeviceRepository));
    userService = new UserService(getCustomRepository(UserRepository));
});

afterEach(async () => {
    await connection.clear();
});

afterAll(async () => {
    await connection.close();
});

it('adds a device to an existing user', async () => {
    const user = await userService.createGhostUser('foo', 'android');
    await userService.getUser(user.id).then(user => {
        expect(user!.devices).toHaveLength(1);
    });

    await deviceService.addDevice(user.id, { type: 'ios', deviceId: 'bar' });
    await userService.getUser(user.id).then(user => {
        expect(user!.devices).toHaveLength(2);
    });
});