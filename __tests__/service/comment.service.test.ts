require('dotenv').config({ path: `./.env.${process.env.NODE_ENV}` });
require("reflect-metadata");
import { useContainer } from 'typeorm';
import { Container } from 'typeorm-typedi-extensions';
import connection from '../../src/database';
import Post from '../../src/entity/post';
import User from '../../src/entity/user';
import CommentService from '../../src/service/comment.service';
import LocationService from '../../src/service/location.service';
import PostService from '../../src/service/post.service';
import UserService from '../../src/service/user.service';
import { MockData } from '../../__mocks__/mock-data';

let commentService: CommentService;
let userService: UserService;
let postService: PostService;
let locationService: LocationService;
let user: User;
let post: Post;

beforeAll(async () => {
    useContainer(Container);

    await connection.create();

    commentService = Container.get(CommentService);
    userService = Container.get(UserService);
    postService = Container.get(PostService);
    locationService = Container.get(LocationService);
});

beforeEach(async () => {
    await connection.clear();

    user = await userService.createGhostUser('foo', 'android');

    let location = MockData.location1();
    post = await postService.savePostAndLocation(user.id, location, true, new Date(), [MockData.photo1()]);
});

afterAll(async () => {
    await connection.close();
});

it('adds a comment', async () => {
    const commentId = (await commentService.addComment(post.id, user.id, 'sweet squirrel')).id;
    const postWithComment = await postService.getPost(post.id) as Post;
    expect(postWithComment.comments).toHaveLength(1);
    expect(postWithComment.comments![0]).toEqual(
        expect.objectContaining({
            id: commentId,
            content: 'sweet squirrel'
        })
    );
});

it('deletes a comment', async () => {
    const commentId = (await commentService.addComment(post.id, user.id, 'sweet squirrel')).id;
    await commentService.deleteComment(commentId);

    const postWithComment = await postService.getPost(post.id) as Post;
    expect(postWithComment.comments).toHaveLength(0);
});

