import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AuthModule } from '../auth/auth.module';
import { AppConfig } from '../config/configuration';
import { DatabaseModule } from '../database/database.module';
import { FoldersModule } from '../folders/folders.module';
import { StorageModule } from '../storage/storage.module';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { FILES_SERVICE } from './interfaces/files.interfaces';

@Module({
  imports: [
    AuthModule,
    DatabaseModule,
    FoldersModule,
    StorageModule,
    MulterModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>) => ({
        storage: memoryStorage(),
        limits: { fileSize: config.get('storage', { infer: true }).maxPdfSizeMb * 1024 * 1024, files: 1 },
      }),
    }),
  ],
  controllers: [FilesController],
  providers: [{ provide: FILES_SERVICE, useClass: FilesService }],
})
export class FilesModule {}
