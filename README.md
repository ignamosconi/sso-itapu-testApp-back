# ITAPU · Fechas de exámenes — Backend

API (NestJS + TypeORM + PostgreSQL) para publicar los horarios de exámenes finales **solo a usuarios autenticados con ITAPU SSO**.
Los PDFs se organizan en carpetas arbitrarias definidas por el admin; cada carpeta puede limitarse a ciertas especialidades.

## Arranque

```bash
cp .env.example .env        # completá SSO_CLIENT_ID / SSO_CLIENT_SECRET / DB_PASSWORD
npm install
npm run db:up               # Postgres en Docker (única pieza dockerizada)
npm run migration:run       # crea las tablas (o dejá DB_MIGRATIONS_RUN=true y se aplican al arrancar)
npm run start:dev           # http://localhost:3001/api  ·  Swagger: /api/docs
```

El SSO tiene que estar corriendo en `SSO_BASE_URL` (por defecto `http://localhost:3000`).

## Scripts

| Script | Qué hace |
|---|---|
| `npm run start:dev` | API con recarga |
| `npm test` / `npm run test:cov` | Tests unitarios (jest) |
| `npm run build` | Compila a `dist/` |
| `npm run db:up` / `db:down` / `db:logs` | Postgres en Docker |
| `npm run migration:run` / `migration:revert` / `migration:show` | Aplicar, deshacer o listar migraciones |
| `npm run migration:generate -- src/database/migrations/NombreDelCambio` | Genera una migración comparando las entidades con la base |
| `npm run migration:prod` | Aplica las migraciones desde `dist/` (después de `npm run build`; para CI/producción) |

## Arquitectura

```
src/
├─ sso/         ← TODO el acoplamiento con el SSO (leer sso/README.md: mapa paso a paso del mail)
├─ auth/        ← sesión propia de la app (cookie HttpOnly + tokens en la base), guards, política de acceso
├─ folders/     ← CRUD de carpetas + regla de visibilidad por especialidad
├─ files/       ← CRUD de PDFs (subida multipart, descarga con control de acceso)
├─ library/     ← navegación (la usan admin y alumno)
├─ directory/   ← cargos y especialidades vigentes en el SSO, para el front
├─ storage/     ← almacenamiento de PDFs (disco local detrás de IFileStorage)
├─ database/    ← entidades + repositorios por interfaz
├─ config/      ← configuración tipada + validación del .env
└─ common/      ← OriginGuard (defensa extra CSRF)
```

Cada feature sigue la misma forma: **controller → service → repository**, cada uno con su **interfaz**
(`interfaces/`), **DTOs** validados con `class-validator` y documentados en Swagger, y **tests** `*.spec.ts` al lado del código.
Los servicios reciben sus dependencias por token (`@Inject(FOLDER_REPOSITORY)`), así se pueden reemplazar o mockear.

## Endpoints

| | Ruta | Acceso |
|---|---|---|
| Auth | `GET /api/auth/sso/login-url` · `POST /api/auth/sso/callback` · `GET /api/auth/me` · `POST /api/auth/logout` | público / sesión |
| Biblioteca | `GET /api/library/browse?folderId&asStudent&previewSpecialty` | sesión |
| Carpetas | `POST/GET/GET:id/PATCH:id/DELETE:id /api/folders` | personal |
| PDFs | `POST /api/files` · `GET/PATCH/DELETE /api/files/:id` | personal |
| PDF (contenido) | `GET /api/files/:id/content` | sesión (alumno: solo si la carpeta es visible para su especialidad) |
| Directorio | `GET /api/directory` | personal |

Detalle y DTOs en Swagger: `http://localhost:3001/api/docs`.

## Base de datos y migraciones

El esquema **nunca** lo modifica la app sola (`synchronize` está apagado): todo cambio pasa por una migración versionada
en `src/database/migrations/`. Flujo para cambiar una entidad:

```bash
# 1. editá la entidad  2. generá la migración  3. revisala  4. aplicala
npm run migration:generate -- src/database/migrations/AgregaCampoX
npm run migration:run
```

- `DB_MIGRATIONS_RUN=true`: la app aplica las pendientes al arrancar (cómodo en desarrollo). En producción conviene `false` y
  correr `npm run build && npm run migration:prod` como paso del deploy.
- `DB_SSL=true` para Neon y otros Postgres gestionados (usar la cadena de conexión *pooled*).
- La conexión se define una sola vez (`src/database/typeorm-options.ts`) y la comparten la app y la CLI.

## Reglas de acceso

- **Personal** = usuario cuyo `cargo` (según `/sso/me`) está en `STAFF_CARGOS`. Ve el panel y todo el contenido.
  Al arrancar, el backend contrasta `STAFF_CARGOS` con `/sso/info/domain-roles` y avisa si un valor no existe.
- **Alumno** = cualquier otro cargo. Solo navega y descarga. Una carpeta con `allowedSpecialties` vacío es visible
  para todos; con valores, solo para esas especialidades (y la restricción se hereda a sus subcarpetas y PDFs).
  Lo que no puede ver, para él **no existe** (404).
- Las especialidades de las carpetas se validan contra `/sso/info/specialties`. No hay cargos ni especialidades hardcodeados.

## Seguridad

- El Client Secret solo vive en `.env` del backend; `/sso/token`, `/sso/refresh` y `/sso/logout` se llaman solo desde acá.
- Los tokens del SSO se guardan en la tabla `sessions`; el navegador solo recibe una cookie `HttpOnly` con un ID opaco.
- `state` aleatorio guardado en cookie HttpOnly y verificado en el callback; `iss`/`aud`/`exp` se validan en cada token recibido.
- Un solo refresh en vuelo por sesión (evita el 401 por renovaciones simultáneas). Si el SSO rechaza el refresh, la sesión local se elimina.
- Subida: solo `application/pdf` con cabecera `%PDF-`, tamaño máximo `MAX_PDF_SIZE_MB`, nombre interno `uuid.pdf` (sin path traversal).
- `OriginGuard`: los pedidos que modifican datos solo se aceptan desde `FRONTEND_ORIGIN` o este mismo backend.

## Para producción (fuera de este ejemplo)

- `COOKIE_SECURE=true` (HTTPS), `DB_SSL=true` y migraciones aplicadas en el deploy.
- Cifrar los tokens de la tabla `sessions` en reposo y/o guardar los PDFs en un storage privado (implementar `IFileStorage`).
- Si se corre más de una instancia, el "un refresh en vuelo" necesita un lock distribuido.
