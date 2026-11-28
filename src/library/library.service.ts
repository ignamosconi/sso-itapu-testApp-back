import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AuthUser } from '../auth/auth.types';
import { toPdfFileDto } from '../files/dto/pdf-file.dto';
import { IPdfFileRepository, PDF_FILE_REPOSITORY } from '../files/repositories/pdf-file.repository.interface';
import { Audience } from '../folders/audience';
import { FolderDto, toFolderDto } from '../folders/dto/folder.dto';
import { FolderEntity } from '../folders/entities/folder.entity';
import { FOLDER_ACCESS, IFolderAccessService } from '../folders/interfaces/folders.interfaces';
import { BrowseQueryDto } from './dto/browse-query.dto';
import { LibraryBrowseDto } from './dto/library-browse.dto';
import { ILibraryService } from './interfaces/library.interfaces';

const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, 'es', { numeric: true });
const byTitle = (a: { title: string }, b: { title: string }) => a.title.localeCompare(b.title, 'es', { numeric: true });

/** Vista de navegación: la usan tanto el admin (gestión) como el alumno (solo lectura). */
@Injectable()
export class LibraryService implements ILibraryService {
  constructor(
    @Inject(FOLDER_ACCESS) private readonly access: IFolderAccessService,
    @Inject(PDF_FILE_REPOSITORY) private readonly files: IPdfFileRepository,
  ) {}

  async browse(user: AuthUser, query: BrowseQueryDto): Promise<LibraryBrowseDto> {
    const audience = this.audienceFor(user, query);
    const visible = await this.access.getVisibleFolders(audience);
    const folderId = query.folderId ?? null;

    // Si no es visible para esta audiencia, para ella "no existe".
    const current = folderId ? visible.get(folderId) : undefined;
    if (folderId && !current) throw new NotFoundException('La carpeta no existe');

    const folders = [...visible.values()].filter((folder) => folder.parentId === folderId).sort(byName);
    const files = (await this.files.findByFolder(folderId)).sort(byTitle);

    return {
      viewMode: audience.kind,
      currentFolder: current ? toFolderDto(current) : null,
      breadcrumbs: this.breadcrumbs(current, visible),
      folders: folders.map(toFolderDto),
      files: files.map(toPdfFileDto),
    };
  }

  private audienceFor(user: AuthUser, query: BrowseQueryDto): Audience {
    if (!user.isStaff) return { kind: 'student', especialidades: user.especialidades };
    if (!query.asStudent) return { kind: 'staff' };
    return { kind: 'student', especialidades: query.previewSpecialty ? [query.previewSpecialty] : [] };
  }

  private breadcrumbs(current: FolderEntity | undefined, visible: Map<string, FolderEntity>): FolderDto[] {
    const trail: FolderDto[] = [];
    let cursor: FolderEntity | undefined = current;
    while (cursor) {
      trail.unshift(toFolderDto(cursor));
      cursor = cursor.parentId ? visible.get(cursor.parentId) : undefined;
    }
    return trail;
  }
}
