import { ApiProperty } from '@nestjs/swagger';

export class DirectoryDto {
  @ApiProperty({ type: [String], description: 'Cargos posibles según el SSO (GET /sso/info/domain-roles)' })
  domainRoles: string[];

  @ApiProperty({ type: [String], description: 'Especialidades posibles según el SSO (GET /sso/info/specialties)' })
  specialties: string[];

  @ApiProperty({ type: [String], description: 'Cargos que ven el panel de administración (STAFF_CARGOS)' })
  staffCargos: string[];
}
