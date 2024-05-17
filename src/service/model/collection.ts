import { Collection, Post } from '@prisma/client';

export interface CollectionWithPosts extends Collection {
    posts: Post[],
}

export type CollectionParams = Pick<Collection, 'name' | 'description'>;