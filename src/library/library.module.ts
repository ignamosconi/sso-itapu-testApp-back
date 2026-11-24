import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { FoldersModule } from '../folders/folders.module';
import { LIBRARY_SERVICE } from './interfaces/library.interfaces';
import { LibraryController } from './library.controller';
import { LibraryService } from './library.service';

@Module({
  imports: [AuthModule, DatabaseModule, FoldersModule],
  controllers: [LibraryController],
  providers: [{ provide: LIBRARY_SERVICE, useClass: LibraryService }],
})
export class LibraryModule {}
