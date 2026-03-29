import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { User } from '../../entities/user.entity';
import * as bcrypt from 'bcrypt';

interface JwtPayload {
  sub: number;
  username: string;
  fullName: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: { id: number; username: string; email?: string; fullName: string };
}

@Injectable()
export class AuthService {
  private logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto): Promise<AuthTokens> {
    this.logger.log(`[LOGIN] Attempting login for username: "${loginDto.username}"`);

    // login by username (phone number or member code)
    const user = await this.usersService.findByUsername(loginDto.username);

    this.logger.log(`[LOGIN] findByUsername result: ${user ? `user found (id=${user.id}, email=${user.email}, isActive=${user.isActive})` : 'user NOT found'}`);

    if (!user) {
      this.logger.warn(`[LOGIN] ❌ User not found for username: "${loginDto.username}"`);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      this.logger.warn(`[LOGIN] ❌ User is inactive: id=${user.id}, username="${loginDto.username}"`);
      throw new UnauthorizedException('Tài khoản đã bị khóa');
    }

    this.logger.log(`[LOGIN] Comparing password for user id=${user.id}...`);
    const passwordMatch = await bcrypt.compare(loginDto.password, user.password);
    this.logger.log(`[LOGIN] bcrypt.compare result: ${passwordMatch}`);

    if (!passwordMatch) {
      this.logger.warn(`[LOGIN] ❌ Password mismatch for user id=${user.id}, username="${loginDto.username}"`);
      throw new UnauthorizedException('Invalid credentials');
    }

    this.logger.log(`[LOGIN] ✅ Login success for user id=${user.id}`);
    return this.generateTokens(user);
  }

  generateTokens(user: User): AuthTokens {
    const payload: JwtPayload = { sub: user.id, username: user.username || '', fullName: user.fullName };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
      secret: process.env.JWT_SECRET,
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '30d',
      secret: process.env.JWT_REFRESH_SECRET,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username || '',
        email: user.email || undefined,
        fullName: user.fullName,
      },
    };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      const user = await this.usersService.findById(payload.sub);
      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}


