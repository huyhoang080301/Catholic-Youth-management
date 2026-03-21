import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AttendanceGuard } from '../../common/guards/attendance.guard';
import { CurrentUser, JwtUser } from '../../common/decorators/current-user.decorator';

@Controller('sessions')
export class SessionsController {
  constructor(private sessionsService: SessionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateSessionDto, @CurrentUser() user: JwtUser) {
    return this.sessionsService.create(dto, user.id);
  }

  @Get()
  findAll(@Query('unitId') unitId?: number, @Query('date') date?: string) {
    return this.sessionsService.findAll({ unitId, date });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.sessionsService.findById(id);
  }

  @Get(':id/members')
  getMembersForSession(@Param('id', ParseIntPipe) id: number) {
    return this.sessionsService.findMembersBySession(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSessionDto) {
    return this.sessionsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    await this.sessionsService.delete(id);
    return { message: 'Session deleted' };
  }
}

