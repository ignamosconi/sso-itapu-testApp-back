/** Tokens ya normalizados (el SSO los devuelve en snake_case). */
export interface SsoTokens {
  accessToken: string;
  refreshToken: string;
}

/** Datos del usuario según GET /sso/me (Paso 4). `sub` es el ID único e inmutable. */
export interface SsoUser {
  sub: string;
  displayName: string;
  email: string | null;
  /** Cargos del usuario (lista; el SSO garantiza al menos uno). */
  cargos: string[];
  /** Especialidades del usuario (lista; el SSO garantiza al menos una). */
  especialidades: string[];
}

export interface SsoTokenClaims {
  /** exp del JWT, en segundos epoch */
  exp: number;
}
