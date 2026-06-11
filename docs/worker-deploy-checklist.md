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
| `/doc` | OpenAPI 3.0 |
| `/ui` | Swagger UI |

| Servicio | Swagger UI |
|----------|------------|
| flsjeff | https://flsjeff.jeffaporta.workers.dev/ui |
| system-login | https://system-login.jeffaporta.workers.dev/ui |
| iatools | https://iatools.jeffaporta.workers.dev/ui |
| conversations | https://conversations.jeffaporta.workers.dev/ui |
| jagudeloe | https://jagudeloe.jeffaporta.workers.dev/ui |

## Badge rojo en GitHub

Si el último **push** falló por token/secretos faltantes pero ya corregiste los secretos, haz un push vacío o `workflow_dispatch` desde Actions. El badge refleja el último run en `main`.
