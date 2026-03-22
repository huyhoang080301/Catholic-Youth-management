import { IsDate, IsString, IsOptional, IsInt, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { SessionType } from '../../../entities/session.entity';

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
}
