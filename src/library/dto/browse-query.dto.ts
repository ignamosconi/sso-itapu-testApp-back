import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class BrowseQueryDto {
  @ApiPropertyOptional({ format: 'uuid', description: 'Carpeta a listar. Si se omite, la raíz.' })
  @IsOptional()
  @IsUUID()
  folderId?: string;

  @ApiPropertyOptional({
    description: 'Solo personal: ver exactamente lo que vería un alumno (vista de alumno). Los alumnos siempre la ven.',
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  asStudent?: boolean;

  @ApiPropertyOptional({
    description: 'Solo personal en vista de alumno: especialidad (del SSO) con la que se previsualiza.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  previewSpecialty?: string;
}
