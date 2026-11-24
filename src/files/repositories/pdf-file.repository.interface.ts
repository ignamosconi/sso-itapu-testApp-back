import { PdfFileEntity } from '../entities/pdf-file.entity';

export const PDF_FILE_REPOSITORY = Symbol('PDF_FILE_REPOSITORY');

export type NewPdfFile = Pick<
  PdfFileEntity,
  'title' | 'originalName' | 'storedName' | 'sizeBytes' | 'folderId' | 'uploadedBySub'
>;
export type PdfFilePatch = Partial<Pick<PdfFileEntity, 'title' | 'folderId'>>;

export interface IPdfFileRepository {
  create(data: NewPdfFile): Promise<PdfFileEntity>;
  findById(id: string): Promise<PdfFileEntity | null>;
  /** folderId null = archivos de la raíz */
  findByFolder(folderId: string | null): Promise<PdfFileEntity[]>;
  findByFolderIds(folderIds: string[]): Promise<PdfFileEntity[]>;
  update(id: string, patch: PdfFilePatch): Promise<PdfFileEntity | null>;
  delete(id: string): Promise<void>;
}
