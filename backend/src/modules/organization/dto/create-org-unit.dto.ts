import { IsString, IsEnum, IsOptional, IsInt, IsArray } from 'class-validator';
import { UnitType, Branch, TeamType } from '../../../entities/organization-unit.entity';

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

  @IsInt()
  @IsOptional()
  leaderId?: number;

  @IsInt()
  @IsOptional()
  deputyId?: number;

  @IsEnum(TeamType)
  @IsOptional()
  teamType?: TeamType;

  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  memberIds?: number[];
}
