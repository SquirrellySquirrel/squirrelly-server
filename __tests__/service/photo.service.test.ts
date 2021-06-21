require('dotenv').config({ path: `./.env.${process.env.NODE_ENV}` });
require('reflect-metadata');
import { useContainer } from 'typeorm';
import { Container } from 'typeorm-typedi-extensions';
import connection from '../../src/database';
import Location from '../../src/entity/location';
import Photo from '../../src/entity/photo';
import PhotoService from '../../src/service/photo.service';
import PostService from '../../src/service/post.service';
import UserService from '../../src/service/user.service';
import { MockData } from '../../__mocks__/mock-data';

let photoService: PhotoService;
let userService: UserService;
let postService: PostService;
let userId: string;
let location: Location;
let photo1: Photo;
let photo2: Photo;

beforeAll(async () => {
    useContainer(Container);

    await connection.create();

    photoService = Container.get(PhotoService);
    userService = Container.get(UserService);
    postService = Container.get(PostService);
});

beforeEach(async () => {
    await connection.clear();

    userId = (await userService.createUser(MockData.DEFAULT_EMAIL, MockData.DEFAULT_PASSWORD)).id!;
    location = MockData.location1();
    photo1 = MockData.photo1();
    photo2 = MockData.photo2();
});

afterAll(async () => {
    await connection.close();
});

it('chooses a cover for a post', async () => {
    photo1.order = 1; // order: [photo2, photo1]
    const postId = (await postService.createPost(userId, location, true, new Date(), '', [photo1, photo2])).id;

    const cover = await photoService.getPostCover(postId) as Photo;
    expect(cover).toEqual(
        expect.objectContaining({
            path: photo2.path,
            type: photo2.type,
            height: photo2.height,
            width: photo2.width,
        })
    );
});

it('identifies photos to add', async () => {
    const postId = await postService.createPost(userId, location, true, new Date(), '', [photo1]);
    const post = await postService.getPost(postId.id);

    const photosToAdd = photoService.identifyPhotosToAdd(post, [photo1, photo2]);
    expect(photosToAdd.length).toEqual(1);
    expect(photosToAdd[0]).toEqual(photo2);
});

it('identifies photos to remove', async () => {
    photo2.order = 1; // order: [photo1, photo2]
    const postId = (await postService.createPost(userId, location, true, new Date(), '', [photo1, photo2])).id;

    const photos = await photoService.getPhotosByPost(postId);
    const savedPhoto1 = photos[0];
    const savedPhoto2 = photos[1];
    const photosToRemove = await photoService.identifyPhotosToRemove(postId, [savedPhoto1]);
    expect(photosToRemove.length).toEqual(1);
    expect(photosToRemove[0]).toEqual(savedPhoto2);
});

