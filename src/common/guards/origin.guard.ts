import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { AppConfig } from '../../config/configuration';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Defensa extra contra CSRF (además de SameSite=Lax): los pedidos que modifican datos solo se aceptan si
 * el header Origin (cuando viene) es el del front o el de este mismo backend (Swagger).
 */
@Injectable()
export class OriginGuard implements CanActivate {
  private readonly allowed: Set<string>;

  constructor(config: ConfigService<AppConfig, true>) {
    this.allowed = new Set(
      [config.get('frontendOrigin', { infer: true }), config.get('appPublicUrl', { infer: true })].map(
        (url) => new URL(url).origin,
      ),
    );
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    if (SAFE_METHODS.has(request.method)) return true;

    const origin = request.headers.origin;
    if (origin && !this.allowed.has(origin)) {
      throw new ForbiddenException('Origen no permitido');
    }
    return true;
  }
}
