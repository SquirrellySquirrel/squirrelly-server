require('dotenv').config({ path: `./.env.${process.env.NODE_ENV}` });
require("reflect-metadata");
import { useContainer } from 'typeorm';
import { Container } from 'typeorm-typedi-extensions';
import connection from '../../src/database';
import UserService from '../../src/service/user.service';

let userService: UserService;

beforeAll(async () => {
    useContainer(Container);

    await connection.create();

    userService = Container.get(UserService);
});

beforeEach(async () => {
    await connection.clear();
});

afterAll(async () => {
    await connection.close();
});

it('creates a ghost user', async () => {
    const user = await userService.createGhostUser('foo', 'android');
    expect(user.id).not.toBeNull();
    expect(user.devices).toHaveLength(1);
    const device = user.devices[0];
    expect(device.id).not.toBeNull();
    expect(device.type).toEqual('android');
    expect(device.deviceId).toEqual('foo');
});

it('upgrades a ghost user', async () => {
    const ghostUser = await userService.createGhostUser('foo', 'android');
    const user = await userService.upgradeGhostUser(ghostUser.id, 'foo@bar.com', 'secret', 'squirrel');
    expect(user.id).toEqual(ghostUser.id);
    expect(user.email).toEqual('foo@bar.com');
    expect(user.password).toEqual('secret');
    expect(user.displayName).toEqual('squirrel');
});

it('updates user display name', async () => {
    const ghostUser = await userService.createGhostUser('foo', 'android');
    const user = await userService.updateUser(ghostUser.id, 'cool squirrel');
    expect(user.id).toEqual(ghostUser.id);
    expect(user.displayName).toEqual('cool squirrel');
});

it('deletes a user', async () => {
    const userId = (await userService.createGhostUser('foo', 'android')).id;
    await userService.deleteUser(userId);
    const user = await userService.getUser(userId);
    expect(user).toBeUndefined();
});