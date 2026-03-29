import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { addTransactionalDataSource } from 'typeorm-transactional';
import { User } from './entities/user.entity';
import { OrganizationUnit } from './entities/organization-unit.entity';
import { Member } from './entities/member.entity';
import { MemberStatusHistory } from './entities/member-status-history.entity';
import { MemberTeam } from './entities/member-team.entity';
import { Parent } from './entities/parent.entity';
import { Address } from './entities/address.entity';
import { UserUnitRole } from './entities/user-unit-role.entity';
import { Session } from './entities/session.entity';
import { Attendance } from './entities/attendance.entity';
import { Notification } from './entities/notification.entity';
import { PendingRegistration } from './entities/pending-registration.entity';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { OrganizationModule } from './modules/organization/organization.module';
import { MembersModule } from './modules/members/members.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PendingRegistrationsModule } from './modules/pending-registrations/pending-registrations.module';
import { SessionScheduleModule } from './modules/session-schedule/session-schedule.module';
import { SessionSchedule } from './modules/session-schedule/session-schedule.entity';
import { AttendanceReportModule } from './modules/attendance-report/attendance-report.module';
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        url: process.env.DATABASE_URL,
        ssl:
          process.env.DATABASE_URL?.includes('neon.tech') ||
          process.env.DATABASE_URL?.includes('sslmode=require')
            ? { rejectUnauthorized: false }
            : false,
        entities: [
          User,
          OrganizationUnit,
          Member,
          MemberStatusHistory,
          MemberTeam,
          Parent,
          Address,
          UserUnitRole,
          Session,
          Attendance,
          Notification,
          PendingRegistration,
          SessionSchedule,
        ],
        synchronize: process.env.NODE_ENV !== 'production',
        logging: process.env.NODE_ENV === 'development',
      }),
      dataSourceFactory: async (options) => {
        const dataSource = new DataSource(options!);
        await dataSource.initialize();
        return addTransactionalDataSource(dataSource);
      },
    }),
    CommonModule,
    AuthModule,
    UsersModule,
    OrganizationModule,
    MembersModule,
    SessionsModule,
    AttendanceModule,
    NotificationsModule,
    PendingRegistrationsModule,
    SessionScheduleModule,
    AttendanceReportModule,
  ],
})
export class AppModule {}
