import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum NotificationType {
  ATTENDANCE_SUMMARY = 'attendance_summary',
  ABSENT_ALERT = 'absent_alert',
  GENERAL = 'general',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  userId!: number;

  @Column()
  title!: string;

  @Column({ type: 'text' })
  body!: string;

  @Column({ type: 'enum', enum: NotificationType, default: NotificationType.GENERAL })
  type!: NotificationType;

  @Column({ default: false })
  isRead!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown>;

  @ManyToOne(() => User, (u) => u.notifications)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @CreateDateColumn()
  createdAt!: Date;
}

