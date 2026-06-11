# Swagger / OpenAPI — Workers Jeff-Aporta

Cada backend expone documentación bajo **`/api/`** (salud en `/`).

## Arquitectura
![Diagrama de arquitectura](https://mermaid.ink/img/JSV7aW5pdDogeyJmbG93Y2hhcnQiOiB7ImN1cnZlIjogInN0ZXBBZnRlciIsICJodG1sTGFiZWxzIjogdHJ1ZSwgIm5vZGVTcGFjaW5nIjogNDQsICJyYW5rU3BhY2luZyI6IDUyLCAicGFkZGluZyI6IDE4fX19JSUKZmxvd2NoYXJ0IExSCiAgQ0FOT05bd29ya2VyLXN3YWdnZXIgY2Fuw7NuaWNvXQogIHN1YmdyYXBoIHdvcmtlcnMgW0NhZGEgKi1iYWNrXQogICAgU1dbc3JjL2xpYi9zd2FnZ2VyLnRzXQogICAgVUlbIkdFVCAvYXBpL3VpIGRhcmsiXQogICAgRE9DWyJHRVQgL2FwaS9kb2MiXQogICAgQVVUSFsiUE9TVCAvYXBpL2F1dGgvdGVzdC10b2tlbiJdCiAgZW5kCiAgU0xbc3lzdGVtLWxvZ2luXQogIENBTk9OIC0tPnxjb3BpYXJ8IFNXCiAgU1cgLS0-IFVJICYgRE9DICYgQVVUSAogIEFVVEggLS0-fHByb3h5fCBTTA==)

> **Fuente del diagrama:** [`docs/arquitectura.mmd`](docs/arquitectura.mmd) — editar el `.mmd`; regenerar imagen: `node scripts/mermaid-ink-url.mjs front-shared/worker-swagger/docs/arquitectura.mmd` (desde `apps/`).

| Ruta | Contenido |
|------|-----------|
| `GET /` | Health JSON |
| `GET /api/doc` | Especificación OpenAPI 3.0 (`openapi.json`) |
| `GET /api/ui` | Swagger UI interactiva (dark mode) + panel JWT de prueba + enlace al front GH Pages |
| `POST /api/auth/token` | Proxy → system-login (excepto system-login nativo) |
| `POST /api/auth/test-token` | Proxy → system-login — JWT Swagger 1 h |

## JWT de prueba en Swagger

Todas las UIs incluyen un panel **«JWT de prueba (1 hora)»** arriba de la documentación:

1. Ingresa usuario y contraseña de la organización.
2. El panel llama `POST /api/auth/test-token` en **el mismo Worker** (proxy a system-login).
3. El JWT se aplica automáticamente al esquema **Bearer** de Swagger.

```
POST /api/auth/test-token
{ "username": "…", "password": "…" }   // contraseña con transporte César (automático en el panel)
```

Respuesta: JWT con `purpose=swagger-test` y expiración **1 hora**.

- Auth real: `https://system-login.jeffaporta.workers.dev`
- Local auth: `http://localhost:8781` (el proxy lo resuelve en `wrangler dev`)

Login normal de apps (`POST /api/auth/token`) sigue emitiendo JWT de **30 días**.

## Enlace al front (GitHub Pages)

Al final de cada Swagger UI aparece un pie con el panel GH Pages del servicio (si existe). Configuración en `mountSwagger`:

- `serviceId` — lookup en `GH_PAGES_FRONTS` (flsjeff, jagudeloe, …)
- `frontUrl` / `frontLabel` — override manual (p. ej. jagudeloe-tks → jagudeloe-front)
- `frontLinks` — lista de enlaces (Swagger agregado del orquestador)

## Integración

1. Copiar `swagger.ts`, `openapi-params.ts` y `auth-proxy.ts` → `{backend}/src/lib/`
2. Crear `{backend}/src/openapi/spec.ts` con paths del servicio + `...authOpenApiPaths()`. Usar helpers de `openapi-params.ts` (`pathEnum`, `tkSpaceParam`, etc.) para selects y valores de prueba.
3. En `index.ts`:

```typescript
import { mountAuthProxy } from "./lib/auth-proxy.js";
import { mountSwagger } from "./lib/swagger.js";
import { openApiSpec } from "./openapi/spec.js";

// No montar mountAuthProxy en system-login (rutas nativas).
mountAuthProxy(app);
mountSwagger(app, openApiSpec);
```

4. Dependencias: `@hono/swagger-ui`, `hono`

Swagger UI se carga en **v5.31+** con clase `dark-mode` en `<html>` (tema oscuro fijo).

## Actualizar documentación

Editar `src/openapi/spec.ts` cuando agregues rutas. Para parámetros restringidos preferir `pathEnum` / `queryEnum` (renderizan `<select>` en Swagger UI) y `default` + `example` para Try it out.

Tras cambiar `swagger.ts`, `openapi-params.ts` o `auth-proxy.ts` canónicos, volver a copiar a todos los backends y **desplegar** los Workers.
