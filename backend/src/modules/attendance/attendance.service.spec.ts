import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { Attendance, AttendanceStatus } from '../../entities/attendance.entity';
import { Session } from '../../entities/session.entity';
import { Notification } from '../../entities/notification.entity';
import { Member } from '../../entities/member.entity';

function createMockRepo(data: any[] = []) {
  return {
    create: jest.fn().mockImplementation((dto) => ({ ...dto, id: Math.random() })),
    save: jest.fn().mockImplementation((entity) => Promise.resolve({ ...entity, id: entity.id ?? 1 })),
    findOne: jest.fn(),
    find: jest.fn().mockResolvedValue(data),
  } as any;
}

const mockSession = {
  id: 1,
  title: 'Sinh hoạt tháng 3',
  date: new Date('2026-03-15'),
  organizationUnit: { id: 1, name: 'Lớp 1' },
};


describe('AttendanceService', () => {
  let attendanceService: AttendanceService;

  function buildService(
    attendanceRepo: any,
    sessionRepo: any,
    notificationRepo: any,
    memberRepo: any,
  ) {
    return new AttendanceService(attendanceRepo, sessionRepo, notificationRepo, memberRepo);
  }

  // Note: upsert() is @Transactional and requires TypeORM data source context.
  // It's tested via Playwright E2E tests instead.

  describe('findBySession', () => {
    it('should return attendance records for session', async () => {
      const records = [{ id: 1, sessionId: 1, memberId: 1 }];
      const attendanceRepo = createMockRepo(records);
      const svc = buildService(attendanceRepo, createMockRepo(), createMockRepo(), createMockRepo());

      const result = await svc.findBySession(1);
      expect(attendanceRepo.find).toHaveBeenCalledWith({
        where: { sessionId: 1 },
        relations: ['member'],
      });
      expect(result).toEqual(records);
    });
  });

  describe('findByMember', () => {
    it('should return attendance records for member', async () => {
      const records = [{ id: 1, sessionId: 1, memberId: 5 }];
      const attendanceRepo = createMockRepo(records);
      const svc = buildService(attendanceRepo, createMockRepo(), createMockRepo(), createMockRepo());

      const result = await svc.findByMember(5);
      expect(attendanceRepo.find).toHaveBeenCalledWith({
        where: { memberId: 5 },
        relations: ['session'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(records);
    });
  });
});
