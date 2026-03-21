import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1750000000000 implements MigrationInterface {
  name = 'InitialSchema1750000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" SERIAL PRIMARY KEY,
        "email" character varying NOT NULL UNIQUE,
        "password" character varying NOT NULL,
        "fullName" character varying NOT NULL,
        "phone" character varying,
        "avatarUrl" character varying,
        "parish" character varying,
        "diocese" character varying,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "addresses" (
        "id" SERIAL PRIMARY KEY,
        "street" character varying,
        "ward" character varying,
        "district" character varying,
        "province" character varying,
        "country" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(
      `CREATE TYPE "public"."organization_units_type_enum" AS ENUM('xu_doan','phan_doan','chi_doan','lop','doi')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."organization_units_branch_enum" AS ENUM('chien_con','au_nhi','thieu_nhi','nghia_si','hiep_si')`,
    );

    await queryRunner.query(`
      CREATE TABLE "organization_units" (
        "id" SERIAL PRIMARY KEY,
        "name" character varying NOT NULL,
        "type" "public"."organization_units_type_enum" NOT NULL DEFAULT 'doi',
        "branch" "public"."organization_units_branch_enum",
        "description" character varying,
        "parentId" integer REFERENCES "organization_units"("id") ON DELETE SET NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "parents" (
        "id" SERIAL PRIMARY KEY,
        "userId" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "fullName" character varying NOT NULL,
        "phone" character varying,
        "parish" character varying,
        "diocese" character varying,
        "addressId" integer REFERENCES "addresses"("id") ON DELETE SET NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "notes" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`CREATE TYPE "public"."members_gender_enum" AS ENUM('male','female')`);
    await queryRunner.query(`CREATE TYPE "public"."members_level_enum" AS ENUM('cap_1','cap_2','cap_3')`);

    await queryRunner.query(`
      CREATE TABLE "members" (
        "id" SERIAL PRIMARY KEY,
        "fullName" character varying NOT NULL,
        "baptismName" character varying,
        "dateOfBirth" date,
        "gender" "public"."members_gender_enum",
        "phone" character varying,
        "photoUrl" character varying,
        "addressId" integer REFERENCES "addresses"("id") ON DELETE SET NULL,
        "parentId" integer REFERENCES "parents"("id") ON DELETE SET NULL,
        "baptismDate" date,
        "baptismPlace" character varying,
        "firstConfessionDate" date,
        "firstConfessionPlace" character varying,
        "firstCommunionDate" date,
        "firstCommunionPlace" character varying,
        "confirmationDate" date,
        "confirmationPlace" character varying,
        "level" "public"."members_level_enum",
        "organizationUnitId" integer REFERENCES "organization_units"("id") ON DELETE SET NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "notes" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(
      `CREATE TYPE "public"."user_unit_roles_role_enum" AS ENUM('admin','chu_nhiem','pho_lop','huynh_truong','parent')`,
    );

    await queryRunner.query(`
      CREATE TABLE "user_unit_roles" (
        "id" SERIAL PRIMARY KEY,
        "userId" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "organizationUnitId" integer REFERENCES "organization_units"("id") ON DELETE CASCADE,
        "role" "public"."user_unit_roles_role_enum" NOT NULL,
        "canAttend" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "sessions" (
        "id" SERIAL PRIMARY KEY,
        "date" date NOT NULL,
        "title" character varying NOT NULL,
        "description" character varying,
        "organizationUnitId" integer REFERENCES "organization_units"("id") ON DELETE SET NULL,
        "createdById" integer REFERENCES "users"("id") ON DELETE SET NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`CREATE TYPE "public"."attendances_status_enum" AS ENUM('present','absent','excused')`);

    await queryRunner.query(`
      CREATE TABLE "attendances" (
        "id" SERIAL PRIMARY KEY,
        "sessionId" integer NOT NULL REFERENCES "sessions"("id") ON DELETE CASCADE,
        "memberId" integer NOT NULL REFERENCES "members"("id") ON DELETE CASCADE,
        "status" "public"."attendances_status_enum" NOT NULL DEFAULT 'absent',
        "note" character varying,
        "markedById" integer REFERENCES "users"("id") ON DELETE SET NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_attendance_session_member" UNIQUE ("sessionId","memberId")
      )
    `);

    await queryRunner.query(
      `CREATE TYPE "public"."notifications_type_enum" AS ENUM('attendance_summary','absent_alert','general')`,
    );

    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" SERIAL PRIMARY KEY,
        "userId" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "title" character varying NOT NULL,
        "body" text NOT NULL,
        "type" "public"."notifications_type_enum" NOT NULL DEFAULT 'general',
        "isRead" boolean NOT NULL DEFAULT false,
        "metadata" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
    await queryRunner.query(`DROP TABLE "attendances"`);
    await queryRunner.query(`DROP TYPE "public"."attendances_status_enum"`);
    await queryRunner.query(`DROP TABLE "sessions"`);
    await queryRunner.query(`DROP TABLE "user_unit_roles"`);
    await queryRunner.query(`DROP TYPE "public"."user_unit_roles_role_enum"`);
    await queryRunner.query(`DROP TABLE "members"`);
    await queryRunner.query(`DROP TYPE "public"."members_level_enum"`);
    await queryRunner.query(`DROP TYPE "public"."members_gender_enum"`);
    await queryRunner.query(`DROP TABLE "parents"`);
    await queryRunner.query(`DROP TABLE "organization_units"`);
    await queryRunner.query(`DROP TYPE "public"."organization_units_branch_enum"`);
    await queryRunner.query(`DROP TYPE "public"."organization_units_type_enum"`);
    await queryRunner.query(`DROP TABLE "addresses"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
