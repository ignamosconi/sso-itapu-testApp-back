/** Usuario autenticado tal como lo ve el resto de la app. */
export interface AuthUser {
  /** ID único e inmutable del SSO */
  sub: string;
  displayName: string;
  email: string | null;
  cargo: string | null;
  especialidad: string | null;
  /** true si el cargo está en STAFF_CARGOS: ve el panel de administración */
  isStaff: boolean;
}
