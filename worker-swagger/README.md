# Swagger / OpenAPI — Workers Jeff-Aporta

Cada backend expone:

| Ruta | Contenido |
|------|-----------|
| `GET /doc` | Especificación OpenAPI 3.0 (`openapi.json`) |
| `GET /ui` | Swagger UI interactiva + panel JWT de prueba |

## JWT de prueba en Swagger

Todas las UIs incluyen un panel **«JWT de prueba (1 hora)»** que llama a system-login:

```
POST {system-login}/auth/test-token
{ "username": "…", "password": "…" }   // contraseña con transporte César (automático en el panel)
```

Respuesta: JWT con `purpose=swagger-test` y expiración **1 hora**. El token se aplica automáticamente al esquema **Bearer** de Swagger.

- Producción auth: `https://system-login.jeffaporta.workers.dev`
- Local auth: `http://localhost:8781` (detectado en el navegador)

Login normal de apps (`POST /auth/token`) sigue emitiendo JWT de **30 días**.

## Integración

1. Copiar `swagger.ts` → `{backend}/src/lib/swagger.ts`
2. Crear `{backend}/src/openapi/spec.ts` con paths del servicio
3. En `index.ts`:

```typescript
import { mountSwagger } from "./lib/swagger.js";
import { openApiSpec } from "./openapi/spec.js";

mountSwagger(app, openApiSpec);
```

4. Dependencias: `@hono/swagger-ui`, `zod` (schemas futuros con `@hono/zod-openapi`)

## Actualizar documentación

Editar `src/openapi/spec.ts` cuando agregues rutas. Opcional: migrar rutas a `createRoute` + `app.openapi()` para autogeneración con Zod.

Tras cambiar `swagger.ts` canónico, volver a copiar a todos los backends.
