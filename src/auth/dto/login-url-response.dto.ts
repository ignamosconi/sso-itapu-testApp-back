import { ApiProperty } from '@nestjs/swagger';

export class LoginUrlResponseDto {
  @ApiProperty({ description: 'URL del popup de login del SSO (Paso 1 del mail)' })
  url: string;

  @ApiProperty({ description: 'State aleatorio. El front lo compara con el que llega por postMessage (Paso 2)' })
  state: string;

  @ApiProperty({
    description: 'Origen del SSO. El front lo usa para verificar event.origin (Paso 2)',
    example: 'http://localhost:3000',
  })
  ssoOrigin: string;
}
