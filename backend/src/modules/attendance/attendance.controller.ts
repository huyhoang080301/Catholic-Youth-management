import {
  Controller,
  Post,
  Get,
  Param,
  ParseIntPipe,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { UpsertAttendanceDto } from './dto/upsert-attendance.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AttendanceGuard } from '../../common/guards/attendance.guard';
import { CurrentUser, JwtUser } from '../../common/decorators/current-user.decorator';

@Controller('attendance')
export class AttendanceController {
  constructor(private attendanceService: AttendanceService) {}

  @Post('sessions/:sessionId')
  @UseGuards(JwtAuthGuard, AttendanceGuard)
  upsert(
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Body() dto: UpsertAttendanceDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.attendanceService.upsert(sessionId, dto, user.id);
  }

  @Get('sessions/:sessionId')
  findBySession(@Param('sessionId', ParseIntPipe) sessionId: number) {
    return this.attendanceService.findBySession(sessionId);
  }

  @Get('members/:memberId')
  findByMember(@Param('memberId', ParseIntPipe) memberId: number) {
    return this.attendanceService.findByMember(memberId);
  }
}

