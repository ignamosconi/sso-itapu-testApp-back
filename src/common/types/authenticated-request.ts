import { Request } from 'express';
import { AuthUser } from '../../auth/auth.types';

export interface AuthenticatedRequest extends Request {
  user: AuthUser;
}
