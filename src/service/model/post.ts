import { Photo, Post } from '@prisma/client';

export interface ExtendedPost extends Post {
    likes?: number,
    cover?: Photo
}

export type PostParams = Pick<Post, 'public' | 'description' | 'occurred'>