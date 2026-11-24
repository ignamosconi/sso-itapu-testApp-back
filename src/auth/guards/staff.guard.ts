import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { AuthenticatedRequest } from '../../common/types/authenticated-request';

/** Usar SIEMPRE después de SessionAuthGuard: @UseGuards(SessionAuthGuard, StaffGuard) */
@Injectable()
export class StaffGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!user?.isStaff) {
      throw new ForbiddenException('Solo el personal autorizado puede hacer esto');
    }
    return true;
  }
}
