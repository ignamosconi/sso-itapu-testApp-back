import { Controller, Get, Inject, ServiceUnavailableException, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiForbiddenResponse, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { IAccessPolicy, ACCESS_POLICY } from '../auth/interfaces/auth.interfaces';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { StaffGuard } from '../auth/guards/staff.guard';
import { ISsoDirectory } from '../sso/interfaces/sso-directory.interface';
import { SSO_DIRECTORY } from '../sso/sso.constants';
import { SsoError } from '../sso/sso.errors';
import { DirectoryDto } from './dto/directory.dto';

/** Expone al front lo que el SSO dice sobre cargos y especialidades, para que el front tampoco los hardcodee. */
@ApiTags('directory')
@ApiCookieAuth()
@ApiUnauthorizedResponse({ description: 'Sin sesión' })
@ApiForbiddenResponse({ description: 'Solo personal' })
@UseGuards(SessionAuthGuard, StaffGuard)
@Controller('directory')
export class DirectoryController {
  constructor(
    @Inject(SSO_DIRECTORY) private readonly directory: ISsoDirectory,
    @Inject(ACCESS_POLICY) private readonly policy: IAccessPolicy,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Cargos y especialidades vigentes en el SSO' })
  @ApiOkResponse({ type: DirectoryDto })
  async get(): Promise<DirectoryDto> {
    try {
      const [domainRoles, specialties] = await Promise.all([
        this.directory.getDomainRoles(),
        this.directory.getSpecialties(),
      ]);
      return { domainRoles, specialties, staffCargos: this.policy.getStaffCargos() };
    } catch (error) {
      if (error instanceof SsoError) throw new ServiceUnavailableException('No se pudo consultar el SSO');
      throw error;
    }
  }
}
