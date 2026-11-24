import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { SsoModule } from '../sso/sso.module';
import { StorageModule } from '../storage/storage.module';
import { FolderAccessService } from './folder-access.service';
import { FoldersController } from './folders.controller';
import { FoldersService } from './folders.service';
import { FOLDER_ACCESS, FOLDERS_SERVICE } from './interfaces/folders.interfaces';

@Module({
  imports: [AuthModule, DatabaseModule, SsoModule, StorageModule],
  controllers: [FoldersController],
  providers: [
    { provide: FOLDERS_SERVICE, useClass: FoldersService },
    { provide: FOLDER_ACCESS, useClass: FolderAccessService },
  ],
  exports: [FOLDERS_SERVICE, FOLDER_ACCESS],
})
export class FoldersModule {}
