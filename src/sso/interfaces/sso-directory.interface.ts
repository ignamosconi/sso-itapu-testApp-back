export interface ISsoDirectory {
  /** Valores posibles de cada elemento de `cargos`. Fuente: GET /sso/info/domain-roles */
  getDomainRoles(): Promise<string[]>;
  /** Valores posibles de cada elemento de `especialidades`. Fuente: GET /sso/info/specialties */
  getSpecialties(): Promise<string[]>;
}
