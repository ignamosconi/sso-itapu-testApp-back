export interface ISsoDirectory {
  /** Valores posibles de `cargo`. Fuente: GET /sso/info/domain-roles */
  getDomainRoles(): Promise<string[]>;
  /** Valores posibles de `especialidad`. Fuente: GET /sso/info/specialties */
  getSpecialties(): Promise<string[]>;
}
