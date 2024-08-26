require('dotenv').config({ path: `./.env.${process.env.NODE_ENV}` });
require('reflect-metadata');
import Container from 'typedi';
import { MockData } from '../../__mocks__/mock-data';
import NotFoundException from '../../src/exception/not-found.exception';
import CollectionService from '../../src/service/collection.service';
import PostService from '../../src/service/post.service';
import UserService from '../../src/service/user.service';
import resetDb from '../reset-db';

let collectionService: CollectionService;
let userService: UserService;
let postService: PostService;
let userId: string;

beforeAll(async () => {
    collectionService = Container.get(CollectionService);
    userService = Container.get(UserService);
    postService = Container.get(PostService);
});

beforeEach(async () => {
    await resetDb();

    userId = (await userService.createUser({ email: MockData.DEFAULT_EMAIL, password: MockData.DEFAULT_PASSWORD })).id!;
});

describe('creates a collection', () => {
    it('creates an empty collection', async () => {
        const collectionId = (await collectionService.createCollection([], userId, { name: 'my empty collection', description: 'empty squirrel' })).id;
        const newCollection = await collectionService.getCollection(collectionId, false);

        expect(newCollection.name).toEqual('my empty collection');
        expect(newCollection.description).toEqual('empty squirrel');
        expect(newCollection.creatorId).toEqual(userId);
        expect(newCollection.posts).toHaveLength(0);
    });

    it('creates a collection with existing posts', async () => {
        const location1 = MockData.location1();
        const location2 = MockData.location2();
        const post1 = await postService.savePost(userId, location1, { occurred: new Date(), public: true, description: '' });
        const post2 = await postService.savePost(userId, location2, { occurred: new Date(), public: true, description: '' });

        const collectionId = (await collectionService.createCollection([post1.id, post2.id], userId, { name: 'my cool collection', description: 'cool squirrel' })).id;
        const newCollection = await collectionService.getCollection(collectionId, false);

        expect(newCollection.name).toEqual('my cool collection');
        expect(newCollection.description).toEqual('cool squirrel');
        expect(newCollection.creatorId).toEqual(userId);
        expect(newCollection.posts).toHaveLength(2);
    });
});

describe('updates a collection', () => {
    it('updates name and description', async () => {
        const collectionId = (await collectionService.createCollection([], userId, { name: 'my empty collection', description: 'init desciption' })).id;
        await collectionService.updateCollection(collectionId, [], { name: 'my cooler collection', description: 'cooler squirrel' });
        const updatedCollection = await collectionService.getCollection(collectionId, false);

        expect(updatedCollection.name).toEqual('my cooler collection');
        expect(updatedCollection.description).toEqual('cooler squirrel');
        expect(updatedCollection.creatorId).toEqual(userId);
        expect(updatedCollection.posts).toHaveLength(0);
    });

    it('updates posts', async () => {
        const location1 = MockData.location1();
        const location2 = MockData.location2();
        const post1 = await postService.savePost(userId, location1, { occurred: new Date(), public: true, description: '' });
        const post2 = await postService.savePost(userId, location2, { occurred: new Date(), public: true, description: '' });

        const collectionId = (await collectionService.createCollection([post1.id], userId, { name: 'my cool collection', description: 'cool squirrel' })).id;
        await collectionService.updateCollection(collectionId, [post2.id], { name: 'my cooler collection', description: 'cooler squirrel' });
        const updatedCollection = await collectionService.getCollection(collectionId, false);

        expect(updatedCollection.name).toEqual('my cooler collection');
        expect(updatedCollection.description).toEqual('cooler squirrel');
        expect(updatedCollection.creatorId).toEqual(userId);
        expect(updatedCollection.posts).toHaveLength(1);
        expect(updatedCollection.posts![0].id).toEqual(post2.id);
    });
});

describe('gets a collection by id', () => {
    it('includes all posts', async () => {
        const location1 = MockData.location1();
        const location2 = MockData.location2();
        const post1 = await postService.savePost(userId, location1, { occurred: new Date(), public: true, description: '' });
        const post2 = await postService.savePost(userId, location2, { occurred: new Date(), public: false, description: '' });

        const collectionId = (await collectionService.createCollection([post1.id, post2.id], userId, { name: 'my cool collection', description: 'cool squirrel' })).id;
        const collection = await collectionService.getCollection(collectionId, false);

        expect(collection.posts).toHaveLength(2);
    });

    it('includes public posts only', async () => {
        const location1 = MockData.location1();
        const location2 = MockData.location2();
        const post1 = await postService.savePost(userId, location1, { occurred: new Date(), public: true, description: '' });
        const post2 = await postService.savePost(userId, location2, { occurred: new Date(), public: false, description: '' });

        const collectionId = (await collectionService.createCollection([post1.id, post2.id], userId, { name: 'my cool collection', description: 'cool squirrel' })).id;
        const collection = await collectionService.getCollection(collectionId, true);

        expect(collection.posts).toHaveLength(1);
        expect(collection.posts[0].id).toEqual(post1.id);
    });
});


it('gets all collections by user', async () => {
    await collectionService.createCollection([], userId, { name: 'collection-1', description: 'desc-1' });
    await collectionService.createCollection([], userId, { name: 'collection-2', description: 'desc-2' });
    const collections = await collectionService.getCollectionsByUser(userId, false);

    expect(collections).toHaveLength(2);
});

it('deletes a collection', async () => {
    const collectionId = (await collectionService.createCollection([], userId, { name: 'my empty collection', description: 'init description' })).id;
    await collectionService.deleteCollection(collectionId);

    await expect(collectionService.getCollection(collectionId, false)).rejects.toThrow(NotFoundException);
});