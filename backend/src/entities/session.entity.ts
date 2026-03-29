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
import { OrganizationUnit } from './organization-unit.entity';
import { Attendance } from './attendance.entity';
import { User } from './user.entity';
import { SessionType } from '../common/enums';

@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'date' })
  date!: Date;

  @Column()
  title!: string;

  @Column({ nullable: true })
  description!: string;

  @Column({ nullable: true })
  organizationUnitId!: number;

  @ManyToOne(() => OrganizationUnit, (u) => u.sessions, { nullable: true })
  @JoinColumn({ name: 'organizationUnitId' })
  organizationUnit!: OrganizationUnit;

  @OneToMany(() => Attendance, (a) => a.session)
  attendances!: Attendance[];

  @Column({ nullable: true })
  createdById!: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'createdById' })
  createdBy!: User;

  @Column({ type: 'enum', enum: SessionType, default: SessionType.CLASS })
  sessionType!: SessionType;

  @Column({ type: 'int', array: true, nullable: true })
  teamIds!: number[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

