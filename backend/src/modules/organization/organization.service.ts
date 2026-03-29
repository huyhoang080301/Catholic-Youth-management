import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrganizationUnit } from '../../entities/organization-unit.entity';
import { Member } from '../../entities/member.entity';
import { MemberTeam } from '../../entities/member-team.entity';
import { CreateOrgUnitDto } from './dto/create-org-unit.dto';
import { UpdateOrgUnitDto } from './dto/update-org-unit.dto';

export interface OrgUnitNode extends OrganizationUnit {
  children: OrgUnitNode[];
}

export interface ClassStat {
  id: number;
  name: string;
  branch: string;
  memberCount: number;
  presentRate: number;
}

export interface TeamStat {
  id: number;
  name: string;
  branch: string;
  teamType: string;
  memberCount: number;
  members: { id: number; fullName: string }[];
  leader?: { id: number; fullName: string } | null;
  deputy?: { id: number; fullName: string } | null;
}

export interface OrgStats {
  totalClasses: number;
  totalTeams: number;
  totalMembers: number;
  classes: ClassStat[];
  teams: TeamStat[];
  branchBreakdown: { branch: string; label: string; count: number }[];
  genderBreakdown: { gender: string; label: string; count: number }[];
}

@Injectable()
export class OrganizationService {
  constructor(
    @InjectRepository(OrganizationUnit)
    private orgRepository: Repository<OrganizationUnit>,
    @InjectRepository(Member)
    private memberRepository: Repository<Member>,
    @InjectRepository(MemberTeam)
    private memberTeamRepository: Repository<MemberTeam>,
  ) {}

  async create(dto: CreateOrgUnitDto) {
    const { memberIds, ...rest } = dto;
    const orgUnit = this.orgRepository.create(rest);
    const saved = await this.orgRepository.save(orgUnit);

    if (memberIds && memberIds.length > 0) {
      const memberTeams = memberIds.map((memberId) =>
        this.memberTeamRepository.create({ memberId, teamId: saved.id }),
      );
      await this.memberTeamRepository.save(memberTeams);
    }

    return saved;
  }

  async findAll() {
    return this.orgRepository.find({ relations: ['parent'] });
  }

  async findTree(): Promise<OrgUnitNode[]> {
    const all = await this.orgRepository.find({
      relations: ['leader', 'deputy'],
      order: { id: 'ASC' },
    });

    const map = new Map<number, OrgUnitNode>();
    all.forEach((u) => map.set(u.id, { ...u, children: [] }));

    const roots: OrgUnitNode[] = [];
    map.forEach((unit) => {
      if (unit.parentId) {
        const parent = map.get(unit.parentId);
        if (parent) parent.children.push(unit);
      } else {
        roots.push(unit);
      }
    });

    return roots;
  }

  async findById(id: number) {
    const orgUnit = await this.orgRepository.findOne({
      where: { id },
      relations: ['parent', 'children', 'leader', 'deputy'],
    });

    if (!orgUnit) throw new NotFoundException('Organization unit not found');
    return orgUnit;
  }

  async findMembers(id: number) {
    const orgUnit = await this.orgRepository.findOne({ where: { id } });
    if (!orgUnit) throw new NotFoundException('Organization unit not found');

    return this.memberRepository.find({
      where: { organizationUnitId: id, isActive: true },
      order: { fullName: 'ASC' },
    });
  }

  async findTeamMembers(teamId: number) {
    const team = await this.orgRepository.findOne({ where: { id: teamId } });
    if (!team) throw new NotFoundException('Team not found');

    const memberTeams = await this.memberTeamRepository.find({
      where: { teamId },
      relations: ['member'],
    });

    return memberTeams.map((mt) => mt.member).filter(Boolean);
  }

  async updateTeamMembers(teamId: number, memberIds: number[]) {
    const team = await this.orgRepository.findOne({ where: { id: teamId } });
    if (!team) throw new NotFoundException('Team not found');

    // Remove existing
    await this.memberTeamRepository.delete({ teamId });

    // Re-add
    if (memberIds && memberIds.length > 0) {
      const memberTeams = memberIds.map((memberId) =>
        this.memberTeamRepository.create({ memberId, teamId }),
      );
      await this.memberTeamRepository.save(memberTeams);
    }

    return this.findTeamMembers(teamId);
  }

