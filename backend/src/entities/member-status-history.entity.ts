import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { MemberStatus } from '../common/enums';
import { TransitionType } from '../common/enums';
export { TransitionType };
import { Member } from './member.entity';

@Entity('member_status_history')
export class MemberStatusHistory {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  memberId!: number;

  @ManyToOne(() => Member, (m) => m.statusHistory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'memberId' })
  member!: Member;

  @Column({ type: 'enum', enum: TransitionType })
  transitionType!: TransitionType;

  @Column({ type: 'enum', enum: MemberStatus, nullable: true })
  fromStatus!: MemberStatus;

  @Column({ type: 'enum', enum: MemberStatus })
  toStatus!: MemberStatus;

  @Column({ nullable: true })
  fromOrganizationUnitId!: number;

  @Column({ nullable: true })
  toOrganizationUnitId!: number;

  @Column({ type: 'enum', enum: ['cap_1', 'cap_2', 'cap_3'], nullable: true })
  fromLevel!: string;

  @Column({ type: 'enum', enum: ['cap_1', 'cap_2', 'cap_3'], nullable: true })
  toLevel!: string;

  @Column({ nullable: true })
  reason!: string;

  @Column({ nullable: true })
  performedBy!: string;

  @CreateDateColumn()
  createdAt!: Date;
}




