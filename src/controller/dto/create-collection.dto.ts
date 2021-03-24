import { Length } from 'class-validator';

export default class CreateCollectionDTO {
    public postIds!: string[];

    public userId!: string;

    @Length(1, 50)
    public name!: string;

    @Length(250)
    public description?: string;
}