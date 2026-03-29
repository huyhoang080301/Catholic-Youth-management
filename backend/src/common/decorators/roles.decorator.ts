import { SetMetadata } from '@nestjs/common';
import { UnitRole } from '../enums/user.enum';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
