import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Attendance, AttendanceStatus } from '../../entities/attendance.entity';
import { Session } from '../../entities/session.entity';
import { Member } from '../../entities/member.entity';
import * as XLSX from 'xlsx';

@Injectable()
export class AttendanceReportService {
  constructor(
    @InjectRepository(Attendance)
    private attendanceRepo: Repository<Attendance>,
    @InjectRepository(Session)
    private sessionRepo: Repository<Session>,
    @InjectRepository(Member)
    private memberRepo: Repository<Member>,
  ) {}

  /** Monthly trend for dashboard — last 12 months */
  async getTrend(organizationUnitId?: number) {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 11);
    start.setDate(1);

    const where: any = {
      status: AttendanceStatus.PRESENT,
    };
    if (organizationUnitId) {
      where.session = { organizationUnitId };
    }

    const sessions = await this.sessionRepo
      .createQueryBuilder('session')
      .where('session.date >= :start', { start })
      .andWhere('session.date <= :end', { end })
      .andWhere(organizationUnitId ? 'session.organizationUnitId = :orgId' : '1=1', {
        orgId: organizationUnitId,
      })
      .orderBy('session.date', 'ASC')
      .getMany();

    const sessionIds = sessions.map((s) => s.id);

    if (sessionIds.length === 0) {
      return [];
    }

    const attendances = await this.attendanceRepo
      .createQueryBuilder('a')
      .where('a.sessionId IN (:...ids)', { ids: sessionIds })
      .getMany();

    const byMonth: Record<string, { total: number; present: number; month: string; rate: number }> = {};

    for (const att of attendances) {
      const session = sessions.find((s) => s.id === att.sessionId);
      if (!session) continue;
      const monthKey = `${session.date.getFullYear()}-${String(session.date.getMonth() + 1).padStart(2, '0')}`;
      if (!byMonth[monthKey]) {
        byMonth[monthKey] = { total: 0, present: 0, month: monthKey, rate: 0 };
      }
      byMonth[monthKey].total++;
      if (att.status === AttendanceStatus.PRESENT) {
        byMonth[monthKey].present++;
      }
    }

    for (const key of Object.keys(byMonth)) {
      byMonth[key].rate = Math.round((byMonth[key].present / byMonth[key].total) * 100);
    }

    return Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month));
  }

  /** Stats for a specific class/unit */
  async getClassStats(unitId: number) {
    const sessions = await this.sessionRepo.find({
      where: { organizationUnitId: unitId },
      order: { date: 'DESC' },
    });

    const totalMembers = await this.memberRepo.count({ where: { organizationUnitId: unitId } });

    const sessionIds = sessions.map((s) => s.id);
    if (sessionIds.length === 0) {
      return { sessions: [], totalMembers, overallRate: 0 };
    }

    const attendances = await this.attendanceRepo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.member', 'member')
      .where('a.sessionId IN (:...ids)', { ids: sessionIds })
      .getMany();

    const overallPresent = attendances.filter((a) => a.status === AttendanceStatus.PRESENT).length;
    const overallTotal = attendances.length;
    const overallRate = overallTotal > 0 ? Math.round((overallPresent / overallTotal) * 100) : 0;

    const sessionStats = sessions.map((s) => {
      const sAtt = attendances.filter((a) => a.sessionId === s.id);
      const present = sAtt.filter((a) => a.status === AttendanceStatus.PRESENT).length;
      const absent = sAtt.filter((a) => a.status === AttendanceStatus.ABSENT).length;
      const excused = sAtt.filter((a) => a.status === AttendanceStatus.EXCUSED).length;
      const total = sAtt.length;
      return {
        sessionId: s.id,
        date: s.date,
        title: s.title,
        present,
        absent,
        excused,
        unmarked: totalMembers - total,
        rate: total > 0 ? Math.round((present / total) * 100) : 0,
      };
    });

    return { sessions: sessionStats, totalMembers, overallRate };
  }

  /** Export Excel for a class */
  async exportClassExcel(unitId: number) {
    const stats = await this.getClassStats(unitId);

    const sheetData = [
      [`Bao cao diem danh - ${unitId}`, '', ''],
      [`Tong thanh vien: ${stats.totalMembers}`, '', ''],
      [`Ty le diem danh chung: ${stats.overallRate}%`, '', ''],
      ['', '', ''],
      ['Ngay', 'Tieu de', 'Co mat', 'Vang', 'Phep', 'Chua danh', 'Ty le'],
      ...stats.sessions.map((s) => [
        new Date(s.date).toLocaleDateString('vi-VN'),
        s.title,
        s.present,
        s.absent,
        s.excused,
        s.unmarked,
        `${s.rate}%`,
      ]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    ws['!cols'] = [
      { wch: 15 },
      { wch: 30 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 12 },
      { wch: 10 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Diem danh');
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
    return buffer;
  }

  /** Export member attendance list as Excel */
  async exportMemberListExcel(unitId: number) {
    const members = await this.memberRepo.find({
      where: { organizationUnitId: unitId },
      order: { fullName: 'ASC' },
    });

    const sessions = await this.sessionRepo.find({
      where: { organizationUnitId: unitId },
      order: { date: 'ASC' },
    });

    const sessionIds = sessions.map((s) => s.id);
    const attendances = sessionIds.length
      ? await this.attendanceRepo
          .createQueryBuilder('a')
          .where('a.sessionId IN (:...ids)', { ids: sessionIds })
          .getMany()
      : [];

    const header = ['STT', 'Ho va ten', 'Ma TV', 'Cap', ...sessions.map((s) => {
      const d = new Date(s.date);
      return `${d.getDate()}/${d.getMonth() + 1}`;
    }), 'Co mat', 'Vang', 'Ty le'];

    const rows = members.map((m, idx) => {
      const atts = attendances.filter((a) => a.memberId === m.id);
      const present = atts.filter((a) => a.status === AttendanceStatus.PRESENT).length;
      const absent = atts.filter((a) => a.status === AttendanceStatus.ABSENT).length;
      const unmarked = sessions.length - atts.length;
      const rate = sessions.length > 0 ? Math.round((present / sessions.length) * 100) : 0;

      const statusCells = sessions.map((s) => {
        const att = atts.find((a) => a.sessionId === s.id);
        if (!att) return '-';
        if (att.status === AttendanceStatus.PRESENT) return 'C';
        if (att.status === AttendanceStatus.ABSENT) return 'V';
        return 'P';
      });

      return [
        idx + 1,
        m.fullName,
        m.memberCode,
        m.level,
        ...statusCells,
        present,
        absent + unmarked,
        `${rate}%`,
      ];
    });

    const sheetData = [
      [`Danh sach diem danh - Don vi ${unitId}`],
      [],
      header,
      ...rows,
    ];

    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    ws['!cols'] = [
      { wch: 4 }, { wch: 25 }, { wch: 10 }, { wch: 6 },
      ...sessions.map(() => ({ wch: 4 })),
      { wch: 8 }, { wch: 8 }, { wch: 8 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Danh sach');
    return XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
  }
}
