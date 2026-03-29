import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PendingRegistration, RegistrationStatus } from '../../entities/pending-registration.entity';
import { OrganizationUnit } from '../../entities/organization-unit.entity';

@Injectable()
export class PendingRegistrationsService {
  constructor(
    @InjectRepository(PendingRegistration)
    private registrationsRepository: Repository<PendingRegistration>,
    @InjectRepository(OrganizationUnit)
    private orgRepository: Repository<OrganizationUnit>,
  ) {}

  async create(dto: {
    organizationUnitCode: string;
    fullName: string;
    dateOfBirth?: string;
    phone?: string;
    gender?: string;
    note?: string;
  }) {
    const unit = await this.orgRepository.findOne({ where: { code: dto.organizationUnitCode } });
    if (!unit) throw new BadRequestException(`Không tìm thấy đơn vị với mã: ${dto.organizationUnitCode}`);

    const registration = this.registrationsRepository.create({
      organizationUnitId: unit.id,
      fullName: dto.fullName,
      dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
      phone: dto.phone || undefined,
      gender: dto.gender || undefined,
      note: dto.note || undefined,
      status: RegistrationStatus.PENDING,
    });
    return this.registrationsRepository.save(registration);
  }

  async findAll() {
    return this.registrationsRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findPending() {
    return this.registrationsRepository.find({
      where: { status: RegistrationStatus.PENDING },
      order: { createdAt: 'DESC' },
    });
  }

  async approve(id: number, processedBy: string) {
    await this.registrationsRepository.update(id, {
      status: RegistrationStatus.APPROVED,
      processedBy,
      processedAt: new Date(),
    });
    return this.registrationsRepository.findOne({ where: { id } });
  }

  async reject(id: number, processedBy: string) {
    await this.registrationsRepository.update(id, {
      status: RegistrationStatus.REJECTED,
      processedBy,
      processedAt: new Date(),
    });
    return this.registrationsRepository.findOne({ where: { id } });
  }
}
