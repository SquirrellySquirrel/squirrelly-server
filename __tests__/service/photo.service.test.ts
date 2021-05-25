require('dotenv').config({ path: `./.env.${process.env.NODE_ENV}` });
require("reflect-metadata");
import { useContainer } from 'typeorm';
import { Container } from 'typeorm-typedi-extensions';
import connection from '../../src/database';
import Photo from '../../src/entity/photo';
import LocationService from '../../src/service/location.service';
import PhotoService from '../../src/service/photo.service';
import PostService from '../../src/service/post.service';
import UserService from '../../src/service/user.service';
import { MockData } from '../../__mocks__/mock-data';

let photoService: PhotoService;
let userService: UserService;
let postService: PostService;
let locationService: LocationService;

beforeAll(async () => {
    useContainer(Container);

    await connection.create();

    photoService = Container.get(PhotoService);
    userService = Container.get(UserService);
    postService = Container.get(PostService);
    locationService = Container.get(LocationService);
});

beforeEach(async () => {
    await connection.clear();
});

afterAll(async () => {
    await connection.close();
});

it('chooses a cover for a post', async () => {
    const user = await userService.createGhostUser('foo', 'android');

    const location = MockData.location1();

    const photo1 = MockData.photo1();
    const photo2 = MockData.photo2();
    photo1.order = 1; // reorder photo1 and photo2
    const postId = (await postService.savePostAndLocation(user.id, location, true, new Date(), [photo1, MockData.photo2()])).id;

    const cover = await photoService.getPostCover(postId) as Photo;
    expect(cover).toEqual(
        expect.objectContaining({
            path: photo2.path,
            type: photo2.type,
            height: photo2.height,
            width: photo2.width
        })
    );
});

