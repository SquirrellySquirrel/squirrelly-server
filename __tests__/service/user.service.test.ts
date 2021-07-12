require('dotenv').config({ path: `./.env.${process.env.NODE_ENV}` });
require('reflect-metadata');
import { useContainer } from 'typeorm';
import { Container } from 'typeorm-typedi-extensions';
import connection from '../../src/database';
import DuplicateDataException from '../../src/exception/conflicting-data.exception';
import NotFoundException from '../../src/exception/not-found.exception';
import UnauthorizedException from '../../src/exception/unauthorized.exception';
import UserService from '../../src/service/user.service';
import { MockData } from '../../__mocks__/mock-data';

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

describe('creates a user', () => {
    it('creating user succeeds', async () => {
        const user = await userService.createUser(MockData.DEFAULT_EMAIL, MockData.DEFAULT_PASSWORD);
        expect(user.id).not.toBeNull();
    });

    it('creating user fails due to conflicting email', async () => {
        await userService.createUser(MockData.DEFAULT_EMAIL, MockData.DEFAULT_PASSWORD);
        await expect(userService.createUser(MockData.DEFAULT_EMAIL, MockData.DEFAULT_PASSWORD))
            .rejects.toThrow(DuplicateDataException);
    });
});

describe('authenticates a user', () => {
    it('authentication succeeds, saves default display name and last login', async () => {
        const user = await userService.createUser(MockData.DEFAULT_EMAIL, MockData.DEFAULT_PASSWORD);
        await userService.authenticate(MockData.DEFAULT_EMAIL, MockData.DEFAULT_PASSWORD);

        const authenticatedUser = await userService.getUserById(user.id);
        expect(authenticatedUser.displayName).toEqual(MockData.DEFAULT_DISPLAY_NAME);
        expect(authenticatedUser.lastLogin).not.toBeNull();
    });

    it('authentication fails due to non-existent user', async () => {
        await expect(userService.authenticate(MockData.DEFAULT_EMAIL, MockData.DEFAULT_PASSWORD))
            .rejects.toThrow(UnauthorizedException);
    });

    it('authentication fails due to invalid credentials', async () => {
        await expect(userService.authenticate(MockData.DEFAULT_EMAIL, MockData.DEFAULT_PASSWORD))
            .rejects.toThrow(UnauthorizedException);
    });
});

describe('updates a user', () => {
    it('updates user display name', async () => {
        const displayName = 'cool squirrel';
        const user = await userService.createUser(MockData.DEFAULT_EMAIL, MockData.DEFAULT_PASSWORD);
        await userService.updateUser(user.id, displayName);
        const updatedUser = await userService.getUserById(user.id);
        expect(updatedUser.displayName).toEqual(displayName);
    });

    it('updating user fails due to non-existent user', async () => {
        const displayName = 'cool squirrel';
        await expect(userService.updateUser('00000000-1111-2222-3333-444444444444', displayName)).rejects.toThrow(NotFoundException);
    });

    it('updating user fails due to existent display name', async () => {
        await userService.createUser(MockData.DEFAULT_EMAIL, MockData.DEFAULT_PASSWORD);
        const user2 = await userService.createUser(MockData.EMAIL_2, MockData.DEFAULT_PASSWORD);
        await expect(userService.updateUser(user2.id, MockData.DEFAULT_DISPLAY_NAME))
            .rejects.toThrow(DuplicateDataException);
    });
});

describe('deletes a user', () => {
    it('deleting user succeeds', async () => {
        const user = await userService.createUser(MockData.DEFAULT_EMAIL, MockData.DEFAULT_PASSWORD);
        await userService.deleteUser(user.id);
        await expect(userService.getUserById(user.id)).rejects.toThrow(NotFoundException);
    });
});
