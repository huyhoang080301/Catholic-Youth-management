import { IsNumber, IsOptional, IsString, IsEnum } from 'class-validator';
import { MemberLevel, MemberStatus } from '../../../common/enums';

export class TransferClassDto {
  @IsNumber()
  toOrganizationUnitId!: number;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class TransferBranchDto {
  @IsNumber()
  toOrganizationUnitId!: number;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class PromoteDto {
  @IsEnum(MemberLevel)
  toLevel!: MemberLevel;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class SetStatusDto {
  @IsEnum(MemberStatus)
  toStatus!: MemberStatus;

  @IsOptional()
  @IsString()
  reason?: string;
}

