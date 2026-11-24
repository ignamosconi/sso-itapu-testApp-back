import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, ValidateIf } from 'class-validator';

export class UpdatePdfFileDto {
  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    nullable: true,
    type: String,
    description: 'Mover a otra carpeta. null = mover a la raíz. Omitir = no mover.',
  })
  @ValidateIf((dto: UpdatePdfFileDto) => dto.folderId !== undefined && dto.folderId !== null)
  @IsUUID()
  folderId?: string | null;
}
