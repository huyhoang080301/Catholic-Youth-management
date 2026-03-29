import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

const mockUser = {
  id: 1,
  username: 'ht_anton',
  email: 'anton@tntt.local',
  fullName: 'Anton Hoang',
  password: '$2b$10$hashedpassword',
  isActive: true,
};

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const mockUsersService = {
      findByUsername: jest.fn(),
      findById: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
      verify: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
  });

  describe('login', () => {
    it('should return tokens on valid credentials', async () => {
      const hashed = await bcrypt.hash('tntt123', 10);
      usersService.findByUsername.mockResolvedValue({
        ...mockUser,
        password: hashed,
      } as any);

      const result = await authService.login({
        username: 'ht_anton',
        password: 'tntt123',
      });

      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.refreshToken).toBe('mock-jwt-token');
      expect(result.user.username).toBe('ht_anton');
    });

    it('should throw UnauthorizedException if user not found', async () => {
      usersService.findByUsername.mockResolvedValue(null);

      await expect(
        authService.login({ username: 'nobody', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user is inactive', async () => {
      usersService.findByUsername.mockResolvedValue({
        ...mockUser,
        isActive: false,
      } as any);

      await expect(
        authService.login({ username: 'ht_anton', password: 'tntt123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is wrong', async () => {
      const hashed = await bcrypt.hash('correctpassword', 10);
      usersService.findByUsername.mockResolvedValue({
        ...mockUser,
        password: hashed,
      } as any);

      await expect(
        authService.login({ username: 'ht_anton', password: 'wrongpassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('should return new tokens for valid refresh token', async () => {
      jwtService.verify.mockReturnValue({ sub: 1, username: 'ht_anton', fullName: 'Anton' });
      usersService.findById.mockResolvedValue(mockUser as any);

      const result = await authService.refresh('valid-refresh-token');
      expect(result.accessToken).toBe('mock-jwt-token');
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      jwtService.verify.mockImplementation(() => { throw new Error('invalid'); });

      await expect(authService.refresh('bad-token')).rejects.toThrow(UnauthorizedException);
    });
  });
});
