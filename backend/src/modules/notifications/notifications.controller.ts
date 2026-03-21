import {
  Controller,
  Get,
  Patch,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtUser } from '../../common/decorators/current-user.decorator';

@Controller('notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async findByUser(
    @CurrentUser() user: JwtUser,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ): Promise<{ notifications: unknown[]; total: number }> {
    const [notifications, total] = await this.notificationsService.findByUser(
      user.id,
      skip || 0,
      take || 20,
    );
    return { notifications, total };
  }

  @Patch(':id/read')
  @UseGuards(JwtAuthGuard)
  markAsRead(@Param('id', ParseIntPipe) id: number) {
    return this.notificationsService.markAsRead(id);
  }

  @Patch('mark-all-read')
  @UseGuards(JwtAuthGuard)
  markAllAsRead(@CurrentUser() user: JwtUser) {
    return this.notificationsService.markAllAsRead(user.id);
  }
}

