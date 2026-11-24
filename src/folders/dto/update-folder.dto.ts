import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, ValidateIf } from 'class-validator';

export class UpdateFolderDto {
  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    nullable: true,
    type: String,
    description: 'Mover a otra carpeta. null = mover a la raíz. Omitir = no mover.',
  })
  @ValidateIf((dto: UpdateFolderDto) => dto.parentId !== undefined && dto.parentId !== null)
  @IsUUID()
  parentId?: string | null;

  @ApiPropertyOptional({ type: [String], description: 'Reemplaza la lista completa. [] = visible para todos.' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  allowedSpecialties?: string[];
}
