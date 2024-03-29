require('dotenv').config({ path: `./.env.${process.env.NODE_ENV}` });
require('reflect-metadata');
import path from 'path';
import { useContainer } from 'typeorm';
import { Container } from 'typeorm-typedi-extensions';
import connection from '../../src/database';
import Photo from '../../src/entity/photo';
import UnprocessableEntityException from '../../src/exception/unprocessable-entity.exception';
import PhotoService from '../../src/service/photo.service';
import PostService from '../../src/service/post.service';
import UserService from '../../src/service/user.service';
import { MockData } from '../../__mocks__/mock-data';
import { FILE_DIR } from '../config';

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

    jest.spyOn(PhotoService.prototype as any, 'savePhotoToStorage').mockImplementation(() => { console.log('Mocking saving photo to disk'); });

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

it('fetches photo path by id', async () => {
    const photoPath = await photoService.getPhotoPath(photoId);
    expect(photoPath).toEqual(path.join(FILE_DIR, photo.name));
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

describe('updates a photo', () => {
    it('updates photo by id successfully', async () => {
        await photoService.updatePhoto(postId, photoId, 1);

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

    it('photo does not match post id', async () => {
        await expect(photoService.updatePhoto(photoId, photoId, 1)).rejects.toThrow(UnprocessableEntityException);
    });
});

describe('deletes a photo', () => {
    it('deletes photo by id successfully', async () => {
        await photoService.deletePhoto(postId, photoId);

        const postWithoutPhoto = await postService.getPost(postId);
        expect(postWithoutPhoto!.photos!.length).toEqual(0);
    });

    it('photo does not match post id', async () => {
        await expect(photoService.deletePhoto(photoId, photoId)).rejects.toThrow(UnprocessableEntityException);
    });
});