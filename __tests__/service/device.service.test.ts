require('dotenv').config({ path: `./.env.${process.env.NODE_ENV}` });
require("reflect-metadata");
import { useContainer } from 'typeorm';
import { Container } from 'typeorm-typedi-extensions';
import connection from '../../src/database';
import DeviceService from '../../src/service/device.service';
import UserService from '../../src/service/user.service';

let deviceService: DeviceService;
let userService: UserService;

beforeAll(async () => {
    useContainer(Container);

    await connection.create();

    deviceService = Container.get(DeviceService);
    userService = Container.get(UserService);
});

beforeEach(async () => {
    await connection.clear();
});

afterAll(async () => {
    await connection.close();
});

it('adds a device to an existing user', async () => {
    const userId = (await userService.createGhostUser('foo', 'android')).id!;
    const newUser = await userService.getUserById(userId);

    expect(newUser!.devices).toHaveLength(1);

    await deviceService.addDevice(userId, 'bar', 'ios');
    const userWithNewDevices = await userService.getUserById(userId);
    expect(userWithNewDevices!.devices).toHaveLength(2);
});