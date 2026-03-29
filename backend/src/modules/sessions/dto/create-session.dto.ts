import { IsDate, IsString, IsOptional, IsInt, IsEnum, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { SessionType } from '../../../common/enums';

export class CreateSessionDto {
  @IsDate()
  @Type(() => Date)
  date!: Date;

  @IsString()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  organizationUnitId?: number;

  @IsEnum(SessionType)
  @IsOptional()
  sessionType?: SessionType;

  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  teamIds?: number[];
}
