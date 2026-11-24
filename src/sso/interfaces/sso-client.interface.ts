import { SsoTokens, SsoUser } from '../sso.types';

export interface ISsoClient {
  /** Origen del SSO (ej. http://localhost:3000). El front lo usa para verificar event.origin. */
  getOrigin(): string;
  /** Paso 1: URL del popup de login. */
  buildLoginUrl(state: string): string;
  /** Paso 3: canjea el code por tokens (solo desde el backend). */
  exchangeCode(code: string): Promise<SsoTokens>;
  /** Paso 4: identifica al usuario y verifica que aud sea nuestro client_id. */
  getUserInfo(accessToken: string): Promise<SsoUser>;
  /** Paso 5: renueva tokens (el refresh anterior queda inválido). */
  refresh(refreshToken: string): Promise<SsoTokens>;
  /** Paso 6: revoca la sesión en el SSO. */
  logout(refreshToken: string): Promise<void>;
}
