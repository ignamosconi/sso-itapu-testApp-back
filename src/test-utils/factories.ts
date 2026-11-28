import { AuthUser } from '../auth/auth.types';
import { SessionEntity } from '../auth/entities/session.entity';
import { PdfFileEntity } from '../files/entities/pdf-file.entity';
import { FolderEntity } from '../folders/entities/folder.entity';

export const makeJwt = (payload: Record<string, unknown>): string => {
  const enc = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${enc({ alg: 'none', typ: 'JWT' })}.${enc(payload)}.firma`;
};

export const makeFolder = (overrides: Partial<FolderEntity> = {}): FolderEntity =>
  ({
    id: 'f-1',
    name: 'Carpeta',
    parentId: null,
    allowedSpecialties: [],
    createdBySub: 'u-1',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  }) as FolderEntity;

export const makeFile = (overrides: Partial<PdfFileEntity> = {}): PdfFileEntity =>
  ({
    id: 'p-1',
    title: 'Examen',
    originalName: 'examen.pdf',
    storedName: '11111111-1111-1111-1111-111111111111.pdf',
    sizeBytes: 100,
    folderId: null,
    uploadedBySub: 'u-1',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  }) as PdfFileEntity;

export const makeSession = (overrides: Partial<SessionEntity> = {}): SessionEntity =>
  ({
    id: 'sid-1',
    sub: 'u-1',
    accessToken: 'a',
    refreshToken: 'r',
    displayName: 'Ana Pérez',
    email: null,
    cargos: ['Profesor'],
    especialidades: ['ITAPU'],
    absoluteExpiresAt: new Date(Date.now() + 3600_000),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }) as SessionEntity;

export const staffUser: AuthUser = {
  sub: 'u-staff',
  displayName: 'Profe',
  email: null,
  cargos: ['Preceptor', 'Profesor'],
  especialidades: ['ITAPU'],
  isStaff: true,
};

export const studentUser: AuthUser = {
  sub: 'u-student',
  displayName: 'Alumno',
  email: null,
  cargos: ['Alumno'],
  especialidades: ['Informática'],
  isStaff: false,
};

/** ConfigService mínimo para tests */
export const fakeConfig = (values: Record<string, unknown>) => ({ get: (key: string) => values[key] }) as never;

export const ssoCfg = {
  baseUrl: 'http://sso.test',
  issuer: 'http://sso.test',
  clientId: '30',
  clientSecret: 'secret',
  redirectUri: 'http://app.test/',
  theme: 'dark',
  httpTimeoutMs: 1000,
};
