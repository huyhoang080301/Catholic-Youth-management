import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PendingRegistration } from '../../entities/pending-registration.entity';
import { OrganizationUnit } from '../../entities/organization-unit.entity';
import { PendingRegistrationsService } from './pending-registrations.service';
import { PendingRegistrationsController } from './pending-registrations.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PendingRegistration, OrganizationUnit])],
  providers: [PendingRegistrationsService],
  controllers: [PendingRegistrationsController],
  exports: [PendingRegistrationsService],
})
export class PendingRegistrationsModule {}
