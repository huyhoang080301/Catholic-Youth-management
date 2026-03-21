import { Injectable, ForbiddenException } from '@nestjs/common';
import { CanActivate, ExecutionContext } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { UserUnitRole, UnitRole, CAN_ATTEND_ROLES } from '../../entities/user-unit-role.entity';
import { Session } from '../../entities/session.entity';

@Injectable()
export class AttendanceGuard implements CanActivate {
  constructor(
    @InjectRepository(UserUnitRole)
    private userUnitRoleRepo: Repository<UserUnitRole>,
    @InjectRepository(Session)
    private sessionRepo: Repository<Session>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ user: { id: number }; params: { sessionId: string } }>();
    const user = request.user;
    const sessionId = parseInt(request.params.sessionId, 10);

    if (!user) throw new ForbiddenException('Not authenticated');

    // Check if user is super admin
    const isAdmin = await this.userUnitRoleRepo.findOne({
      where: { userId: user.id, role: UnitRole.ADMIN, organizationUnitId: IsNull() },
    });

    if (isAdmin) return true;

    // Get session
    const session = await this.sessionRepo.findOne({ where: { id: sessionId } });
    if (!session) throw new ForbiddenException('Session not found');

    // If no unit, allow
    if (!session.organizationUnitId) return true;

    // Check if user has permission for the unit
    const role = await this.userUnitRoleRepo.findOne({
      where: {
        userId: user.id,
        organizationUnitId: session.organizationUnitId,
      },
    });

    if (role && CAN_ATTEND_ROLES.includes(role.role)) return true;

    throw new ForbiddenException(
      'You do not have permission to mark attendance for this unit',
    );
  }
}

