import { SessionEntity } from '../entities/session.entity';

export const SESSION_REPOSITORY = Symbol('SESSION_REPOSITORY');

export type NewSession = Pick<
  SessionEntity,
  'sub' | 'accessToken' | 'refreshToken' | 'displayName' | 'email' | 'cargo' | 'especialidad' | 'absoluteExpiresAt'
>;

export type SessionPatch = Partial<
  Pick<SessionEntity, 'accessToken' | 'refreshToken' | 'displayName' | 'email' | 'cargo' | 'especialidad'>
>;

export interface ISessionRepository {
  create(data: NewSession): Promise<SessionEntity>;
  findById(id: string): Promise<SessionEntity | null>;
  update(id: string, patch: SessionPatch): Promise<SessionEntity | null>;
  delete(id: string): Promise<void>;
  /** Borra sesiones vencidas. Devuelve cuántas. */
  deleteExpired(now: Date): Promise<number>;
}
