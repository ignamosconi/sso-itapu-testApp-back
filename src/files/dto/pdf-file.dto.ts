import { ApiProperty } from '@nestjs/swagger';
import { PdfFileEntity } from '../entities/pdf-file.entity';

export class PdfFileDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Título visible' })
  title: string;

  @ApiProperty({ description: 'Nombre del archivo original al subirlo' })
  originalName: string;

  @ApiProperty()
  sizeBytes: number;

  @ApiProperty({ format: 'uuid', nullable: true, type: String, description: 'null = en la raíz' })
  folderId: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export const toPdfFileDto = (file: PdfFileEntity): PdfFileDto => ({
  id: file.id,
  title: file.title,
  originalName: file.originalName,
  sizeBytes: file.sizeBytes,
  folderId: file.folderId,
  createdAt: file.createdAt,
  updatedAt: file.updatedAt,
});
