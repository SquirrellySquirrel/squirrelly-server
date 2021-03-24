import { Length } from 'class-validator';

export default class UpdateCollectionDTO {
    public postIds!: string[];

    @Length(1, 50)
    public name!: string;

    @Length(250)
    public description?: string;
}