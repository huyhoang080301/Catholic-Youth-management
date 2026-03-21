import { IsString, IsOptional, IsDate, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { Gender, MemberLevel } from '../../../entities/member.entity';

export class UpdateMemberDto {
  @IsString()
  @IsOptional()
  fullName?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  dateOfBirth?: Date;

  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  parentPhone?: string;

  @IsString()
  @IsOptional()
  baptismName?: string;

  @IsEnum(MemberLevel)
  @IsOptional()
  level?: MemberLevel;

  @IsString()
  @IsOptional()
  notes?: string;
}
