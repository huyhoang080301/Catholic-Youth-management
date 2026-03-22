import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrganizationUnit } from '../../entities/organization-unit.entity';
import { Member } from '../../entities/member.entity';
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
  memberCount: number;
  members: { id: number; fullName: string }[];
}

export interface OrgStats {
  totalClasses: number;
  totalTeams: number;
  totalMembers: number;
  classes: ClassStat[];
  teams: TeamStat[];
}

@Injectable()
export class OrganizationService {
  constructor(
    @InjectRepository(OrganizationUnit)
    private orgRepository: Repository<OrganizationUnit>,
    @InjectRepository(Member)
    private memberRepository: Repository<Member>,
  ) {}

  async create(dto: CreateOrgUnitDto) {
    const orgUnit = this.orgRepository.create(dto);
    return this.orgRepository.save(orgUnit);
  }

  async findAll() {
    return this.orgRepository.find({ relations: ['parent'] });
  }

  async findTree(): Promise<OrgUnitNode[]> {
    const all = await this.orgRepository.find({
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
      relations: ['parent', 'children'],
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

    // Build team stats — include member names
    const teamStats: TeamStat[] = await Promise.all(
      teams.map(async (t) => {
        const members = await this.memberRepository.find({
          where: { organizationUnitId: t.id, isActive: true },
          select: ['id', 'fullName'],
          order: { fullName: 'ASC' },
        });
        return {
          id: t.id,
          name: t.name,
          branch: t.branch,
          memberCount: members.length,
          members: members.map((m) => ({ id: m.id, fullName: m.fullName })),
        };
      }),
    );

    return {
      totalClasses: classes.length,
      totalTeams: teams.length,
      totalMembers,
      classes: classStats,
      teams: teamStats,
    };
  }

  async update(id: number, dto: UpdateOrgUnitDto) {
    await this.orgRepository.update(id, dto);
    return this.findById(id);
  }

  async delete(id: number) {
    const result = await this.orgRepository.delete(id);
    if (result.affected === 0)
      throw new NotFoundException('Organization unit not found');
  }
}
