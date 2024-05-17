require('dotenv').config({ path: `./.env.${process.env.NODE_ENV}` });
require('reflect-metadata');
import Container from 'typedi';
import { MockData } from '../../__mocks__/mock-data';
import PostLikeService from '../../src/service/post-like.service';
import PostService from '../../src/service/post.service';
import UserService from '../../src/service/user.service';
import resetDb from '../reset-db';

let postLikeService: PostLikeService;
let userService: UserService;
let postService: PostService;
let userId: string;
let postId: string;

beforeAll(async () => {
    postLikeService = Container.get(PostLikeService);
    userService = Container.get(UserService);
    postService = Container.get(PostService);
});

beforeEach(async () => {
    await resetDb();

    userId = (await userService.createUser({ email: MockData.DEFAULT_EMAIL, password: MockData.DEFAULT_PASSWORD })).id!;

    const location = MockData.location1();
    postId = (await postService.savePost(userId, location, { occurred: new Date(), public: true, description: '' })).id;
});

it('gets post likes', async () => {
    await postLikeService.addPostLike(postId, userId);
    const user2Id = (await userService.createUser({ email: MockData.EMAIL_2, password: MockData.DEFAULT_PASSWORD })).id!;
    await postLikeService.addPostLike(postId, user2Id);

    const postLikes = await postLikeService.getPostLikes(postId);
    expect(postLikes.likes).toBe(2);
});

it('adds and deletes a like', async () => {
    await postLikeService.addPostLike(postId, userId);
    let postLikes = await postLikeService.getPostLikes(postId);
    expect(postLikes.likes).toBe(1);
    expect(postLikes.likers).toContainEqual(userId);

    await postLikeService.deletePostLike(postId, userId);
    postLikes = await postLikeService.getPostLikes(postId);
    expect(postLikes.likes).toBe(0);
    expect(postLikes.likers).toHaveLength(0);
});

it('can add a like only once', async () => {
    await postLikeService.addPostLike(postId, userId);
    await postLikeService.addPostLike(postId, userId);

    const postLikes = await postLikeService.getPostLikes(postId);
    expect(postLikes.likes).toBe(1);
    expect(postLikes.likers).toContainEqual(userId);
});

