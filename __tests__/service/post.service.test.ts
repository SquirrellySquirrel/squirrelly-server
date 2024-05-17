require('dotenv').config({ path: `./.env.${process.env.NODE_ENV}` });
require('reflect-metadata');
import Container from 'typedi';
import { MockData } from '../../__mocks__/mock-data';
import NotFoundException from '../../src/exception/not-found.exception';
import LocationService from '../../src/service/location.service';
import { LocationParams } from '../../src/service/model/location';
import { PhotoParams } from '../../src/service/model/photo';
import { ExtendedPost } from '../../src/service/model/post';
import PhotoService from '../../src/service/photo.service';
import PostLikeService from '../../src/service/post-like.service';
import PostService from '../../src/service/post.service';
import UserService from '../../src/service/user.service';
import resetDb from '../reset-db';

let postService: PostService;
let userService: UserService;
let locationService: LocationService;
let photoService: PhotoService;
let postLikeService: PostLikeService;
let userId: string;
let post: ExtendedPost;
let location: LocationParams;
let photo: PhotoParams;

beforeAll(async () => {
    postService = Container.get(PostService);
    userService = Container.get(UserService);
    locationService = Container.get(LocationService);
    photoService = Container.get(PhotoService);
    postLikeService = Container.get(PostLikeService);
});

beforeEach(async () => {
    await resetDb();

    jest.spyOn(PhotoService.prototype as any, 'savePhotoToStorage').mockImplementation(() => { console.log('Mocking saving photo to disk'); });

    userId = (await userService.createUser({ email: MockData.DEFAULT_EMAIL, password: MockData.DEFAULT_PASSWORD })).id!;
    location = MockData.location1();
    const postId = await postService.savePost(userId, location, { occurred: new Date(), public: false, description: 'Default post' });
    photo = MockData.photo1();
    post = await postService.getPost(postId.id);
});

describe('creates a post', () => {
    it('creates a post with a new location', async () => {
        const newPostId = (await postService.savePost(userId, location, { occurred: new Date(), public: false, description: 'Test post' })).id;
        const newPost = await postService.getPost(newPostId);

        expect(newPost.id).toEqual(newPostId);
        expect(newPost.creatorId).toEqual(userId);
        expect(newPost.description).toEqual('Test post');
        expect(newPost.public).toBeFalsy();

        const savedLocation = await locationService.getLocationByCoordinate(location.latitude, location.longitude);
        expect(newPost.locationId).toEqual(savedLocation?.id);
    });

    it('creates a post with an existing location', async () => {
        const location2 = MockData.location2();
        const existingLocation = await locationService.saveLocationIfNotExists({
            latitude: location2.latitude,
            longitude: location2.longitude,
            address: location2.address,
        });

        const newPostId = (await postService.savePost(userId, existingLocation, { occurred: new Date(), public: false, description: 'Test post' })).id;
        const newPost = await postService.getPost(newPostId);

        expect(newPost.id).toEqual(newPostId);
        expect(newPost.creatorId).toEqual(userId);
        expect(newPost.locationId).toEqual(existingLocation.id);
        expect(newPost.description).toEqual('Test post');
        expect(newPost.public).toBeFalsy();
    });
});

it('updates a post', async () => {
    const newLocation = MockData.location2();

    await postService.updatePost(post.id, newLocation, { occurred: post.occurred, public: true, description: 'Updated post' });

    const updatedPost = await postService.getPost(post.id);

    expect(updatedPost.id).toEqual(post.id);
    expect(updatedPost.creatorId).toEqual(userId);
    expect(updatedPost.description).toEqual('Updated post');
    expect(updatedPost.public).toBeTruthy();

    const savedNewLocation = await locationService.getLocationByCoordinate(newLocation.latitude, newLocation.longitude);
    expect(updatedPost.locationId).toEqual(savedNewLocation?.id);
});

describe('gets all posts', () => {
    it('without limit', async () => {
        const user2Id = (await userService.createUser({ email: MockData.EMAIL_2, password: MockData.DEFAULT_PASSWORD })).id!;
        await postService.savePost(user2Id, location, { occurred: new Date(), public: true, description: 'Test post' });
        const posts = await postService.getPosts({ withCover: true, publicOnly: false }); // get all posts
        expect(posts).toHaveLength(2);
    });

    it('with limit', async () => {
        const user2Id = (await userService.createUser({ email: MockData.EMAIL_2, password: MockData.DEFAULT_PASSWORD })).id!;
        await postService.savePost(user2Id, location, { occurred: new Date(), public: true, description: 'Test post' });
        const posts = await postService.getPosts({ count: 1, withCover: true, publicOnly: false }); // get one post
        expect(posts).toHaveLength(1);
    });

    it('by user', async () => {
        // wait 1s to create another post with photo
        await new Promise((f) => setTimeout(f, 1000));
        const post2Id = (await postService.savePost(userId, location, { occurred: new Date(), public: false, description: 'Test post' })).id;
        const photoId = (await photoService.addPhotoToPost(post2Id, photo)).id;
        photoService.addPhotoToPost(post2Id, photo);

        const posts = await postService.getPosts({ userId: userId, withCover: true, publicOnly: false });
        expect(posts).toHaveLength(2);
        expect(posts[0].id).toEqual(post2Id);
        expect(posts[0].cover?.id).toEqual(photoId);
    });

    it('by location', async () => {
        // wait 1s to create another post with photo
        await new Promise((f) => setTimeout(f, 1000));
        const post2Id = (await postService.savePost(userId, location, { occurred: new Date(), public: false, description: 'Test post' })).id;
        const photoId = (await photoService.addPhotoToPost(post2Id, photo)).id;
        photoService.addPhotoToPost(post2Id, photo);

        const posts = await postService.getPosts({ locationId: post.locationId, withCover: true, publicOnly: false });
        expect(posts).toHaveLength(2);
        expect(posts[0].id).toEqual(post2Id);
        expect(posts[0].cover?.id).toEqual(photoId);
    });

    it('by user and location', async () => {
        const user2Id = (await userService.createUser({ email: MockData.EMAIL_2, password: MockData.DEFAULT_PASSWORD })).id!;
        const user2PostId = (await postService.savePost(user2Id, location, { occurred: new Date(), public: true, description: 'Test post' })).id;
        const posts = await postService
            .getPosts({ userId: user2Id, locationId: post.locationId, withCover: true, publicOnly: false });
        expect(posts).toHaveLength(1);
        expect(posts[0].id).toEqual(user2PostId);
    });

    it('public only', async () => {
        const newPostId = (await postService.savePost(userId, location, { occurred: new Date(), public: true, description: 'Test post' })).id;
        const posts = await postService.getPosts({ withCover: false, publicOnly: true });
        expect(posts).toHaveLength(1);
        expect(posts[0].id).toEqual(newPostId);
    });
});

describe('gets an existing post by id', () => {
    it('with likes', async () => {
        const user2Id = (await userService.createUser({ email: MockData.EMAIL_2, password: MockData.DEFAULT_PASSWORD })).id;
        await postLikeService.addPostLike(post.id, user2Id);
        const existingPost = await postService.getPost(post.id);
        expect(existingPost.likes).toBe(1);
    });
});

it('deletes a post', async () => {
    await postService.deletePost(post.id);
    await expect(postService.getPost(post.id)).rejects.toThrow(NotFoundException);
});