import { Module } from '@nestjs/common';
import { FILE_STORAGE } from './file-storage.interface';
import { LocalFileStorage } from './local-file-storage';

@Module({
  providers: [{ provide: FILE_STORAGE, useClass: LocalFileStorage }],
  exports: [FILE_STORAGE],
})
export class StorageModule {}
