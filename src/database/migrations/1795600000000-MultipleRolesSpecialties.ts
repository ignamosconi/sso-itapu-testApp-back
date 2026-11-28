import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * SSO v2.0.0: /sso/me devuelve `cargos` y `especialidades` como listas.
 * Las sesiones guardadas tienen el formato viejo (un solo valor), así que se borran:
 * los usuarios solo tienen que volver a iniciar sesión.
 */
export class MultipleRolesSpecialties1795600000000 implements MigrationInterface {
  name = 'MultipleRolesSpecialties1795600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "sessions"`);
    await queryRunner.query(`ALTER TABLE "sessions" DROP COLUMN "cargo"`);
    await queryRunner.query(`ALTER TABLE "sessions" DROP COLUMN "especialidad"`);
    await queryRunner.query(`ALTER TABLE "sessions" ADD "cargos" jsonb NOT NULL DEFAULT '[]'`);
    await queryRunner.query(`ALTER TABLE "sessions" ADD "especialidades" jsonb NOT NULL DEFAULT '[]'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "sessions"`);
    await queryRunner.query(`ALTER TABLE "sessions" DROP COLUMN "especialidades"`);
    await queryRunner.query(`ALTER TABLE "sessions" DROP COLUMN "cargos"`);
    await queryRunner.query(`ALTER TABLE "sessions" ADD "especialidad" character varying(120)`);
    await queryRunner.query(`ALTER TABLE "sessions" ADD "cargo" character varying(120)`);
  }
}
