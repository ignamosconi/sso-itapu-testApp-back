/**
 * Configuración tipada. TODO lo que cambia entre entornos (o cuando el administrador del SSO
 * rota credenciales) sale de variables de entorno: se modifica en el .env y repercute en todo el sistema.
 */
export interface AppConfig {
  nodeEnv: string;
  port: number;
  appPublicUrl: string;
  frontendOrigin: string;
  database: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
    synchronize: boolean;
  };
  sso: {
    baseUrl: string;
    issuer: string;
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    theme: string;
    httpTimeoutMs: number;
  };
  policy: {
    staffCargos: string[];
    directoryCacheTtlSeconds: number;
  };
  session: {
    cookieName: string;
    maxAgeHours: number;
    cookieSecure: boolean;
  };
  storage: {
    dir: string;
    maxPdfSizeMb: number;
  };
}

const stripTrailingSlash = (url: string): string => url.replace(/\/+$/, '');
const toList = (value?: string): string[] =>
  (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
const toInt = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const configuration = (): AppConfig => {
  const env = process.env;
  const ssoBaseUrl = stripTrailingSlash(env.SSO_BASE_URL ?? '');

  return {
    nodeEnv: env.NODE_ENV ?? 'development',
    port: toInt(env.PORT, 3001),
    appPublicUrl: stripTrailingSlash(env.APP_PUBLIC_URL ?? `http://localhost:${toInt(env.PORT, 3001)}`),
    frontendOrigin: stripTrailingSlash(env.FRONTEND_ORIGIN ?? ''),
    database: {
      host: env.DB_HOST ?? 'localhost',
      port: toInt(env.DB_PORT, 5432),
      name: env.DB_NAME ?? '',
      user: env.DB_USER ?? '',
      password: env.DB_PASSWORD ?? '',
      synchronize: (env.DB_SYNCHRONIZE ?? 'false') === 'true',
    },
    sso: {
      baseUrl: ssoBaseUrl,
      issuer: stripTrailingSlash(env.SSO_ISSUER ?? ssoBaseUrl),
      clientId: (env.SSO_CLIENT_ID ?? '').trim(),
      clientSecret: (env.SSO_CLIENT_SECRET ?? '').trim(),
      // NO se normaliza: debe coincidir exactamente con la registrada en el SSO.
      redirectUri: (env.SSO_REDIRECT_URI ?? '').trim(),
      theme: env.SSO_THEME ?? 'dark',
      httpTimeoutMs: toInt(env.SSO_HTTP_TIMEOUT_MS, 8000),
    },
    policy: {
      staffCargos: toList(env.STAFF_CARGOS),
      directoryCacheTtlSeconds: toInt(env.DIRECTORY_CACHE_TTL_SECONDS, 300),
    },
    session: {
      cookieName: env.SESSION_COOKIE_NAME ?? 'itapu_exams_sid',
      maxAgeHours: toInt(env.SESSION_MAX_AGE_HOURS, 72),
      cookieSecure: (env.COOKIE_SECURE ?? 'false') === 'true',
    },
    storage: {
      dir: env.STORAGE_DIR ?? './storage',
      maxPdfSizeMb: toInt(env.MAX_PDF_SIZE_MB, 20),
    },
  };
};
