import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { SessionScheduleService } from './session-schedule.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ScheduleRuleType } from './session-schedule.entity';

@Controller('session-schedules')
export class SessionScheduleController {
  constructor(private scheduleService: SessionScheduleService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Body()
    dto: {
      organizationUnitId: number;
      title: string;
      ruleType: ScheduleRuleType;
      weekDays: number[];
      weekNumbers: number[];
      startDate: string;
      endDate?: string;
      time?: string;
      note?: string;
    },
  ) {
    return this.scheduleService.create(dto);
  }

  @Get(':unitId')
  @UseGuards(JwtAuthGuard)
  findByUnit(@Param('unitId', ParseIntPipe) unitId: number) {
    return this.scheduleService.findByUnit(unitId);
  }

  @Post(':id/generate')
  @UseGuards(JwtAuthGuard)
  generateSessions(@Param('id', ParseIntPipe) id: number) {
    return this.scheduleService.generateSessions(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.scheduleService.delete(id);
  }
}
