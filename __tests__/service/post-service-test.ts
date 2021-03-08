require('dotenv').config({ path: `./.env.${process.env.NODE_ENV}` });
require("reflect-metadata");
import { getCustomRepository } from 'typeorm';
import connection from '../../src/database';
import { Location } from '../../src/entity/location';
import { Photo } from '../../src/entity/photo';
import { Post } from '../../src/entity/post';
import { User } from '../../src/entity/user';
import { CommentRepository } from '../../src/repository/comment-repository';
import { LocationRepository } from '../../src/repository/location-repository';
import { PhotoRepository } from '../../src/repository/photo-repository';
import { PostLikeRepository } from '../../src/repository/post-like-repository';
import { PostRepository } from '../../src/repository/post-repository';
import { UserRepository } from '../../src/repository/user-repository';
import { CommentService } from '../../src/service/comment-service';
import { LocationService } from '../../src/service/location-service';
import { PhotoService } from '../../src/service/photo-service';
import { PostLikeService } from '../../src/service/post-like-service';
import { PostService } from '../../src/service/post-service';
import { UserService } from '../../src/service/user-service';
import { MockData } from '../../__mocks__/mock-data';

let postService: PostService;
let userService: UserService;
let locationService: LocationService;
let user: User;
let post: Post;
let location: Location;
let photo1: Photo;
let photo2: Photo;

beforeAll(async () => {
    await connection.create();

    postService = new PostService(getCustomRepository(PostRepository),
        new PhotoService(getCustomRepository(PhotoRepository)),
        new PostLikeService(getCustomRepository(PostLikeRepository)));
    userService = new UserService(getCustomRepository(UserRepository));
    locationService = new LocationService(getCustomRepository(LocationRepository));
});

beforeEach(async () => {
    await connection.clear();

    user = await userService.createGhostUser('foo', 'android');
    location = MockData.location1();
    location.id = (await locationService.saveLocation(location)).id;
    photo1 = MockData.photo1();
    photo2 = MockData.photo2();
    post = await postService.savePost(user.id, location, false, new Date(), [photo1]);
});

afterAll(async () => {
    await connection.close();
});

it('creates a post with location and another photo', async () => {
    const newPostId = (await postService.savePost(user.id, location, false, new Date(), [photo2])).id;
    const newPost = await postService.getPost(newPostId) as Post;

    //expect(newPost.creator.id).toEqual(user.id);
    expect(newPost.id).toEqual(newPostId);
    expect(newPost.location).toEqual(location);
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
        const existingPost = await postService.getPost(post.id) as Post;
        let photo1 = existingPost.photos![0]; // existing photo with id
        photo2.order = 1;

        await postService.updatePost(post.id, location, false, post.created, [photo1, photo2]);

        const updatedPost = await postService.getPost(post.id) as Post;

        expect(updatedPost.location).toEqual(location);
        expect(updatedPost.photos).toHaveLength(2);
        expect(updatedPost.photos![0].id).not.toBeNull();
        expect(updatedPost.photos![1].id).not.toBeNull();
        expect(updatedPost.public).toBeFalsy();
    });

    it('relaces the existing photo', async () => {
        await postService.updatePost(post.id, location, false, post.created, [photo2]);

        const updatedPost = await postService.getPost(post.id) as Post;

        expect(updatedPost.location).toEqual(location);
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
        newLocation.id = (await locationService.saveLocation(newLocation)).id;

        await postService.updatePost(post.id, newLocation, true, post.created, [photo1]);

        const updatedPost = await postService.getPost(post.id) as Post;

        expect(updatedPost.location).toEqual(newLocation);
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
        const user2 = await userService.createGhostUser('bar', 'android');
        await postService.savePost(user2.id, location, true, new Date(), [photo2]);
        const posts = await postService.getPosts(9);
        expect(posts).toHaveLength(2);
    });

    it('more than limit', async () => {
        const user2 = await userService.createGhostUser('bar', 'android');
        await postService.savePost(user2.id, location, true, new Date(), [photo2]);
        const posts = await postService.getPosts(1);
        expect(posts).toHaveLength(1);
    });
});

it('gets all posts by user with correct orders and covers', async () => {
    await new Promise(resolve => setTimeout(resolve, 1000)); // wait for 1s before saving a new post
    const post2 = await postService.savePost(user.id, location, true, new Date(), [photo2]);
    const posts = await postService.getPostsByUser(user.id) as Post[];
    expect(posts).toHaveLength(2);
    expect(posts[0].id).toEqual(post2.id);
    expect(posts[0].cover.id).toEqual(photo2.id);
    expect(posts[1].id).toEqual(post.id);
    expect(posts[1].cover.id).toEqual(photo1.id);
});

describe('gets an existing post by id', () => {
    it('gets comments', async () => {
        const commentService = new CommentService(getCustomRepository(CommentRepository));
        const user2 = await userService.createGhostUser('bar', 'android');
        await commentService.addComment(post.id, user2.id, 'aww');
        const existingPost = await postService.getPost(post.id) as Post;
        expect(existingPost.comments).toHaveLength(1);
        expect(existingPost.comments![0].id).not.toBeNull();
        expect(existingPost.comments![0].content).toEqual('aww');
    });

    it('gets likes', async () => {
        const postLikeService = new PostLikeService(getCustomRepository(PostLikeRepository));
        const user2 = await userService.createGhostUser('bar', 'android');
        await postLikeService.addPostLike(post.id, user2.id);
        const existingPost = await postService.getPost(post.id) as Post;
        expect(existingPost.likes).toBe(1);
    });
});


it('deletes a post', async () => {
    const post2 = await postService.savePost(user.id, location, true, new Date(), [photo2]);
    await postService.deletePost(post2.id);
    const post = await postService.getPost(post2.id);
    expect(post).toBeUndefined();
});