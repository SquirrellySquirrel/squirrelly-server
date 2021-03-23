import { Length } from 'class-validator';

export default class CreateCommentDTO {
    public userId!: string;

    @Length(1, 250)
    public content!: string;
}