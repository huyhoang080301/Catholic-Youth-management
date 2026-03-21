import { IsString, IsEnum, IsOptional, IsInt } from 'class-validator';
import { UnitType, Branch } from '../../../entities/organization-unit.entity';

export class CreateOrgUnitDto {
  @IsString()
  name!: string;

  @IsEnum(UnitType)
  type!: UnitType;

  @IsEnum(Branch)
  @IsOptional()
  branch?: Branch;

  @IsInt()
  @IsOptional()
  parentId?: number;

  @IsString()
  @IsOptional()
  description?: string;
}

