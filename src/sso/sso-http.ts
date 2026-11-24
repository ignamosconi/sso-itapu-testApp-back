import { SsoProtocolError, SsoRejectedError, SsoUnavailableError } from './sso.errors';

export interface SsoRequest {
  method: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs: number;
}

/**
 * Único punto por el que sale tráfico HTTP hacia el SSO (timeout + traducción de errores).
 * Nunca incluye el body (puede tener client_secret) en los mensajes de error.
 */
export async function ssoFetchJson<T>(url: string, request: SsoRequest): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), request.timeoutMs);
  const hasBody = request.body !== undefined;

  let status: number;
  let ok: boolean;
  let text: string;
  try {
    const response = await fetch(url, {
      method: request.method,
      headers: {
        Accept: 'application/json',
        ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
        ...request.headers,
      },
      body: hasBody ? JSON.stringify(request.body) : undefined,
      signal: controller.signal,
    });
    status = response.status;
    ok = response.ok;
    text = await response.text();
  } catch (error) {
    throw new SsoUnavailableError(`No se pudo contactar al SSO (${request.method} ${url}): ${(error as Error).message}`);
  } finally {
    clearTimeout(timer);
  }

  if (!ok) {
    if (status >= 400 && status < 500) {
      throw new SsoRejectedError(`El SSO rechazó el pedido (${request.method} ${url}) con ${status}`, status);
    }
    throw new SsoUnavailableError(`El SSO respondió ${status} (${request.method} ${url})`);
  }

  if (!text) return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new SsoProtocolError(`El SSO devolvió una respuesta que no es JSON (${request.method} ${url})`);
  }
}
