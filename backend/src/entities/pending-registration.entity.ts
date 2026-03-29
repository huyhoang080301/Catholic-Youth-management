import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum RegistrationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('pending_registrations')
export class PendingRegistration {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  organizationUnitId!: number;

  @Column()
  fullName!: string;

  @Column({ type: 'date', nullable: true })
  dateOfBirth!: Date | null;

  @Column({ nullable: true })
  phone!: string;

  @Column({ nullable: true })
  gender!: string;

  @Column({ type: 'text', nullable: true })
  note!: string;

  @Column({ type: 'varchar', default: RegistrationStatus.PENDING })
  status!: RegistrationStatus;

  @Column({ nullable: true })
  processedBy!: string;

  @Column({ nullable: true })
  processedAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
