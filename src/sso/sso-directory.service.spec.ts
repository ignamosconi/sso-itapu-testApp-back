import { fakeConfig, ssoCfg } from '../test-utils/factories';
import { SsoUnavailableError } from './sso.errors';
import { SsoDirectoryService } from './sso-directory.service';

const jsonResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

describe('SsoDirectoryService', () => {
  const build = (ttlSeconds = 300) =>
    new SsoDirectoryService(fakeConfig({ sso: ssoCfg, policy: { directoryCacheTtlSeconds: ttlSeconds, staffCargos: [] } }));
  let fetchMock: jest.SpyInstance;

  beforeEach(() => {
    fetchMock = jest.spyOn(global, 'fetch');
  });
  afterEach(() => jest.restoreAllMocks());

  it('lee cargos y especialidades del SSO, aceptando strings, objetos o un array envuelto', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(['Profesor', 'Alumno']));
    fetchMock.mockResolvedValueOnce(jsonResponse({ data: [{ nombre: 'Informática' }, { name: 'Electrónica' }, 'Informática'] }));
    const directory = build();

    await expect(directory.getDomainRoles()).resolves.toEqual(['Profesor', 'Alumno']);
    await expect(directory.getSpecialties()).resolves.toEqual(['Informática', 'Electrónica']);
    expect(fetchMock.mock.calls.map((c) => c[0])).toEqual([
      'http://sso.test/sso/info/domain-roles',
      'http://sso.test/sso/info/specialties',
    ]);
  });

  it('usa cache dentro del TTL', async () => {
    fetchMock.mockResolvedValue(jsonResponse(['A']));
    const directory = build();
    await directory.getSpecialties();
    await directory.getSpecialties();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('si el SSO cae, sirve el último valor conocido; sin cache, propaga el error', async () => {
    const directory = build(0); // TTL 0: siempre intenta refrescar
    fetchMock.mockResolvedValueOnce(jsonResponse(['A']));
    await directory.getSpecialties();

    fetchMock.mockRejectedValueOnce(new Error('caído'));
    await expect(directory.getSpecialties()).resolves.toEqual(['A']);

    fetchMock.mockRejectedValueOnce(new Error('caído'));
    await expect(build(0).getDomainRoles()).rejects.toBeInstanceOf(SsoUnavailableError);
  });
});
