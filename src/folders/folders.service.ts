import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { AuthUser } from '../auth/auth.types';
import { IPdfFileRepository, PDF_FILE_REPOSITORY } from '../files/repositories/pdf-file.repository.interface';
import { ISsoDirectory } from '../sso/interfaces/sso-directory.interface';
import { SSO_DIRECTORY } from '../sso/sso.constants';
import { SsoError } from '../sso/sso.errors';
import { normalizeKey } from '../sso/utils/normalize';
import { FILE_STORAGE, IFileStorage } from '../storage/file-storage.interface';
import { CreateFolderDto } from './dto/create-folder.dto';
import { FolderDto, toFolderDto } from './dto/folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { FolderEntity } from './entities/folder.entity';
import { IFoldersService } from './interfaces/folders.interfaces';
import { FOLDER_REPOSITORY, FolderPatch, IFolderRepository } from './repositories/folder.repository.interface';

@Injectable()
export class FoldersService implements IFoldersService {
  private readonly logger = new Logger(FoldersService.name);

  constructor(
    @Inject(FOLDER_REPOSITORY) private readonly folders: IFolderRepository,
    @Inject(PDF_FILE_REPOSITORY) private readonly files: IPdfFileRepository,
    @Inject(FILE_STORAGE) private readonly storage: IFileStorage,
    @Inject(SSO_DIRECTORY) private readonly directory: ISsoDirectory,
  ) {}

  async create(dto: CreateFolderDto, user: AuthUser): Promise<FolderDto> {
    const parentId = dto.parentId ?? null;
    if (parentId) await this.requireFolder(parentId, 'La carpeta padre no existe');
    await this.assertNameAvailable(parentId, dto.name);
    const allowedSpecialties = await this.canonicalSpecialties(dto.allowedSpecialties ?? []);

    const created = await this.folders.create({
      name: dto.name,
      parentId,
      allowedSpecialties,
      createdBySub: user.sub,
    });
    return toFolderDto(created);
  }

  async findAll(): Promise<FolderDto[]> {
    const folders = await this.folders.findAll();
    return folders.sort((a, b) => a.name.localeCompare(b.name, 'es', { numeric: true })).map(toFolderDto);
  }

  async findOne(id: string): Promise<FolderDto> {
    return toFolderDto(await this.requireFolder(id));
  }

  async update(id: string, dto: UpdateFolderDto): Promise<FolderDto> {
    const folder = await this.requireFolder(id);
    const patch: FolderPatch = {};

    const targetParentId = dto.parentId === undefined ? folder.parentId : dto.parentId;
    const targetName = dto.name ?? folder.name;

    if (dto.parentId !== undefined && dto.parentId !== folder.parentId) {
      if (dto.parentId !== null) await this.assertValidParent(id, dto.parentId);
      patch.parentId = dto.parentId;
    }
    if (dto.name !== undefined) patch.name = dto.name;
    if (patch.parentId !== undefined || patch.name !== undefined) {
      await this.assertNameAvailable(targetParentId, targetName, id);
    }
    if (dto.allowedSpecialties !== undefined) {
      patch.allowedSpecialties = await this.canonicalSpecialties(dto.allowedSpecialties);
    }

    const updated = await this.folders.update(id, patch);
    if (!updated) throw new NotFoundException('La carpeta no existe');
    return toFolderDto(updated);
  }

  async remove(id: string): Promise<void> {
    await this.requireFolder(id);
    const all = await this.folders.findAll();
    const idsToDelete = [id, ...this.descendantIds(id, all)];

    // Primero los archivos físicos; los registros se van en cascada al borrar la carpeta.
    const files = await this.files.findByFolderIds(idsToDelete);
    for (const file of files) {
      try {
        await this.storage.delete(file.storedName);
      } catch (error) {
        this.logger.error(`No se pudo borrar el archivo ${file.storedName}: ${(error as Error).message}`);
      }
    }
    await this.folders.delete(id);
  }

  private async requireFolder(id: string, message = 'La carpeta no existe'): Promise<FolderEntity> {
    const folder = await this.folders.findById(id);
    if (!folder) throw new NotFoundException(message);
    return folder;
  }

  private async assertNameAvailable(parentId: string | null, name: string, ignoreId?: string): Promise<void> {
    const existing = await this.folders.findByParentAndName(parentId, name);
    if (existing && existing.id !== ignoreId) {
      throw new ConflictException(`Ya existe una carpeta llamada "${name}" en esa ubicación`);
    }
  }

  /** No se puede mover una carpeta dentro de sí misma ni de una de sus subcarpetas. */
  private async assertValidParent(folderId: string, newParentId: string): Promise<void> {
    const all = await this.folders.findAll();
    const byId = new Map(all.map((folder) => [folder.id, folder]));
    if (!byId.has(newParentId)) throw new NotFoundException('La carpeta destino no existe');

    let cursor: string | null = newParentId;
    while (cursor) {
      if (cursor === folderId) {
        throw new BadRequestException('No se puede mover una carpeta dentro de sí misma o de una subcarpeta');
      }
      cursor = byId.get(cursor)?.parentId ?? null;
    }
  }

  private descendantIds(rootId: string, all: FolderEntity[]): string[] {
    const result: string[] = [];
    const queue = [rootId];
    while (queue.length > 0) {
      const current = queue.shift() as string;
      for (const folder of all) {
        if (folder.parentId === current) {
          result.push(folder.id);
          queue.push(folder.id);
        }
      }
    }
    return result;
  }

  /** Valida contra las especialidades que informa el SSO (sin hardcodear) y guarda el valor canónico. */
  private async canonicalSpecialties(requested: string[]): Promise<string[]> {
    if (requested.length === 0) return [];

    let available: string[];
    try {
      available = await this.directory.getSpecialties();
    } catch (error) {
      if (error instanceof SsoError) {
        throw new ServiceUnavailableException('No se pudieron consultar las especialidades al SSO');
      }
      throw error;
    }

    const byKey = new Map(available.map((specialty) => [normalizeKey(specialty), specialty]));
    const canonical: string[] = [];
    const unknown: string[] = [];
    for (const value of requested) {
      const match = byKey.get(normalizeKey(value));
      if (match) {
        if (!canonical.includes(match)) canonical.push(match);
      } else {
        unknown.push(value);
      }
    }
    if (unknown.length > 0) {
      throw new BadRequestException(`Especialidades inexistentes en el SSO: ${unknown.join(', ')}`);
    }
    return canonical;
  }
}
