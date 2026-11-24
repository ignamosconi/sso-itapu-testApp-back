import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SsoCallbackDto {
  @ApiProperty({ description: 'Authorization code recibido por postMessage (un solo uso, expira en 2 min)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2048)
  code: string;

  @ApiProperty({ description: 'State recibido por postMessage' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  state: string;
}
