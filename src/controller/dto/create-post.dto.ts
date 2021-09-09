import { Length } from 'class-validator';
import Location from '../../entity/location';

export default class CreatePostDTO {
    public userId!: string;

    public location!: Location;

    public isPublic!: boolean;

    @Length(0, 250)
    public description?: string;

    public created!: Date;
}