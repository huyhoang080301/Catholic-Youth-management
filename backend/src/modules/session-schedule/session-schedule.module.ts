import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionSchedule } from './session-schedule.entity';
import { Session } from '../../entities/session.entity';
import { SessionScheduleService } from './session-schedule.service';
import { SessionScheduleController } from './session-schedule.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SessionSchedule, Session])],
  controllers: [SessionScheduleController],
  providers: [SessionScheduleService],
})
export class SessionScheduleModule {}
