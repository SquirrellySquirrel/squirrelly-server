import { Length } from 'class-validator';
import Location from '../../entity/location';

export default class UpdatePostDTO {
    public location!: Location;

    public isPublic!: boolean;

    @Length(1, 250)
    public description?: string;

    public created!: Date;
}