import { ApiProperty } from '@nestjs/swagger';
import { FolderEntity } from '../entities/folder.entity';

export class FolderDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ format: 'uuid', nullable: true, type: String, description: 'null = carpeta raíz' })
  parentId: string | null;

  @ApiProperty({
    type: [String],
    description: 'Especialidades del SSO que pueden verla. Vacío = todos los alumnos.',
  })
  allowedSpecialties: string[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export const toFolderDto = (folder: FolderEntity): FolderDto => ({
  id: folder.id,
  name: folder.name,
  parentId: folder.parentId,
  allowedSpecialties: folder.allowedSpecialties ?? [],
  createdAt: folder.createdAt,
  updatedAt: folder.updatedAt,
});
