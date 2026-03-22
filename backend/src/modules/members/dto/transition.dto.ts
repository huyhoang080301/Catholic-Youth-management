import { IsNumber, IsOptional, IsString } from 'class-validator';

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
  @IsOptional()
  @IsString()
  reason?: string;
}

export class SetStatusDto {
  @IsString()
  status!: 'inactive' | 'on_leave' | 'reserved' | 'active';

  @IsOptional()
  @IsString()
  reason?: string;
}

