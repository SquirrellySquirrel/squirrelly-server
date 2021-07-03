import { IsEmail } from 'class-validator';

export default class CreateUserDTO {
    @IsEmail()
    public email!: string;

    public password!: string;
}