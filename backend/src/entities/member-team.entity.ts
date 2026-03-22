import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { Member } from './member.entity';
import { OrganizationUnit } from './organization-unit.entity';

@Entity('member_teams')
@Unique(['memberId', 'teamId'])
export class MemberTeam {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  memberId!: number;

  @Column()
  teamId!: number;

  @ManyToOne(() => Member, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'memberId' })
  member!: Member;

  @ManyToOne(() => OrganizationUnit, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teamId' })
  team!: OrganizationUnit;

  @CreateDateColumn()
  createdAt!: Date;
}

