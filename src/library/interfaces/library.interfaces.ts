import { AuthUser } from '../../auth/auth.types';
import { BrowseQueryDto } from '../dto/browse-query.dto';
import { LibraryBrowseDto } from '../dto/library-browse.dto';

export const LIBRARY_SERVICE = Symbol('LIBRARY_SERVICE');

export interface ILibraryService {
  browse(user: AuthUser, query: BrowseQueryDto): Promise<LibraryBrowseDto>;
}

export interface ILibraryController {
  browse(user: AuthUser, query: BrowseQueryDto): Promise<LibraryBrowseDto>;
}