  async getStats(): Promise<OrgStats> {
    const allUnits = await this.orgRepository.find({ order: { name: 'ASC' } });

    const classes = allUnits.filter((u) => u.type === 'lop');
    const teams = allUnits.filter((u) => u.type === 'doi');

    // Count active members per unit
    const memberCounts: { organizationUnitId: number; count: string }[] =
      await this.memberRepository
        .createQueryBuilder('member')
        .select('member.organizationUnitId', 'organizationUnitId')
        .addSelect('COUNT(member.id)', 'count')
        .where('member.isActive = true')
        .groupBy('member.organizationUnitId')
        .getRawMany();

    const countMap = new Map<number, number>();
    memberCounts.forEach((r) =>
      countMap.set(Number(r.organizationUnitId), parseInt(r.count, 10)),
    );

    const totalMembers = memberCounts.reduce((sum, r) => sum + parseInt(r.count, 10), 0);

    // Build class stats — attendance rate from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const classStats: ClassStat[] = await Promise.all(
      classes.map(async (c) => {
        let presentRate = 0;
        try {
          const result: { total: string; present: string }[] =
            await this.memberRepository.manager.query(
              `SELECT
                COUNT(a.id) AS total,
                SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) AS present
               FROM attendances a
               INNER JOIN sessions s ON s.id = a."sessionId"
               WHERE s."organizationUnitId" = $1
                 AND s.date >= $2`,
              [c.id, thirtyDaysAgo],
            );
          const total = parseInt(result[0]?.total || '0', 10);
          const present = parseInt(result[0]?.present || '0', 10);
          presentRate = total > 0 ? Math.round((present / total) * 100) : 0;
        } catch {
          presentRate = 0;
        }
        return {
          id: c.id,
          name: c.name,
          branch: c.branch,
          memberCount: countMap.get(c.id) || 0,
          presentRate,
        };
      }),
    );

    // Build team stats — use MemberTeam table for member count
    const teamStats: TeamStat[] = await Promise.all(
      teams.map(async (t) => {
        const memberTeams = await this.memberTeamRepository.find({
          where: { teamId: t.id },
          relations: ['member'],
        });
        const teamMembers = memberTeams.map((mt) => mt.member).filter(Boolean);

        let leader = null;
        let deputy = null;
        if (t.leaderId) {
          const l = await this.memberRepository.findOne({ where: { id: t.leaderId }, select: ['id', 'fullName'] });
          if (l) leader = { id: l.id, fullName: l.fullName };
        }
        if (t.deputyId) {
          const d = await this.memberRepository.findOne({ where: { id: t.deputyId }, select: ['id', 'fullName'] });
          if (d) deputy = { id: d.id, fullName: d.fullName };
        }

        return {
          id: t.id,
          name: t.name,
          branch: t.branch,
          teamType: t.teamType,
          memberCount: teamMembers.length,
          members: teamMembers.map((m) => ({ id: m.id, fullName: m.fullName })),
          leader,
          deputy,
        };
      }),
    );

    // Branch breakdown
    const branchCounts: { branch: string; count: string }[] =
      await this.memberRepository
        .createQueryBuilder('member')
        .innerJoin('member.organizationUnit', 'unit')
        .select('unit.branch', 'branch')
        .addSelect('COUNT(member.id)', 'count')
        .where('member.isActive = true')
        .andWhere('unit.branch IS NOT NULL')
        .groupBy('unit.branch')
        .getRawMany();

    const BRANCH_LABELS: Record<string, string> = {
      chien_con: 'Chiên Con',
      au_nhi: 'Ấu Nhi',
      thieu_nhi: 'Thiếu Nhi',
      nghia_si: 'Nghĩa Sĩ',
      hiep_si: 'Hiệp Sĩ',
    };

    const branchBreakdown = branchCounts.map((r) => ({
      branch: r.branch,
      label: BRANCH_LABELS[r.branch] || r.branch,
      count: parseInt(r.count, 10),
    }));

    // Gender breakdown
    const genderCounts: { gender: string; count: string }[] =
      await this.memberRepository
        .createQueryBuilder('member')
        .select('member.gender', 'gender')
        .addSelect('COUNT(member.id)', 'count')
        .where('member.isActive = true')
        .andWhere('member.gender IS NOT NULL')
        .groupBy('member.gender')
        .getRawMany();

    const GENDER_LABELS: Record<string, string> = {
      male: 'Nam',
      female: 'Nữ',
    };

    const genderBreakdown = genderCounts.map((r) => ({
      gender: r.gender,
      label: GENDER_LABELS[r.gender] || r.gender,
      count: parseInt(r.count, 10),
    }));

    return {
      totalClasses: classes.length,
      totalTeams: teams.length,
      totalMembers,
      classes: classStats,
      teams: teamStats,
      branchBreakdown,
      genderBreakdown,
    };
  }

  async update(id: number, dto: UpdateOrgUnitDto) {
    const { memberIds, ...rest } = dto as UpdateOrgUnitDto & { memberIds?: number[] };
    await this.orgRepository.update(id, rest);
    return this.findById(id);
  }

  async delete(id: number) {
    const result = await this.orgRepository.delete(id);
    if (result.affected === 0)
      throw new NotFoundException('Organization unit not found');
  }

  async joinByCode(code: string) {
    const unit = await this.orgRepository.findOne({
      where: { code },
      relations: ['parent', 'leader', 'deputy'],
    });
    if (!unit) throw new NotFoundException(`No organization unit found with code: ${code}`);
    return unit;
  }
}
