require('dotenv').config({ path: `./.env.${process.env.NODE_ENV}` });
require('reflect-metadata');
import { useContainer } from 'typeorm';
import { Container } from 'typeorm-typedi-extensions';
import connection from '../../src/database';
import Post from '../../src/entity/post';
import PostLikeService from '../../src/service/post-like.service';
import PostService from '../../src/service/post.service';
import UserService from '../../src/service/user.service';
import { MockData } from '../../__mocks__/mock-data';

let postLikeService: PostLikeService;
let userService: UserService;
let postService: PostService;
let userId: string;
let post: Post;

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
    const postId = await postService.createPost(userId, location, true, new Date(), '', [MockData.photo1()]);
    post = await postService.getPost(postId.id);
});

afterAll(async () => {
    await connection.close();
});

it('deletes a like', async () => {
    const user2Id = (await userService.createUser(MockData.EMAIL_2, MockData.DEFAULT_PASSWORD)).id!;
    await postLikeService.addPostLike(post.id, user2Id);
    await postLikeService.deletePostLike(post.id, user2Id);

    const existingPost = await postService.getPost(post.id) as Post;
    expect(existingPost.likes).toBe(0);
});

