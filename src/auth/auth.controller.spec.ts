import { Response } from 'express';
import { fakeConfig, staffUser } from '../test-utils/factories';
import { AuthController } from './auth.controller';

describe('AuthController', () => {
  const auth = { startLogin: jest.fn(), completeLogin: jest.fn(), resolveUser: jest.fn(), logout: jest.fn() };
  const config = fakeConfig({ session: { cookieName: 'sid', maxAgeHours: 72, cookieSecure: false } });
  const controller = new AuthController(auth, config);
  const makeRes = () => ({ cookie: jest.fn(), clearCookie: jest.fn() }) as unknown as jest.Mocked<Response>;

  beforeEach(() => jest.clearAllMocks());

  it('getLoginUrl guarda el state en una cookie HttpOnly y lo devuelve', () => {
    auth.startLogin.mockReturnValue({ url: 'http://sso/login', state: 'st', ssoOrigin: 'http://sso' });
    const res = makeRes();
    expect(controller.getLoginUrl(res)).toEqual({ url: 'http://sso/login', state: 'st', ssoOrigin: 'http://sso' });
    expect(res.cookie).toHaveBeenCalledWith('itapu_sso_state', 'st', expect.objectContaining({ httpOnly: true, sameSite: 'lax' }));
  });

  it('callback usa el state de la cookie, setea la cookie de sesión HttpOnly y limpia la del state', async () => {
    auth.completeLogin.mockResolvedValue({ sessionId: 'sid-1', user: staffUser, maxAgeMs: 1000 });
    const res = makeRes();
    const req = { cookies: { itapu_sso_state: 'st' } } as never;

    const dto = await controller.callback({ code: 'c', state: 'st' }, req, res);

    expect(auth.completeLogin).toHaveBeenCalledWith('c', 'st', 'st');
    expect(res.cookie).toHaveBeenCalledWith('sid', 'sid-1', expect.objectContaining({ httpOnly: true, maxAge: 1000 }));
    expect(res.clearCookie).toHaveBeenCalledWith('itapu_sso_state', expect.anything());
    expect(dto).toMatchObject({ sub: 'u-staff', isStaff: true });
    expect(JSON.stringify(dto)).not.toContain('Token'); // nunca salen tokens
  });

  it('me devuelve el usuario', () => {
    expect(controller.me(staffUser)).toMatchObject({ displayName: 'Profe' });
  });

  it('logout revoca y borra la cookie; sin cookie igual responde', async () => {
    const res = makeRes();
    await controller.logout({ cookies: { sid: 'sid-1' } } as never, res);
    expect(auth.logout).toHaveBeenCalledWith('sid-1');
    expect(res.clearCookie).toHaveBeenCalledWith('sid', expect.anything());

    auth.logout.mockClear();
    await controller.logout({ cookies: {} } as never, makeRes());
    expect(auth.logout).not.toHaveBeenCalled();
  });
});
