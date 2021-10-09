require('dotenv').config({ path: `./.env.${process.env.NODE_ENV}` });
require('reflect-metadata');
import jwt from 'jsonwebtoken';
import ms from 'ms';
import { useContainer } from 'typeorm';
import { Container } from 'typeorm-typedi-extensions';
import { v4 as uuidv4 } from 'uuid';
import connection from '../../src/database';
import DuplicateDataException from '../../src/exception/conflicting-data.exception';
import InvalidCredentialsException from '../../src/exception/invalid-credentials.exception';
import NotFoundException from '../../src/exception/not-found.exception';
import TokenData from '../../src/interfaces/token-data.interface';
import UserService, { UserToken } from '../../src/service/user.service';
import { MockData } from '../../__mocks__/mock-data';
import { JWT_SECRET, TOKEN_TTL } from '../config';

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
    it('creating user succeeds, generates user token und display name', async () => {
        const userToken = await userService.createUser(MockData.DEFAULT_EMAIL, MockData.DEFAULT_PASSWORD);
        expect(userToken.id).not.toBeNull;
        verifyUserToken(userToken);

        const user = await userService.getUserByIdOrEmail(userToken.id);
        expect(user.displayName).toMatch(new RegExp(`${MockData.DEFAULT_DISPLAY_NAME}\\d{1,3}`));
    });

    it('creating user fails due to conflicting email', async () => {
        await userService.createUser(MockData.DEFAULT_EMAIL, MockData.DEFAULT_PASSWORD);
        await expect(userService.createUser(MockData.DEFAULT_EMAIL, MockData.DEFAULT_PASSWORD))
            .rejects.toThrow(DuplicateDataException);
    });
});

describe('gets a user', () => {
    it('by id', async () => {
        const userId = (await userService.createUser(MockData.DEFAULT_EMAIL, MockData.DEFAULT_PASSWORD)).id;
        const user = await userService.getUserByIdOrEmail(userId);
        expect(user.email).toEqual(MockData.DEFAULT_EMAIL);
    });

    it('by email', async () => {
        const userId = (await userService.createUser(MockData.DEFAULT_EMAIL, MockData.DEFAULT_PASSWORD)).id;
        const user = await userService.getUserByIdOrEmail(MockData.DEFAULT_EMAIL);
        expect(user.id).toEqual(userId);
    });
});

describe('authenticates a user', () => {
    it('authentication succeeds, saves default display name and last login, generates user token', async () => {
        const user = await userService.createUser(MockData.DEFAULT_EMAIL, MockData.DEFAULT_PASSWORD);
        const userToken = await userService.authenticate(MockData.DEFAULT_EMAIL, MockData.DEFAULT_PASSWORD);
        expect(userToken.id).toEqual(user.id);
        verifyUserToken(userToken);

        const authenticatedUser = await userService.getUserById(user.id);
        expect(authenticatedUser.lastLogin).not.toBeNull();
    });

    it('authentication fails due to non-existent user', async () => {
        await expect(userService.authenticate(MockData.DEFAULT_EMAIL, MockData.DEFAULT_PASSWORD))
            .rejects.toThrow(InvalidCredentialsException);
    });

    it('authentication fails due to invalid credentials', async () => {
        await expect(userService.authenticate(MockData.DEFAULT_EMAIL, MockData.DEFAULT_PASSWORD))
            .rejects.toThrow(InvalidCredentialsException);
    });
});

describe('updates a user', () => {
    const displayName = 'cool squirrel';

    it('updates user display name', async () => {
        const user = await userService.createUser(MockData.DEFAULT_EMAIL, MockData.DEFAULT_PASSWORD);
        await userService.updateUser(user.id, displayName);
        const updatedUser = await userService.getUserById(user.id);
        expect(updatedUser.displayName).toEqual(displayName);
    });

    it('updating user fails due to non-existent user', async () => {
        await expect(userService.updateUser(uuidv4(), displayName)).rejects.toThrow(NotFoundException);
    });

    it('updating user fails due to existent display name', async () => {
        const user = await userService.createUser(MockData.DEFAULT_EMAIL, MockData.DEFAULT_PASSWORD);
        await userService.updateUser(user.id, displayName);
        const user2 = await userService.createUser(MockData.EMAIL_2, MockData.DEFAULT_PASSWORD);
        await expect(userService.updateUser(user2.id, displayName)).rejects.toThrow(DuplicateDataException);
    });
});

describe('deletes a user', () => {
    it('deleting user succeeds', async () => {
        const user = await userService.createUser(MockData.DEFAULT_EMAIL, MockData.DEFAULT_PASSWORD);
        await userService.deleteUser(user.id);
        await expect(userService.getUserById(user.id)).rejects.toThrow(NotFoundException);
    });
});

function verifyUserToken(userToken: UserToken) {
    const tokenData = jwt.verify(userToken.token.token, JWT_SECRET) as TokenData;
    expect(tokenData._id).toEqual(userToken.id);
    expect(tokenData.role).toEqual('contributor');
    expect(userToken.token.ttl).toEqual(ms(TOKEN_TTL) / 1000);
}
