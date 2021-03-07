require('dotenv').config({ path: `./.env.${process.env.NODE_ENV}` });
require("reflect-metadata");
import { getCustomRepository } from 'typeorm';
import connection from '../../src/database';
import { UserRepository } from '../../src/repository/user-repository';
import { UserService } from '../../src/service/user-service';

let userService: UserService;

beforeAll(async () => {
    await connection.create();
    userService = new UserService(getCustomRepository(UserRepository));
});

beforeEach(async () => {
    await connection.clear();
});

afterAll(async () => {
    await connection.close();
});

it('creates a ghost user', async () => {
    const user = await userService.createGhostUser('foo', 'android');
    expect(user.id).not.toBeNull;
    expect(user.devices).toHaveLength(1);
    const device = user.devices[0];
    expect(device.id).not.toBeNull;
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
    const user = await userService.createGhostUser('foo', 'android');
    await userService.deleteUser(user.id);
    await userService.getUser(user.id).then(user => expect(user).toBeUndefined);
});