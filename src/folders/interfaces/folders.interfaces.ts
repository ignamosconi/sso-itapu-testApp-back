import { AuthUser } from '../../auth/auth.types';
import { Audience } from '../audience';
import { CreateFolderDto } from '../dto/create-folder.dto';
import { FolderDto } from '../dto/folder.dto';
import { UpdateFolderDto } from '../dto/update-folder.dto';
import { FolderEntity } from '../entities/folder.entity';

export const FOLDERS_SERVICE = Symbol('FOLDERS_SERVICE');
export const FOLDER_ACCESS = Symbol('FOLDER_ACCESS');

export interface IFoldersService {
  create(dto: CreateFolderDto, user: AuthUser): Promise<FolderDto>;
  findAll(): Promise<FolderDto[]>;
  findOne(id: string): Promise<FolderDto>;
  update(id: string, dto: UpdateFolderDto): Promise<FolderDto>;
  /** Borra la carpeta, sus subcarpetas y los PDFs que contienen (también del almacenamiento). */
  remove(id: string): Promise<void>;
}

export interface IFolderAccessService {
  /** Carpetas visibles para la audiencia (id → carpeta). Una carpeta es visible si ella y todos sus ancestros lo son. */
  getVisibleFolders(audience: Audience): Promise<Map<string, FolderEntity>>;
  /** folderId null (raíz) siempre es visible. */
  canView(folderId: string | null, audience: Audience): Promise<boolean>;
}

export interface IFoldersController {
  create(dto: CreateFolderDto, user: AuthUser): Promise<FolderDto>;
  findAll(): Promise<FolderDto[]>;
  findOne(id: string): Promise<FolderDto>;
  update(id: string, dto: UpdateFolderDto): Promise<FolderDto>;
  remove(id: string): Promise<void>;
}
