require('dotenv').config({ path: `./.env.${process.env.NODE_ENV}` });
require('reflect-metadata');
import { getCustomRepository, useContainer } from 'typeorm';
import { Container } from 'typeorm-typedi-extensions';
import connection from '../../src/database';
import Location from '../../src/entity/location';
import Post from '../../src/entity/post';
import NotFoundException from '../../src/exception/not-found.exception';
import CommentRepository from '../../src/repository/comment.repository';
import PostLikeRepository from '../../src/repository/post-like.repository';
import CommentService from '../../src/service/comment.service';
import LocationService from '../../src/service/location.service';
import PostLikeService from '../../src/service/post-like.service';
import PostService from '../../src/service/post.service';
import UserService from '../../src/service/user.service';
import { MockData } from '../../__mocks__/mock-data';

let postService: PostService;
let userService: UserService;
let locationService: LocationService;
let userId: string;
let post: Post;
let location: Location;

beforeAll(async () => {
    useContainer(Container);

    await connection.create();

    postService = Container.get(PostService);
    userService = Container.get(UserService);
    locationService = Container.get(LocationService);
});

beforeEach(async () => {
    await connection.clear();

    userId = (await userService.createUser(MockData.DEFAULT_EMAIL, MockData.DEFAULT_PASSWORD)).id!;
    location = MockData.location1();
    const postId = await postService.savePost(userId, location, false, new Date(), 'Default post');
    post = await postService.getPost(postId.id);
});

afterAll(async () => {
    await connection.close();
});

describe('creates a post', () => {
    it('creates a post with a new location', async () => {
        const newPostId = (await postService.savePost(userId, location, false, new Date(), 'Test post')).id;
        const newPost = await postService.getPost(newPostId) as Post;

        expect(newPost.id).toEqual(newPostId);
        expect(newPost.creator.id).toEqual(userId);
        expect(newPost.location).toEqual(
            expect.objectContaining({
                latitude: location.latitude,
                longitude: location.longitude,
                address: location.address,
            })
        );
        expect(newPost.description).toEqual('Test post');
        expect(newPost.public).toBeFalsy();
    });

    it('creates a post with an existing location', async () => {
        const location2 = MockData.location2();
        const existingLocation = await locationService.saveLocation({
            latitude: location2.latitude,
            longitude: location2.longitude,
            address: location2.address,
        });

        const newPostId = (await postService.savePost(userId, existingLocation, false, new Date(), 'Test post')).id;
        const newPost = await postService.getPost(newPostId) as Post;

        expect(newPost.id).toEqual(newPostId);
        expect(newPost.creator.id).toEqual(userId);
        expect(newPost.location).toEqual(
            expect.objectContaining({
                latitude: location2.latitude,
                longitude: location2.longitude,
                address: location2.address,
            })
        );
        expect(newPost.description).toEqual('Test post');
        expect(newPost.public).toBeFalsy();
    });
});

it('updates a post', async () => {
    const newLocation = MockData.location2();

    await postService.updatePost(post.id, newLocation, true, post.created, 'Updated post');

    const updatedPost = await postService.getPost(post.id) as Post;

    expect(updatedPost.id).toEqual(post.id);
    expect(updatedPost.creator.id).toEqual(userId);
    expect(updatedPost.location).toEqual(
        expect.objectContaining({
            latitude: newLocation.latitude,
            longitude: newLocation.longitude,
            address: newLocation.address,
        })
    );
    expect(updatedPost.description).toEqual('Updated post');
    expect(updatedPost.public).toBeTruthy();
});

describe('gets all posts', () => {
    it('less than limit', async () => {
        const user2Id = (await userService.createUser(MockData.EMAIL_2, MockData.DEFAULT_PASSWORD)).id!;
        await postService.savePost(user2Id, location, true, new Date(), 'Test post');
        const posts = await postService.getPosts(); // get all posts
        expect(posts).toHaveLength(2);
    });

    it('more than limit', async () => {
        const user2Id = (await userService.createUser(MockData.EMAIL_2, MockData.DEFAULT_PASSWORD)).id!;
        await postService.savePost(user2Id, location, true, new Date(), 'Test post');
        const posts = await postService.getPosts(1); // get one post
        expect(posts).toHaveLength(1);
    });
});

describe('gets an existing post by id', () => {
    it('gets comments', async () => {
        const commentService = new CommentService(getCustomRepository(CommentRepository));
        const user2Id = (await userService.createUser(MockData.EMAIL_2, MockData.DEFAULT_PASSWORD)).id!;
        await commentService.addComment(post.id, user2Id, 'aww');
        const existingPost = await postService.getPost(post.id) as Post;
        expect(existingPost.comments).toHaveLength(1);
        expect(existingPost.comments![0].id).not.toBeNull();
        expect(existingPost.comments![0].content).toEqual('aww');
    });

    it('gets likes', async () => {
        const postLikeService = new PostLikeService(getCustomRepository(PostLikeRepository));
        const user2Id = (await userService.createUser(MockData.EMAIL_2, MockData.DEFAULT_PASSWORD)).id!;
        await postLikeService.addPostLike(post.id, user2Id);
        const existingPost = await postService.getPost(post.id) as Post;
        expect(existingPost.likes).toBe(1);
    });
});

it('deletes a post', async () => {
    await postService.deletePost(post.id);
    await expect(postService.getPost(post.id)).rejects.toThrow(NotFoundException);
});