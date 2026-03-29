import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { AuthService, AuthTokens } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtUser } from '../../common/decorators/current-user.decorator';
import { UserUnitRole } from '../../entities/user-unit-role.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

interface MeResponse extends JwtUser {
  roles: string[];
}

@Controller('auth')
export class AuthController {
  private logger = new Logger(AuthController.name);

  constructor(
    private authService: AuthService,
    @InjectRepository(UserUnitRole)
    private userUnitRoleRepo: Repository<UserUnitRole>,
  ) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<AuthTokens> {
    this.logger.log(`[LOGIN] Raw body: ${JSON.stringify({ ...loginDto, password: '***' })}`);
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  async refresh(@Body() refreshTokenDto: RefreshTokenDto): Promise<AuthTokens> {
    return this.authService.refresh(refreshTokenDto.refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: JwtUser): Promise<MeResponse> {
    const unitRoles = await this.userUnitRoleRepo.find({ where: { userId: user.id } });
    const roles = unitRoles.map((ur) => ur.role);
    return { ...user, roles };
  }

  @Post('logout')
  async logout(): Promise<{ message: string }> {
    return { message: 'Logged out successfully' };
  }
}


