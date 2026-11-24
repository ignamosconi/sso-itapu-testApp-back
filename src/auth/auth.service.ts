import { randomBytes, timingSafeEqual } from 'node:crypto';
import {
  BadGatewayException,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../config/configuration';
import { ISsoClient } from '../sso/interfaces/sso-client.interface';
import { ISsoTokenValidator } from '../sso/interfaces/sso-token-validator.interface';
import { SSO_CLIENT, SSO_TOKEN_VALIDATOR } from '../sso/sso.constants';
import { SsoProtocolError, SsoRejectedError, SsoUnavailableError } from '../sso/sso.errors';
import { AuthUser } from './auth.types';
import { SessionEntity } from './entities/session.entity';
import {
  ACCESS_POLICY,
  CompletedLogin,
  IAccessPolicy,
  IAuthService,
  LoginRequest,
} from './interfaces/auth.interfaces';
import { ISessionRepository, SESSION_REPOSITORY } from './repositories/session.repository.interface';

/** Renovamos el access_token un poco antes de que venza (dura 15 min). */
const REFRESH_SKEW_SECONDS = 30;

@Injectable()
export class AuthService implements IAuthService, OnModuleInit {
  private readonly logger = new Logger(AuthService.name);
  private readonly sessionMaxAgeMs: number;
  /** Un solo refresh en vuelo por sesión: si dos pedidos renuevan a la vez con el mismo token, el SSO le da 401 a uno. */
  private readonly refreshInFlight = new Map<string, Promise<SessionEntity>>();

  constructor(
    @Inject(SSO_CLIENT) private readonly sso: ISsoClient,
    @Inject(SSO_TOKEN_VALIDATOR) private readonly tokens: ISsoTokenValidator,
    @Inject(SESSION_REPOSITORY) private readonly sessions: ISessionRepository,
    @Inject(ACCESS_POLICY) private readonly policy: IAccessPolicy,
    config: ConfigService<AppConfig, true>,
  ) {
    this.sessionMaxAgeMs = config.get('session', { infer: true }).maxAgeHours * 60 * 60 * 1000;
  }

  async onModuleInit(): Promise<void> {
    const removed = await this.sessions.deleteExpired(new Date());
    if (removed > 0) this.logger.log(`Se limpiaron ${removed} sesiones vencidas`);
  }

  startLogin(): LoginRequest {
    const state = randomBytes(24).toString('base64url');
    return { state, url: this.sso.buildLoginUrl(state), ssoOrigin: this.sso.getOrigin() };
  }

  async completeLogin(code: string, state: string, expectedState: string | undefined): Promise<CompletedLogin> {
    if (!expectedState || !this.safeEqual(state, expectedState)) {
      throw new UnauthorizedException('State inválido o expirado. Volvé a iniciar sesión.');
    }

    try {
      const tokens = await this.sso.exchangeCode(code); // Paso 3
      this.tokens.validateAccessToken(tokens.accessToken); // iss / aud / exp
      const me = await this.sso.getUserInfo(tokens.accessToken); // Paso 4

      const session = await this.sessions.create({
        sub: me.sub,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        displayName: me.displayName,
        email: me.email,
        cargo: me.cargo,
        especialidad: me.especialidad,
        absoluteExpiresAt: new Date(Date.now() + this.sessionMaxAgeMs),
      });
      return { sessionId: session.id, user: this.toAuthUser(session), maxAgeMs: this.sessionMaxAgeMs };
    } catch (error) {
      throw this.mapSsoError(error, 'No se pudo completar el inicio de sesión.');
    }
  }

  async resolveUser(sessionId: string): Promise<AuthUser> {
    const session = await this.sessions.findById(sessionId);
    if (!session) {
      throw new UnauthorizedException('Sesión inexistente o vencida');
    }
    if (session.absoluteExpiresAt.getTime() <= Date.now()) {
      await this.sessions.delete(session.id);
      throw new UnauthorizedException('La sesión venció');
    }

    const current = this.tokens.isExpiringSoon(session.accessToken, REFRESH_SKEW_SECONDS)
      ? await this.refreshSession(session)
      : session;
    return this.toAuthUser(current);
  }

  async logout(sessionId: string): Promise<void> {
    const session = await this.sessions.findById(sessionId);
    if (!session) return;
    try {
      await this.sso.logout(session.refreshToken); // Paso 6
    } catch (error) {
      // Aunque el SSO no responda, la sesión local se elimina igual.
      this.logger.warn(`No se pudo revocar la sesión en el SSO: ${(error as Error).message}`);
    }
    await this.sessions.delete(session.id);
  }

  private refreshSession(session: SessionEntity): Promise<SessionEntity> {
    const inFlight = this.refreshInFlight.get(session.id);
    if (inFlight) return inFlight;

    const promise = this.doRefresh(session).finally(() => this.refreshInFlight.delete(session.id));
    this.refreshInFlight.set(session.id, promise);
    return promise;
  }

  /** Paso 5. Reemplaza AMBOS tokens. Si el SSO rechaza (suspendido, eliminado, refresh reutilizado) → sesión revocada. */
  private async doRefresh(session: SessionEntity): Promise<SessionEntity> {
    try {
      const tokens = await this.sso.refresh(session.refreshToken);
      this.tokens.validateAccessToken(tokens.accessToken);
      // cargo y especialidad "reflejan los valores configurados por el administrador": se refrescan acá.
      const me = await this.sso.getUserInfo(tokens.accessToken);
      const updated = await this.sessions.update(session.id, {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        displayName: me.displayName,
        email: me.email,
        cargo: me.cargo,
        especialidad: me.especialidad,
      });
      if (!updated) throw new UnauthorizedException('Sesión inexistente o vencida');
      return updated;
    } catch (error) {
      if (error instanceof SsoRejectedError) {
        await this.sessions.delete(session.id);
        throw new UnauthorizedException('Tu sesión fue revocada. Volvé a iniciar sesión.');
      }
      throw this.mapSsoError(error, 'No se pudo renovar la sesión.');
    }
  }

  private toAuthUser(session: SessionEntity): AuthUser {
    return {
      sub: session.sub,
      displayName: session.displayName,
      email: session.email,
      cargo: session.cargo,
      especialidad: session.especialidad,
      isStaff: this.policy.isStaff(session.cargo),
    };
  }

  private mapSsoError(error: unknown, message: string): Error {
    if (error instanceof SsoRejectedError) return new UnauthorizedException(`${message} El SSO rechazó el pedido.`);
    if (error instanceof SsoUnavailableError) return new ServiceUnavailableException('El SSO no está disponible.');
    if (error instanceof SsoProtocolError) return new BadGatewayException(`${message} ${error.message}`);
    return error instanceof Error ? error : new Error(String(error));
  }

  private safeEqual(a: string, b: string): boolean {
    const left = Buffer.from(a);
    const right = Buffer.from(b);
    return left.length === right.length && timingSafeEqual(left, right);
  }
}
