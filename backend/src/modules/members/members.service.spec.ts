import { NotFoundException, BadRequestException } from '@nestjs/common';
import { initializeTransactionalContext } from 'typeorm-transactional';
import { MembersService } from './members.service';
import { MemberStatus, MemberLevel } from '../../entities/member.entity';

beforeAll(() => {
  initializeTransactionalContext();
});

const mockMember = {
  id: 1,
  fullName: 'Nguyen Van A',
  baptismName: 'Maria',
  dateOfBirth: new Date('2010-05-15'),
  gender: 'male',
  memberCode: 'TNTT00001',
  status: MemberStatus.ACTIVE,
  isActive: true,
  level: MemberLevel.CAP_1,
  organizationUnitId: 1,
};

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
    save: jest.fn().mockImplementation((entity) => Promise.resolve({ ...entity, id: entity.id ?? Math.random() })),
    findOne: jest.fn(),
    find: jest.fn().mockResolvedValue(data),
    count: jest.fn().mockResolvedValue(data.length),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(() => qb),
  } as any;
}

describe('MembersService', () => {
  describe('findAll', () => {
    it('should return all members without filters', async () => {
      const members = [mockMember as any];
      const memberRepo = createMockRepo(members);
      const svc = new MembersService(
        memberRepo,
        createMockRepo(),
        createMockRepo(),
        createMockRepo(),
        createMockRepo(),
        createMockRepo(),
      );
      const result = await svc.findAll();
      expect(result).toEqual(members);
    });

    it('should filter by unitId', async () => {
      const memberRepo = createMockRepo([mockMember]);
      const svc = new MembersService(
        memberRepo,
        createMockRepo(),
        createMockRepo(),
        createMockRepo(),
        createMockRepo(),
        createMockRepo(),
      );
      await svc.findAll({ unitId: 1 });
      const qb = memberRepo.createQueryBuilder();
      expect(qb.andWhere).toHaveBeenCalled();
    });

    it('should filter by isActive', async () => {
      const memberRepo = createMockRepo([mockMember]);
      const svc = new MembersService(
        memberRepo,
        createMockRepo(),
        createMockRepo(),
        createMockRepo(),
        createMockRepo(),
        createMockRepo(),
      );
      await svc.findAll({ isActive: true });
      expect(memberRepo.createQueryBuilder().andWhere).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return member when found', async () => {
      const memberRepo = createMockRepo();
      memberRepo.findOne.mockResolvedValue(mockMember);
      const svc = new MembersService(
        memberRepo,
        createMockRepo(),
        createMockRepo(),
        createMockRepo(),
        createMockRepo(),
        createMockRepo(),
      );
      const result = await svc.findById(1);
      expect(result).toEqual(mockMember);
    });

    it('should throw NotFoundException when member not found', async () => {
      const memberRepo = createMockRepo();
      memberRepo.findOne.mockResolvedValue(null);
      const svc = new MembersService(
        memberRepo,
        createMockRepo(),
        createMockRepo(),
        createMockRepo(),
        createMockRepo(),
        createMockRepo(),
      );
      await expect(svc.findById(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete member when found', async () => {
      const memberRepo = createMockRepo();
      memberRepo.delete.mockResolvedValue({ affected: 1 });
      const svc = new MembersService(
        memberRepo,
        createMockRepo(),
        createMockRepo(),
        createMockRepo(),
        createMockRepo(),
        createMockRepo(),
      );
      await expect(svc.delete(1)).resolves.toBeUndefined();
    });

    it('should throw NotFoundException when member not found', async () => {
      const memberRepo = createMockRepo();
      memberRepo.delete.mockResolvedValue({ affected: 0 });
      const svc = new MembersService(
        memberRepo,
        createMockRepo(),
        createMockRepo(),
        createMockRepo(),
        createMockRepo(),
        createMockRepo(),
      );
      await expect(svc.delete(999)).rejects.toThrow(NotFoundException);
    });
  });

  // Note: @Transactional methods (setStatus, createUserAccount, transferClass, transferBranch, promote)
  // require a TypeORM data source context which is not available in unit tests.
  // These are tested via E2E tests instead.
});
