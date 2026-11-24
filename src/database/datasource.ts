import 'dotenv/config';
import { DataSource } from 'typeorm';
import { configuration } from '../config/configuration';
import { buildDataSourceOptions } from './typeorm-options';

/** Punto de entrada de la CLI de TypeORM (npm run migration:*). Lee el mismo .env que la app. */
export default new DataSource(buildDataSourceOptions(configuration().database));
