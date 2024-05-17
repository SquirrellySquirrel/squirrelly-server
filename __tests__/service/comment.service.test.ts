require('dotenv').config({ path: `./.env.${process.env.NODE_ENV}` });
require('reflect-metadata');
import { Post } from '@prisma/client';
import Container from 'typedi';
import { MockData } from '../../__mocks__/mock-data';
import CommentService from '../../src/service/comment.service';
import PostService from '../../src/service/post.service';
import UserService from '../../src/service/user.service';
import resetDb from '../reset-db';

let commentService: CommentService;
let userService: UserService;
let postService: PostService;
let userId: string;
let post: Post;
let commentId: string;

beforeAll(async () => {
    commentService = Container.get(CommentService);
    userService = Container.get(UserService);
    postService = Container.get(PostService);
});

beforeEach(async () => {
    await resetDb();

    userId = (await userService.createUser({ email: MockData.DEFAULT_EMAIL, password: MockData.DEFAULT_PASSWORD })).id!;

    const location = MockData.location1();
    const postId = await postService.savePost(userId, location, { occurred: new Date(), public: true, description: '' });
    post = await postService.getPost(postId.id);
    commentId = (await commentService.addComment(post.id, userId, 'sweet squirrel')).id;
});

it('adds a comment', async () => {
    const comments = await commentService.getComments(post.id);

    expect(comments).toHaveLength(1);
    expect(comments[0]).toEqual(
        expect.objectContaining({
            id: commentId,
            content: 'sweet squirrel',
        })
    );
});

it('deletes a comment', async () => {
    await commentService.deleteComment(commentId);
    const comments = await commentService.getComments(post.id);

    expect(comments).toHaveLength(0);
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
            creatorId: userId,
            postId: post.id,
        }));
    expect(comments[1]).toEqual(
        expect.objectContaining({
            id: commentId,
            content: 'sweet squirrel',
            creatorId: userId,
            postId: post.id,
        }));
});
