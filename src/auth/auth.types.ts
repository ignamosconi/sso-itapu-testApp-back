/** Usuario autenticado tal como lo ve el resto de la app. */
export interface AuthUser {
  /** ID único e inmutable del SSO */
  sub: string;
  displayName: string;
  email: string | null;
  /** Cargos según el SSO (lista, al menos uno) */
  cargos: string[];
  /** Especialidades según el SSO (lista, al menos una) */
  especialidades: string[];
  /** true si ALGUNO de sus cargos está en STAFF_CARGOS: ve el panel de administración */
  isStaff: boolean;
}
