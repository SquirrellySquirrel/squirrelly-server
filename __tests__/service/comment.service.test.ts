require('dotenv').config({ path: `./.env.${process.env.NODE_ENV}` });
require('reflect-metadata');
import { useContainer } from 'typeorm';
import { Container } from 'typeorm-typedi-extensions';
import connection from '../../src/database';
import Post from '../../src/entity/post';
import CommentService from '../../src/service/comment.service';
import PostService from '../../src/service/post.service';
import UserService from '../../src/service/user.service';
import { MockData } from '../../__mocks__/mock-data';

let commentService: CommentService;
let userService: UserService;
let postService: PostService;
let userId: string;
let post: Post;
let commentId: string;

beforeAll(async () => {
    useContainer(Container);

    await connection.create();

    commentService = Container.get(CommentService);
    userService = Container.get(UserService);
    postService = Container.get(PostService);
});

beforeEach(async () => {
    await connection.clear();

    userId = (await userService.createUser(MockData.DEFAULT_EMAIL, MockData.DEFAULT_PASSWORD)).id!;

    const location = MockData.location1();
    const postId = await postService.savePost(userId, location, true, new Date(), '');
    post = await postService.getPost(postId.id);
    commentId = (await commentService.addComment(post.id, userId, 'sweet squirrel')).id;
});

afterAll(async () => {
    await connection.close();
});

it('adds a comment', async () => {
    const postWithComment = await postService.getPost(post.id) as Post;

    expect(postWithComment.comments).toHaveLength(1);
    expect(postWithComment.comments![0]).toEqual(
        expect.objectContaining({
            id: commentId,
            content: 'sweet squirrel',
        })
    );
});

it('deletes a comment', async () => {
    await commentService.deleteComment(commentId);
    const postWithComment = await postService.getPost(post.id) as Post;

    expect(postWithComment.comments).toHaveLength(0);
});

it('gets all comments of a post ordered by created descendingly', async () => {
    // wait 1s to create another comment
    await new Promise((f) => setTimeout(f, 1000));

    const comment2Id = (await commentService.addComment(post.id, userId, 'another sweet squirrel')).id;
    const comments = await commentService.getComments(post.id);

    expect(comments).toHaveLength(2);
    expect(comments[0]).toEqual(
        expect.objectContaining({
            id: comment2Id,
            content: 'another sweet squirrel',
            creator: expect.objectContaining({ id: userId }),
        }));
    expect(comments[1]).toEqual(
        expect.objectContaining({
            id: commentId,
            content: 'sweet squirrel',
            creator: expect.objectContaining({ id: userId }),
        }));
});
