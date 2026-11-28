import { Controller, Get, Inject, Query, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { BrowseQueryDto } from './dto/browse-query.dto';
import { LibraryBrowseDto } from './dto/library-browse.dto';
import { ILibraryController, ILibraryService, LIBRARY_SERVICE } from './interfaces/library.interfaces';

@ApiTags('library')
@ApiCookieAuth()
@ApiUnauthorizedResponse({ description: 'Sin sesión' })
@UseGuards(SessionAuthGuard)
@Controller('library')
export class LibraryController implements ILibraryController {
  constructor(@Inject(LIBRARY_SERVICE) private readonly service: ILibraryService) {}

  @Get('browse')
  @ApiOperation({
    summary: 'Navegar carpetas y PDFs',
    description:
      'Alumno: solo ve carpetas habilitadas para alguna de sus especialidades. Personal: ve todo, o lo que vería un alumno con ' +
      '`asStudent=true` (y `previewSpecialty` para elegir la especialidad a previsualizar).',
  })
  @ApiOkResponse({ type: LibraryBrowseDto })
  @ApiNotFoundResponse({ description: 'La carpeta no existe o no es visible para este usuario' })
  browse(@CurrentUser() user: AuthUser, @Query() query: BrowseQueryDto): Promise<LibraryBrowseDto> {
    return this.service.browse(user, query);
  }
}
