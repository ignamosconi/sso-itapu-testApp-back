import { validateEnv } from './env.validation';

const valid = {
  FRONTEND_ORIGIN: 'http://localhost:5173',
  DB_HOST: 'localhost',
  DB_PORT: '5432',
  DB_NAME: 'x',
  DB_USER: 'u',
  DB_PASSWORD: 'p',
  SSO_BASE_URL: 'http://localhost:3000',
  SSO_CLIENT_ID: '30',
  SSO_CLIENT_SECRET: 's',
  SSO_REDIRECT_URI: 'http://localhost:5173/',
  STAFF_CARGOS: 'Profesor',
};

describe('validateEnv', () => {
  it('acepta una configuración completa', () => expect(validateEnv(valid)).toBe(valid));

  it('lista todo lo que falta', () => {
    expect(() => validateEnv({ ...valid, SSO_CLIENT_SECRET: '', DB_NAME: undefined })).toThrow(/DB_NAME, SSO_CLIENT_SECRET|SSO_CLIENT_SECRET/);
  });

  it('rechaza URLs inválidas', () => {
    expect(() => validateEnv({ ...valid, SSO_BASE_URL: 'no-es-url' })).toThrow('SSO_BASE_URL');
  });
});
