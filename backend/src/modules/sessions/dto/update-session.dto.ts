import { IsDate, IsString, IsOptional, IsArray, IsInt, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { SessionType } from '../../../common/enums';

export class UpdateSessionDto {
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  date?: Date;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(SessionType)
  @IsOptional()
  sessionType?: SessionType;

  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  teamIds?: number[];
}
