import { SsoTokenClaims } from '../sso.types';

export interface ISsoTokenValidator {
  /** Paso 3 / seguridad: verifica iss, aud y exp de un access_token. Lanza SsoProtocolError si algo no cierra. */
  validateAccessToken(token: string): SsoTokenClaims;
  /** true si el token vence en menos de `skewSeconds` (o ya venció o no se puede leer). */
  isExpiringSoon(token: string, skewSeconds: number): boolean;
}
