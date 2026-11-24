import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1795547231690 implements MigrationInterface {
    name = 'InitialSchema1795547231690'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "sessions" ("id" character varying(64) NOT NULL, "sub" character varying(128) NOT NULL, "access_token" text NOT NULL, "refresh_token" text NOT NULL, "display_name" character varying(200) NOT NULL, "email" character varying(200), "cargo" character varying(120), "especialidad" character varying(120), "absolute_expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_3238ef96f18b355b671619111bc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_e3a0c74c8151623cc58499e290" ON "sessions" ("sub") `);
        await queryRunner.query(`CREATE TABLE "folders" ("id" uuid NOT NULL, "name" character varying(120) NOT NULL, "parent_id" uuid, "allowed_specialties" jsonb NOT NULL DEFAULT '[]', "created_by_sub" character varying(128) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_8578bd31b0e7f6d6c2480dbbca8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "pdf_files" ("id" uuid NOT NULL, "title" character varying(200) NOT NULL, "original_name" character varying(255) NOT NULL, "stored_name" character varying(64) NOT NULL, "size_bytes" integer NOT NULL, "folder_id" uuid, "uploaded_by_sub" character varying(128) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_b261be17305c5bdd514f6675cdb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_b3a69811f62b0fa94ad24c3c58" ON "pdf_files" ("folder_id") `);
        await queryRunner.query(`ALTER TABLE "folders" ADD CONSTRAINT "FK_938a930768697b6ece215667d8e" FOREIGN KEY ("parent_id") REFERENCES "folders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pdf_files" ADD CONSTRAINT "FK_b3a69811f62b0fa94ad24c3c584" FOREIGN KEY ("folder_id") REFERENCES "folders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pdf_files" DROP CONSTRAINT "FK_b3a69811f62b0fa94ad24c3c584"`);
        await queryRunner.query(`ALTER TABLE "folders" DROP CONSTRAINT "FK_938a930768697b6ece215667d8e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b3a69811f62b0fa94ad24c3c58"`);
        await queryRunner.query(`DROP TABLE "pdf_files"`);
        await queryRunner.query(`DROP TABLE "folders"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e3a0c74c8151623cc58499e290"`);
        await queryRunner.query(`DROP TABLE "sessions"`);
    }

}
