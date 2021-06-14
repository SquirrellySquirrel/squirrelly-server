require('dotenv').config({ path: `./.env.${process.env.NODE_ENV}` });
require("reflect-metadata");
import { getCustomRepository, useContainer } from 'typeorm';
import { Container } from 'typeorm-typedi-extensions';
import connection from '../../src/database';
import Location from '../../src/entity/location';
import Photo from '../../src/entity/photo';
import Post from '../../src/entity/post';
import NotFoundException from '../../src/exception/not-found.exception';
import CommentRepository from '../../src/repository/comment.repository';
import PostLikeRepository from '../../src/repository/post-like.repository';
import CommentService from '../../src/service/comment.service';
import PostLikeService from '../../src/service/post-like.service';
import PostService from '../../src/service/post.service';
import UserService from '../../src/service/user.service';
import { MockData } from '../../__mocks__/mock-data';

let postService: PostService;
let userService: UserService;
let userId: string;
let post: Post;
let location: Location;
let photo1: Photo;
let photo2: Photo;

beforeAll(async () => {
    useContainer(Container);

    await connection.create();

    postService = Container.get(PostService);
    userService = Container.get(UserService);
});

beforeEach(async () => {
    await connection.clear();

    userId = (await userService.createUser(MockData.DEFAULT_EMAIL, MockData.DEFAULT_PASSWORD)).id!;
    location = MockData.location1();
    photo1 = MockData.photo1();
    photo2 = MockData.photo2();
    post = await postService.createPost(userId, location, false, new Date(), 'Default post', [photo1]);
});

afterAll(async () => {
    await connection.close();
});

it('creates a post with location and another photo', async () => {
    const newPostId = (await postService.createPost(userId, location, false, new Date(), 'Test post', [photo2])).id;
    const newPost = await postService.getPost(newPostId) as Post;

    expect(newPost.creator.id).toEqual(userId);
    expect(newPost.id).toEqual(newPostId);
    expect(newPost.location).toEqual(
        expect.objectContaining({
            latitude: location.latitude,
            longitude: location.longitude,
            address: location.address
        })
    );
    expect(newPost.description).toEqual('Test post');
    expect(newPost.photos).toHaveLength(1);
    const savedPhoto = newPost.photos![0];
    expect(savedPhoto.id).not.toBeNull();
    expect(savedPhoto).toEqual(
        expect.objectContaining({
            path: photo2.path,
            type: photo2.type,
            height: photo2.height,
            width: photo2.width,
            order: 0
        })
    );
    expect(newPost.public).toBeFalsy();
});

describe('updates the existing post', () => {
    it('adds a new photo', async () => {
        photo2.order = 1;
        photo2.post = post;

        await postService.updatePost(post.id, location, false, post.created, 'Updated post');
        await postService.updateDBPhotos([photo2], []);

        const updatedPost = await postService.getPost(post.id) as Post;

        expect(updatedPost.location).toEqual(
            expect.objectContaining({
                latitude: location.latitude,
                longitude: location.longitude,
                address: location.address
            })
        );
        expect(updatedPost.description).toEqual('Updated post');
        expect(updatedPost.photos).toHaveLength(2);
        expect(updatedPost.photos![0].id).not.toBeNull();
        expect(updatedPost.photos![1].id).not.toBeNull();
        expect(updatedPost.public).toBeFalsy();
    });

    it('relaces the existing photo', async () => {
        photo2.post = post;

        await postService.updatePost(post.id, location, false, post.created, 'Updated post');
        await postService.updateDBPhotos([photo2], [photo1]);

        const updatedPost = await postService.getPost(post.id) as Post;

        expect(updatedPost.location).toEqual(
            expect.objectContaining({
                latitude: location.latitude,
                longitude: location.longitude,
                address: location.address
            })
        );
        expect(updatedPost.description).toEqual('Updated post');
        expect(updatedPost.photos).toHaveLength(1);
        const savedPhoto = updatedPost.photos![0];
        expect(savedPhoto.id).not.toBeNull();
        expect(savedPhoto).toEqual(
            expect.objectContaining({
                path: photo2.path,
                type: photo2.type,
                height: photo2.height,
                width: photo2.width,
                order: photo2.order
            })
        );
        expect(updatedPost.public).toBeFalsy;
    });

    it('updates other fields', async () => {
        const newLocation = MockData.location2();

        await postService.updatePost(post.id, newLocation, true, post.created, 'Updated post');

        const updatedPost = await postService.getPost(post.id) as Post;

        expect(updatedPost.location).toEqual(
            expect.objectContaining({
                latitude: newLocation.latitude,
                longitude: newLocation.longitude,
                address: newLocation.address
            })
        );
        expect(updatedPost.description).toEqual('Updated post');
        expect(updatedPost.photos).toHaveLength(1);
        const savedPhoto = updatedPost.photos![0];
        expect(savedPhoto.id).not.toBeNull();
        expect(savedPhoto).toEqual(
            expect.objectContaining({
                path: photo1.path,
                type: photo1.type,
                height: photo1.height,
                width: photo1.width,
                order: photo1.order
            })
        );
        expect(updatedPost.public).toBeTruthy();
    });
});

describe('gets all posts', () => {
    it('less than limit', async () => {
        const user2Id = (await userService.createUser(MockData.EMAIL_2, MockData.DEFAULT_PASSWORD)).id!;
        await postService.createPost(user2Id, location, true, new Date(), 'Test post', [photo2]);
        const posts = await postService.getPosts(); // get all posts
        expect(posts).toHaveLength(2);
    });

    it('more than limit', async () => {
        const user2Id = (await userService.createUser(MockData.EMAIL_2, MockData.DEFAULT_PASSWORD)).id!;
        await postService.createPost(user2Id, location, true, new Date(), 'Test post', [photo2]);
        const posts = await postService.getPosts(1); // get one post
        expect(posts).toHaveLength(1);
    });
});

it('gets all posts by user with correct orders and covers', async () => {
    await new Promise(resolve => setTimeout(resolve, 1000)); // wait for 1s before saving a new post
    const post2 = await postService.createPost(userId, location, true, new Date(), 'Test post', [photo2]);
    const posts = await postService.getPostsByUser(userId) as Post[];
    expect(posts).toHaveLength(2);
    expect(posts[0].id).toEqual(post2.id);
    expect(posts[0].cover.id).toEqual(photo2.id);
    expect(posts[1].id).toEqual(post.id);
    expect(posts[1].cover.id).toEqual(photo1.id);
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