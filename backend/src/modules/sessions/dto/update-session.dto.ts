import { IsDate, IsString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

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
}
