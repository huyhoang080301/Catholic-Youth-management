import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { Response } from 'express';
import { AttendanceReportService } from './attendance-report.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('attendance-report')
export class AttendanceReportController {
  constructor(private reportService: AttendanceReportService) {}

  @Get('trend')
  @UseGuards(JwtAuthGuard)
  getTrend(@Query('organizationUnitId') orgId?: string) {
    return this.reportService.getTrend(orgId ? parseInt(orgId) : undefined);
  }

  @Get('class/:unitId')
  @UseGuards(JwtAuthGuard)
  getClassStats(@Param('unitId', ParseIntPipe) unitId: number) {
    return this.reportService.getClassStats(unitId);
  }

  @Get('class/:unitId/export')
  @UseGuards(JwtAuthGuard)
  async exportClassExcel(@Param('unitId', ParseIntPipe) unitId: number, @Res() res: Response) {
    const buffer = await this.reportService.exportClassExcel(unitId);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="diem-danh-${unitId}.xlsx"`,
    });
    res.end(buffer);
  }

  @Get('class/:unitId/members/export')
  @UseGuards(JwtAuthGuard)
  async exportMembersExcel(@Param('unitId', ParseIntPipe) unitId: number, @Res() res: Response) {
    const buffer = await this.reportService.exportMemberListExcel(unitId);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="danh-sach-${unitId}.xlsx"`,
    });
    res.end(buffer);
  }
}
