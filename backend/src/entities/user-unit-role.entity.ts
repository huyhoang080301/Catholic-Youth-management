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
import { UnitRole } from '../common/enums';
export { UnitRole };
import { CAN_ATTEND_ROLES } from '../common/constants';

export { CAN_ATTEND_ROLES };

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



