import { IsEmail, IsOptional, MaxLength } from 'class-validator';

export default class UpgradeUserDTO {
    @IsEmail()
    public email!: string;

    public password!: string;

    @IsOptional()
    @MaxLength(50)
    public displayName?: string;
}