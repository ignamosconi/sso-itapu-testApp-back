const REQUIRED = [
  'FRONTEND_ORIGIN',
  'DB_HOST',
  'DB_PORT',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'SSO_BASE_URL',
  'SSO_CLIENT_ID',
  'SSO_CLIENT_SECRET',
  'SSO_REDIRECT_URI',
  'STAFF_CARGOS',
] as const;

const URL_KEYS = ['FRONTEND_ORIGIN', 'SSO_BASE_URL', 'SSO_REDIRECT_URI'] as const;

/** Falla rápido y con un mensaje claro si falta algo en el .env. */
export function validateEnv(env: Record<string, unknown>): Record<string, unknown> {
  const missing = REQUIRED.filter((key) => typeof env[key] !== 'string' || (env[key] as string).trim() === '');
  if (missing.length > 0) {
    throw new Error(`Faltan variables de entorno: ${missing.join(', ')}. Copiá .env.example a .env y completalo.`);
  }

  for (const key of URL_KEYS) {
    try {
      new URL(env[key] as string);
    } catch {
      throw new Error(`La variable ${key} no es una URL válida: "${String(env[key])}"`);
    }
  }
  return env;
}
