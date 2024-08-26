import { Photo } from '@prisma/client';

export type PhotoParams = Omit<Photo, 'id' | 'postId'>;