import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { Session } from './session.entity';
import { Member } from './member.entity';
import { User } from './user.entity';

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  EXCUSED = 'excused',
}

@Entity('attendances')
@Unique(['sessionId', 'memberId'])
export class Attendance {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  sessionId!: number;

  @Column()
  memberId!: number;

  @Column({ type: 'enum', enum: AttendanceStatus, default: AttendanceStatus.ABSENT })
  status!: AttendanceStatus;

  @Column({ nullable: true, type: 'text' })
  note!: string | null;

  @Column({ nullable: true })
  markedById!: number;

  @ManyToOne(() => Session, (s) => s.attendances)
  @JoinColumn({ name: 'sessionId' })
  session!: Session;

  @ManyToOne(() => Member, (m) => m.attendances)
  @JoinColumn({ name: 'memberId' })
  member!: Member;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'markedById' })
  markedBy!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}


