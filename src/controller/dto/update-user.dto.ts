import { Length } from 'class-validator';

export default class UpdateUserDTO {
    @Length(1, 50)
    public displayName!: string;
}