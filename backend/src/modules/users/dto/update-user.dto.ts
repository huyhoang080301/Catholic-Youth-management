import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  parish?: string;

  @IsOptional()
  @IsString()
  diocese?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
