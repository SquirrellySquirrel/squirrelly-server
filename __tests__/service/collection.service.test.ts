require('dotenv').config({ path: `./.env.${process.env.NODE_ENV}` });
require('reflect-metadata');
import { useContainer } from 'typeorm';
import { Container } from 'typeorm-typedi-extensions';
import connection from '../../src/database';
import Collection from '../../src/entity/collection';
import NotFoundException from '../../src/exception/not-found.exception';
import CollectionService from '../../src/service/collection.service';
import PostService from '../../src/service/post.service';
import UserService from '../../src/service/user.service';
import { MockData } from '../../__mocks__/mock-data';

let collectionService: CollectionService;
let userService: UserService;
let postService: PostService;
let userId: string;

beforeAll(async () => {
    useContainer(Container);

    await connection.create();

    collectionService = Container.get(CollectionService);
    userService = Container.get(UserService);
    postService = Container.get(PostService);
});

beforeEach(async () => {
    await connection.clear();

    userId = (await userService.createUser(MockData.DEFAULT_EMAIL, MockData.DEFAULT_PASSWORD)).id!;
});

afterAll(async () => {
    await connection.close();
});

describe('creates a collection', () => {
    it('creates an empty collection', async () => {
        const collectionId = (await collectionService.createCollection([], userId, { name: 'my empty collection', description: 'empty squirrel' })).id;
        const newCollection = await collectionService.getCollection(collectionId, false) as Collection;

        expect(newCollection.name).toEqual('my empty collection');
        expect(newCollection.description).toEqual('empty squirrel');
        expect(newCollection.creator.id).toEqual(userId);
        expect(newCollection.posts).toHaveLength(0);
    });

    it('creates a collection with existing posts', async () => {
        const location1 = MockData.location1();
        const location2 = MockData.location2();
        const post1 = await postService.savePost(userId, location1, true, new Date(), '');
        const post2 = await postService.savePost(userId, location2, true, new Date(), '');

        const collectionId = (await collectionService.createCollection([post1.id, post2.id], userId, { name: 'my cool collection', description: 'cool squirrel' })).id;
        const newCollection = await collectionService.getCollection(collectionId, false) as Collection;

        expect(newCollection.name).toEqual('my cool collection');
        expect(newCollection.description).toEqual('cool squirrel');
        expect(newCollection.creator.id).toEqual(userId);
        expect(newCollection.posts).toHaveLength(2);
    });
});

describe('updates a collection', () => {
    it('updates name and description', async () => {
        const collectionId = (await collectionService.createCollection([], userId, { name: 'my empty collection' })).id;
        await collectionService.updateCollection(collectionId, [], { name: 'my cooler collection', description: 'cooler squirrel' });
        const updatedCollection = await collectionService.getCollection(collectionId, false) as Collection;

        expect(updatedCollection.name).toEqual('my cooler collection');
        expect(updatedCollection.description).toEqual('cooler squirrel');
        expect(updatedCollection.creator.id).toEqual(userId);
        expect(updatedCollection.posts).toHaveLength(0);
    });

    it('updates posts', async () => {
        const location1 = MockData.location1();
        const location2 = MockData.location2();
        const post1 = await postService.savePost(userId, location1, true, new Date(), '');
        const post2 = await postService.savePost(userId, location2, true, new Date(), '');

        const collectionId = (await collectionService.createCollection([post1.id], userId, { name: 'my cool collection', description: 'cool squirrel' })).id;
        await collectionService.updateCollection(collectionId, [post2.id], { name: 'my cooler collection', description: 'cooler squirrel' });
        const updatedCollection = await collectionService.getCollection(collectionId, false) as Collection;

        expect(updatedCollection.name).toEqual('my cooler collection');
        expect(updatedCollection.description).toEqual('cooler squirrel');
        expect(updatedCollection.creator.id).toEqual(userId);
        expect(updatedCollection.posts).toHaveLength(1);
        expect(updatedCollection.posts![0].id).toEqual(post2.id);
    });
});

describe('gets a collection by id', () => {
    it('includes all posts', async () => {
        const location1 = MockData.location1();
        const location2 = MockData.location2();
        const post1 = await postService.savePost(userId, location1, true, new Date(), '');
        const post2 = await postService.savePost(userId, location2, false, new Date(), '');

        const collectionId = (await collectionService.createCollection([post1.id, post2.id], userId, { name: 'my cool collection', description: 'cool squirrel' })).id;
        const collection = await collectionService.getCollection(collectionId, false);

        expect(collection.posts).toHaveLength(2);
    });

    it('includes public posts only', async () => {
        const location1 = MockData.location1();
        const location2 = MockData.location2();
        const post1 = await postService.savePost(userId, location1, true, new Date(), '');
        const post2 = await postService.savePost(userId, location2, false, new Date(), '');

        const collectionId = (await collectionService.createCollection([post1.id, post2.id], userId, { name: 'my cool collection', description: 'cool squirrel' })).id;
        const collection = await collectionService.getCollection(collectionId, true);

        expect(collection.posts).toHaveLength(1);
        expect(collection.posts[0].id).toEqual(post1.id);
    });
});


it('gets all collections by user', async () => {
    await collectionService.createCollection([], userId, { name: 'collection-1' });
    await collectionService.createCollection([], userId, { name: 'collection-2' });
    const collections = await collectionService.getCollectionsByUser(userId, false);

    expect(collections).toHaveLength(2);
});

it('deletes a collection', async () => {
    const collectionId = (await collectionService.createCollection([], userId, { name: 'my empty collection' })).id;
    await collectionService.deleteCollection(collectionId);

    await expect(collectionService.getCollection(collectionId, false)).rejects.toThrow(NotFoundException);
});