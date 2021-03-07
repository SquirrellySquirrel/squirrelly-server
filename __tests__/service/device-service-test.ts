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

beforeEach(async () => {
    await connection.clear();
});

afterAll(async () => {
    await connection.close();
});

it('adds a device to an existing user', async () => {
    const userId = (await userService.createGhostUser('foo', 'android')).id;
    const newUser = await userService.getUser(userId);

    expect(newUser!.devices).toHaveLength(1);

    await deviceService.addDevice(userId, { type: 'ios', deviceId: 'bar' });
    const userWithNewDevice = await userService.getUser(userId);
    expect(userWithNewDevice!.devices).toHaveLength(2);
});