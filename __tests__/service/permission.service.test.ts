require('dotenv').config({ path: `./.env.${process.env.NODE_ENV}` });
require('reflect-metadata');
import { User } from '@prisma/client';
import Container from 'typedi';
import { MockData } from '../../__mocks__/mock-data';
import PermissionDeniedException from '../../src/exception/permission-denied.exception';
import CollectionService from '../../src/service/collection.service';
import CommentService from '../../src/service/comment.service';
import { UserRole } from '../../src/service/model/user';
import PermissionService from '../../src/service/permission.service';
import PostService from '../../src/service/post.service';
import UserService from '../../src/service/user.service';
import resetDb from '../reset-db';

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
    permissionService = Container.get(PermissionService);
    collectionService = Container.get(CollectionService);
    userService = Container.get(UserService);
    postService = Container.get(PostService);
    commentService = Container.get(CommentService);
});

beforeEach(async () => {
    await resetDb();

    const requestUserId = (await userService.createUser({ email: MockData.DEFAULT_EMAIL, password: MockData.DEFAULT_PASSWORD }))
        .id;
    requestUser = await userService.getUserById(requestUserId);

    const postCreatorId = (await userService.createUser({ email: MockData.EMAIL_2, password: MockData.DEFAULT_PASSWORD })).id;
    postCreator = await userService.getUserById(postCreatorId);

    publicPostId = (await postService.savePost(postCreator.id, location, { occurred: new Date(), public: true, description: 'Public post' })).id;
    privatePostId = (await postService.savePost(postCreator.id, location, { occurred: new Date(), public: false, description: 'Private post' })).id;

    collectionId = (await collectionService.createCollection([publicPostId], postCreator.id, { name: 'my collection', description: 'init description' })).id;

    postCreatorCommentId = (await commentService.addComment(publicPostId, postCreator.id, 'my sweet squirrel')).id;
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
        await expect(permissionService.verifyOwnPostAction(requestUser, publicPostId)).resolves.toBeUndefined();
    });

    it('allows own access for user', async () => {
        await expect(permissionService.verifyOwnPostAction(postCreator, publicPostId)).resolves.toBeUndefined();
    });

    it('denies all access for user', async () => {
        await expect(permissionService.verifyOwnPostAction(requestUser, publicPostId)).rejects.toThrow(PermissionDeniedException);
    });

    it('denies user to read other private posts', async () => {
        await expect(permissionService.verifyPostReadAction(privatePostId, requestUser))
            .rejects.toThrow(PermissionDeniedException);
    });

    it('denies viewer to read any private posts', async () => {
        await expect(permissionService.verifyPostReadAction(privatePostId, null))
            .rejects.toThrow(PermissionDeniedException);
    });

    it('allows user to read own private post', async () => {
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

    it('allows own access for user', async () => {
        await expect(permissionService.verifyCollectionAction(postCreator, collectionId)).resolves.toBeUndefined();
    });

    it('denies all access for user', async () => {
        await expect(permissionService.verifyCollectionAction(requestUser, collectionId))
            .rejects.toThrow(PermissionDeniedException);
    });
});

describe('verifies comment action', () => {
    describe('comment action authorized', () => {
        it('allows viewr to read any public posts', async () => {
            await expect(permissionService.verifyPostReadAction(publicPostId, null)).resolves.toBeUndefined();
        });

        it('allows users to create comments for any public posts', async () => {
            await expect(permissionService.verifyAllPostAction(requestUser, publicPostId)).resolves.toBeUndefined();
            await expect(permissionService.verifyAllPostAction(postCreator, publicPostId)).resolves.toBeUndefined();
        });

        it('allows user to delete his own comments of any public posts', async () => {
            await expect(permissionService.verifyCommentAction(postCreator, postCreatorCommentId, publicPostId))
                .resolves.toBeUndefined();
        });

        it('allows user to delete any comments of his own public posts', async () => {
            const requestUserCommentId = (await commentService.addComment(publicPostId, requestUser.id, 'your sweet squirrel')).id;
            await expect(permissionService.verifyCommentAction(postCreator, requestUserCommentId, publicPostId))
                .resolves.toBeUndefined();
        });

        it('allows user to create comments of his own private post', async () => {
            await expect(permissionService.verifyOwnPostAction(postCreator, privatePostId)).resolves.toBeUndefined();
        });

        it('allows user to delete comments of his own private post', async () => {
            await expect(permissionService.verifyCommentAction(postCreator, postCreatorCommentId, privatePostId))
                .resolves.toBeUndefined();
        });

        it('allows admin user to delete comments of any public posts', async () => {
            requestUser.role = UserRole.ADMIN;
            await expect(permissionService.verifyCommentAction(requestUser, postCreatorCommentId, publicPostId))
                .resolves.toBeUndefined();
        });

        it('allows admin user to create comments for any private posts', async () => {
            requestUser.role = UserRole.ADMIN;
            await expect(permissionService.verifyOwnPostAction(requestUser, privatePostId)).resolves.toBeUndefined();
        });

        it('allows admin user to delete comments of any private posts', async () => {
            requestUser.role = UserRole.ADMIN;
            await expect(permissionService.verifyCommentAction(requestUser, postCreatorCommentId, privatePostId))
                .resolves.toBeUndefined();
        });
    });

    describe('comment action denied', () => {
        it('denies user to create comments for other private post', async () => {
            await expect(permissionService.verifyOwnPostAction(requestUser, privatePostId))
                .rejects.toThrow(PermissionDeniedException);
        });

        it('denies user to delete comments of other private post', async () => {
            await expect(permissionService.verifyCommentAction(requestUser, postCreatorCommentId, privatePostId))
                .rejects.toThrow(PermissionDeniedException);
        });

        it('denies user to delete other comments of other public post', async () => {
            await expect(permissionService.verifyCommentAction(requestUser, postCreatorCommentId, publicPostId))
                .rejects.toThrow(PermissionDeniedException);
        });
    });
});

