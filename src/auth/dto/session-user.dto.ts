import { ApiProperty } from '@nestjs/swagger';
import { AuthUser } from '../auth.types';

export class SessionUserDto {
  @ApiProperty({ description: 'ID único del SSO (sub)' })
  sub: string;

  @ApiProperty()
  displayName: string;

  @ApiProperty({ nullable: true, type: String })
  email: string | null;

  @ApiProperty({ nullable: true, type: String, description: 'Cargo según el SSO' })
  cargo: string | null;

  @ApiProperty({ nullable: true, type: String, description: 'Especialidad según el SSO' })
  especialidad: string | null;

  @ApiProperty({ description: 'true si ve el panel de administración (cargo en STAFF_CARGOS)' })
  isStaff: boolean;
}

export const toSessionUserDto = (user: AuthUser): SessionUserDto => ({
  sub: user.sub,
  displayName: user.displayName,
  email: user.email,
  cargo: user.cargo,
  especialidad: user.especialidad,
  isStaff: user.isStaff,
});
