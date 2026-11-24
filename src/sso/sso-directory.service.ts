import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../config/configuration';
import { ISsoDirectory } from './interfaces/sso-directory.interface';
import { SSO_ENDPOINTS } from './sso.constants';
import { ssoFetchJson } from './sso-http';
import { extractList } from './utils/normalize';

type DirectoryKind = 'domainRoles' | 'specialties';

/**
 * Referencia pública del SSO: "No hardcodees estos valores en tu app: consultá la API".
 * Es el ÚNICO lugar que conoce los cargos y especialidades. Se cachean unos minutos y, si el SSO
 * no responde, se sirve el último valor conocido para no romper la app.
 */
@Injectable()
export class SsoDirectoryService implements ISsoDirectory {
  private readonly logger = new Logger(SsoDirectoryService.name);
  private readonly cfg: AppConfig['sso'];
  private readonly ttlMs: number;
  private readonly cache = new Map<DirectoryKind, { values: string[]; fetchedAt: number }>();

  constructor(config: ConfigService<AppConfig, true>) {
    this.cfg = config.get('sso', { infer: true });
    this.ttlMs = config.get('policy', { infer: true }).directoryCacheTtlSeconds * 1000;
  }

  getDomainRoles(): Promise<string[]> {
    return this.load('domainRoles');
  }

  getSpecialties(): Promise<string[]> {
    return this.load('specialties');
  }

  private async load(kind: DirectoryKind): Promise<string[]> {
    const cached = this.cache.get(kind);
    if (cached && Date.now() - cached.fetchedAt < this.ttlMs) {
      return cached.values;
    }

    try {
      const raw = await ssoFetchJson<unknown>(`${this.cfg.baseUrl}${SSO_ENDPOINTS[kind]}`, {
        method: 'GET',
        timeoutMs: this.cfg.httpTimeoutMs,
      });
      const values = extractList(raw);
      this.cache.set(kind, { values, fetchedAt: Date.now() });
      return values;
    } catch (error) {
      if (cached) {
        this.logger.warn(`No se pudo refrescar "${kind}" desde el SSO; se usa el último valor conocido.`);
        return cached.values;
      }
      throw error;
    }
  }
}
