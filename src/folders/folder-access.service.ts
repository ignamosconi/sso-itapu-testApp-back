import { Inject, Injectable } from '@nestjs/common';
import { normalizeKey } from '../sso/utils/normalize';
import { Audience } from './audience';
import { FolderEntity } from './entities/folder.entity';
import { IFolderAccessService } from './interfaces/folders.interfaces';
import { FOLDER_REPOSITORY, IFolderRepository } from './repositories/folder.repository.interface';

/**
 * Regla de visibilidad: un alumno ve una carpeta si ella y TODOS sus ancestros están habilitados para
 * ALGUNA de sus especialidades (lista vacía = habilitada para todos). El personal ve todo.
 */
@Injectable()
export class FolderAccessService implements IFolderAccessService {
  constructor(@Inject(FOLDER_REPOSITORY) private readonly folders: IFolderRepository) {}

  async getVisibleFolders(audience: Audience): Promise<Map<string, FolderEntity>> {
    const all = await this.folders.findAll();
    const byId = new Map(all.map((folder) => [folder.id, folder]));
    if (audience.kind === 'staff') return byId;

    const studentKeys = new Set(audience.especialidades.map(normalizeKey));
    const memo = new Map<string, boolean>();

    const isVisible = (folder: FolderEntity): boolean => {
      const cached = memo.get(folder.id);
      if (cached !== undefined) return cached;

      const allowed = folder.allowedSpecialties ?? [];
      const selfOk = allowed.length === 0 || allowed.some((s) => studentKeys.has(normalizeKey(s)));
      const parent = folder.parentId ? byId.get(folder.parentId) : undefined;
      const visible = selfOk && (folder.parentId === null || (parent !== undefined && isVisible(parent)));

      memo.set(folder.id, visible);
      return visible;
    };

    return new Map([...byId].filter(([, folder]) => isVisible(folder)));
  }

  async canView(folderId: string | null, audience: Audience): Promise<boolean> {
    if (folderId === null || audience.kind === 'staff') return true;
    return (await this.getVisibleFolders(audience)).has(folderId);
  }
}
