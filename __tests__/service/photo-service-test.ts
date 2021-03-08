require('dotenv').config({ path: `./.env.${process.env.NODE_ENV}` });
require("reflect-metadata");
import { getCustomRepository } from 'typeorm';
import connection from '../../src/database';
import { Photo } from '../../src/entity/photo';
import { LocationRepository } from '../../src/repository/location-repository';
import { PhotoRepository } from '../../src/repository/photo-repository';
import { PostLikeRepository } from '../../src/repository/post-like-repository';
import { PostRepository } from '../../src/repository/post-repository';
import { UserRepository } from '../../src/repository/user-repository';
import { LocationService } from '../../src/service/location-service';
import { PhotoService } from '../../src/service/photo-service';
import { PostLikeService } from '../../src/service/post-like-service';
import { PostService } from '../../src/service/post-service';
import { UserService } from '../../src/service/user-service';
import { MockData } from '../../__mocks__/mock-data';

let photoService: PhotoService;
let userService: UserService;
let postService: PostService;
let locationService: LocationService;

beforeAll(async () => {
    await connection.create();

    photoService = new PhotoService(getCustomRepository(PhotoRepository));
    userService = new UserService(getCustomRepository(UserRepository));
    postService = new PostService(getCustomRepository(PostRepository),
        new PhotoService(getCustomRepository(PhotoRepository)),
        new PostLikeService(getCustomRepository(PostLikeRepository)));
    locationService = new LocationService(getCustomRepository(LocationRepository));
});

beforeEach(async () => {
    await connection.clear();
});

afterAll(async () => {
    await connection.close();
});

it('chooses a cover for a post', async () => {
    const user = await userService.createGhostUser('foo', 'android');

    const location1 = MockData.location1();
    location1.id = (await locationService.saveLocation(location1)).id;
    const location2 = MockData.location2();
    location2.id = (await locationService.saveLocation(location2)).id;

    const photo1 = MockData.photo1();
    const photo2 = MockData.photo2();
    photo1.order = 1; // reorder photo1 and photo2
    const postId = (await postService.savePost(user.id, location1, true, new Date(), [photo1, MockData.photo2()])).id;

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

