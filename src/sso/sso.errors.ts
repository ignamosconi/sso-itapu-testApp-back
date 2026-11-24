/** Errores propios de la integración con el SSO. La capa de auth los traduce a respuestas HTTP. */
export class SsoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/** El SSO respondió 4xx: código inválido/expirado, refresh reutilizado, alumno suspendido, etc. */
export class SsoRejectedError extends SsoError {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

/** No se pudo hablar con el SSO (red, timeout, 5xx). */
export class SsoUnavailableError extends SsoError {}

/** El SSO respondió algo que no cumple el contrato (JWT inválido, iss/aud incorrectos, campos faltantes). */
export class SsoProtocolError extends SsoError {}
