require('dotenv').config({ path: `./.env.${process.env.NODE_ENV}` });
require('reflect-metadata');
import { useContainer } from 'typeorm';
import { Container } from 'typeorm-typedi-extensions';
import connection from '../../src/database';
import User, { UserRole } from '../../src/entity/user';
import PermissionDeniedException from '../../src/exception/permission-denied.exception';
import CollectionService from '../../src/service/collection.service';
import CommentService from '../../src/service/comment.service';
import PermissionService from '../../src/service/permission.service';
import PostService from '../../src/service/post.service';
import UserService from '../../src/service/user.service';
import { MockData } from '../../__mocks__/mock-data';

let permissionService: PermissionService;
let userService: UserService;
let postService: PostService;
let commentService: CommentService;
let collectionService: CollectionService;
let requestUser: User;
let user: User;
let postId: string;
let collectionId: string;
let commentId: string;

beforeAll(async () => {
    useContainer(Container);

    await connection.create();

    permissionService = Container.get(PermissionService);
    collectionService = Container.get(CollectionService);
    userService = Container.get(UserService);
    postService = Container.get(PostService);
    commentService = Container.get(CommentService);
});

beforeEach(async () => {
    await connection.clear();

    const requestUserId = (await userService.createUser(MockData.DEFAULT_EMAIL, MockData.DEFAULT_PASSWORD)).id;
    requestUser = await userService.getUserById(requestUserId);

    const userId = (await userService.createUser(MockData.EMAIL_2, MockData.DEFAULT_PASSWORD)).id;
    user = await userService.getUserById(userId);

    const location = MockData.location1();
    postId = (await postService.savePost(user.id, location, false, new Date(), 'Default post')).id;
    collectionId = (await collectionService.createCollection([postId], user.id, { name: 'my collection' })).id;
    commentId = (await commentService.addComment(postId, user.id, 'sweet squirrel')).id;
});

afterAll(async () => {
    await connection.close();
});

describe('verifies user action', () => {
    it('allows all access for user with admin role', () => {
        requestUser.role = UserRole.ADMIN;
        expect(() => permissionService.verifyUserAction(requestUser, user.id)).not.toThrowError();
    });

    it('allows own access for user with contributor role', () => {
        expect(() => permissionService.verifyUserAction(requestUser, requestUser.id)).not.toThrowError();
    });

    it('denies all access for user with contributor role', () => {
        expect(() => permissionService.verifyUserAction(requestUser, user.id)).toThrow(PermissionDeniedException);
    });
});

describe('verifies post action', () => {
    it('allows all access for user with admin role', () => {
        requestUser.role = UserRole.ADMIN;
        expect(() => permissionService.verifyPostAction(requestUser, postId)).not.toThrowError();
    });

    it('allows own access for user with contributor role', () => {
        expect(() => permissionService.verifyPostAction(user, postId)).not.toThrowError();
    });

    it('denies all access for user with contributor role', async () => {
        await expect(() => permissionService.verifyPostAction(requestUser, postId)).rejects.toThrow(PermissionDeniedException);
    });
});

describe('verifies collection action', () => {
    it('allows all access for user with admin role', () => {
        requestUser.role = UserRole.ADMIN;
        expect(() => permissionService.verifyCollectionAction(requestUser, collectionId)).not.toThrowError();
    });

    it('allows own access for user with contributor role', () => {
        expect(() => permissionService.verifyCollectionAction(user, collectionId)).not.toThrowError();
    });

    it('denies all access for user with contributor role', async () => {
        await expect(() => permissionService.verifyCollectionAction(requestUser, collectionId))
            .rejects.toThrow(PermissionDeniedException);
    });
});

describe('verifies comment action', () => {
    it('allows all access for user with admin role', () => {
        requestUser.role = UserRole.ADMIN;
        expect(() => permissionService.verifyCommentAction(requestUser, commentId)).not.toThrowError();
    });

    it('allows own access for user with contributor role', () => {
        expect(() => permissionService.verifyCommentAction(user, commentId)).not.toThrowError();
    });

    it('denies all access for user with contributor role', async () => {
        await expect(() => permissionService.verifyCommentAction(requestUser, commentId))
            .rejects.toThrow(PermissionDeniedException);
    });
});