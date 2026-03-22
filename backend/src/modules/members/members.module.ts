import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Member } from '../../entities/member.entity';
import { MemberTeam } from '../../entities/member-team.entity';
import { MemberStatusHistory } from '../../entities/member-status-history.entity';
import { Address } from '../../entities/address.entity';
import { Parent } from '../../entities/parent.entity';
import { User } from '../../entities/user.entity';
import { MembersService } from './members.service';
import { MembersController } from './members.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Member, MemberTeam, MemberStatusHistory, Address, Parent, User])],
  providers: [MembersService],
  controllers: [MembersController],
  exports: [MembersService],
})
export class MembersModule {}

