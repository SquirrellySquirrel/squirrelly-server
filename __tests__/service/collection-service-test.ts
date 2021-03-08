require('dotenv').config({ path: `./.env.${process.env.NODE_ENV}` });
require("reflect-metadata");
import { getCustomRepository } from 'typeorm';
import connection from '../../src/database';
import { Collection } from '../../src/entity/collection';
import { User } from '../../src/entity/user';
import { CollectionRepository } from '../../src/repository/collection-repository';
import { LocationRepository } from '../../src/repository/location-repository';
import { PhotoRepository } from '../../src/repository/photo-repository';
import { PostLikeRepository } from '../../src/repository/post-like-repository';
import { PostRepository } from '../../src/repository/post-repository';
import { UserRepository } from '../../src/repository/user-repository';
import { CollectionService } from '../../src/service/collection-service';
import { LocationService } from '../../src/service/location-service';
import { PhotoService } from '../../src/service/photo-service';
import { PostLikeService } from '../../src/service/post-like-service';
import { PostService } from '../../src/service/post-service';
import { UserService } from '../../src/service/user-service';
import { MockData } from '../../__mocks__/mock-data';

let collectionService: CollectionService;
let userService: UserService;
let postService: PostService;
let locationService: LocationService;
let user: User;

beforeAll(async () => {
    await connection.create();
    collectionService = new CollectionService(getCustomRepository(CollectionRepository));
    userService = new UserService(getCustomRepository(UserRepository));
    postService = new PostService(getCustomRepository(PostRepository),
        new PhotoService(getCustomRepository(PhotoRepository)),
        new PostLikeService(getCustomRepository(PostLikeRepository)));
    locationService = new LocationService(getCustomRepository(LocationRepository));
});

beforeEach(async () => {
    await connection.clear();

    user = await userService.createGhostUser('foo', 'android');
});

afterAll(async () => {
    await connection.close();
});

describe('creates a collection', () => {
    it('creates an empty collection', async () => {
        let collectionId = (await collectionService.createCollection([], user.id, { name: 'my empty collection', description: 'empty squirrel' })).id;
        let newCollection = await collectionService.getCollection(collectionId) as Collection;

        expect(newCollection.name).toEqual('my empty collection');
        expect(newCollection.description).toEqual('empty squirrel');
        expect(newCollection.creator.id).toEqual(user.id);
        expect(newCollection.posts).toHaveLength(0);
    });

    it('creates a collection with existing posts', async () => {
        let location1 = MockData.location1();
        location1.id = (await locationService.saveLocation(location1)).id;
        let location2 = MockData.location2();
        location2.id = (await locationService.saveLocation(location2)).id;
        let post1 = await postService.savePost(user.id, location1, true, new Date(), [MockData.photo1()]);
        let post2 = await postService.savePost(user.id, location2, true, new Date(), [MockData.photo2()]);

        let collectionId = (await collectionService.createCollection([post1, post2], user.id, { name: 'my cool collection', description: 'cool squirrel' })).id;
        let newCollection = await collectionService.getCollection(collectionId) as Collection;

        expect(newCollection.name).toEqual('my cool collection');
        expect(newCollection.description).toEqual('cool squirrel');
        expect(newCollection.creator.id).toEqual(user.id);
        expect(newCollection.posts).toHaveLength(2);
    });
});

describe('updates a collection', () => {
    it('updates name and description', async () => {
        let collectionId = (await collectionService.createCollection([], user.id, { name: 'my empty collection' })).id;
        await collectionService.updateCollection(collectionId, [], { name: 'my cooler collection', description: 'cooler squirrel' });
        let updatedCollection = await collectionService.getCollection(collectionId) as Collection;

        expect(updatedCollection.name).toEqual('my cooler collection');
        expect(updatedCollection.description).toEqual('cooler squirrel');
        expect(updatedCollection.creator.id).toEqual(user.id);
        expect(updatedCollection.posts).toHaveLength(0);
    });

    it('updates posts', async () => {
        let location1 = MockData.location1();
        location1.id = (await locationService.saveLocation(location1)).id;
        let location2 = MockData.location2();
        location2.id = (await locationService.saveLocation(location2)).id;
        let post1 = await postService.savePost(user.id, location1, true, new Date(), [MockData.photo1()]);
        let post2 = await postService.savePost(user.id, location2, true, new Date(), [MockData.photo2()]);

        let collectionId = (await collectionService.createCollection([post1], user.id, { name: 'my cool collection', description: 'cool squirrel' })).id;
        await collectionService.updateCollection(collectionId, [post2], { name: 'my cooler collection', description: 'cooler squirrel' });
        let updatedCollection = await collectionService.getCollection(collectionId) as Collection;

        expect(updatedCollection.name).toEqual('my cooler collection');
        expect(updatedCollection.description).toEqual('cooler squirrel');
        expect(updatedCollection.creator.id).toEqual(user.id);
        expect(updatedCollection.posts).toHaveLength(1);
        expect(updatedCollection.posts![0].id).toEqual(post2.id);
    });
});

it('gets all collections by user', async () => {
    await collectionService.createCollection([], user.id, { name: 'collection-1' });
    await collectionService.createCollection([], user.id, { name: 'collection-2' });
    const collections = await collectionService.getCollectionsByUser(user.id);

    expect(collections).toHaveLength(2);
});

it('deletes a collection', async () => {
    let collectionId = (await collectionService.createCollection([], user.id, { name: 'my empty collection' })).id;
    await collectionService.deleteCollection(collectionId);

    const collection = await collectionService.getCollection(collectionId);
    expect(collection).toBeUndefined();
});


