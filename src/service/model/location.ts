import { Location } from '@prisma/client';

export type LocationParams = Omit<Location, 'id'>;