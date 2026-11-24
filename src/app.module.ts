import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { OriginGuard } from './common/guards/origin.guard';
import { AppConfig, configuration } from './config/configuration';
import { validateEnv } from './config/env.validation';
import { buildDataSourceOptions } from './database/typeorm-options';
import { DirectoryModule } from './directory/directory.module';
import { FilesModule } from './files/files.module';
import { FoldersModule } from './folders/folders.module';
import { LibraryModule } from './library/library.module';
import { SsoModule } from './sso/sso.module';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration], validate: validateEnv }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>) => {
        const db = config.get('database', { infer: true });
        return { ...buildDataSourceOptions(db), migrationsRun: db.migrationsRun };
      },
    }),
    SsoModule,
    StorageModule,
    AuthModule,
    FoldersModule,
    FilesModule,
    LibraryModule,
    DirectoryModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: OriginGuard }],
})
export class AppModule {}
