import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/** Campos de texto del multipart (el archivo viaja en el campo `file`). */
export class UploadPdfDto {
  @ApiPropertyOptional({ maxLength: 200, description: 'Título visible. Si se omite se usa el nombre del archivo.' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? undefined : typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Carpeta destino. Si se omite, queda en la raíz.' })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsUUID()
  folderId?: string;
}
