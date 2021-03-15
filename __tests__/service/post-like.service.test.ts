require('dotenv').config({ path: `./.env.${process.env.NODE_ENV}` });
require("reflect-metadata");
import { getCustomRepository } from 'typeorm';
import connection from '../../src/database';
import { Post } from '../../src/entity/post';
import { User } from '../../src/entity/user';
import { LocationRepository } from '../../src/repository/location.repository';
import { PhotoRepository } from '../../src/repository/photo.repository';
import { PostLikeRepository } from '../../src/repository/post-like.repository';
import { PostRepository } from '../../src/repository/post.repository';
import { UserRepository } from '../../src/repository/user.repository';
import { LocationService } from '../../src/service/location.service';
import { PhotoService } from '../../src/service/photo.service';
import { PostLikeService } from '../../src/service/post-like.service';
import { PostService } from '../../src/service/post.service';
import { UserService } from '../../src/service/user.service';
import { MockData } from '../../__mocks__/mock-data';

let postLikeService: PostLikeService;
let userService: UserService;
let postService: PostService;
let locationService: LocationService;
let user: User;
let post: Post;

beforeAll(async () => {
    await connection.create();

    postLikeService = new PostLikeService(getCustomRepository(PostLikeRepository));
    userService = new UserService(getCustomRepository(UserRepository));
    postService = new PostService(getCustomRepository(PostRepository),
        new PhotoService(getCustomRepository(PhotoRepository)),
        new PostLikeService(getCustomRepository(PostLikeRepository)));
    locationService = new LocationService(getCustomRepository(LocationRepository));
});

beforeEach(async () => {
    await connection.clear();

    user = await userService.createGhostUser('foo', 'android');

    let location1 = MockData.location1();
    location1.id = (await locationService.saveLocation(location1)).id;
    let location2 = MockData.location2();
    location2.id = (await locationService.saveLocation(location2)).id;
    post = await postService.savePost(user.id, location1, true, new Date(), [MockData.photo1()]);
});

afterAll(async () => {
    await connection.close();
});

it('deletes a like', async () => {
    const user2 = await userService.createGhostUser('bar', 'android');
    await postLikeService.addPostLike(post.id, user2.id);
    await postLikeService.deletePostLike(post.id, user2.id);

    const existingPost = await postService.getPost(post.id) as Post;
    expect(existingPost.likes).toBe(0);
});

