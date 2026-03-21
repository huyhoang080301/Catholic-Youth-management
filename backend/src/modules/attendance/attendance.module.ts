import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attendance } from '../../entities/attendance.entity';
import { Session } from '../../entities/session.entity';
import { Notification } from '../../entities/notification.entity';
import { Member } from '../../entities/member.entity';
import { UserUnitRole } from '../../entities/user-unit-role.entity';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { AttendanceGuard } from '../../common/guards/attendance.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Attendance, Session, Notification, Member, UserUnitRole]),
  ],
  providers: [AttendanceService, AttendanceGuard],
  controllers: [AttendanceController],
  exports: [AttendanceService],
})
export class AttendanceModule {}
