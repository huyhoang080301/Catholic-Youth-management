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
import { UnitType, Branch, TeamType } from '../common/enums';
export { UnitType, Branch, TeamType };

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
  leaderId!: number;

  @ManyToOne(() => Member, { nullable: true })
  @JoinColumn({ name: 'leaderId' })
  leader!: Member;

  @Column({ nullable: true })
  deputyId!: number;

  @ManyToOne(() => Member, { nullable: true })
  @JoinColumn({ name: 'deputyId' })
  deputy!: Member;

  @Column({ type: 'enum', enum: TeamType, nullable: true })
  teamType!: TeamType;

  @Column({ nullable: true })
  description!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

