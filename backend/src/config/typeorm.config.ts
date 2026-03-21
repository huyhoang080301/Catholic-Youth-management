import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { OrganizationUnit } from '../entities/organization-unit.entity';
import { Member } from '../entities/member.entity';
import { Parent } from '../entities/parent.entity';
import { Address } from '../entities/address.entity';
import { UserUnitRole } from '../entities/user-unit-role.entity';
import { Session } from '../entities/session.entity';
import { Attendance } from '../entities/attendance.entity';
import { Notification } from '../entities/notification.entity';

export const typeormConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [
    User,
    OrganizationUnit,
    Member,
    Parent,
    Address,
    UserUnitRole,
    Session,
    Attendance,
    Notification,
  ],
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
  migrationsRun: false,
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV === 'development',
  dropSchema: false,
};
