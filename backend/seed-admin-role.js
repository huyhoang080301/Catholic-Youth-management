// Script to assign admin role to admin@tntt.vn user
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('✅ Connected to database');

  // Find user
  const userResult = await client.query(
    `SELECT id, username, email, "fullName", "isActive" FROM users WHERE email = $1 OR username = $1`,
    ['admin@tntt.vn']
  );

  if (userResult.rows.length === 0) {
    console.log('❌ User not found');
    await client.end();
    return;
  }

  const user = userResult.rows[0];
  console.log(`👤 Found user: id=${user.id}, email=${user.email}, username=${user.username}, fullName=${user.fullName}, isActive=${user.isActive}`);

  // Check existing roles
  const existingRoles = await client.query(
    `SELECT * FROM user_unit_roles WHERE "userId" = $1`,
    [user.id]
  );
  console.log(`📋 Existing roles:`, existingRoles.rows);

  // Delete any existing roles to start clean
  await client.query(`DELETE FROM user_unit_roles WHERE "userId" = $1`, [user.id]);
  console.log('🗑️ Cleared existing roles');

  // Insert admin role (no updatedAt column in DB)
  await client.query(
    `INSERT INTO user_unit_roles ("userId", "organizationUnitId", role, "canAttend", "createdAt")
     VALUES ($1, NULL, $2, true, NOW())`,
    [user.id, 'admin']
  );
  console.log(`✅ Assigned role 'admin' to user id=${user.id}`);

  // Verify
  const verifyRoles = await client.query(`SELECT "userId", "organizationUnitId", role, "canAttend" FROM user_unit_roles WHERE "userId" = $1`, [user.id]);
  console.log(`📋 Roles after update:`, verifyRoles.rows);

  await client.end();
  console.log('✅ Done');
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
