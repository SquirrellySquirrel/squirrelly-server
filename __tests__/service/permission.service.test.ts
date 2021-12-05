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
let postCreator: User;
let postId: string;
let collectionId: string;
let postCreatorCommentId: string;
const location = MockData.location1();

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

    const postCreatorId = (await userService.createUser(MockData.EMAIL_2, MockData.DEFAULT_PASSWORD)).id;
    postCreator = await userService.getUserById(postCreatorId);

    postId = (await postService.savePost(postCreator.id, location, true, new Date(), 'Public post')).id;
    collectionId = (await collectionService.createCollection([postId], postCreator.id, { name: 'my collection' })).id;

    postCreatorCommentId = (await commentService.addComment(postId, postCreator.id, 'my sweet squirrel')).id;
});

afterAll(async () => {
    await connection.close();
});

describe('verifies user action', () => {
    it('allows all access for admin user', () => {
        requestUser.role = UserRole.ADMIN;
        expect(() => permissionService.verifyUserAction(requestUser, postCreator.id)).not.toThrowError();
    });

    it('allows own access for contributor user', () => {
        expect(() => permissionService.verifyUserAction(requestUser, requestUser.id)).not.toThrowError();
    });

    it('denies all access for contributor user', () => {
        expect(() => permissionService.verifyUserAction(requestUser, postCreator.id)).toThrow(PermissionDeniedException);
    });
});

describe('verifies post action', () => {
    it('allows all access for admin user', () => {
        requestUser.role = UserRole.ADMIN;
        expect(() => permissionService.verifyPostAction(requestUser, postId)).not.toThrowError();
    });

    it('allows own access for contributor user', () => {
        expect(() => permissionService.verifyPostAction(postCreator, postId)).not.toThrowError();
    });

    it('denies all access for contributor user', async () => {
        await expect(() => permissionService.verifyPostAction(requestUser, postId)).rejects.toThrow(PermissionDeniedException);
    });
});

describe('verifies collection action', () => {
    it('allows all access for admin user', () => {
        requestUser.role = UserRole.ADMIN;
        expect(() => permissionService.verifyCollectionAction(requestUser, collectionId)).not.toThrowError();
    });

    it('allows own access for user contributor', () => {
        expect(() => permissionService.verifyCollectionAction(postCreator, collectionId)).not.toThrowError();
    });

    it('denies all access for contributor user', async () => {
        await expect(() => permissionService.verifyCollectionAction(requestUser, collectionId))
            .rejects.toThrow(PermissionDeniedException);
    });
});

describe('verifies comment action', () => {
    it('allows any users to create comments for public post', () => {
        expect(() => permissionService.verifyCommentCreateAction(requestUser, postId)).not.toThrowError();
        expect(() => permissionService.verifyCommentCreateAction(postCreator, postId)).not.toThrowError();
    });

    it('denies any users to create comments for private post', async () => {
        const privatePostId = (await postService.savePost(postCreator.id, location, false, new Date(), 'Private post')).id;
        await expect(() => permissionService.verifyCommentCreateAction(requestUser, privatePostId))
            .rejects.toThrow(PermissionDeniedException);

        requestUser.role = UserRole.ADMIN;
        await expect(() => permissionService.verifyCommentCreateAction(requestUser, privatePostId))
            .rejects.toThrow(PermissionDeniedException);

        await expect(() => permissionService.verifyCommentCreateAction(postCreator, privatePostId))
            .rejects.toThrow(PermissionDeniedException);
    });

    it('allows admin user to delete any comments for public post', () => {
        requestUser.role = UserRole.ADMIN;
        expect(() => permissionService.verifyCommentDeleteAction(requestUser, postCreatorCommentId, postId)).not.toThrowError();
    });

    it('allows contributor user to delete his own comments', () => {
        expect(() => permissionService.verifyCommentDeleteAction(postCreator, postCreatorCommentId, postId)).not.toThrowError();
    });

    it('allows contributor user to delete any comments of his own post', async () => {
        const requestUserCommentId = (await commentService.addComment(postId, requestUser.id, 'your sweet squirrel')).id;
        expect(() => permissionService.verifyCommentDeleteAction(postCreator, requestUserCommentId, postId)).not.toThrowError();
    });

    it('denies contributor user to delete other comments of other post', async () => {
        await expect(() => permissionService.verifyCommentDeleteAction(requestUser, postCreatorCommentId, postId))
            .rejects.toThrow(PermissionDeniedException);
    });
});