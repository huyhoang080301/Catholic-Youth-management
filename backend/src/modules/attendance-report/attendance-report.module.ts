import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attendance } from '../../entities/attendance.entity';
import { Session } from '../../entities/session.entity';
import { Member } from '../../entities/member.entity';
import { AttendanceReportService } from './attendance-report.service';
import { AttendanceReportController } from './attendance-report.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Attendance, Session, Member])],
  controllers: [AttendanceReportController],
  providers: [AttendanceReportService],
})
export class AttendanceReportModule {}
