import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('addresses')
export class Address {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: true })
  street!: string;

  @Column({ nullable: true })
  ward!: string;

  @Column({ nullable: true })
  district!: string;

  @Column({ nullable: true })
  province!: string;

  @Column({ nullable: true })
  country!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

