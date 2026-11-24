# Módulo `sso/` — acoplamiento con ITAPU SSO (backend)

Todo lo que sabe *cómo hablar con el SSO* está en esta carpeta. El resto de la app (carpetas, PDFs, etc.)
solo conoce las interfaces `ISsoClient`, `ISsoDirectory` e `ISsoTokenValidator`.
Si el SSO cambia (otra URL, nuevas credenciales, otro formato), se toca **`.env`** y/o **esta carpeta**, nada más.

## Configuración (`.env`)

| Variable | Del mail | Para qué |
|---|---|---|
| `SSO_BASE_URL` | `http://localhost:3000` | Base de todos los endpoints y `iss` esperado de los JWT |
| `SSO_CLIENT_ID` | "Client ID" | `client_id` en login/token/refresh/logout y `aud` esperado |
| `SSO_CLIENT_SECRET` | "Client Secret" | Solo backend. Nunca sale al front |
| `SSO_REDIRECT_URI` | "Redirect URIs" | Debe coincidir **exactamente** (incluida la `/` final) |
| `SSO_THEME` | `theme=dark` | Tema del popup |

## Mapa: pasos del mail → código

| Paso del mail | Dónde está | Qué hace |
|---|---|---|
| **Endpoints de referencia** (`/sso/info/domain-roles`, `/sso/info/specialties`) | `sso-directory.service.ts` | Consulta cargos y especialidades. Cache + último valor conocido. Nada hardcodeado |
| **1. Abrir popup de login** | `sso-client.service.ts` → `buildLoginUrl()` | Arma `/sso/login?client_id&redirect_uri&state&theme`. La abre el front (ver `front/src/sso`) |
| **2. Escuchar postMessage** | *(front)* `front/src/sso/ssoLogin.ts` | Verifica `event.origin` y `state`. El backend aporta el `state` y el origen del SSO vía `GET /api/auth/sso/login-url` y lo re-verifica contra una cookie HttpOnly en el callback |
| **3. Canjear code por tokens** | `sso-client.service.ts` → `exchangeCode()` + `sso-token-validator.service.ts` | `POST /sso/token` desde el backend; luego se validan `iss`, `aud` y `exp` del JWT |
| **4. Identificar al usuario** | `sso-client.service.ts` → `getUserInfo()` | `GET /sso/me` con Bearer. Usa `sub` como ID, exige `aud == client_id`, lee `cargo` y `especialidad` |
| **5. Renovar tokens** | `sso-client.service.ts` → `refresh()` (orquestado en `auth/auth.service.ts`) | `POST /sso/refresh`. Se reemplazan ambos tokens. Un solo refresh en vuelo por sesión (evita el 401 por pedidos simultáneos). Un 4xx ⇒ sesión revocada |
| **6. Cerrar sesión** | `sso-client.service.ts` → `logout()` | `POST /sso/logout` y se borra la sesión local |
| **Seguridad: tokens fuera de localStorage** | `auth/` | Los tokens viven en la base (tabla `sessions`); al navegador solo llega una cookie HttpOnly con un ID opaco |
| **Seguridad: secret solo en backend** | `.env` | `/sso/token`, `/sso/refresh` y `/sso/logout` se llaman únicamente desde acá |

## Archivos

- `sso.constants.ts` — tokens de inyección y paths de los endpoints
- `sso-http.ts` — único punto de salida HTTP al SSO (timeout y traducción de errores, nunca loguea secretos)
- `sso-client.service.ts` — pasos 1, 3, 4, 5 y 6
- `sso-token-validator.service.ts` — validación de `iss`/`aud`/`exp`
- `sso-directory.service.ts` — referencia pública (cargos / especialidades)
- `utils/normalize.ts` — lectura tolerante de las respuestas (string u objeto `{name}`)
- `interfaces/` — contratos que consume el resto de la app

## Si algo no cierra con tu SSO

- **400 al canjear el code**: revisá `SSO_REDIRECT_URI` (debe ser idéntica a la del login) y si el SSO espera `client_id` como número en vez de string (`sso-client.service.ts`).
- **Cargos/especialidades vacíos**: ajustá `utils/normalize.ts` al formato real de `/sso/info/*`.
- **El panel de admin no aparece**: `STAFF_CARGOS` debe contener el cargo tal cual lo devuelve `domain-roles`. Al arrancar, el backend loguea los valores disponibles.
