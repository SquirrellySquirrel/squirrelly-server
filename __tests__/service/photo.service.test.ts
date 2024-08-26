require('dotenv').config({ path: `./.env.${process.env.NODE_ENV}` });
require('reflect-metadata');
import path from 'path';
import Container from 'typedi';
import { MockData } from '../../__mocks__/mock-data';
import UnprocessableEntityException from '../../src/exception/unprocessable-entity.exception';
import { PhotoParams } from '../../src/service/model/photo';
import PhotoService from '../../src/service/photo.service';
import PostService from '../../src/service/post.service';
import UserService from '../../src/service/user.service';
import { FILE_DIR } from '../config';
import resetDb from '../reset-db';

let photoService: PhotoService;
let userService: UserService;
let postService: PostService;
let userId: string;
let postId: string;
let photo: PhotoParams;
let photoId: string;

beforeAll(async () => {
    photoService = Container.get(PhotoService);
    userService = Container.get(UserService);
    postService = Container.get(PostService);
});

beforeEach(async () => {
    await resetDb();

    jest.spyOn(PhotoService.prototype as any, 'savePhotoToStorage').mockImplementation(() => { console.log('Mocking saving photo to disk'); });

    userId = (await userService.createUser({ email: MockData.DEFAULT_EMAIL, password: MockData.DEFAULT_PASSWORD })).id!;

    postId = (await postService.savePost(userId, MockData.location1(), { occurred: new Date(), public: true, description: 'Default post' })).id;

    photo = MockData.photo1();
    photoId = (await photoService.addPhotoToPost(postId, photo)).id;
});

it('added a photo for a post', async () => {
    const photosByPost = await photoService.getPhotosByPost(postId);
    expect(photosByPost.length).toEqual(1);
    expect(photosByPost[0].name).toEqual(photo.name);
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

    const cover = await photoService.getPostCover(postId);
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

        const photosByPost = await photoService.getPhotosByPost(postId);
        expect(photosByPost[0]).toEqual(
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

        const photosByPost = await photoService.getPhotosByPost(postId);
        expect(photosByPost.length).toEqual(0);
    });

    it('photo does not match post id', async () => {
        await expect(photoService.deletePhoto(photoId, photoId)).rejects.toThrow(UnprocessableEntityException);
    });
});