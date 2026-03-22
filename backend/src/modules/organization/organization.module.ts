import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationUnit } from '../../entities/organization-unit.entity';
import { Member } from '../../entities/member.entity';
import { MemberTeam } from '../../entities/member-team.entity';
import { OrganizationService } from './organization.service';
import { OrganizationController } from './organization.controller';

@Module({
  imports: [TypeOrmModule.forFeature([OrganizationUnit, Member, MemberTeam])],
  providers: [OrganizationService],
  controllers: [OrganizationController],
  exports: [OrganizationService],
})
export class OrganizationModule {}

