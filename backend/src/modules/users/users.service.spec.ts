import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from '../../entities/user.entity';

const mockUser = {
  id: 1,
  username: 'ht_anton',
  email: 'anton@tntt.local',
  fullName: 'Anton Hoang',
  phone: '0901234567',
  isActive: true,
  parish: 'TNTT Maria Trinh Vuong',
  diocese: 'Ban Ma Thuot',
  createdAt: new Date(),
};

function createMockRepo(data: any[] = []) {
  return {
    create: jest.fn().mockImplementation((dto) => ({ ...dto, id: Math.random() })),
    save: jest.fn().mockImplementation((entity) => Promise.resolve({ ...entity, id: entity.id ?? 1 })),
    findOne: jest.fn(),
    find: jest.fn().mockResolvedValue(data),
    update: jest.fn(),
    delete: jest.fn(),
  };
}

describe('UsersService', () => {
  let service: UsersService;

  function buildService(repo: any) {
    return new UsersService(repo);
  }

  describe('create', () => {
    it('should create a user successfully', async () => {
      const repo = createMockRepo();
      repo.findOne.mockResolvedValue(null);
      const svc = buildService(repo);

      const result = await svc.create({
        username: 'newuser',
        password: 'password123',
        fullName: 'New User',
      });

      expect(repo.create).toHaveBeenCalled();
      expect(repo.save).toHaveBeenCalled();
      expect(result.username).toBe('newuser');
    });

    it('should throw ConflictException if username already exists', async () => {
      const repo = createMockRepo();
      repo.findOne.mockResolvedValue(mockUser);
      const svc = buildService(repo);

      await expect(
        svc.create({ username: 'ht_anton', password: 'pass', fullName: 'Test' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      const repo = createMockRepo();
      repo.findOne.mockResolvedValue(mockUser);
      const svc = buildService(repo);

      const result = await svc.findById(1);
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      const repo = createMockRepo();
      repo.findOne.mockResolvedValue(null);
      const svc = buildService(repo);

      await expect(svc.findById(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByUsername', () => {
    it('should find user by username', async () => {
      const repo = createMockRepo();
      repo.findOne.mockResolvedValue(mockUser);
      const svc = buildService(repo);

      const result = await svc.findByUsername('ht_anton');
      expect(result).toEqual(mockUser);
    });

    it('should find user by email when provided as username', async () => {
      const repo = createMockRepo();
      repo.findOne.mockResolvedValue(mockUser);
      const svc = buildService(repo);

      await svc.findByUsername('anton@tntt.local');
      expect(repo.findOne).toHaveBeenCalledWith({
        where: [{ username: 'anton@tntt.local' }, { email: 'anton@tntt.local' }],
      });
    });
  });

  describe('delete', () => {
    it('should delete user when found', async () => {
      const repo = createMockRepo();
      repo.delete.mockResolvedValue({ affected: 1 });
      const svc = buildService(repo);

      await expect(svc.delete(1)).resolves.toBeUndefined();
    });

    it('should throw NotFoundException when user not found', async () => {
      const repo = createMockRepo();
      repo.delete.mockResolvedValue({ affected: 0 });
      const svc = buildService(repo);

      await expect(svc.delete(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('exportUsersExcel', () => {
    it('should return a buffer', async () => {
      const repo = createMockRepo([mockUser]);
      const svc = buildService(repo);

      const result = await svc.exportUsersExcel();
      expect(Buffer.isBuffer(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
