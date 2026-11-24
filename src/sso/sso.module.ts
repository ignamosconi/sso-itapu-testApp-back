import { Module } from '@nestjs/common';
import { SSO_CLIENT, SSO_DIRECTORY, SSO_TOKEN_VALIDATOR } from './sso.constants';
import { SsoClientService } from './sso-client.service';
import { SsoDirectoryService } from './sso-directory.service';
import { SsoTokenValidatorService } from './sso-token-validator.service';

/** Todo el acoplamiento con el SSO vive en este módulo. Ver README.md. */
@Module({
  providers: [
    { provide: SSO_CLIENT, useClass: SsoClientService },
    { provide: SSO_DIRECTORY, useClass: SsoDirectoryService },
    { provide: SSO_TOKEN_VALIDATOR, useClass: SsoTokenValidatorService },
  ],
  exports: [SSO_CLIENT, SSO_DIRECTORY, SSO_TOKEN_VALIDATOR],
})
export class SsoModule {}
