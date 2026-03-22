import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { Attendance, AttendanceStatus } from '../../entities/attendance.entity';
import { Session } from '../../entities/session.entity';
import { Notification, NotificationType } from '../../entities/notification.entity';
import { Member } from '../../entities/member.entity';
import { UpsertAttendanceDto } from './dto/upsert-attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private attendanceRepo: Repository<Attendance>,
    @InjectRepository(Session)
    private sessionRepo: Repository<Session>,
    @InjectRepository(Notification)
    private notificationRepo: Repository<Notification>,
    @InjectRepository(Member)
    private memberRepo: Repository<Member>,
  ) {}

  @Transactional()
  async upsert(sessionId: number, dto: UpsertAttendanceDto, userId: number) {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId },
      relations: ['organizationUnit'],
    });

    if (!session) throw new NotFoundException('Session not found');

    const records: Attendance[] = [];

    for (const record of dto.records) {
      let attendance = await this.attendanceRepo.findOne({
        where: { sessionId, memberId: record.memberId },
      });

      if (attendance) {
        attendance.status = record.status;
        attendance.note = record.note ?? null;
        attendance.markedById = userId;
      } else {
        attendance = this.attendanceRepo.create({
          sessionId,
          memberId: record.memberId,
          status: record.status,
          note: record.note ?? null,
          markedById: userId,
        });
      }

      records.push(await this.attendanceRepo.save(attendance));
    }

    const allAttendances = await this.attendanceRepo.find({
      where: { sessionId },
      relations: ['member', 'member.parent'],
    });

    const summary = this.calcSummary(allAttendances);
    await this.sendNotifications(session, allAttendances, userId, summary);

    return { session, records, summary };
  }

  async findBySession(sessionId: number) {
    return this.attendanceRepo.find({
      where: { sessionId },
      relations: ['member'],
    });
  }

  async findByMember(memberId: number) {
    return this.attendanceRepo.find({
      where: { memberId },
      relations: ['session'],
      order: { createdAt: 'DESC' },
    });
  }

  private calcSummary(records: Attendance[]): { total: number; present: number; absent: number; excused: number } {
    return {
      total: records.length,
      present: records.filter((r) => r.status === AttendanceStatus.PRESENT).length,
      absent: records.filter((r) => r.status === AttendanceStatus.ABSENT).length,
      excused: records.filter((r) => r.status === AttendanceStatus.EXCUSED).length,
    };
  }

  private async sendNotifications(
    session: Session,
    records: Attendance[],
    markedById: number,
    summary: { total: number; present: number; absent: number; excused: number },
  ): Promise<void> {
    const sessionDate = new Date(session.date).toLocaleDateString('vi-VN');
    const sessionLabel = session.title || `Sinh hoạt ${sessionDate}`;

    await this.notificationRepo.save(
      this.notificationRepo.create({
        userId: markedById,
        title: 'Điểm danh hoàn tất',
        body: `${sessionLabel}: ${summary.present}/${summary.total} có mặt, ${summary.absent} vắng, ${summary.excused} có phép.`,
        type: NotificationType.ATTENDANCE_SUMMARY,
        metadata: { sessionId: session.id, ...summary },
      }),
    );

    const absentRecords = records.filter((r) => r.status === AttendanceStatus.ABSENT);

    for (const record of absentRecords) {
      const member = record.member ?? (await this.memberRepo.findOne({
        where: { id: record.memberId },
        relations: ['parent'],
      }));

      if (!member?.parent?.userId) continue;

      await this.notificationRepo.save(
        this.notificationRepo.create({
          userId: member.parent.userId,
          title: 'Thông báo vắng mặt',
          body: `${member.fullName} đã vắng mặt trong buổi sinh hoạt "${sessionLabel}" ngày ${sessionDate}.`,
          type: NotificationType.ABSENT_ALERT,
          metadata: {
            sessionId: session.id,
            memberId: member.id,
            memberName: member.fullName,
          },
        }),
      );
    }
  }
}



