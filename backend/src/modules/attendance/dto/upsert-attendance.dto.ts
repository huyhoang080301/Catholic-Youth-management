import { IsInt, IsEnum, IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AttendanceStatus } from '../../../entities/attendance.entity';

export class AttendanceRecordDto {
  @IsInt()
  @Type(() => Number)
  memberId!: number;

  @IsEnum(AttendanceStatus)
  status!: AttendanceStatus;

  @IsString()
  @IsOptional()
  note?: string;
}

export class UpsertAttendanceDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttendanceRecordDto)
  records!: AttendanceRecordDto[];
}

