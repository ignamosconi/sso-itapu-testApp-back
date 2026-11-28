import { Inject, Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../config/configuration';
import { ISsoDirectory } from '../sso/interfaces/sso-directory.interface';
import { SSO_DIRECTORY } from '../sso/sso.constants';
import { normalizeKey } from '../sso/utils/normalize';
import { IAccessPolicy } from './interfaces/auth.interfaces';

/**
 * Decide quién es "staff" (ve el panel de administración).
 * La lista sale del .env (STAFF_CARGOS) y al arrancar se contrasta con lo que dice el SSO,
 * para detectar al toque un cargo mal escrito o renombrado por el administrador.
 */
@Injectable()
export class AccessPolicyService implements IAccessPolicy, OnApplicationBootstrap {
  private readonly logger = new Logger(AccessPolicyService.name);
  private readonly staffCargos: string[];
  private readonly staffKeys: Set<string>;

  constructor(
    config: ConfigService<AppConfig, true>,
    @Inject(SSO_DIRECTORY) private readonly directory: ISsoDirectory,
  ) {
    this.staffCargos = config.get('policy', { infer: true }).staffCargos;
    this.staffKeys = new Set(this.staffCargos.map(normalizeKey));
  }

  /** Es staff si ALGUNO de sus cargos está en STAFF_CARGOS (por ejemplo, Profesor y Preceptor a la vez). */
  isStaff(cargos: readonly string[]): boolean {
    return cargos.some((cargo) => this.staffKeys.has(normalizeKey(cargo)));
  }

  getStaffCargos(): string[] {
    return [...this.staffCargos];
  }

  async onApplicationBootstrap(): Promise<void> {
    try {
      const available = await this.directory.getDomainRoles();
      const availableKeys = new Set(available.map(normalizeKey));
      const unknown = this.staffCargos.filter((cargo) => !availableKeys.has(normalizeKey(cargo)));
      if (unknown.length > 0) {
        this.logger.warn(
          `STAFF_CARGOS contiene valores que el SSO no lista: ${unknown.join(', ')}. ` +
            `Cargos disponibles en el SSO: ${available.join(', ') || '(ninguno)'}`,
        );
      } else {
        this.logger.log(`Cargos con acceso al panel de administración: ${this.staffCargos.join(', ')}`);
      }
    } catch {
      this.logger.warn('No se pudo verificar STAFF_CARGOS contra el SSO al arrancar (¿está levantado?).');
    }
  }
}
