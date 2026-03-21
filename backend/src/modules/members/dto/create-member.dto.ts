import {
  IsString,
  IsOptional,
  IsDate,
  IsEnum,
  IsInt,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Gender, MemberLevel } from '../../../entities/member.entity';

export class AddressDto {
  @IsString()
  @IsOptional()
  street?: string;

  @IsString()
  @IsOptional()
  ward?: string;

  @IsString()
  @IsOptional()
  district?: string;

  @IsString()
  @IsOptional()
  province?: string;

  @IsString()
  @IsOptional()
  country?: string;
}

export class ParentInfoDto {
  @IsString()
  fullName!: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  parish?: string;

  @ValidateNested()
  @IsOptional()
  @Type(() => AddressDto)
  address?: AddressDto;
}

export class CreateMemberDto {
  @IsString()
  fullName!: string;

  @IsString()
  @IsOptional()
  baptismName?: string;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  dateOfBirth?: Date;

  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  photoUrl?: string;

  @ValidateNested()
  @IsOptional()
  @Type(() => AddressDto)
  address?: AddressDto;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  addressId?: number;

  @ValidateNested()
  @IsOptional()
  @Type(() => ParentInfoDto)
  parentInfo?: ParentInfoDto;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  parentId?: number;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  baptismDate?: Date;

  @IsString()
  @IsOptional()
  baptismPlace?: string;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  firstConfessionDate?: Date;

  @IsString()
  @IsOptional()
  firstConfessionPlace?: string;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  firstCommunionDate?: Date;

  @IsString()
  @IsOptional()
  firstCommunionPlace?: string;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  confirmationDate?: Date;

  @IsString()
  @IsOptional()
  confirmationPlace?: string;

  @IsEnum(MemberLevel)
  @IsOptional()
  level?: MemberLevel;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  organizationUnitId?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

