import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Member } from '../../entities/member.entity';
import { Address } from '../../entities/address.entity';
import { Parent } from '../../entities/parent.entity';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';

@Injectable()
export class MembersService {
  constructor(
    @InjectRepository(Member)
    private membersRepository: Repository<Member>,
    private dataSource: DataSource,
  ) {}

  async create(dto: CreateMemberDto) {
    const { address, parentInfo, ...rest } = dto;
    let addressId = dto.addressId;
    let parentId = dto.parentId;

    if (address && !addressId) {
      const hasAnyField = Object.values(address).some((v) => v);
      if (hasAnyField) {
        const addrRepo = this.dataSource.getRepository(Address);
        const saved = await addrRepo.save(addrRepo.create(address));
        addressId = saved.id;
      }
    }

    if (parentInfo && parentInfo.fullName && !parentId) {
      const parentRepo = this.dataSource.getRepository(Parent);
      const parentAddress = parentInfo.address;
      let parentAddressId: number | undefined;

      if (parentAddress) {
        const hasAnyField = Object.values(parentAddress).some((v) => v);
        if (hasAnyField) {
          const addrRepo = this.dataSource.getRepository(Address);
          const saved = await addrRepo.save(addrRepo.create(parentAddress));
          parentAddressId = saved.id;
        }
      }

      const { address: _addr, ...parentFields } = parentInfo;
      const parent = parentRepo.create({
        ...parentFields,
        ...(parentAddressId ? { addressId: parentAddressId } : {}),
      });
      const savedParent = await parentRepo.save(parent);
      parentId = savedParent.id;
    }

    const member = this.membersRepository.create({
      ...rest,
      ...(addressId ? { addressId } : {}),
      ...(parentId ? { parentId } : {}),
    });

    return this.membersRepository.save(member);
  }

  async findAll(filters?: { unitId?: number; isActive?: boolean; branch?: string }) {
    const query = this.membersRepository.createQueryBuilder('member');

    if (filters?.unitId) {
      query.where('member.organizationUnitId = :unitId', { unitId: +filters.unitId });
    }

    if (filters?.isActive !== undefined) {
      query.andWhere('member.isActive = :isActive', { isActive: filters.isActive });
    }

    if (filters?.branch) {
      query.leftJoin('member.organizationUnit', 'unit');
      query.andWhere('unit.branch = :branch', { branch: filters.branch });
    }

    return query.getMany();
  }

  async findById(id: number) {
    const member = await this.membersRepository.findOne({
      where: { id },
      relations: ['organizationUnit', 'parent', 'address', 'parent.address'],
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
}
