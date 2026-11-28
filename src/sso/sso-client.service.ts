import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../config/configuration';
import { ISsoClient } from './interfaces/sso-client.interface';
import { SSO_ENDPOINTS } from './sso.constants';
import { SsoProtocolError } from './sso.errors';
import { ssoFetchJson } from './sso-http';
import { SsoTokens, SsoUser } from './sso.types';
import { extractLabel, extractList } from './utils/normalize';

/**
 * Cliente del SSO. Cada método corresponde a un paso del mail "Credenciales de integración".
 * Ver src/sso/README.md para el mapa completo.
 */
@Injectable()
export class SsoClientService implements ISsoClient {
  private readonly cfg: AppConfig['sso'];

  constructor(config: ConfigService<AppConfig, true>) {
    this.cfg = config.get('sso', { infer: true });
  }

  getOrigin(): string {
    return new URL(this.cfg.baseUrl).origin;
  }

  /** Paso 1 — "Abrir popup de login": GET /sso/login?client_id=..&redirect_uri=..&state=..&theme=.. */
  buildLoginUrl(state: string): string {
    const url = new URL(`${this.cfg.baseUrl}${SSO_ENDPOINTS.login}`);
    url.searchParams.set('client_id', this.cfg.clientId);
    url.searchParams.set('redirect_uri', this.cfg.redirectUri);
    url.searchParams.set('state', state);
    url.searchParams.set('theme', this.cfg.theme);
    return url.toString();
  }

  /**
   * Paso 3 — "Canjear code por tokens": POST /sso/token con client_id, client_secret, code y la MISMA
   * redirect_uri que se usó en el login. El code es de un solo uso y expira en 2 minutos.
   */
  async exchangeCode(code: string): Promise<SsoTokens> {
    const raw = await ssoFetchJson<Record<string, unknown>>(`${this.cfg.baseUrl}${SSO_ENDPOINTS.token}`, {
      method: 'POST',
      timeoutMs: this.cfg.httpTimeoutMs,
      body: {
        client_id: this.cfg.clientId,
        client_secret: this.cfg.clientSecret,
        code,
        redirect_uri: this.cfg.redirectUri,
      },
    });
    return this.toTokens(raw);
  }

  /**
   * Paso 4 — "Identificar al usuario": GET /sso/me con Authorization: Bearer ACCESS_TOKEN.
   * `sub` es el ID único. `aud` tiene que ser nuestro client_id.
   */
  async getUserInfo(accessToken: string): Promise<SsoUser> {
    const raw = await ssoFetchJson<Record<string, unknown>>(`${this.cfg.baseUrl}${SSO_ENDPOINTS.me}`, {
      method: 'GET',
      timeoutMs: this.cfg.httpTimeoutMs,
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const audiences = (Array.isArray(raw?.aud) ? raw.aud : [raw?.aud]).map((aud) => String(aud));
    if (!audiences.includes(String(this.cfg.clientId))) {
      throw new SsoProtocolError('El campo aud de /sso/me no coincide con nuestro client_id');
    }
    if (typeof raw.sub !== 'string' && typeof raw.sub !== 'number') {
      throw new SsoProtocolError('/sso/me no devolvió sub');
    }

    const sub = String(raw.sub);
    return {
      sub,
      displayName: this.pickDisplayName(raw) ?? sub,
      email: extractLabel(raw.email),
      // Desde SSO v2.0.0 son listas: una persona puede ser, por ejemplo, Profesor y Preceptor.
      cargos: extractList(raw.cargos),
      especialidades: extractList(raw.especialidades),
    };
  }

  /**
   * Paso 5 — "Renovar tokens": POST /sso/refresh con client_id, client_secret y refresh_token.
   * Hay que reemplazar AMBOS tokens con la respuesta (el refresh anterior queda inválido).
   */
  async refresh(refreshToken: string): Promise<SsoTokens> {
    const raw = await ssoFetchJson<Record<string, unknown>>(`${this.cfg.baseUrl}${SSO_ENDPOINTS.refresh}`, {
      method: 'POST',
      timeoutMs: this.cfg.httpTimeoutMs,
      body: {
        client_id: this.cfg.clientId,
        client_secret: this.cfg.clientSecret,
        refresh_token: refreshToken,
      },
    });
    return this.toTokens(raw);
  }

  /** Paso 6 — "Cerrar sesión": POST /sso/logout con client_id, client_secret y refresh_token. */
  async logout(refreshToken: string): Promise<void> {
    await ssoFetchJson<unknown>(`${this.cfg.baseUrl}${SSO_ENDPOINTS.logout}`, {
      method: 'POST',
      timeoutMs: this.cfg.httpTimeoutMs,
      body: {
        client_id: this.cfg.clientId,
        client_secret: this.cfg.clientSecret,
        refresh_token: refreshToken,
      },
    });
  }

  private toTokens(raw: Record<string, unknown> | undefined): SsoTokens {
    const accessToken = raw?.access_token ?? raw?.accessToken;
    const refreshToken = raw?.refresh_token ?? raw?.refreshToken;
    if (typeof accessToken !== 'string' || typeof refreshToken !== 'string') {
      throw new SsoProtocolError('La respuesta del SSO no incluye access_token y refresh_token');
    }
    return { accessToken, refreshToken };
  }

  private pickDisplayName(raw: Record<string, unknown>): string | null {
    const full = extractLabel(raw.name) ?? extractLabel(raw.nombre_completo) ?? extractLabel(raw.full_name);
    if (full) return full;
    const first = extractLabel(raw.nombre) ?? extractLabel(raw.first_name) ?? extractLabel(raw.given_name);
    const last = extractLabel(raw.apellido) ?? extractLabel(raw.last_name) ?? extractLabel(raw.family_name);
    const joined = [first, last].filter(Boolean).join(' ');
    return joined || extractLabel(raw.email);
  }
}
