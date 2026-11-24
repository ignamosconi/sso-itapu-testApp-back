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
  cargo: string | null;
  especialidad: string | null;
}

export interface SsoTokenClaims {
  /** exp del JWT, en segundos epoch */
  exp: number;
}
