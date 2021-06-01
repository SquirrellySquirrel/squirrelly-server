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
    const user = await userService.createOrGetUser('foo', 'android');
    expect(user.id).not.toBeNull();
});

it('upgrades a ghost user', async () => {
    const ghostUserId = (await userService.createOrGetUser('foo', 'android')).id!;
    const user = await userService.upgradeGhostUser(ghostUserId, 'foo@bar.com', 'secret', 'squirrel');
    expect(user.id).toEqual(ghostUserId);
    expect(user.email).toEqual('foo@bar.com');
    expect(user.password).toBeUndefined();
    expect(user.displayName).toEqual('squirrel');
});

it('updates user display name', async () => {
    const ghostUserId = (await userService.createOrGetUser('foo', 'android')).id!;
    const user = await userService.updateUser(ghostUserId, 'cool squirrel');
    expect(user.id).toEqual(ghostUserId);
    expect(user.displayName).toEqual('cool squirrel');
});

it('deletes a user', async () => {
    const userId = (await userService.createOrGetUser('foo', 'android')).id!;
    await userService.deleteUser(userId);
    const user = await userService.getUserById(userId);
    expect(user).toBeUndefined();
});