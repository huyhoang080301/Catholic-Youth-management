import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrganizationUnit } from '../../entities/organization-unit.entity';
import { CreateOrgUnitDto } from './dto/create-org-unit.dto';
import { UpdateOrgUnitDto } from './dto/update-org-unit.dto';

export interface OrgUnitNode extends OrganizationUnit {
  children: OrgUnitNode[];
}

@Injectable()
export class OrganizationService {
  constructor(
    @InjectRepository(OrganizationUnit)
    private orgRepository: Repository<OrganizationUnit>,
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



