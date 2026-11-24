import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionEntity } from '../auth/entities/session.entity';
import { SessionRepository } from '../auth/repositories/session.repository';
import { SESSION_REPOSITORY } from '../auth/repositories/session.repository.interface';
import { PdfFileEntity } from '../files/entities/pdf-file.entity';
import { PdfFileRepository } from '../files/repositories/pdf-file.repository';
import { PDF_FILE_REPOSITORY } from '../files/repositories/pdf-file.repository.interface';
import { FolderEntity } from '../folders/entities/folder.entity';
import { FolderRepository } from '../folders/repositories/folder.repository';
import { FOLDER_REPOSITORY } from '../folders/repositories/folder.repository.interface';

/**
 * Registra las entidades y expone los repositorios (por interfaz) a los módulos de negocio.
 * Centralizarlo acá evita dependencias circulares entre carpetas, PDFs y sesiones.
 */
@Module({
  imports: [TypeOrmModule.forFeature([SessionEntity, FolderEntity, PdfFileEntity])],
  providers: [
    { provide: SESSION_REPOSITORY, useClass: SessionRepository },
    { provide: FOLDER_REPOSITORY, useClass: FolderRepository },
    { provide: PDF_FILE_REPOSITORY, useClass: PdfFileRepository },
  ],
  exports: [SESSION_REPOSITORY, FOLDER_REPOSITORY, PDF_FILE_REPOSITORY],
})
export class DatabaseModule {}
