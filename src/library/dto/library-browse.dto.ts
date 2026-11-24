import { ApiProperty } from '@nestjs/swagger';
import { FolderDto } from '../../folders/dto/folder.dto';
import { PdfFileDto } from '../../files/dto/pdf-file.dto';

export class LibraryBrowseDto {
  @ApiProperty({ enum: ['staff', 'student'], description: 'Con qué reglas se armó la respuesta' })
  viewMode: 'staff' | 'student';

  @ApiProperty({ type: FolderDto, nullable: true, description: 'Carpeta actual (null = raíz)' })
  currentFolder: FolderDto | null;

  @ApiProperty({ type: [FolderDto], description: 'Camino desde la raíz hasta la carpeta actual (incluida)' })
  breadcrumbs: FolderDto[];

  @ApiProperty({ type: [FolderDto], description: 'Subcarpetas visibles' })
  folders: FolderDto[];

  @ApiProperty({ type: [PdfFileDto], description: 'PDFs de la carpeta actual' })
  files: PdfFileDto[];
}
