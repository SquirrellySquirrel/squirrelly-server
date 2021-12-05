require('dotenv').config({ path: `./.env.${process.env.NODE_ENV}` });
require('reflect-metadata');
import { useContainer } from 'typeorm';
import { Container } from 'typeorm-typedi-extensions';
import connection from '../../src/database';
import PostLikeService from '../../src/service/post-like.service';
import PostService from '../../src/service/post.service';
import UserService from '../../src/service/user.service';
import { MockData } from '../../__mocks__/mock-data';

let postLikeService: PostLikeService;
let userService: UserService;
let postService: PostService;
let userId: string;
let postId: string;

beforeAll(async () => {
    useContainer(Container);

    await connection.create();

    postLikeService = Container.get(PostLikeService);
    userService = Container.get(UserService);
    postService = Container.get(PostService);
});

beforeEach(async () => {
    await connection.clear();

    userId = (await userService.createUser(MockData.DEFAULT_EMAIL, MockData.DEFAULT_PASSWORD)).id!;

    const location = MockData.location1();
    postId = (await postService.savePost(userId, location, true, new Date(), '')).id;
});

afterAll(async () => {
    await connection.close();
});

it('gets post likes', async () => {
    await postLikeService.addPostLike(postId, userId);
    const user2Id = (await userService.createUser(MockData.EMAIL_2, MockData.DEFAULT_PASSWORD)).id!;
    await postLikeService.addPostLike(postId, user2Id);

    const likes = await postLikeService.getPostLikes(postId);
    expect(likes).toBe(2);
});

it('adds and deletes a like', async () => {
    await postLikeService.addPostLike(postId, userId);
    let likes = await postLikeService.getPostLikes(postId);
    expect(likes).toBe(1);

    await postLikeService.deletePostLike(postId, userId);
    likes = await postLikeService.getPostLikes(postId);
    expect(likes).toBe(0);
});

