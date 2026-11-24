import { Request, Response } from 'express';
import { AuthUser } from '../auth.types';
import { LoginUrlResponseDto } from '../dto/login-url-response.dto';
import { SessionUserDto } from '../dto/session-user.dto';
import { SsoCallbackDto } from '../dto/sso-callback.dto';

export const AUTH_SERVICE = Symbol('AUTH_SERVICE');
export const ACCESS_POLICY = Symbol('ACCESS_POLICY');

export interface LoginRequest {
  url: string;
  state: string;
  ssoOrigin: string;
}

export interface CompletedLogin {
  sessionId: string;
  user: AuthUser;
  maxAgeMs: number;
}

export interface IAuthService {
  /** Genera el state y la URL del popup (Paso 1). */
  startLogin(): LoginRequest;
  /** Pasos 3 y 4: valida state, canjea el code, identifica al usuario y crea la sesión. */
  completeLogin(code: string, state: string, expectedState: string | undefined): Promise<CompletedLogin>;
  /** Devuelve el usuario de la sesión, renovando tokens (Paso 5) si hace falta. */
  resolveUser(sessionId: string): Promise<AuthUser>;
  /** Paso 6. */
  logout(sessionId: string): Promise<void>;
}

export interface IAccessPolicy {
  /** ¿Este cargo tiene acceso al panel de administración? */
  isStaff(cargo: string | null): boolean;
  getStaffCargos(): string[];
}

export interface IAuthController {
  getLoginUrl(res: Response): LoginUrlResponseDto;
  callback(dto: SsoCallbackDto, req: Request, res: Response): Promise<SessionUserDto>;
  me(user: AuthUser): SessionUserDto;
  logout(req: Request, res: Response): Promise<void>;
}
