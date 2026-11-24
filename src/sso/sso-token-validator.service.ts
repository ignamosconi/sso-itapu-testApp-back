import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../config/configuration';
import { ISsoTokenValidator } from './interfaces/sso-token-validator.interface';
import { SsoProtocolError } from './sso.errors';
import { SsoTokenClaims } from './sso.types';
import { decodeJwtPayload } from './utils/jwt';

/**
 * Seguridad del mail: "Al recibir un access_token en tu backend verificá iss (la URL del SSO) y aud (tu client_id)".
 *
 * Nota: acá se validan iss/aud/exp. La FIRMA del token la verifica el propio SSO cuando llamamos a /sso/me
 * (Paso 4), que es la fuente de verdad. Si el SSO publicara una clave pública/JWKS, la verificación de
 * firma local se agregaría en este único punto.
 */
@Injectable()
export class SsoTokenValidatorService implements ISsoTokenValidator {
  private readonly cfg: AppConfig['sso'];

  constructor(config: ConfigService<AppConfig, true>) {
    this.cfg = config.get('sso', { infer: true });
  }

  validateAccessToken(token: string): SsoTokenClaims {
    let payload: Record<string, unknown>;
    try {
      payload = decodeJwtPayload(token);
    } catch (error) {
      throw new SsoProtocolError(`access_token ilegible: ${(error as Error).message}`);
    }

    if (payload.iss !== this.cfg.issuer) {
      throw new SsoProtocolError('El iss del token no coincide con el SSO configurado');
    }

    const audiences = (Array.isArray(payload.aud) ? payload.aud : [payload.aud]).map((aud) => String(aud));
    if (!audiences.includes(String(this.cfg.clientId))) {
      throw new SsoProtocolError('El aud del token no coincide con nuestro client_id');
    }

    if (typeof payload.exp !== 'number') {
      throw new SsoProtocolError('El token no tiene exp');
    }
    if (payload.exp * 1000 <= Date.now()) {
      throw new SsoProtocolError('El token ya venció');
    }
    return { exp: payload.exp };
  }

  isExpiringSoon(token: string, skewSeconds: number): boolean {
    try {
      const { exp } = decodeJwtPayload(token);
      if (typeof exp !== 'number') return true;
      return exp * 1000 - Date.now() <= skewSeconds * 1000;
    } catch {
      return true;
    }
  }
}
