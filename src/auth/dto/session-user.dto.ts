import { ApiProperty } from '@nestjs/swagger';
import { AuthUser } from '../auth.types';

export class SessionUserDto {
  @ApiProperty({ description: 'ID único del SSO (sub)' })
  sub: string;

  @ApiProperty()
  displayName: string;

  @ApiProperty({ nullable: true, type: String })
  email: string | null;

  @ApiProperty({ type: [String], example: ['Preceptor', 'Profesor'], description: 'Cargos según el SSO (al menos uno)' })
  cargos: string[];

  @ApiProperty({ type: [String], example: ['Sistemas'], description: 'Especialidades según el SSO (al menos una)' })
  especialidades: string[];

  @ApiProperty({ description: 'true si ve el panel de administración (ALGUNO de sus cargos está en STAFF_CARGOS)' })
  isStaff: boolean;
}

export const toSessionUserDto = (user: AuthUser): SessionUserDto => ({
  sub: user.sub,
  displayName: user.displayName,
  email: user.email,
  cargos: user.cargos,
  especialidades: user.especialidades,
  isStaff: user.isStaff,
});
