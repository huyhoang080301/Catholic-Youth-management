/**
 * Seed script cho TNTT Maria Trinh Vương - Giáo xứ Cẩm Giang
 * Chạy: node seed-full.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { Client } = require('pg');
const bcrypt = require('bcrypt');

const now = new Date().toISOString();

// ===== SAMPLE DATA =====

const organizationUnits = [
  // Đoàn
  { name: 'TNTT Maria Trinh Vương', type: 'xu_doan', branch: null, parentId: null, description: 'Đoàn TNTT Giáo xứ Cẩm Giang', code: 'TNTT_MTV' },

  // Chiên non (branch: chien_con)
  { name: 'Chiên non 4-6 tuổi', type: 'lop', branch: 'chien_con', parentId: null, description: 'Chiên non từ 4-6 tuổi', code: 'CN_4_6' },
  { name: 'Chiên non đã xưng tội', type: 'lop', branch: 'chien_con', parentId: null, description: 'Chiên non đã xưng tội lần đầu', code: 'CN_DXT' },
  { name: 'Chiên non chưa xưng tội', type: 'lop', branch: 'chien_con', parentId: null, description: 'Chiên non chưa xưng tội', code: 'CN_CXT' },

  // Ấu nhi (branch: au_nhi)
  { name: 'Lớp Ấu Nhi', type: 'lop', branch: 'au_nhi', parentId: null, description: 'Lớp Ấu Nhi', code: 'LOP_AU' },

  // Thiếu nhi (branch: thieu_nhi)
  { name: 'Lớp Thiếu Nhi 1', type: 'lop', branch: 'thieu_nhi', parentId: null, description: 'Lớp Thiếu Nhi năm thứ nhất', code: 'LOP_TN1' },
  { name: 'Lớp Thiếu Nhi 2', type: 'lop', branch: 'thieu_nhi', parentId: null, description: 'Lớp Thiếu Nhi năm thứ hai', code: 'LOP_TN2' },

  // Nghĩa sĩ (branch: nghia_si)
  { name: 'Lớp Nghĩa Sĩ', type: 'lop', branch: 'nghia_si', parentId: null, description: 'Lớp Nghĩa Sĩ', code: 'LOP_NS' },

  // Các đội (type: doi)
  { name: 'Đội Thánh Maria Goretti', type: 'doi', branch: 'au_nhi', parentId: null, description: 'Đội TNTT nữ Ấu Nhi', code: 'DOI_MARIA_GORETTI' },
  { name: 'Đội Thánh Têrêsa', type: 'doi', branch: 'thieu_nhi', parentId: null, description: 'Đội TNTT nữ Thiếu Nhi', code: 'DOI_TERESA' },
  { name: 'Đội Thánh Inhaxio', type: 'doi', branch: 'thieu_nhi', parentId: null, description: 'Đội TNTT nam Thiếu Nhi', code: 'DOI_INHAXIO' },
  { name: 'Đội Thánh Phaolô', type: 'doi', branch: 'nghia_si', parentId: null, description: 'Đội TNTT Nghĩa Sĩ', code: 'DOI_PHAOLO' },
  { name: 'Đội Thánh Phêrô', type: 'doi', branch: 'nghia_si', parentId: null, description: 'Đội TNTT Nghĩa Sĩ', code: 'DOI_PHERO' },
  { name: 'Đội Thánh Antôn', type: 'doi', branch: 'nghia_si', parentId: null, description: 'Đội TNTT Nghĩa Sĩ', code: 'DOI_ANTON' },
  { name: 'Đội Thánh Martin', type: 'doi', branch: 'hiep_si', parentId: null, description: 'Đội TNTT Hiệp Sĩ', code: 'DOI_MARTIN' },
  { name: 'Đội Thánh Giacôbê', type: 'doi', branch: 'hiep_si', parentId: null, description: 'Đội TNTT Hiệp Sĩ', code: 'DOI_GIACOBE' },
];

// Huynh trưởng
const users = [
  { username: 'ht_maria', email: 'ht.maria@tntt.vn', fullName: 'Hướng dẫn Maria Nguyễn Thị', phone: '0901000001', parish: 'Cẩm Giang' },
  { username: 'ht_giuse', email: 'ht.giuse@tntt.vn', fullName: 'Hướng dẫn Giuse Trần Văn', phone: '0901000002', parish: 'Cẩm Giang' },
  { username: 'ht_anna', email: 'ht.anna@tntt.vn', fullName: 'Hướng dẫn Anna Lê Thị', phone: '0901000003', parish: 'Cẩm Giang' },
  { username: 'ht_phaolo', email: 'ht.phaolo@tntt.vn', fullName: 'Hướng dẫn Phaolô Nguyễn Văn', phone: '0901000004', parish: 'Cẩm Giang' },
  { username: 'ht_anton', email: 'ht.anton@tntt.vn', fullName: 'Hướng dẫn Antôn Phạm Văn', phone: '0901000005', parish: 'Cẩm Giang' },
];

const passwords = ['tntt123', 'tntt123', 'tntt123', 'tntt123', 'tntt123'];

// Thành viên mẫu
const membersData = [
  // Chiên non 4-6 tuổi (3 em)
  { fullName: 'Maria Nguyễn Thảo', baptismName: 'Maria', dob: '2020-05-15', gender: 'female', branch: 'chien_con', lopCode: 'CN_4_6', doiCodes: [] },
  { fullName: 'Giuse Trần Minh', baptismName: 'Giuse', dob: '2019-03-20', gender: 'male', branch: 'chien_con', lopCode: 'CN_4_6', doiCodes: [] },
  { fullName: 'Anna Lê Ngọc', baptismName: 'Anna', dob: '2020-08-10', gender: 'female', branch: 'chien_con', lopCode: 'CN_4_6', doiCodes: [] },

  // Chiên non đã xưng tội (3 em)
  { fullName: 'Phaolô Nguyễn Hoàng', baptismName: 'Phaolô', dob: '2017-01-25', gender: 'male', branch: 'chien_con', lopCode: 'CN_DXT', doiCodes: [], baptismDate: '2024-04-15', baptismPlace: 'Giáo xứ Cẩm Giang' },
  { fullName: 'Têrêsa Phạm Thu', baptismName: 'Têrêsa', dob: '2017-07-08', gender: 'female', branch: 'chien_con', lopCode: 'CN_DXT', doiCodes: [] },
  { fullName: 'Giuse Lê Đức', baptismName: 'Giuse', dob: '2017-02-14', gender: 'male', branch: 'chien_con', lopCode: 'CN_DXT', doiCodes: [] },

  // Chiên non chưa xưng tội (2 em)
  { fullName: 'Antôn Trần Gia', baptismName: 'Antôn', dob: '2018-06-18', gender: 'male', branch: 'chien_con', lopCode: 'CN_CXT', doiCodes: [] },
  { fullName: 'Maria Phạm Hà', baptismName: 'Maria', dob: '2018-11-03', gender: 'female', branch: 'chien_con', lopCode: 'CN_CXT', doiCodes: [] },

  // Ấu Nhi (4 em)
  { fullName: 'Maria Goretti Nguyễn Thị Minh', baptismName: 'Maria', dob: '2016-04-22', gender: 'female', branch: 'au_nhi', lopCode: 'LOP_AU', doiCodes: ['DOI_MARIA_GORETTI'] },
  { fullName: 'Têrêsa Lê Thu Hà', baptismName: 'Têrêsa', dob: '2016-09-30', gender: 'female', branch: 'au_nhi', lopCode: 'LOP_AU', doiCodes: ['DOI_MARIA_GORETTI'] },
  { fullName: 'Anna Phạm Phương', baptismName: 'Anna', dob: '2016-02-28', gender: 'female', branch: 'au_nhi', lopCode: 'LOP_AU', doiCodes: ['DOI_MARIA_GORETTI'] },
  { fullName: 'Rosa Nguyễn Thị Lan', baptismName: 'Rosa', dob: '2016-12-12', gender: 'female', branch: 'au_nhi', lopCode: 'LOP_AU', doiCodes: ['DOI_MARIA_GORETTI'] },

  // Thiếu Nhi 1 (4 em)
  { fullName: 'Inhaxio Trần Văn A', baptismName: 'Inhaxio', dob: '2015-03-15', gender: 'male', branch: 'thieu_nhi', lopCode: 'LOP_TN1', doiCodes: ['DOI_INHAXIO'], firstCommunionDate: '2024-06-08', firstCommunionPlace: 'Giáo xứ Cẩm Giang' },
  { fullName: 'Phaolô Lê Minh Đức', baptismName: 'Phaolô', dob: '2015-07-20', gender: 'male', branch: 'thieu_nhi', lopCode: 'LOP_TN1', doiCodes: ['DOI_INHAXIO'] },
  { fullName: 'Têrêsa Nguyễn Thị B', baptismName: 'Têrêsa', dob: '2015-10-05', gender: 'female', branch: 'thieu_nhi', lopCode: 'LOP_TN1', doiCodes: ['DOI_TERESA'] },
  { fullName: 'Phêrô Phạm Văn C', baptismName: 'Phêrô', dob: '2015-01-18', gender: 'male', branch: 'thieu_nhi', lopCode: 'LOP_TN1', doiCodes: ['DOI_INHAXIO'] },

  // Thiếu Nhi 2 (3 em)
  { fullName: 'Têrêsa Hạnh Nguyễn Thị', baptismName: 'Têrêsa', dob: '2014-05-14', gender: 'female', branch: 'thieu_nhi', lopCode: 'LOP_TN2', doiCodes: ['DOI_TERESA'], confirmationDate: '2025-03-23', confirmationPlace: 'Giáo xứ Cẩm Giang' },
  { fullName: 'Inhaxio Đức Trần Văn', baptismName: 'Inhaxio', dob: '2014-08-30', gender: 'male', branch: 'thieu_nhi', lopCode: 'LOP_TN2', doiCodes: ['DOI_INHAXIO'] },
  { fullName: 'Maria Phương Lê Thị', baptismName: 'Maria', dob: '2014-12-01', gender: 'female', branch: 'thieu_nhi', lopCode: 'LOP_TN2', doiCodes: ['DOI_TERESA'] },

  // Nghĩa Sĩ (4 em)
  { fullName: 'Phaolô Tô Hoàng Duy', baptismName: 'Phaolô', dob: '2013-03-10', gender: 'male', branch: 'nghia_si', lopCode: 'LOP_NS', doiCodes: ['DOI_PHAOLO'], confirmationDate: '2025-03-23', confirmationPlace: 'Giáo xứ Cẩm Giang' },
  { fullName: 'Phêrô Nguyễn Văn An', baptismName: 'Phêrô', dob: '2013-07-25', gender: 'male', branch: 'nghia_si', lopCode: 'LOP_NS', doiCodes: ['DOI_PHERO'] },
  { fullName: 'Antôn Trần Quang Minh', baptismName: 'Antôn', dob: '2013-09-08', gender: 'male', branch: 'nghia_si', lopCode: 'LOP_NS', doiCodes: ['DOI_ANTON'] },
  { fullName: 'Têrêsa Phạm Thị Hương', baptismName: 'Têrêsa', dob: '2013-11-20', gender: 'female', branch: 'nghia_si', lopCode: 'LOP_NS', doiCodes: ['DOI_PHAOLO'] },
];

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('✅ Connected to database');

  // ===== CLEAR EXISTING DATA =====
  console.log('🗑️  Clearing existing data...');
  await client.query(`DELETE FROM attendances`);
  await client.query(`DELETE FROM sessions`);
  await client.query(`DELETE FROM member_teams`);
  await client.query(`DELETE FROM members`);
  await client.query(`DELETE FROM organization_units`);
  await client.query(`DELETE FROM user_unit_roles`);
  await client.query(`DELETE FROM notifications`);
  await client.query(`DELETE FROM users`);
  console.log('✅ Cleared all data');

  // ===== INSERT ORGANIZATION UNITS =====
  console.log('🏛️  Inserting organization units...');
  const unitIds = {};
  for (const unit of organizationUnits) {
    const result = await client.query(
      `INSERT INTO organization_units (name, type, branch, "parentId", description, code, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [unit.name, unit.type, unit.branch, null, unit.description, unit.code, now, now]
    );
    unitIds[unit.code] = result.rows[0].id;
    console.log(`  ✅ ${unit.name} (id=${result.rows[0].id})`);
  }

  // ===== INSERT USERS =====
  console.log('👥 Inserting users (huynh trưởng)...');
  const userIds = {};
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const hash = await bcrypt.hash(passwords[i], 10);
    const result = await client.query(
      `INSERT INTO users (username, email, password, "fullName", phone, parish, "isActive", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, true, $7, $8)
       RETURNING id`,
      [user.username, user.email, hash, user.fullName, user.phone, user.parish, now, now]
    );
    userIds[user.username] = result.rows[0].id;
    console.log(`  ✅ ${user.fullName} (id=${result.rows[0].id}) - password: ${passwords[i]}`);
  }

  // ===== INSERT USER UNIT ROLES =====
  console.log('🔑 Assigning user roles...');
  // ht_maria - chu_nhiem cho lớp Ấu Nhi
  await client.query(
    `INSERT INTO user_unit_roles ("userId", "organizationUnitId", role, "canAttend", "createdAt")
     VALUES ($1, $2, 'chu_nhiem', true, $3)`,
    [userIds['ht_maria'], unitIds['LOP_AU'], now]
  );
  console.log(`  ✅ ht_maria → Chu nhiệm Lớp Ấu Nhi`);

  // ht_giuse - chu_nhiem lớp Thiếu 1
  await client.query(
    `INSERT INTO user_unit_roles ("userId", "organizationUnitId", role, "canAttend", "createdAt")
     VALUES ($1, $2, 'chu_nhiem', true, $3)`,
    [userIds['ht_giuse'], unitIds['LOP_TN1'], now]
  );
  console.log(`  ✅ ht_giuse → Chu nhiệm Lớp Thiếu Nhi 1`);

  // ht_anna - chu_nhiem lớp Thiếu 2
  await client.query(
    `INSERT INTO user_unit_roles ("userId", "organizationUnitId", role, "canAttend", "createdAt")
     VALUES ($1, $2, 'chu_nhiem', true, $3)`,
    [userIds['ht_anna'], unitIds['LOP_TN2'], now]
  );
  console.log(`  ✅ ht_anna → Chu nhiệm Lớp Thiếu Nhi 2`);

  // ht_phaolo - chu_nhiem lớp Nghĩa Sĩ
  await client.query(
    `INSERT INTO user_unit_roles ("userId", "organizationUnitId", role, "canAttend", "createdAt")
     VALUES ($1, $2, 'chu_nhiem', true, $3)`,
    [userIds['ht_phaolo'], unitIds['LOP_NS'], now]
  );
  console.log(`  ✅ ht_phaolo → Chu nhiệm Lớp Nghĩa Sĩ`);

  // ht_anton - admin toàn đoàn
  await client.query(
    `INSERT INTO user_unit_roles ("userId", "organizationUnitId", role, "canAttend", "createdAt")
     VALUES ($1, NULL, 'admin', true, $2)`,
    [userIds['ht_anton'], now]
  );
  console.log(`  ✅ ht_anton → Admin toàn đoàn`);

  // ===== INSERT MEMBERS =====
  console.log('📋 Inserting members...');
  const memberIds = [];
  for (let i = 0; i < membersData.length; i++) {
    const m = membersData[i];
    const lopId = unitIds[m.lopCode];
    const code = `MTV${String(i + 1).padStart(4, '0')}`;

    const result = await client.query(
      `INSERT INTO members
       ("memberCode", "fullName", "baptismName", "dateOfBirth", gender, branch, "organizationUnitId",
        "baptismDate", "baptismPlace", "firstCommunionDate", "firstCommunionPlace",
        "confirmationDate", "confirmationPlace", status, "isActive", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'active', true, $14, $15)
       RETURNING id`,
      [
        code, m.fullName, m.baptismName, m.dob, m.gender, m.branch, lopId,
        m.baptismDate || null, m.baptismPlace || null,
        m.firstCommunionDate || null, m.firstCommunionPlace || null,
        m.confirmationDate || null, m.confirmationPlace || null,
        now, now
      ]
    );
    const memberId = result.rows[0].id;
    memberIds.push({ id: memberId, code, fullName: m.fullName, doiCodes: m.doiCodes, lopCode: m.lopCode });
    console.log(`  ✅ ${m.fullName} (${code}) → ${m.lopCode} | ${m.doiCodes.join(', ') || 'không đội'}`);
  }

  // ===== INSERT MEMBER TEAMS =====
  console.log('🏆 Assigning members to teams...');
  for (const m of memberIds) {
    for (const doiCode of m.doiCodes) {
      if (unitIds[doiCode]) {
        await client.query(
          `INSERT INTO member_teams ("memberId", "teamId", "createdAt")
           VALUES ($1, $2, $3)
           ON CONFLICT DO NOTHING`,
          [m.id, unitIds[doiCode], now]
        );
        console.log(`  ✅ ${m.fullName} → ${doiCode}`);
      }
    }
  }

  // ===== INSERT SESSIONS =====
  console.log('📅 Inserting attendance sessions...');

  // Helper: get date string
  const d = (offset) => {
    const date = new Date();
    date.setDate(date.getDate() - offset);
    return date.toISOString().split('T')[0];
  };

  const sessionsToInsert = [
    // Chiên non 4-6 tuổi - 3 sessions
    { date: d(14), title: 'Sinh hoạt Chiên non - Chủ đề: Yêu thương', unitId: unitIds['CN_4_6'], sessionType: 'class', teamIds: null },
    { date: d(7), title: 'Sinh hoạt Chiên non - Chủ đề: Cầu nguyện', unitId: unitIds['CN_4_6'], sessionType: 'class', teamIds: null },
    { date: d(0), title: 'Sinh hoạt Chiên non - Chủ đề: Chia sẻ Tin Mừng', unitId: unitIds['CN_4_6'], sessionType: 'class', teamIds: null },

    // Chiên non đã xưng tội - 3 sessions
    { date: d(14), title: 'Sinh hoạt Chiên non ĐXT - Tháng Hoa', unitId: unitIds['CN_DXT'], sessionType: 'class', teamIds: null },
    { date: d(7), title: 'Sinh hoạt Chiên non ĐXT - Học giáo lý', unitId: unitIds['CN_DXT'], sessionType: 'class', teamIds: null },
    { date: d(0), title: 'Sinh hoạt Chiên non ĐXT - Cầu nguyện', unitId: unitIds['CN_DXT'], sessionType: 'class', teamIds: null },

    // Chiên non chưa xưng tội - 3 sessions
    { date: d(14), title: 'Sinh hoạt Chiên non CXT - Tìm hiểu Lời Chúa', unitId: unitIds['CN_CXT'], sessionType: 'class', teamIds: null },
    { date: d(7), title: 'Sinh hoạt Chiên non CXT - Vui chơi lành mạnh', unitId: unitIds['CN_CXT'], sessionType: 'class', teamIds: null },
    { date: d(0), title: 'Sinh hoạt Chiên non CXT - Học kinh', unitId: unitIds['CN_CXT'], sessionType: 'class', teamIds: null },

    // Lớp Ấu Nhi - 4 sessions
    { date: d(21), title: 'Sinh hoạt Ấu Nhi - Chủ đề: Nhỏ bé trong Chúa', unitId: unitIds['LOP_AU'], sessionType: 'class', teamIds: null },
    { date: d(14), title: 'Sinh hoạt Ấu Nhi - Tháng Maria', unitId: unitIds['LOP_AU'], sessionType: 'class', teamIds: null },
    { date: d(7), title: 'Sinh hoạt Ấu Nhi - Học hát thánh ca', unitId: unitIds['LOP_AU'], sessionType: 'class', teamIds: null },
    { date: d(0), title: 'Sinh hoạt Ấu Nhi - Chia sẻ', unitId: unitIds['LOP_AU'], sessionType: 'class', teamIds: null },

    // Lớp Thiếu Nhi 1 - 4 sessions
    { date: d(21), title: 'Sinh hoạt Thiếu Nhi 1 - Tìm hiểu Kinh Thánh', unitId: unitIds['LOP_TN1'], sessionType: 'class', teamIds: null },
    { date: d(14), title: 'Sinh hoạt Thiếu Nhi 1 - Phong trào Mùa Chay', unitId: unitIds['LOP_TN1'], sessionType: 'class', teamIds: null },
    { date: d(7), title: 'Sinh hoạt Thiếu Nhi 1 - Học giáo lý nâng cao', unitId: unitIds['LOP_TN1'], sessionType: 'class', teamIds: null },
    { date: d(0), title: 'Sinh hoạt Thiếu Nhi 1 - Cầu nguyện và chia sẻ', unitId: unitIds['LOP_TN1'], sessionType: 'class', teamIds: null },

    // Lớp Thiếu Nhi 2 - 4 sessions
    { date: d(21), title: 'Sinh hoạt Thiếu Nhi 2 - Chuẩn bị Rước Lễ', unitId: unitIds['LOP_TN2'], sessionType: 'class', teamIds: null },
    { date: d(14), title: 'Sinh hoạt Thiếu Nhi 2 - Sống đạo hàng ngày', unitId: unitIds['LOP_TN2'], sessionType: 'class', teamIds: null },
    { date: d(7), title: 'Sinh hoạt Thiếu Nhi 2 - Học lịch sử Giáo hội', unitId: unitIds['LOP_TN2'], sessionType: 'class', teamIds: null },
    { date: d(0), title: 'Sinh hoạt Thiếu Nhi 2 - Ôn tập', unitId: unitIds['LOP_TN2'], sessionType: 'class', teamIds: null },

    // Lớp Nghĩa Sĩ - 4 sessions
    { date: d(21), title: 'Sinh hoạt Nghĩa Sĩ - Sứ mệnh người tín hữu', unitId: unitIds['LOP_NS'], sessionType: 'class', teamIds: null },
    { date: d(14), title: 'Sinh hoạt Nghĩa Sĩ - Phục vụ cộng đoàn', unitId: unitIds['LOP_NS'], sessionType: 'class', teamIds: null },
    { date: d(7), title: 'Sinh hoạt Nghĩa Sĩ - Học hỏi giáo lý', unitId: unitIds['LOP_NS'], sessionType: 'class', teamIds: null },
    { date: d(0), title: 'Sinh hoạt Nghĩa Sĩ - Chia sẻ và cầu nguyện', unitId: unitIds['LOP_NS'], sessionType: 'class', teamIds: null },

    // Sinh hoạt chung toàn đoàn - 2 sessions
    { date: d(28), title: 'Sinh hoạt chung - Ngày gặp mặt toàn đoàn', unitId: null, sessionType: 'general', teamIds: null },
    { date: d(0), title: 'Sinh hoạt chung - Cử hành Thánh Lễ', unitId: null, sessionType: 'general', teamIds: null },
  ];

  const sessionIds = [];
  for (const s of sessionsToInsert) {
    const result = await client.query(
      `INSERT INTO sessions (date, title, "organizationUnitId", "sessionType", "teamIds", "createdById", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [s.date, s.title, s.unitId, s.sessionType, s.teamIds, userIds['ht_anton'], now, now]
    );
    sessionIds.push({ id: result.rows[0].id, unitId: s.unitId, lopCode: Object.keys(unitIds).find(k => unitIds[k] === s.unitId) || null });
    console.log(`  ✅ [${s.sessionType}] ${s.title} (${s.date})`);
  }

  // ===== INSERT ATTENDANCES =====
  console.log('✅ Inserting attendances...');
  let attCount = 0;
  for (const sess of sessionIds) {
    // Get members for this class (or all for general sessions)
    let classMembers = [];
    if (sess.unitId && sess.lopCode) {
      classMembers = memberIds.filter(m => m.lopCode === sess.lopCode);
    }

    for (const m of classMembers) {
      // Randomly decide: 70% present, 20% absent, 10% excused
      const rand = Math.random();
      const status = rand < 0.7 ? 'present' : rand < 0.9 ? 'absent' : 'excused';
      await client.query(
        `INSERT INTO attendances ("sessionId", "memberId", status, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT DO NOTHING`,
        [sess.id, m.id, status, now, now]
      );
      attCount++;
    }
  }
  console.log(`  ✅ Đã tạo ${attCount} bản ghi điểm danh`);

  console.log('\n🎉 Seed hoàn tất!\n');
  console.log('========== THÔNG TIN ĐĂNG NHẬP ==========');
  for (let i = 0; i < users.length; i++) {
    console.log(`  Username: ${users[i].username}  |  Password: ${passwords[i]}`);
  }
  console.log('===========================================\n');

  await client.end();
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
