import { fakeConfig, ssoCfg } from '../test-utils/factories';
import { SsoProtocolError, SsoRejectedError, SsoUnavailableError } from './sso.errors';
import { SsoClientService } from './sso-client.service';

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('SsoClientService', () => {
  const client = new SsoClientService(fakeConfig({ sso: ssoCfg }));
  let fetchMock: jest.SpyInstance;

  beforeEach(() => {
    fetchMock = jest.spyOn(global, 'fetch');
  });
  afterEach(() => jest.restoreAllMocks());

  it('buildLoginUrl arma el popup con client_id, redirect_uri, state y theme', () => {
    const url = new URL(client.buildLoginUrl('abc'));
    expect(url.origin + url.pathname).toBe('http://sso.test/sso/login');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      client_id: '30',
      redirect_uri: 'http://app.test/',
      state: 'abc',
      theme: 'dark',
    });
  });

  it('getOrigin devuelve solo el origen', () => {
    expect(client.getOrigin()).toBe('http://sso.test');
  });

  it('exchangeCode envía las credenciales y la misma redirect_uri', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ access_token: 'A', refresh_token: 'R' }));
    await expect(client.exchangeCode('code-1')).resolves.toEqual({ accessToken: 'A', refreshToken: 'R' });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://sso.test/sso/token');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({
      client_id: '30',
      client_secret: 'secret',
      code: 'code-1',
      redirect_uri: 'http://app.test/',
    });
  });

  it('exchangeCode falla si faltan tokens en la respuesta', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ access_token: 'A' }));
    await expect(client.exchangeCode('c')).rejects.toBeInstanceOf(SsoProtocolError);
  });

  it('traduce 4xx a SsoRejectedError y 5xx/red a SsoUnavailableError', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({}, 401));
    await expect(client.exchangeCode('c')).rejects.toBeInstanceOf(SsoRejectedError);

    fetchMock.mockResolvedValueOnce(jsonResponse({}, 503));
    await expect(client.exchangeCode('c')).rejects.toBeInstanceOf(SsoUnavailableError);

    fetchMock.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    await expect(client.exchangeCode('c')).rejects.toBeInstanceOf(SsoUnavailableError);
  });

  it('getUserInfo usa Bearer y lee cargos/especialidades como listas (strings u objetos)', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        sub: 'u-9', aud: '30', nombre: 'Ana', apellido: 'Pérez',
        cargos: [{ name: 'Preceptor' }, 'Profesor'], especialidades: ['Informática'],
      }),
    );
    const user = await client.getUserInfo('tok');
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer tok');
    expect(user).toEqual({
      sub: 'u-9', displayName: 'Ana Pérez', email: null, cargos: ['Preceptor', 'Profesor'], especialidades: ['Informática'],
    });
  });

  it('getUserInfo ignora los campos sueltos del formato viejo (cargo/especialidad)', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ sub: 'u-9', aud: '30', cargo: 'Profesor', especialidad: 'Informática' }));
    const user = await client.getUserInfo('tok');
    expect(user.cargos).toEqual([]);
    expect(user.especialidades).toEqual([]);
  });

  it('getUserInfo exige aud == client_id', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ sub: 'u', aud: '77' }));
    await expect(client.getUserInfo('tok')).rejects.toBeInstanceOf(SsoProtocolError);
  });

  it('refresh y logout mandan refresh_token', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ access_token: 'A2', refresh_token: 'R2' }));
    await expect(client.refresh('R1')).resolves.toEqual({ accessToken: 'A2', refreshToken: 'R2' });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({ client_secret: 'secret', refresh_token: 'R1' });

    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    await expect(client.logout('R2')).resolves.toBeUndefined();
    expect(fetchMock.mock.calls[1][0]).toBe('http://sso.test/sso/logout');
  });
});
