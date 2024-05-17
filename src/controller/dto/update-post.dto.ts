import { Length } from 'class-validator';
import { LocationParams } from '../../service/model/location';

export default class UpdatePostDTO {
    public location!: LocationParams;

    public isPublic!: boolean;

    @Length(0, 250)
    public description?: string;

    public occurred!: Date;
}