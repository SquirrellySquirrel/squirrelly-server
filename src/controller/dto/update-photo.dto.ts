import { Max, Min } from 'class-validator';

export default class UpdatePhotoDTO {
    @Min(0)
    @Max(9)
    public order!: number;
}