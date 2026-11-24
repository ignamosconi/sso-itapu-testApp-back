/** Tokens de inyección: los servicios dependen de interfaces, no de clases concretas. */
export const SSO_CLIENT = Symbol('SSO_CLIENT');
export const SSO_DIRECTORY = Symbol('SSO_DIRECTORY');
export const SSO_TOKEN_VALIDATOR = Symbol('SSO_TOKEN_VALIDATOR');

/**
 * Paths del SSO (relativos a SSO_BASE_URL). Son parte del contrato del mail
 * "Credenciales de integración", no cambian entre entornos; lo que cambia es la URL base (.env).
 */
export const SSO_ENDPOINTS = {
  login: '/sso/login', //                 Paso 1: popup de login
  token: '/sso/token', //                 Paso 3: canjear code por tokens
  me: '/sso/me', //                       Paso 4: identificar al usuario
  refresh: '/sso/refresh', //             Paso 5: renovar tokens
  logout: '/sso/logout', //               Paso 6: cerrar sesión
  domainRoles: '/sso/info/domain-roles', // Referencia pública: cargos posibles
  specialties: '/sso/info/specialties', //  Referencia pública: especialidades posibles
} as const;
