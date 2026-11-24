import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AuthUser } from '../auth/auth.types';
import { audienceFor } from '../folders/audience';
import { FOLDER_ACCESS, IFolderAccessService } from '../folders/interfaces/folders.interfaces';
import { FOLDER_REPOSITORY, IFolderRepository } from '../folders/repositories/folder.repository.interface';
import { FILE_STORAGE, IFileStorage } from '../storage/file-storage.interface';
import { PdfFileDto, toPdfFileDto } from './dto/pdf-file.dto';
import { UpdatePdfFileDto } from './dto/update-pdf-file.dto';
import { UploadPdfDto } from './dto/upload-pdf.dto';
import { PdfFileEntity } from './entities/pdf-file.entity';
import { IFilesService, PdfContent, UploadedPdf } from './interfaces/files.interfaces';
import { IPdfFileRepository, PDF_FILE_REPOSITORY } from './repositories/pdf-file.repository.interface';

const PDF_MAGIC = '%PDF-';

@Injectable()
export class FilesService implements IFilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(
    @Inject(PDF_FILE_REPOSITORY) private readonly files: IPdfFileRepository,
    @Inject(FOLDER_REPOSITORY) private readonly folders: IFolderRepository,
    @Inject(FILE_STORAGE) private readonly storage: IFileStorage,
    @Inject(FOLDER_ACCESS) private readonly access: IFolderAccessService,
  ) {}

  async upload(file: UploadedPdf | undefined, dto: UploadPdfDto, user: AuthUser): Promise<PdfFileDto> {
    if (!file) throw new BadRequestException('Falta el archivo (campo "file")');
    this.assertIsPdf(file);

    const folderId = dto.folderId ?? null;
    if (folderId) await this.requireFolder(folderId);

    // multer decodifica los nombres como latin1; lo pasamos a utf8 para conservar tildes y ñ.
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const title = dto.title ?? originalName.replace(/\.pdf$/i, '');

    const storedName = await this.storage.save(file.buffer);
    try {
      const created = await this.files.create({
        title,
        originalName,
        storedName,
        sizeBytes: file.size,
        folderId,
        uploadedBySub: user.sub,
      });
      return toPdfFileDto(created);
    } catch (error) {
      try {
        await this.storage.delete(storedName);
      } catch {
        this.logger.error(`No se pudo limpiar el archivo huérfano ${storedName}`);
      }
      throw error;
    }
  }

  async findOne(id: string): Promise<PdfFileDto> {
    return toPdfFileDto(await this.requireFile(id));
  }

  async update(id: string, dto: UpdatePdfFileDto): Promise<PdfFileDto> {
    await this.requireFile(id);
    if (dto.folderId) await this.requireFolder(dto.folderId);

    const updated = await this.files.update(id, {
      ...(dto.title !== undefined ? { title: dto.title } : {}),
      ...(dto.folderId !== undefined ? { folderId: dto.folderId } : {}),
    });
    if (!updated) throw new NotFoundException('El PDF no existe');
    return toPdfFileDto(updated);
  }

  async remove(id: string): Promise<void> {
    const file = await this.requireFile(id);
    await this.files.delete(id);
    try {
      await this.storage.delete(file.storedName);
    } catch (error) {
      this.logger.error(`No se pudo borrar el archivo ${file.storedName}: ${(error as Error).message}`);
    }
  }

  async getContent(id: string, user: AuthUser): Promise<PdfContent> {
    const file = await this.requireFile(id);
    // Si no puede verlo, respondemos 404 (no revelamos que existe).
    if (!(await this.access.canView(file.folderId, audienceFor(user)))) {
      throw new NotFoundException('El PDF no existe');
    }
    return {
      stream: await this.storage.openReadStream(file.storedName),
      originalName: file.originalName,
      title: file.title,
      sizeBytes: file.sizeBytes,
    };
  }

  private assertIsPdf(file: UploadedPdf): void {
    const header = file.buffer.subarray(0, PDF_MAGIC.length).toString('latin1');
    if (file.mimetype !== 'application/pdf' || header !== PDF_MAGIC) {
      throw new BadRequestException('Solo se aceptan archivos PDF');
    }
  }

  private async requireFile(id: string): Promise<PdfFileEntity> {
    const file = await this.files.findById(id);
    if (!file) throw new NotFoundException('El PDF no existe');
    return file;
  }

  private async requireFolder(id: string): Promise<void> {
    if (!(await this.folders.findById(id))) throw new NotFoundException('La carpeta no existe');
  }
}
