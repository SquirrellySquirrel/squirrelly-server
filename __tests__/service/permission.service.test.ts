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
let publicPostId: string;
let privatePostId: string;
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

    publicPostId = (await postService.savePost(postCreator.id, location, true, new Date(), 'Public post')).id;
    privatePostId = (await postService.savePost(postCreator.id, location, false, new Date(), 'Private post')).id;

    collectionId = (await collectionService.createCollection([publicPostId], postCreator.id, { name: 'my collection' })).id;

    postCreatorCommentId = (await commentService.addComment(publicPostId, postCreator.id, 'my sweet squirrel')).id;
});

afterAll(async () => {
    await connection.close();
});

describe('verifies user action', () => {
    it('allows all access for admin user', async () => {
        requestUser.role = UserRole.ADMIN;
        await expect(permissionService.verifyUserAction(requestUser, postCreator.id)).resolves.toBeUndefined();
    });

    it('allows own access for contributor user', async () => {
        await expect(permissionService.verifyUserAction(requestUser, requestUser.id)).resolves.toBeUndefined();
    });

    it('denies all access for contributor user', async () => {
        await expect(permissionService.verifyUserAction(requestUser, postCreator.id)).rejects.toThrow(PermissionDeniedException);
    });
});

describe('verifies post action', () => {
    it('allows all access for admin user', async () => {
        requestUser.role = UserRole.ADMIN;
        await expect(permissionService.verifyPostAction(requestUser, publicPostId)).resolves.toBeUndefined();
    });

    it('allows own access for contributor user', async () => {
        await expect(permissionService.verifyPostAction(postCreator, publicPostId)).resolves.toBeUndefined();
    });

    it('denies all access for contributor user', async () => {
        await expect(permissionService.verifyPostAction(requestUser, publicPostId)).rejects.toThrow(PermissionDeniedException);
    });

    it('denies contributor to read other private posts', async () => {
        await expect(permissionService.verifyPostReadAction(privatePostId, requestUser))
            .rejects.toThrow(PermissionDeniedException);
    });

    it('denies viewer to read any private posts', async () => {
        await expect(permissionService.verifyPostReadAction(privatePostId, undefined))
            .rejects.toThrow(PermissionDeniedException);
    });

    it('allows contributor to read own private post', async () => {
        await expect(permissionService.verifyPostReadAction(privatePostId, postCreator)).resolves.toBeUndefined();
    });

    it('allows admin user to read any private posts', async () => {
        requestUser.role = UserRole.ADMIN;
        await expect(permissionService.verifyPostReadAction(privatePostId, requestUser)).resolves.toBeUndefined();
    });
});

describe('verifies collection action', () => {
    it('allows all access for admin user', async () => {
        requestUser.role = UserRole.ADMIN;
        await expect(permissionService.verifyCollectionAction(requestUser, collectionId)).resolves.toBeUndefined();
    });

    it('allows own access for user contributor', async () => {
        await expect(permissionService.verifyCollectionAction(postCreator, collectionId)).resolves.toBeUndefined();
    });

    it('denies all access for contributor user', async () => {
        await expect(permissionService.verifyCollectionAction(requestUser, collectionId))
            .rejects.toThrow(PermissionDeniedException);
    });
});

describe('verifies comment action permission denied', () => {
    it('denies contributor user to create comments for other private post', async () => {
        await expect(permissionService.verifyPostAction(requestUser, privatePostId))
            .rejects.toThrow(PermissionDeniedException);
    });

    it('denies contributor user to delete comments of other private post', async () => {
        await expect(permissionService.verifyCommentDeleteAction(requestUser, postCreatorCommentId, privatePostId))
            .rejects.toThrow(PermissionDeniedException);
    });

    it('denies contributor user to delete other comments of other public post', async () => {
        await expect(permissionService.verifyCommentDeleteAction(requestUser, postCreatorCommentId, publicPostId))
            .rejects.toThrow(PermissionDeniedException);
    });

    it('denies viewer to read comments for private post', async () => {
        await expect(permissionService.verifyPostReadAction(privatePostId, undefined))
            .rejects.toThrow(PermissionDeniedException);
    });

    it('denies contributor to read comments for other private post', async () => {
        await expect(permissionService.verifyPostReadAction(privatePostId, requestUser))
            .rejects.toThrow(PermissionDeniedException);
    });
});

describe('verifies comment action authorized', () => {
    it('allows viewr to read any public posts', async () => {
        await expect(permissionService.verifyPostReadAction(publicPostId, undefined)).resolves.toBeUndefined();
    });

    it('allows contributor to read comments of his own private post', async () => {
        await expect(permissionService.verifyPostReadAction(privatePostId, postCreator)).resolves.toBeUndefined();
    });

    it('allows admin user to read comments of any private posts', async () => {
        requestUser.role = UserRole.ADMIN;
        await expect(permissionService.verifyPostReadAction(privatePostId, requestUser)).resolves.toBeUndefined();
    });

    it('allows users to create comments for any public posts', async () => {
        await expect(permissionService.verifyCommentCreateAction(requestUser, publicPostId)).resolves.toBeUndefined();
        await expect(permissionService.verifyCommentCreateAction(postCreator, publicPostId)).resolves.toBeUndefined();
    });

    it('allows contributor user to delete his own comments of any public posts', async () => {
        await expect(permissionService.verifyCommentDeleteAction(postCreator, postCreatorCommentId, publicPostId))
            .resolves.toBeUndefined();
    });

    it('allows contributor user to delete any comments of his own public posts', async () => {
        const requestUserCommentId = (await commentService.addComment(publicPostId, requestUser.id, 'your sweet squirrel')).id;
        await expect(permissionService.verifyCommentDeleteAction(postCreator, requestUserCommentId, publicPostId))
            .resolves.toBeUndefined();
    });

    it('allows contributor user to create comments of his own private post', async () => {
        await expect(permissionService.verifyPostAction(postCreator, privatePostId)).resolves.toBeUndefined();
    });

    it('allows contributor user to delete comments of his own private post', async () => {
        await expect(permissionService.verifyCommentDeleteAction(postCreator, postCreatorCommentId, privatePostId))
            .resolves.toBeUndefined();
    });

    it('allows admin user to delete comments of any public posts', async () => {
        requestUser.role = UserRole.ADMIN;
        await expect(permissionService.verifyCommentDeleteAction(requestUser, postCreatorCommentId, publicPostId))
            .resolves.toBeUndefined();
    });

    it('allows admin user to create comments for any private posts', async () => {
        requestUser.role = UserRole.ADMIN;
        await expect(permissionService.verifyPostAction(requestUser, privatePostId)).resolves.toBeUndefined();
    });

    it('allows admin user to delete comments of any private posts', async () => {
        requestUser.role = UserRole.ADMIN;
        await expect(permissionService.verifyCommentDeleteAction(requestUser, postCreatorCommentId, privatePostId))
            .resolves.toBeUndefined();
    });
});