require('dotenv').config({ path: `./.env.${process.env.NODE_ENV}` });
require("reflect-metadata");
import { getCustomRepository } from 'typeorm';
import connection from '../../src/database';
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

let commentService: CommentService;
let userService: UserService;
let postService: PostService;
let locationService: LocationService;
let user: User;
let post: Post;

beforeAll(async () => {
    await connection.create();

    commentService = new CommentService(getCustomRepository(CommentRepository));
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

it('adds a comment', async () => {
    const commentId = (await commentService.addComment(post.id, user.id, 'sweet squirrel')).id;
    const postWithComment = await postService.getPost(post.id) as Post;
    expect(postWithComment.comments).toHaveLength(1);
    expect(postWithComment.comments![0]).toEqual(
        expect.objectContaining({
            id: commentId,
            content: 'sweet squirrel'
        })
    );
});

it('deletes a comment', async () => {
    const commentId = (await commentService.addComment(post.id, user.id, 'sweet squirrel')).id;
    await commentService.deleteComment(commentId);

    const postWithComment = await postService.getPost(post.id) as Post;
    expect(postWithComment.comments).toHaveLength(0);
});

