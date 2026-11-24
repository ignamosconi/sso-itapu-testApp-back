import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../../config/configuration';
import { AuthenticatedRequest } from '../../common/types/authenticated-request';
import { AUTH_SERVICE, IAuthService } from '../interfaces/auth.interfaces';

/** Exige sesión válida (cookie HttpOnly). Deja el usuario en request.user. */
@Injectable()
export class SessionAuthGuard implements CanActivate {
  private readonly cookieName: string;

  constructor(
    @Inject(AUTH_SERVICE) private readonly auth: IAuthService,
    config: ConfigService<AppConfig, true>,
  ) {
    this.cookieName = config.get('session', { infer: true }).cookieName;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const sessionId: unknown = request.cookies?.[this.cookieName];
    if (typeof sessionId !== 'string' || !sessionId) {
      throw new UnauthorizedException('No hay sesión iniciada');
    }
    request.user = await this.auth.resolveUser(sessionId);
    return true;
  }
}
