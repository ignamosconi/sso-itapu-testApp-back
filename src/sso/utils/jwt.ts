/** Decodifica el payload de un JWT SIN verificar la firma (la firma la valida el SSO en /sso/me). */
export function decodeJwtPayload(token: string): Record<string, unknown> {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('El token no tiene formato JWT');
  }
  const json = Buffer.from(parts[1], 'base64url').toString('utf8');
  const payload: unknown = JSON.parse(json);
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('Payload JWT inválido');
  }
  return payload as Record<string, unknown>;
}
