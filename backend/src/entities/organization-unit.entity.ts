import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Member } from './member.entity';
import { Session } from './session.entity';
import { UserUnitRole } from './user-unit-role.entity';

export enum UnitType {
  XU_DOAN = 'xu_doan',
  PHAN_DOAN = 'phan_doan',
  CHI_DOAN = 'chi_doan',
  LOP = 'lop',
  DOI = 'doi',
}

export enum Branch {
  CHIEN_CON = 'chien_con',
  AU_NHI = 'au_nhi',
  THIEU_NHI = 'thieu_nhi',
  NGHIA_SI = 'nghia_si',
  HIEP_SI = 'hiep_si',
}

@Entity('organization_units')
export class OrganizationUnit {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ type: 'enum', enum: UnitType })
  type!: UnitType;

  @Column({ type: 'enum', enum: Branch, nullable: true })
  branch!: Branch;

  @Column({ nullable: true })
  parentId!: number;

  @ManyToOne(() => OrganizationUnit, (u) => u.children, { nullable: true })
  @JoinColumn({ name: 'parentId' })
  parent!: OrganizationUnit;

  @OneToMany(() => OrganizationUnit, (u) => u.parent)
  children!: OrganizationUnit[];

  @OneToMany(() => Member, (m) => m.organizationUnit)
  members!: Member[];

  @OneToMany(() => Session, (s) => s.organizationUnit)
  sessions!: Session[];

  @OneToMany(() => UserUnitRole, (r) => r.organizationUnit)
  userRoles!: UserUnitRole[];

  @Column({ nullable: true })
  description!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

