import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { SessionType } from '../../common/enums/organization.enum';
import { Session } from '../../entities/session.entity';
import { Member } from '../../entities/member.entity';
import { MemberTeam } from '../../entities/member-team.entity';

function createMockRepo(data: any[] = []) {
  const qb = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(data),
  };
  return {
    create: jest.fn().mockImplementation((dto) => ({ ...dto, id: Math.random() })),
    save: jest.fn().mockImplementation((entity) => Promise.resolve({ ...entity, id: entity.id ?? 1 })),
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(() => qb),
    _qb: qb,
  };
}

const mockSession = {
  id: 1,
  title: 'Sinh hoạt tháng 3',
  date: new Date('2026-03-15'),
  sessionType: 'class',
  organizationUnitId: 1,
  createdById: 1,
};

describe('SessionsService', () => {
  let service: SessionsService;

  function buildService(sessionRepo: any, memberRepo: any, memberTeamRepo: any) {
    return new SessionsService(sessionRepo, memberRepo, memberTeamRepo);
  }

  describe('create', () => {
    it('should create a session', async () => {
      const sessionRepo = createMockRepo();
      const svc = buildService(sessionRepo, createMockRepo(), createMockRepo());

      const result = await svc.create(
        { title: 'Test Session', date: new Date('2026-03-15'), sessionType: SessionType.CLASS },
        1,
      );

      expect(sessionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Test Session', createdById: 1 }),
      );
      expect(result.title).toBe('Test Session');
    });
  });

  describe('findAll', () => {
    it('should return all sessions', async () => {
      const sessions = [mockSession];
      const sessionRepo = createMockRepo(sessions);
      const svc = buildService(sessionRepo, createMockRepo(), createMockRepo());

      const result = await svc.findAll();
      expect(result).toEqual(sessions);
    });

    it('should filter by unitId', async () => {
      const sessionRepo = createMockRepo([mockSession]);
      const svc = buildService(sessionRepo, createMockRepo(), createMockRepo());

      await svc.findAll({ unitId: 1 });
      expect(sessionRepo._qb.where).toHaveBeenCalledWith(
        'session.organizationUnitId = :unitId',
        { unitId: 1 },
      );
    });
  });

  describe('findById', () => {
    it('should return session when found', async () => {
      const sessionRepo = createMockRepo();
      sessionRepo.findOne.mockResolvedValue(mockSession);
      const svc = buildService(sessionRepo, createMockRepo(), createMockRepo());

      const result = await svc.findById(1);
      expect(result).toEqual(mockSession);
    });

    it('should throw NotFoundException when session not found', async () => {
      const sessionRepo = createMockRepo();
      sessionRepo.findOne.mockResolvedValue(null);
      const svc = buildService(sessionRepo, createMockRepo(), createMockRepo());

      await expect(svc.findById(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findMembersBySession', () => {
    it('should throw NotFoundException for non-existent session', async () => {
      const sessionRepo = createMockRepo();
      sessionRepo.findOne.mockResolvedValue(null);
      const svc = buildService(sessionRepo, createMockRepo(), createMockRepo());

      await expect(svc.findMembersBySession(999)).rejects.toThrow(NotFoundException);
    });

    it('should return class members when sessionType is class', async () => {
      const members = [{ id: 1, fullName: 'Nguyen Van A', isActive: true }];
      const sessionRepo = createMockRepo();
      sessionRepo.findOne.mockResolvedValue({ ...mockSession, sessionType: 'class', organizationUnitId: 1 });
      const memberRepo = createMockRepo(members);
      memberRepo.find.mockResolvedValue(members);
      const svc = buildService(sessionRepo, memberRepo, createMockRepo());

      const result = await svc.findMembersBySession(1);
      expect(result).toEqual(members);
    });

    it('should return [] when no organizationUnitId for class session', async () => {
      const sessionRepo = createMockRepo();
      sessionRepo.findOne.mockResolvedValue({ ...mockSession, sessionType: 'class', organizationUnitId: null });
      const svc = buildService(sessionRepo, createMockRepo(), createMockRepo());

      const result = await svc.findMembersBySession(1);
      expect(result).toEqual([]);
    });
  });

  describe('delete', () => {
    it('should delete session when found', async () => {
      const sessionRepo = createMockRepo();
      sessionRepo.delete.mockResolvedValue({ affected: 1 });
      const svc = buildService(sessionRepo, createMockRepo(), createMockRepo());

      await expect(svc.delete(1)).resolves.toBeUndefined();
    });

    it('should throw NotFoundException when session not found', async () => {
      const sessionRepo = createMockRepo();
      sessionRepo.delete.mockResolvedValue({ affected: 0 });
      const svc = buildService(sessionRepo, createMockRepo(), createMockRepo());

      await expect(svc.delete(999)).rejects.toThrow(NotFoundException);
    });
  });
});
