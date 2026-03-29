import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import * as XLSX from 'xlsx';
import * as bcrypt from 'bcrypt';
import { Member, MemberStatus, MemberLevel } from '../../entities/member.entity';
import { Address } from '../../entities/address.entity';
import { Parent } from '../../entities/parent.entity';
import { User } from '../../entities/user.entity';
import { MemberTeam } from '../../entities/member-team.entity';
import { MemberStatusHistory, TransitionType } from '../../entities/member-status-history.entity';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { TransferClassDto, TransferBranchDto, PromoteDto, SetStatusDto } from './dto/transition.dto';

const LEVEL_ORDER: MemberLevel[] = [MemberLevel.CAP_1, MemberLevel.CAP_2, MemberLevel.CAP_3];

@Injectable()
export class MembersService {
  constructor(
    @InjectRepository(Member)
    private membersRepository: Repository<Member>,
    @InjectRepository(Address)
    private addressRepository: Repository<Address>,
    @InjectRepository(Parent)
    private parentRepository: Repository<Parent>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(MemberStatusHistory)
    private historyRepository: Repository<MemberStatusHistory>,
    @InjectRepository(MemberTeam)
    private memberTeamRepository: Repository<MemberTeam>,
  ) {}

  private formatDobPassword(dob: Date): string {
    const d = new Date(dob);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}${month}${year}`;
  }

  private buildMemberEmail(phone: string | undefined, fullName: string): string {
    const base = phone
      ? phone.replace(/\D/g, '')
      : fullName.toLowerCase().replace(/\s+/g, '.').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return `${base}@tntt.local`;
  }

  private async generateMemberCode(): Promise<string> {
    const count = await this.membersRepository.count();
    return `TNTT${String(count + 1).padStart(5, '0')}`;
  }

  @Transactional()
  async create(dto: CreateMemberDto) {
    const { address, parentInfo, ...rest } = dto;
    let addressId = dto.addressId;
    let parentId = dto.parentId;

    if (address && !addressId) {
      const hasAnyField = Object.values(address).some((v) => v);
      if (hasAnyField) {
        const saved = await this.addressRepository.save(this.addressRepository.create(address));
        addressId = saved.id;
      }
    }

    if (parentInfo && parentInfo.fullName && !parentId) {
      const parentAddress = parentInfo.address;
      let parentAddressId: number | undefined;

      if (parentAddress) {
        const hasAnyField = Object.values(parentAddress).some((v) => v);
        if (hasAnyField) {
          const saved = await this.addressRepository.save(this.addressRepository.create(parentAddress));
          parentAddressId = saved.id;
        }
      }

      const { address: _addr, ...parentFields } = parentInfo;
      const savedParent = await this.parentRepository.save(
        this.parentRepository.create({
          ...parentFields,
          ...(parentAddressId ? { addressId: parentAddressId } : {}),
        }),
      );
      parentId = savedParent.id;
    }

    const memberCode = await this.generateMemberCode();
    const member = this.membersRepository.create({
      ...rest,
      memberCode,
      ...(addressId ? { addressId } : {}),
      ...(parentId ? { parentId } : {}),
    });

    const savedMember = await this.membersRepository.save(member);

    // Auto-create user account for the member
    // username = memberCode so elderly users can login with their member code
    const password = dto.dateOfBirth
      ? this.formatDobPassword(dto.dateOfBirth)
      : `Tntt@${Math.floor(100000 + Math.random() * 900000)}`;
    const hashedPassword = await bcrypt.hash(password, 10);
    const existingUser = await this.usersRepository.findOne({ where: { username: memberCode } });
    if (!existingUser) {
      await this.usersRepository.save(this.usersRepository.create({
        username: memberCode,
        email: dto.phone ? this.buildMemberEmail(dto.phone, dto.fullName) : undefined,
        password: hashedPassword,
        fullName: dto.fullName,
        phone: dto.phone,
        isActive: true,
      }));
    }

    return {
      member: savedMember,
      memberCode,
      password,
    };
  }

  async findAll(filters?: { unitId?: number; isActive?: boolean; branch?: string }) {
    const query = this.membersRepository.createQueryBuilder('member')
      .leftJoinAndSelect('member.organizationUnit', 'organizationUnit')
      .leftJoinAndSelect('member.teams', 'memberTeam')
      .leftJoinAndSelect('memberTeam.team', 'team');

    if (filters?.unitId) {
      query.andWhere('member.organizationUnitId = :unitId', { unitId: +filters.unitId });
    }

    if (filters?.isActive !== undefined) {
      query.andWhere('member.isActive = :isActive', { isActive: filters.isActive });
    }

    if (filters?.branch) {
      query.andWhere('organizationUnit.branch = :branch', { branch: filters.branch });
    }

    return query.getMany();
  }

  async findById(id: number) {
    const member = await this.membersRepository.findOne({
      where: { id },
      relations: ['organizationUnit', 'parent', 'address', 'parent.address', 'teams', 'teams.team'],
    });

    if (!member) throw new NotFoundException('Member not found');
    return member;
  }

  async update(id: number, dto: UpdateMemberDto) {
    const member = await this.findById(id);
    Object.assign(member, dto);
    return this.membersRepository.save(member);
  }

  async delete(id: number) {
    const result = await this.membersRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException('Member not found');
  }

  // ─── Team Methods ──────────────────────────────────────────────────────────

  async getMemberTeams(memberId: number) {
    const member = await this.findById(memberId);

    const memberTeams = await this.memberTeamRepository.find({
      where: { memberId },
      relations: ['team'],
    });

    return memberTeams.map((mt) => ({
      id: mt.team.id,
      name: mt.team.name,
      type: mt.team.type,
      branch: mt.team.branch,
      teamType: mt.team.teamType,
      leaderId: mt.team.leaderId,
      deputyId: mt.team.deputyId,
    }));
  }

  // ─── Transition Methods ────────────────────────────────────────────────────

  @Transactional()
  async transferClass(id: number, dto: TransferClassDto, performedBy?: string) {
    const member = await this.findById(id);
    const fromUnitId = member.organizationUnitId;

    member.organizationUnitId = dto.toOrganizationUnitId;
    await this.membersRepository.save(member);

    await this.historyRepository.save(this.historyRepository.create({
      memberId: id,
      transitionType: TransitionType.TRANSFER_CLASS,
      fromStatus: member.status,
      toStatus: member.status,
      fromOrganizationUnitId: fromUnitId,
      toOrganizationUnitId: dto.toOrganizationUnitId,
      reason: dto.reason,
      performedBy,
    }));

    return member;
  }

  @Transactional()
  async transferBranch(id: number, dto: TransferBranchDto, performedBy?: string) {
    const member = await this.findById(id);
    const fromUnitId = member.organizationUnitId;

    member.organizationUnitId = dto.toOrganizationUnitId;
    await this.membersRepository.save(member);

    await this.historyRepository.save(this.historyRepository.create({
      memberId: id,
      transitionType: TransitionType.TRANSFER_BRANCH,
      fromStatus: member.status,
      toStatus: member.status,
      fromOrganizationUnitId: fromUnitId,
      toOrganizationUnitId: dto.toOrganizationUnitId,
      reason: dto.reason,
      performedBy,
    }));

    return member;
  }

  @Transactional()
  async promote(id: number, dto: PromoteDto, performedBy?: string) {
    const member = await this.findById(id);
    const fromLevel = member.level;

    member.level = dto.toLevel;
    await this.membersRepository.save(member);

    await this.historyRepository.save(this.historyRepository.create({
      memberId: id,
      transitionType: TransitionType.PROMOTE,
      fromStatus: member.status,
      toStatus: member.status,
      reason: dto.reason,
      performedBy,
    }));

    return member;
  }

  @Transactional()
  async setStatus(id: number, dto: SetStatusDto, performedBy?: string) {
    const member = await this.findById(id);
    const fromStatus = member.status;

    member.status = dto.toStatus;
    member.isActive = dto.toStatus === MemberStatus.ACTIVE;
    await this.membersRepository.save(member);

    await this.historyRepository.save(this.historyRepository.create({
      memberId: id,
      transitionType: TransitionType.SET_STATUS,
      fromStatus,
      toStatus: dto.toStatus,
      reason: dto.reason,
      performedBy,
    }));

    return member;
  }

  async getStatusHistory(id: number) {
    await this.findById(id);
    return this.historyRepository.find({
      where: { memberId: id },
      order: { createdAt: 'DESC' },
    });
  }

  // ─── Auto-create User Account ─────────────────────────────────────────────

  @Transactional()
  async createUserAccount(id: number): Promise<{ memberCode: string; password: string }> {
    const member = await this.findById(id);

    if (!member.memberCode) {
      member.memberCode = await this.generateMemberCode();
      await this.membersRepository.save(member);
    }

    const existing = await this.usersRepository.findOne({ where: { username: member.memberCode } });
    if (existing) {
      throw new BadRequestException(`User account already exists for member: ${member.memberCode}`);
    }

    const password = member.dateOfBirth
      ? this.formatDobPassword(member.dateOfBirth)
      : `Tntt@${Math.floor(100000 + Math.random() * 900000)}`;
    const hashedPassword = await bcrypt.hash(password, 10);

    await this.usersRepository.save(this.usersRepository.create({
      username: member.memberCode,
      email: member.phone ? this.buildMemberEmail(member.phone, member.fullName) : undefined,
      password: hashedPassword,
      fullName: member.fullName,
      phone: member.phone,
      isActive: true,
    }));

    return { memberCode: member.memberCode, password };
  }

  // ─── Export Excel ──────────────────────────────────────────────────────────

  async exportMembersExcel(filters?: { unitId?: number; isActive?: boolean }): Promise<Buffer> {
    const members = await this.findAll(filters);

    const rows = members.map((m, i) => ({
      STT: i + 1,
      'Họ và tên': m.fullName,
      'Tên thánh': m.baptismName ?? '',
      'Ngày sinh': m.dateOfBirth ? new Date(m.dateOfBirth).toLocaleDateString('vi-VN') : '',
      'Giới tính': m.gender === 'male' ? 'Nam' : m.gender === 'female' ? 'Nữ' : '',
      'Điện thoại': m.phone ?? '',
      'Cấp': m.level ?? '',
      'Trạng thái': m.status ?? '',
      'Hoạt động': m.isActive ? 'Có' : 'Không',
      'Ghi chú': m.notes ?? '',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Danh sách thành viên');

    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }

  async exportAttendanceStatsExcel(unitId?: number): Promise<Buffer> {
    const query = this.membersRepository.createQueryBuilder('member')
      .leftJoinAndSelect('member.attendances', 'attendance')
      .leftJoinAndSelect('attendance.session', 'session');

    if (unitId) {
      query.where('member.organizationUnitId = :unitId', { unitId });
    }

    const members = await query.getMany();

    const rows = members.map((m, i) => {
      const total = m.attendances?.length ?? 0;
      const present = m.attendances?.filter((a) => a.status === 'present').length ?? 0;
      const absent = m.attendances?.filter((a) => a.status === 'absent').length ?? 0;
      const excused = m.attendances?.filter((a) => a.status === 'excused').length ?? 0;
      const rate = total > 0 ? Math.round((present / total) * 100) : 0;

      return {
        STT: i + 1,
        'Họ và tên': m.fullName,
        'Tổng buổi': total,
        'Có mặt': present,
        'Vắng mặt': absent,
        'Nghỉ phép': excused,
        'Tỷ lệ (%)': rate,
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Thống kê điểm danh');

    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }
}

