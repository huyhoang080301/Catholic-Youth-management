import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from '../../entities/session.entity';
import { Member } from '../../entities/member.entity';
import { MemberTeam } from '../../entities/member-team.entity';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(Session)
    private sessionsRepository: Repository<Session>,
    @InjectRepository(Member)
    private membersRepository: Repository<Member>,
    @InjectRepository(MemberTeam)
    private memberTeamRepository: Repository<MemberTeam>,
  ) {}

  async create(createSessionDto: CreateSessionDto, userId: number) {
    const session = this.sessionsRepository.create({
      ...createSessionDto,
      createdById: userId,
    });
    return this.sessionsRepository.save(session);
  }

  async findAll(filters?: { unitId?: number; date?: string }) {
    const query = this.sessionsRepository
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.organizationUnit', 'organizationUnit');

    if (filters?.unitId) {
      query.where('session.organizationUnitId = :unitId', { unitId: filters.unitId });
    }

    if (filters?.date) {
      query.andWhere('DATE(session.date) = :date', { date: filters.date });
    }

    query.orderBy('session.date', 'DESC');
    return query.getMany();
  }

  async findById(id: number) {
    const session = await this.sessionsRepository.findOne({
      where: { id },
      relations: ['organizationUnit', 'createdBy'],
    });

    if (!session) throw new NotFoundException('Session not found');
    return session;
  }

  async findMembersBySession(sessionId: number) {
    const session = await this.sessionsRepository.findOne({
      where: { id: sessionId },
    });

    if (!session) throw new NotFoundException('Session not found');

    // General session: fetch members from selected teams
    if (session.sessionType === 'general' && session.teamIds && session.teamIds.length > 0) {
      const memberTeams = await this.memberTeamRepository
        .createQueryBuilder('mt')
        .leftJoinAndSelect('mt.member', 'member')
        .where('mt.teamId IN (:...teamIds)', { teamIds: session.teamIds })
        .andWhere('member.isActive = :isActive', { isActive: true })
        .orderBy('member.fullName', 'ASC')
        .getMany();
      return memberTeams.map((mt) => mt.member).filter(Boolean);
    }

    // Class session: fetch from organization unit
    if (!session.organizationUnitId) return [];
    return this.membersRepository.find({
      where: { organizationUnitId: session.organizationUnitId, isActive: true },
      order: { fullName: 'ASC' },
    });
  }

  async update(id: number, updateSessionDto: UpdateSessionDto) {
    await this.sessionsRepository.update(id, updateSessionDto);
    return this.findById(id);
  }

  async delete(id: number) {
    const result = await this.sessionsRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException('Session not found');
  }
}
