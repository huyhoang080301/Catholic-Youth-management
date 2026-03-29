import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsString()
  fullName!: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

