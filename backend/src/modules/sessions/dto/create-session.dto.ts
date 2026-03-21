import { IsDate, IsString, IsOptional, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

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
}

