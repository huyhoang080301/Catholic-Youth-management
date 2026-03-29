import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserUnitRole } from '../../entities/user-unit-role.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(UserUnitRole)
    private userUnitRoleRepo: Repository<UserUnitRole>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.id) {
      throw new ForbiddenException('Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.');
    }

    // Get user roles from the database
    const unitRoles = await this.userUnitRoleRepo.find({
      where: { userId: user.id },
    });

    if (!unitRoles || unitRoles.length === 0) {
      throw new ForbiddenException(
        `Tài khoản của bạn chưa được cấp quyền nào. Cần quyền: ${requiredRoles.join(', ')}. Vui lòng liên hệ admin.`,
      );
    }

    const userRoles = unitRoles.map((ur) => ur.role);

    // Check if user has any of the required roles
    const hasRole = requiredRoles.some((role) => (userRoles as string[]).includes(role));
    if (!hasRole) {
      throw new ForbiddenException(
        `Bạn không có quyền thực hiện thao tác này. Cần quyền: ${requiredRoles.join(', ')}. Quyền hiện tại: ${userRoles.join(', ')}.`,
      );
    }

    // Attach roles to request for downstream use
    request.userRoles = userRoles;
    return true;
  }
}
