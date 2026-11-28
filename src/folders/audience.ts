import { AuthUser } from '../auth/auth.types';

/**
 * "Quién está mirando". El personal ve todo; un alumno solo ve las carpetas habilitadas para alguna de sus especialidades.
 * Un profe en "vista de alumno" se evalúa como student (con la especialidad que elija previsualizar).
 */
export type Audience = { kind: 'staff' } | { kind: 'student'; especialidades: string[] };

export const audienceFor = (user: AuthUser): Audience =>
  user.isStaff ? { kind: 'staff' } : { kind: 'student', especialidades: user.especialidades };
