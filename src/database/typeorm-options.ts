import { DataSourceOptions } from 'typeorm';
import { SessionEntity } from '../auth/entities/session.entity';
import { AppConfig } from '../config/configuration';
import { PdfFileEntity } from '../files/entities/pdf-file.entity';
import { FolderEntity } from '../folders/entities/folder.entity';

/**
 * Única definición de la conexión: la usan tanto la app (app.module.ts) como la CLI de migraciones
 * (datasource.ts). Así nunca pueden divergir.
 *
 * `synchronize` está SIEMPRE apagado: el esquema solo cambia con migraciones versionadas.
 */
export const buildDataSourceOptions = (db: AppConfig['database']): DataSourceOptions => ({
  type: 'postgres',
  host: db.host,
  port: db.port,
  database: db.name,
  username: db.user,
  password: db.password,
  // Neon (y la mayoría de Postgres gestionados) exigen SSL.
  ssl: db.ssl ? { rejectUnauthorized: true } : false,
  entities: [SessionEntity, FolderEntity, PdfFileEntity],
  // Funciona tanto con ts (CLI / start:dev) como con js compilado (dist).
  migrations: [`${__dirname}/migrations/*{.ts,.js}`],
  migrationsTableName: 'migrations',
  synchronize: false,
});
