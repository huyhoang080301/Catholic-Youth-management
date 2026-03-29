import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SessionSchedule, ScheduleRuleType } from './session-schedule.entity';
import { Session } from '../../entities/session.entity';
import { SessionType } from '../../common/enums/organization.enum';

@Injectable()
export class SessionScheduleService {
  constructor(
    @InjectRepository(SessionSchedule)
    private scheduleRepo: Repository<SessionSchedule>,
    @InjectRepository(Session)
    private sessionRepo: Repository<Session>,
  ) {}

  async create(dto: {
    organizationUnitId: number;
    title: string;
    ruleType: ScheduleRuleType;
    weekDays: number[];
    weekNumbers: number[];
    startDate: string;
    endDate?: string;
    time?: string;
    note?: string;
  }) {
    const schedule = this.scheduleRepo.create({
      organizationUnitId: dto.organizationUnitId,
      title: dto.title,
      ruleType: dto.ruleType,
      weekDays: dto.weekDays,
      weekNumbers: dto.weekNumbers,
      startDate: new Date(dto.startDate),
      endDate: dto.endDate ? new Date(dto.endDate) : null,
      time: dto.time || '08:00',
      note: dto.note || undefined,
    });
    return this.scheduleRepo.save(schedule);
  }

  findByUnit(unitId: number) {
    return this.scheduleRepo.find({
      where: { organizationUnitId: unitId },
      order: { createdAt: 'DESC' },
    });
  }

  delete(id: number) {
    return this.scheduleRepo.delete(id);
  }

  async generateSessions(scheduleId: number) {
    const schedule = await this.scheduleRepo.findOne({ where: { id: scheduleId } });
    if (!schedule) throw new Error('Schedule not found');

    const sessions: Partial<Session>[] = [];
    const start = new Date(schedule.startDate);
    const end = schedule.endDate
      ? new Date(schedule.endDate)
      : new Date(start.getFullYear(), 11, 31);
    const [hours, minutes] = schedule.time.split(':').map(Number);

    const current = new Date(start);
    while (current <= end) {
      const dayOfWeek = current.getDay();
      const weekOfMonth = this.getWeekOfMonth(current);
      const dateStr = current.toISOString().split('T')[0];

      let matches = false;

      if (schedule.ruleType === ScheduleRuleType.WEEKLY) {
        matches = schedule.weekDays.includes(dayOfWeek);
      } else if (schedule.ruleType === ScheduleRuleType.BIWEEKLY) {
        const weeksSinceStart = Math.floor(
          (current.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000),
        );
        matches = schedule.weekDays.includes(dayOfWeek) && weeksSinceStart % 2 === 0;
      } else if (schedule.ruleType === ScheduleRuleType.SEMI_MONTHLY) {
        matches =
          schedule.weekDays.includes(dayOfWeek) && schedule.weekNumbers.includes(weekOfMonth);
      }

      if (matches) {
        const sessionDate = new Date(current);
        sessionDate.setHours(hours, minutes, 0, 0);
        sessions.push({
          organizationUnitId: schedule.organizationUnitId,
          title: schedule.title,
          date: sessionDate,
          sessionType: SessionType.CLASS,
          description: schedule.note || undefined,
        });
      }

      current.setDate(current.getDate() + 1);
    }

    if (sessions.length > 0) {
      await this.sessionRepo.save(sessions as Session[]);
    }

    return { generated: sessions.length, sessions };
  }

  private getWeekOfMonth(date: Date): number {
    const dayOfMonth = date.getDate();
    return Math.ceil(dayOfMonth / 7);
  }
}
