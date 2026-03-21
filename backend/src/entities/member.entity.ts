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
import { Parent } from './parent.entity';
import { Address } from './address.entity';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
}

export enum MemberLevel {
  CAP_1 = 'cap_1',
  CAP_2 = 'cap_2',
  CAP_3 = 'cap_3',
}

@Entity('members')
export class Member {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  fullName!: string;

  @Column({ nullable: true })
  baptismName!: string;

  @Column({ type: 'date', nullable: true })
  dateOfBirth!: Date;

  @Column({ type: 'enum', enum: Gender, nullable: true })
  gender!: Gender;

  @Column({ nullable: true })
  phone!: string;

  @Column({ nullable: true })
  photoUrl!: string;

  @Column({ nullable: true })
  addressId!: number;

  @ManyToOne(() => Address, { nullable: true, eager: false, cascade: ['insert', 'update'] })
  @JoinColumn({ name: 'addressId' })
  address!: Address;

  @Column({ nullable: true })
  parentId!: number;

  @ManyToOne(() => Parent, { nullable: true, eager: false })
  @JoinColumn({ name: 'parentId' })
  parent!: Parent;

  @Column({ type: 'date', nullable: true })
  baptismDate!: Date;

  @Column({ nullable: true })
  baptismPlace!: string;

  @Column({ type: 'date', nullable: true })
  firstConfessionDate!: Date;

  @Column({ nullable: true })
  firstConfessionPlace!: string;

  @Column({ type: 'date', nullable: true })
  firstCommunionDate!: Date;

  @Column({ nullable: true })
  firstCommunionPlace!: string;

  @Column({ type: 'date', nullable: true })
  confirmationDate!: Date;

  @Column({ nullable: true })
  confirmationPlace!: string;

  @Column({ type: 'enum', enum: MemberLevel, nullable: true })
  level!: MemberLevel;

  @Column({ nullable: true })
  organizationUnitId!: number;

  @ManyToOne(() => OrganizationUnit, (u) => u.members, { nullable: true })
  @JoinColumn({ name: 'organizationUnitId' })
  organizationUnit!: OrganizationUnit;

  @OneToMany(() => Attendance, (a) => a.member)
  attendances!: Attendance[];

  @Column({ default: true })
  isActive!: boolean;

  @Column({ nullable: true })
  notes!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

