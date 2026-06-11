# Deploy Cloudflare Workers — checklist Jeff-Aporta

## Token GitHub Actions

Usar plantilla **Edit Cloudflare Workers** en [API Tokens](https://dash.cloudflare.com/profile/api-tokens).

No usar `FILESTORE_API_TOKEN` (solo R2) → error `Authentication error [code: 10000]`.

Configurar todos los repos:

```powershell
$env:CLOUDFLARE_API_TOKEN = "<Workers Edit token>"
.\apps\front-shared\worker-swagger\setup-all-gh-secrets.ps1
```

## Swagger (pruebas)

Cada Worker expone:

| Ruta | Uso |
|------|-----|
| `/` | Health JSON |
| `/api/doc` | OpenAPI 3.0 |
| `/api/ui` | Swagger UI + panel **JWT de prueba** |
| `POST /api/auth/test-token` | Proxy → system-login (JWT 1 h para Swagger) |
| `POST /api/auth/token` | Proxy → system-login (login normal) |

En `/api/ui`: barra superior con **Iniciar sesión** (usuario/contraseña → JWT 1 h) y **Pegar JWT** (token manual). El botón **Authorize** nativo de Swagger UI sigue disponible.
Auth real siempre en **system-login**; los demás Workers solo hacen proxy.

| Servicio | Swagger UI |
|----------|------------|
| **main-orchestrator** | https://main-orchestrator.jeffaporta.workers.dev/api/ui |
| **main-orchestrator (hub)** | https://jeff-aporta.github.io/main-orchestrator-front/ |
| flsjeff | https://flsjeff.jeffaporta.workers.dev/api/ui |
| system-login | https://system-login.jeffaporta.workers.dev/api/ui |
| iatools | https://iatools.jeffaporta.workers.dev/api/ui |
| conversations | https://conversations.jeffaporta.workers.dev/api/ui |
| jagudeloe | https://jagudeloe.jeffaporta.workers.dev/api/ui |

Los **fronts** usan solo `MAIN_ORCHESTRATOR_URL_PROD` en front-shared. Borrar worker CF `langlab` tras migrar.

## Badge rojo en GitHub

Si el último **push** falló por token/secretos faltantes pero ya corregiste los secretos, haz un push vacío o `workflow_dispatch` desde Actions. El badge refleja el último run en `main`.
