import { fakeConfig, makeJwt, ssoCfg } from '../test-utils/factories';
import { SsoProtocolError } from './sso.errors';
import { SsoTokenValidatorService } from './sso-token-validator.service';

describe('SsoTokenValidatorService', () => {
  const validator = new SsoTokenValidatorService(fakeConfig({ sso: ssoCfg }));
  const future = Math.floor(Date.now() / 1000) + 600;

  it('acepta un token con iss, aud y exp correctos', () => {
    const token = makeJwt({ iss: 'http://sso.test', aud: '30', exp: future });
    expect(validator.validateAccessToken(token)).toEqual({ exp: future });
  });

  it('acepta aud numérico o en array', () => {
    expect(() => validator.validateAccessToken(makeJwt({ iss: 'http://sso.test', aud: 30, exp: future }))).not.toThrow();
    expect(() => validator.validateAccessToken(makeJwt({ iss: 'http://sso.test', aud: ['x', '30'], exp: future }))).not.toThrow();
  });

  it.each([
    ['iss incorrecto', { iss: 'http://otro', aud: '30', exp: future }],
    ['aud incorrecto', { iss: 'http://sso.test', aud: '99', exp: future }],
    ['sin exp', { iss: 'http://sso.test', aud: '30' }],
    ['vencido', { iss: 'http://sso.test', aud: '30', exp: 1 }],
  ])('rechaza: %s', (_name, payload) => {
    expect(() => validator.validateAccessToken(makeJwt(payload))).toThrow(SsoProtocolError);
  });

  it('rechaza algo que no es un JWT', () => {
    expect(() => validator.validateAccessToken('no-es-jwt')).toThrow(SsoProtocolError);
  });

  it('isExpiringSoon considera el margen y los tokens ilegibles', () => {
    expect(validator.isExpiringSoon(makeJwt({ exp: future }), 30)).toBe(false);
    expect(validator.isExpiringSoon(makeJwt({ exp: Math.floor(Date.now() / 1000) + 10 }), 30)).toBe(true);
    expect(validator.isExpiringSoon('basura', 30)).toBe(true);
  });
});
