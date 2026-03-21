import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Address } from './address.entity';

@Entity('parents')
export class Parent {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: true })
  userId!: number;

  @OneToOne(() => User, { nullable: true, eager: false })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column()
  fullName!: string;

  @Column({ nullable: true })
  phone!: string;

  @Column({ nullable: true })
  parish!: string;

  @Column({ nullable: true })
  diocese!: string;

  @Column({ nullable: true })
  addressId!: number;

  @ManyToOne(() => Address, { nullable: true, eager: false, cascade: ['insert', 'update'] })
  @JoinColumn({ name: 'addressId' })
  address!: Address;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ nullable: true })
  notes!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

