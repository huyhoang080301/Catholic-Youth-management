import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { OrganizationUnit } from './organization-unit.entity';

export enum UnitRole {
  ADMIN = 'admin',
  CHU_NHIEM = 'chu_nhiem',
  PHO_LOP = 'pho_lop',
  HUYNH_TRUONG = 'huynh_truong',
  PARENT = 'parent',
}

export const CAN_ATTEND_ROLES = [UnitRole.ADMIN, UnitRole.CHU_NHIEM, UnitRole.PHO_LOP, UnitRole.HUYNH_TRUONG];

@Entity('user_unit_roles')
export class UserUnitRole {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  userId!: number;

  @Column({ nullable: true })
  organizationUnitId!: number;

  @Column({ type: 'enum', enum: UnitRole })
  role!: UnitRole;

  @Column({ default: false })
  canAttend!: boolean;

  @ManyToOne(() => User, (u) => u.unitRoles)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @ManyToOne(() => OrganizationUnit, (u) => u.userRoles, { nullable: true })
  @JoinColumn({ name: 'organizationUnitId' })
  organizationUnit!: OrganizationUnit;

  @CreateDateColumn()
  createdAt!: Date;
}

