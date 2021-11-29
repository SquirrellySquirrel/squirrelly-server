require('dotenv').config({ path: `./.env.${process.env.NODE_ENV}` });
require('reflect-metadata');
import { useContainer } from 'typeorm';
import { Container } from 'typeorm-typedi-extensions';
import connection from '../../src/database';
import Location from '../../src/entity/location';
import Photo from '../../src/entity/photo';
import Post from '../../src/entity/post';
import NotFoundException from '../../src/exception/not-found.exception';
import CommentService from '../../src/service/comment.service';
import LocationService from '../../src/service/location.service';
import PhotoService from '../../src/service/photo.service';
import PostLikeService from '../../src/service/post-like.service';
import PostService from '../../src/service/post.service';
import UserService from '../../src/service/user.service';
import { MockData } from '../../__mocks__/mock-data';

let postService: PostService;
let userService: UserService;
let locationService: LocationService;
let photoService: PhotoService;
let commentService: CommentService;
let postLikeService: PostLikeService;
let userId: string;
let post: Post;
let location: Location;
let photo: Photo;

beforeAll(async () => {
    useContainer(Container);

    await connection.create();

    postService = Container.get(PostService);
    userService = Container.get(UserService);
    locationService = Container.get(LocationService);
    photoService = Container.get(PhotoService);
    commentService = Container.get(CommentService);
    postLikeService = Container.get(PostLikeService);
});

beforeEach(async () => {
    await connection.clear();

    jest.spyOn(PhotoService.prototype as any, 'savePhotoToStorage').mockImplementation(() => { console.log('Mocking saving photo to disk'); });

    userId = (await userService.createUser(MockData.DEFAULT_EMAIL, MockData.DEFAULT_PASSWORD)).id!;
    location = MockData.location1();
    const postId = await postService.savePost(userId, location, false, new Date(), 'Default post');
    photo = MockData.photo1();
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
    it('without limit', async () => {
        const user2Id = (await userService.createUser(MockData.EMAIL_2, MockData.DEFAULT_PASSWORD)).id!;
        await postService.savePost(user2Id, location, true, new Date(), 'Test post');
        const posts = await postService.getPosts({ withCover: true, publicOnly: false }); // get all posts
        expect(posts).toHaveLength(2);
    });

    it('with limit', async () => {
        const user2Id = (await userService.createUser(MockData.EMAIL_2, MockData.DEFAULT_PASSWORD)).id!;
        await postService.savePost(user2Id, location, true, new Date(), 'Test post');
        const posts = await postService.getPosts({ count: 1, withCover: true, publicOnly: false }); // get one post
        expect(posts).toHaveLength(1);
    });

    it('by user', async () => {
        // wait 1s to create another post with photo
        await new Promise((f) => setTimeout(f, 1000));
        const post2Id = (await postService.savePost(userId, location, false, new Date(), 'Test post')).id;
        const photoId = (await photoService.addPhotoToPost(post2Id, photo)).id;
        photo.id = photoId;
        photoService.addPhotoToPost(post2Id, photo);

        const posts = await postService.getPosts({ userId: userId, withCover: true, publicOnly: false });
        expect(posts).toHaveLength(2);
        expect(posts[0].id).toEqual(post2Id);
        expect(posts[0].cover.id).toEqual(photoId);
    });

    it('by location', async () => {
        // wait 1s to create another post with photo
        await new Promise((f) => setTimeout(f, 1000));
        const post2Id = (await postService.savePost(userId, location, false, new Date(), 'Test post')).id;
        const photoId = (await photoService.addPhotoToPost(post2Id, photo)).id;
        photo.id = photoId;
        photoService.addPhotoToPost(post2Id, photo);

        const posts = await postService.getPosts({ locationId: post.location.id, withCover: true, publicOnly: false });
        expect(posts).toHaveLength(2);
        expect(posts[0].id).toEqual(post2Id);
        expect(posts[0].cover.id).toEqual(photoId);
    });

    it('by user and location', async () => {
        const user2Id = (await userService.createUser(MockData.EMAIL_2, MockData.DEFAULT_PASSWORD)).id!;
        const user2PostId = (await postService.savePost(user2Id, location, true, new Date(), 'Test post')).id;
        const posts = await postService
            .getPosts({ userId: user2Id, locationId: post.location.id, withCover: true, publicOnly: false });
        expect(posts).toHaveLength(1);
        expect(posts[0].id).toEqual(user2PostId);
    });

    it('public only', async () => {
        const newPostId = (await postService.savePost(userId, location, true, new Date(), 'Test post')).id;
        const posts = await postService.getPosts({ withCover: false, publicOnly: true });
        expect(posts).toHaveLength(1);
        expect(posts[0].id).toEqual(newPostId);
    });
});

describe('gets an existing post by id', () => {
    it('with comments', async () => {
        const user2Id = (await userService.createUser(MockData.EMAIL_2, MockData.DEFAULT_PASSWORD)).id;
        await commentService.addComment(post.id, user2Id, 'aww');
        const existingPost = await postService.getPost(post.id) as Post;
        expect(existingPost.comments).toHaveLength(1);
        expect(existingPost.comments![0].id).not.toBeNull();
        expect(existingPost.comments![0].creator.id).toEqual(user2Id);
        expect(existingPost.comments![0].content).toEqual('aww');
    });

    it('with likes', async () => {
        const user2Id = (await userService.createUser(MockData.EMAIL_2, MockData.DEFAULT_PASSWORD)).id;
        await postLikeService.addPostLike(post.id, user2Id);
        const existingPost = await postService.getPost(post.id) as Post;
        expect(existingPost.likes).toBe(1);
    });
});

it('deletes a post', async () => {
    await postService.deletePost(post.id);
    await expect(postService.getPost(post.id)).rejects.toThrow(NotFoundException);
});