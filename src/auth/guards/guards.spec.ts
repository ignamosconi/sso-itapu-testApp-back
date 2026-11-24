import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { fakeConfig, staffUser, studentUser } from '../../test-utils/factories';
import { SessionAuthGuard } from './session-auth.guard';
import { StaffGuard } from './staff.guard';

const ctx = (request: object) => ({ switchToHttp: () => ({ getRequest: () => request }) }) as unknown as ExecutionContext;

describe('SessionAuthGuard', () => {
  const auth = { startLogin: jest.fn(), completeLogin: jest.fn(), resolveUser: jest.fn(), logout: jest.fn() };
  const guard = new SessionAuthGuard(auth, fakeConfig({ session: { cookieName: 'sid' } }));

  it('401 sin cookie', async () => {
    await expect(guard.canActivate(ctx({ cookies: {} }))).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('deja el usuario en request.user', async () => {
    auth.resolveUser.mockResolvedValue(staffUser);
    const request: { cookies: Record<string, string>; user?: unknown } = { cookies: { sid: 'abc' } };
    await expect(guard.canActivate(ctx(request))).resolves.toBe(true);
    expect(request.user).toBe(staffUser);
  });
});

describe('StaffGuard', () => {
  const guard = new StaffGuard();
  it('permite al personal y bloquea al resto con 403', () => {
    expect(guard.canActivate(ctx({ user: staffUser }))).toBe(true);
    expect(() => guard.canActivate(ctx({ user: studentUser }))).toThrow(ForbiddenException);
  });
});
