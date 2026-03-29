import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

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

async function seedMemberCodes() {
  await AppDataSource.initialize();
  console.log('Database connected');

  // Find all members without memberCode
  const membersWithoutCode = await AppDataSource.query(
    `SELECT id, "fullName" FROM members WHERE "memberCode" IS NULL ORDER BY id`,
  );

  if (membersWithoutCode.length === 0) {
    console.log('All members already have memberCode!');
  } else {
    console.log(`Found ${membersWithoutCode.length} members without memberCode`);

    for (let i = 0; i < membersWithoutCode.length; i++) {
      const member = membersWithoutCode[i];
      const code = `TNTT${String(i + 1).padStart(5, '0')}`;
      await AppDataSource.query(
        `UPDATE members SET "memberCode" = $1 WHERE id = $2`,
        [code, member.id],
      );
      console.log(`  ${member.id}: ${member.fullName} → ${code}`);
    }

    console.log(`\nUpdated ${membersWithoutCode.length} members`);
  }

  await AppDataSource.destroy();
}

seedMemberCodes().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
