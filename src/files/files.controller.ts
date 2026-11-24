import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Response } from 'express';
import { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { StaffGuard } from '../auth/guards/staff.guard';
import { PdfFileDto } from './dto/pdf-file.dto';
import { UpdatePdfFileDto } from './dto/update-pdf-file.dto';
import { UploadPdfDto } from './dto/upload-pdf.dto';
import { FILES_SERVICE, IFilesController, IFilesService, UploadedPdf } from './interfaces/files.interfaces';

@ApiTags('files')
@ApiCookieAuth()
@ApiUnauthorizedResponse({ description: 'Sin sesión' })
@UseGuards(SessionAuthGuard)
@Controller('files')
export class FilesController implements IFilesController {
  constructor(@Inject(FILES_SERVICE) private readonly service: IFilesService) {}

  @Post()
  @UseGuards(StaffGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Subir un PDF (admin)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
        title: { type: 'string', maxLength: 200 },
        folderId: { type: 'string', format: 'uuid' },
      },
    },
  })
  @ApiCreatedResponse({ type: PdfFileDto })
  @ApiForbiddenResponse({ description: 'Solo personal' })
  upload(
    @UploadedFile() file: UploadedPdf | undefined,
    @Body() dto: UploadPdfDto,
    @CurrentUser() user: AuthUser,
  ): Promise<PdfFileDto> {
    return this.service.upload(file, dto, user);
  }

  @Get(':id')
  @UseGuards(StaffGuard)
  @ApiOperation({ summary: 'Metadatos de un PDF (admin)' })
  @ApiOkResponse({ type: PdfFileDto })
  @ApiNotFoundResponse()
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<PdfFileDto> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @UseGuards(StaffGuard)
  @ApiOperation({ summary: 'Renombrar o mover un PDF (admin)' })
  @ApiOkResponse({ type: PdfFileDto })
  @ApiNotFoundResponse()
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePdfFileDto): Promise<PdfFileDto> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(StaffGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un PDF (admin)' })
  @ApiNoContentResponse()
  @ApiNotFoundResponse()
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.service.remove(id);
  }

  @Get(':id/content')
  @ApiOperation({
    summary: 'Descargar/ver el PDF',
    description: 'Personal: cualquier PDF. Alumno: solo si la carpeta es visible para su especialidad.',
  })
  @ApiProduces('application/pdf')
  @ApiOkResponse({ description: 'Contenido del PDF' })
  @ApiNotFoundResponse()
  async content(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const pdf = await this.service.getContent(id, user);
    const asciiName = pdf.originalName.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_');
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Length': String(pdf.sizeBytes),
      'Content-Disposition': `inline; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(pdf.originalName)}`,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, no-store',
    });
    return new StreamableFile(pdf.stream);
  }
}
