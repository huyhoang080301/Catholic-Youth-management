import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from '../../entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
  ) {}

  async create(
    userId: number,
    title: string,
    body: string,
    type: NotificationType,
    metadata?: Record<string, any>,
  ) {
    const notification = this.notificationsRepository.create({
      userId,
      title,
      body,
      type,
      metadata,
    });

    return this.notificationsRepository.save(notification);
  }

  async findByUser(userId: number, skip = 0, take = 20) {
    return this.notificationsRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip,
      take,
    });
  }

  async markAsRead(notificationId: number) {
    await this.notificationsRepository.update(notificationId, { isRead: true });
    const notification = await this.notificationsRepository.findOne({
      where: { id: notificationId },
    });

    if (!notification) throw new NotFoundException('Notification not found');
    return notification;
  }

  async markAllAsRead(userId: number) {
    await this.notificationsRepository.update({ userId }, { isRead: true });
  }
}
