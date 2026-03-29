import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserUnitRole } from './user-unit-role.entity';
import { Notification } from './notification.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true, nullable: true })
  email!: string;

  @Column({ unique: true, nullable: true })
  username!: string;

  @Column()
  password!: string;

  @Column()
  fullName!: string;

  @Column({ nullable: true })
  phone!: string;

  @Column({ nullable: true })
  avatarUrl!: string;

  @Column({ nullable: true })
  parish!: string;

  @Column({ nullable: true })
  diocese!: string;

  @Column({ default: true })
  isActive!: boolean;

  @OneToMany(() => UserUnitRole, (r) => r.user)
  unitRoles!: UserUnitRole[];

  @OneToMany(() => Notification, (n) => n.user)
  notifications!: Notification[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

