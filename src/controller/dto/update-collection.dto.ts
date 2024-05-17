import { Length } from 'class-validator';

export default class UpdateCollectionDTO {
    public postIds!: string[];

    @Length(0, 50)
    public name?: string;

    @Length(0, 250)
    public description?: string;
}