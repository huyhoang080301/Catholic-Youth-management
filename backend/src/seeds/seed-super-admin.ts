import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: false,
  ssl: process.env.DATABASE_URL?.includes('neon.tech')
    ? { rejectUnauthorized: false }
    : false,
});

async function seedSuperAdmin() {
  await AppDataSource.initialize();
  console.log('Database connected');

  const password = 'Admin@123456';
  const hashedPassword = await bcrypt.hash(password, 10);

  const existing = await AppDataSource.query(
    `SELECT id FROM users WHERE email = $1`,
    ['admin@tntt.vn'],
  );

  let userId: number;

  if (existing.length > 0) {
    userId = existing[0].id;
    console.log(`Super admin already exists (id=${userId}), updating password...`);
    await AppDataSource.query(
      `UPDATE users SET password = $1, "isActive" = true WHERE id = $2`,
      [hashedPassword, userId],
    );
  } else {
    const result = await AppDataSource.query(
      `INSERT INTO users (email, password, "fullName", phone, "isActive", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING id`,
      ['admin@tntt.vn', hashedPassword, 'Super Admin', null, true],
    );
    userId = result[0].id;
    console.log(`Super admin created (id=${userId})`);
  }

  const existingRole = await AppDataSource.query(
    `SELECT id FROM user_unit_roles WHERE "userId" = $1 AND role = 'admin'`,
    [userId],
  );

  if (existingRole.length === 0) {
    await AppDataSource.query(
      `INSERT INTO user_unit_roles ("userId", "organizationUnitId", role, "canAttend", "createdAt")
       VALUES ($1, NULL, 'admin', true, NOW())`,
      [userId],
    );
    console.log('Admin role assigned');
  } else {
    console.log('Admin role already exists');
  }

  console.log('\n=== Super Admin Account ===');
  console.log('Email   : admin@tntt.vn');
  console.log('Password: Admin@123456');
  console.log('===========================\n');

  await AppDataSource.destroy();
}

seedSuperAdmin().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
