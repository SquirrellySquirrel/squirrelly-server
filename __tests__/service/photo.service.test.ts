require('dotenv').config({ path: `./.env.${process.env.NODE_ENV}` });
require('reflect-metadata');
import { useContainer } from 'typeorm';
import { Container } from 'typeorm-typedi-extensions';
import connection from '../../src/database';
import Photo from '../../src/entity/photo';
import PhotoService from '../../src/service/photo.service';
import PostService from '../../src/service/post.service';
import UserService from '../../src/service/user.service';
import { MockData } from '../../__mocks__/mock-data';

let photoService: PhotoService;
let userService: UserService;
let postService: PostService;
let userId: string;
let postId: string;
let photo: Photo;
let photoId: string;

beforeAll(async () => {
    useContainer(Container);

    await connection.create();

    photoService = Container.get(PhotoService);
    userService = Container.get(UserService);
    postService = Container.get(PostService);
});

beforeEach(async () => {
    await connection.clear();

    jest.spyOn(PhotoService.prototype as any, 'savePhotoToDisk').mockImplementation(() => { console.log('Mocking saving photo to disk'); });

    userId = (await userService.createUser(MockData.DEFAULT_EMAIL, MockData.DEFAULT_PASSWORD)).id!;

    postId = (await postService.savePost(userId, MockData.location1(), true, new Date(), 'Default post')).id;

    photo = MockData.photo1();
    photoId = (await photoService.addPhotoToPost(postId, photo)).id;
});

afterAll(async () => {
    await connection.close();
});

it('adds a photo for a post', async () => {
    const postWithPhoto = await postService.getPost(postId);
    expect(postWithPhoto!.photos!.length).toEqual(1);
    expect(postWithPhoto!.photos![0].name).toEqual(photo.name);
});

it('fetches a photo by id', async () => {
    const photoById = await photoService.getPhoto(photoId);
    expect(photoById).toEqual(
        expect.objectContaining({
            id: photoId,
            name: photo.name,
            type: photo.type,
            order: photo.order,
        })
    );
});

it('fetches all photos of a post', async () => {
    await photoService.addPhotoToPost(postId, MockData.photo2());
    const photos = await photoService.getPhotosByPost(postId);
    expect(photos.length).toEqual(2);
});

it('chooses the photo with the lowest order as cover for a post ', async () => {
    await photoService.addPhotoToPost(postId, MockData.photo2());

    const cover = await photoService.getPostCover(postId) as Photo;
    expect(cover).toEqual(
        expect.objectContaining({
            id: photoId,
            name: photo.name,
            type: photo.type,
            order: photo.order,
        })
    );
});

it('updates a photo', async () => {
    await photoService.updatePhoto(photoId, 1);

    const postWithUpdatedPhoto = await postService.getPost(postId);
    expect(postWithUpdatedPhoto!.photos![0]).toEqual(
        expect.objectContaining({
            id: photoId,
            name: photo.name,
            type: photo.type,
            order: 1,
        })
    );
});

it('deletes a photo by id', async () => {
    await photoService.deletePhoto(photoId);

    const postWithoutPhoto = await postService.getPost(postId);
    expect(postWithoutPhoto!.photos!.length).toEqual(0);
});