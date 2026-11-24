import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Inject, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/auth.types';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { StaffGuard } from '../auth/guards/staff.guard';
import { CreateFolderDto } from './dto/create-folder.dto';
import { FolderDto } from './dto/folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { FOLDERS_SERVICE, IFoldersController, IFoldersService } from './interfaces/folders.interfaces';

@ApiTags('folders (admin)')
@ApiCookieAuth()
@ApiUnauthorizedResponse({ description: 'Sin sesión' })
@ApiForbiddenResponse({ description: 'El cargo del usuario no es de personal' })
@UseGuards(SessionAuthGuard, StaffGuard)
@Controller('folders')
export class FoldersController implements IFoldersController {
  constructor(@Inject(FOLDERS_SERVICE) private readonly service: IFoldersService) {}

  @Post()
  @ApiOperation({ summary: 'Crear carpeta' })
  @ApiCreatedResponse({ type: FolderDto })
  @ApiConflictResponse({ description: 'Ya existe una carpeta con ese nombre en esa ubicación' })
  create(@Body() dto: CreateFolderDto, @CurrentUser() user: AuthUser): Promise<FolderDto> {
    return this.service.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas las carpetas (plano; el front arma el árbol con parentId)' })
  @ApiOkResponse({ type: [FolderDto] })
  findAll(): Promise<FolderDto[]> {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una carpeta' })
  @ApiOkResponse({ type: FolderDto })
  @ApiNotFoundResponse()
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<FolderDto> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Renombrar, mover o cambiar la visibilidad por especialidad' })
  @ApiOkResponse({ type: FolderDto })
  @ApiNotFoundResponse()
  @ApiConflictResponse()
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateFolderDto): Promise<FolderDto> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar carpeta con todo su contenido (subcarpetas y PDFs)' })
  @ApiNoContentResponse()
  @ApiNotFoundResponse()
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.service.remove(id);
  }
}
