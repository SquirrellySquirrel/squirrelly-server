import { Length } from 'class-validator';
import { LocationParams } from '../../service/model/location';

export default class CreatePostDTO {
    public userId!: string;

    public location!: LocationParams;

    public isPublic!: boolean;

    @Length(0, 250)
    public description?: string;

    public occurred!: Date;
}