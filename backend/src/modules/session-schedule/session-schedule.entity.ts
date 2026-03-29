import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum ScheduleRuleType {
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  SEMI_MONTHLY = 'semi_monthly',
}

@Entity('session_schedules')
export class SessionSchedule {
  @PrimaryGeneratedColumn() id!: number;
  @Column() organizationUnitId!: number;
  @Column() title!: string;
  @Column({ type: 'enum', enum: ScheduleRuleType }) ruleType!: ScheduleRuleType;
  @Column({ type: 'int', array: true }) weekDays!: number[];
  @Column({ type: 'int', array: true }) weekNumbers!: number[];
  @Column({ type: 'date' }) startDate!: Date;
  @Column({ type: 'date', nullable: true }) endDate!: Date | null;
  @Column({ type: 'time', default: '08:00' }) time!: string;
  @Column({ nullable: true }) note!: string;
  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}
