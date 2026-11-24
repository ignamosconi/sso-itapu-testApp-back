import { FolderEntity } from '../entities/folder.entity';

export const FOLDER_REPOSITORY = Symbol('FOLDER_REPOSITORY');

export type NewFolder = Pick<FolderEntity, 'name' | 'parentId' | 'allowedSpecialties' | 'createdBySub'>;
export type FolderPatch = Partial<Pick<FolderEntity, 'name' | 'parentId' | 'allowedSpecialties'>>;

export interface IFolderRepository {
  create(data: NewFolder): Promise<FolderEntity>;
  findAll(): Promise<FolderEntity[]>;
  findById(id: string): Promise<FolderEntity | null>;
  /** Búsqueda por nombre dentro de un mismo padre, sin distinguir mayúsculas. */
  findByParentAndName(parentId: string | null, name: string): Promise<FolderEntity | null>;
  update(id: string, patch: FolderPatch): Promise<FolderEntity | null>;
  /** Borra la carpeta; la base elimina en cascada subcarpetas y registros de PDFs. */
  delete(id: string): Promise<void>;
}
