import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { fakeConfig } from '../../test-utils/factories';
import { OriginGuard } from './origin.guard';

const ctx = (method: string, origin?: string) =>
  ({ switchToHttp: () => ({ getRequest: () => ({ method, headers: origin ? { origin } : {} }) }) }) as unknown as ExecutionContext;

describe('OriginGuard', () => {
  const guard = new OriginGuard(fakeConfig({ frontendOrigin: 'http://localhost:5173', appPublicUrl: 'http://localhost:3001' }));

  it('GET siempre pasa', () => expect(guard.canActivate(ctx('GET', 'http://evil.com'))).toBe(true));
  it('POST desde el front o desde el propio backend (Swagger) pasa', () => {
    expect(guard.canActivate(ctx('POST', 'http://localhost:5173'))).toBe(true);
    expect(guard.canActivate(ctx('DELETE', 'http://localhost:3001'))).toBe(true);
  });
  it('POST sin Origin (curl, server-to-server) pasa', () => expect(guard.canActivate(ctx('POST'))).toBe(true));
  it('POST desde otro origen es 403', () => {
    expect(() => guard.canActivate(ctx('POST', 'http://evil.com'))).toThrow(ForbiddenException);
  });
});
