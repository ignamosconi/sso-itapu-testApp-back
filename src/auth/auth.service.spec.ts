import { ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { SsoProtocolError, SsoRejectedError, SsoUnavailableError } from '../sso/sso.errors';
import { fakeConfig, makeSession } from '../test-utils/factories';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const sso = {
    getOrigin: jest.fn().mockReturnValue('http://sso.test'),
    buildLoginUrl: jest.fn((state: string) => `http://sso.test/sso/login?state=${state}`),
    exchangeCode: jest.fn(),
    getUserInfo: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
  };
  const tokens = { validateAccessToken: jest.fn(), isExpiringSoon: jest.fn().mockReturnValue(false) };
  const sessions = { create: jest.fn(), findById: jest.fn(), update: jest.fn(), delete: jest.fn(), deleteExpired: jest.fn() };
  const policy = { isStaff: jest.fn((cargos: readonly string[]) => cargos.includes('Profesor')), getStaffCargos: jest.fn() };
  const me = { sub: 'u-1', displayName: 'Ana', email: null, cargos: ['Preceptor', 'Profesor'], especialidades: ['Sistemas'] };

  let service: AuthService;
  beforeEach(() => {
    jest.clearAllMocks();
    tokens.isExpiringSoon.mockReturnValue(false);
    service = new AuthService(sso, tokens, sessions, policy, fakeConfig({ session: { maxAgeHours: 72 } }));
  });

  describe('startLogin', () => {
    it('genera un state distinto cada vez y devuelve el origen del SSO', () => {
      const a = service.startLogin();
      const b = service.startLogin();
      expect(a.state).not.toEqual(b.state);
      expect(a.url).toContain(a.state);
      expect(a.ssoOrigin).toBe('http://sso.test');
    });
  });

  describe('completeLogin', () => {
    it('rechaza si el state no coincide con el de la cookie (sin tocar el SSO)', async () => {
      await expect(service.completeLogin('c', 'x', 'y')).rejects.toBeInstanceOf(UnauthorizedException);
      await expect(service.completeLogin('c', 'x', undefined)).rejects.toBeInstanceOf(UnauthorizedException);
      expect(sso.exchangeCode).not.toHaveBeenCalled();
    });

    it('canjea el code, valida el token, identifica al usuario y crea la sesión', async () => {
      sso.exchangeCode.mockResolvedValue({ accessToken: 'A', refreshToken: 'R' });
      sso.getUserInfo.mockResolvedValue(me);
      sessions.create.mockResolvedValue(makeSession({ id: 'sid-9' }));

      const result = await service.completeLogin('code', 's', 's');

      expect(tokens.validateAccessToken).toHaveBeenCalledWith('A');
      expect(sessions.create).toHaveBeenCalledWith(expect.objectContaining({ sub: 'u-1', accessToken: 'A', refreshToken: 'R' }));
      expect(result.sessionId).toBe('sid-9');
      expect(result.user.isStaff).toBe(true);
      expect(result.maxAgeMs).toBe(72 * 3600 * 1000);
    });

    it('traduce errores del SSO', async () => {
      sso.exchangeCode.mockRejectedValueOnce(new SsoRejectedError('x', 400));
      await expect(service.completeLogin('c', 's', 's')).rejects.toBeInstanceOf(UnauthorizedException);

      sso.exchangeCode.mockRejectedValueOnce(new SsoUnavailableError('x'));
      await expect(service.completeLogin('c', 's', 's')).rejects.toBeInstanceOf(ServiceUnavailableException);

      sso.exchangeCode.mockResolvedValueOnce({ accessToken: 'A', refreshToken: 'R' });
      tokens.validateAccessToken.mockImplementationOnce(() => {
        throw new SsoProtocolError('aud');
      });
      await expect(service.completeLogin('c', 's', 's')).rejects.toThrow('aud');
    });
  });

  describe('resolveUser', () => {
    it('401 si la sesión no existe o pasó el límite absoluto', async () => {
      sessions.findById.mockResolvedValueOnce(null);
      await expect(service.resolveUser('x')).rejects.toBeInstanceOf(UnauthorizedException);

      sessions.findById.mockResolvedValueOnce(makeSession({ absoluteExpiresAt: new Date(Date.now() - 1000) }));
      await expect(service.resolveUser('sid-1')).rejects.toBeInstanceOf(UnauthorizedException);
      expect(sessions.delete).toHaveBeenCalledWith('sid-1');
    });

    it('devuelve el usuario sin refrescar si el access_token está vigente', async () => {
      sessions.findById.mockResolvedValue(makeSession());
      const user = await service.resolveUser('sid-1');
      expect(user).toMatchObject({ sub: 'u-1', cargos: ['Profesor'], isStaff: true });
      expect(sso.refresh).not.toHaveBeenCalled();
    });

    it('refresca cuando está por vencer y reemplaza AMBOS tokens', async () => {
      tokens.isExpiringSoon.mockReturnValue(true);
      sessions.findById.mockResolvedValue(makeSession());
      sso.refresh.mockResolvedValue({ accessToken: 'A2', refreshToken: 'R2' });
      sso.getUserInfo.mockResolvedValue({ ...me, cargos: ['Alumno'] });
      sessions.update.mockResolvedValue(makeSession({ accessToken: 'A2', refreshToken: 'R2', cargos: ['Alumno'] }));

      const user = await service.resolveUser('sid-1');

      expect(sso.refresh).toHaveBeenCalledWith('r');
      expect(sessions.update).toHaveBeenCalledWith('sid-1', expect.objectContaining({ accessToken: 'A2', refreshToken: 'R2', cargos: ['Alumno'], especialidades: ['Sistemas'] }));
      expect(user.isStaff).toBe(false); // el cargo cambió en el SSO y se refleja
    });

    it('pedidos simultáneos comparten UN solo refresh', async () => {
      tokens.isExpiringSoon.mockReturnValue(true);
      sessions.findById.mockResolvedValue(makeSession());
      sso.refresh.mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve({ accessToken: 'A2', refreshToken: 'R2' }), 10)));
      sso.getUserInfo.mockResolvedValue(me);
      sessions.update.mockResolvedValue(makeSession());

      await Promise.all([service.resolveUser('sid-1'), service.resolveUser('sid-1'), service.resolveUser('sid-1')]);
      expect(sso.refresh).toHaveBeenCalledTimes(1);
    });

    it('si el SSO rechaza el refresh (suspendido / token reutilizado) borra la sesión y da 401', async () => {
      tokens.isExpiringSoon.mockReturnValue(true);
      sessions.findById.mockResolvedValue(makeSession());
      sso.refresh.mockRejectedValue(new SsoRejectedError('x', 401));

      await expect(service.resolveUser('sid-1')).rejects.toBeInstanceOf(UnauthorizedException);
      expect(sessions.delete).toHaveBeenCalledWith('sid-1');
    });

    it('si el SSO está caído NO borra la sesión', async () => {
      tokens.isExpiringSoon.mockReturnValue(true);
      sessions.findById.mockResolvedValue(makeSession());
      sso.refresh.mockRejectedValue(new SsoUnavailableError('x'));

      await expect(service.resolveUser('sid-1')).rejects.toBeInstanceOf(ServiceUnavailableException);
      expect(sessions.delete).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('revoca en el SSO y borra la sesión local', async () => {
      sessions.findById.mockResolvedValue(makeSession());
      await service.logout('sid-1');
      expect(sso.logout).toHaveBeenCalledWith('r');
      expect(sessions.delete).toHaveBeenCalledWith('sid-1');
    });

    it('borra la sesión local aunque el SSO falle', async () => {
      sessions.findById.mockResolvedValue(makeSession());
      sso.logout.mockRejectedValue(new SsoUnavailableError('x'));
      await expect(service.logout('sid-1')).resolves.toBeUndefined();
      expect(sessions.delete).toHaveBeenCalledWith('sid-1');
    });

    it('no hace nada si la sesión no existe', async () => {
      sessions.findById.mockResolvedValue(null);
      await service.logout('nope');
      expect(sso.logout).not.toHaveBeenCalled();
    });
  });
});
