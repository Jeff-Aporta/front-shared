# CORS en Workers Jeff-Aporta

Fronts en **GitHub Pages** (`https://jeff-aporta.github.io/...`) llaman APIs en `*.jeffaporta.workers.dev`.

## Orígenes permitidos

- `https://*.github.io` (p. ej. `https://jeff-aporta.github.io`)
- `http://localhost:*` / `http://127.0.0.1:*`
- `https://*.workers.dev` (pruebas entre workers)

## Patrón Hono (`src/lib/cors.ts`)

Copiar desde `system-login/backend/src/lib/cors.ts`:

1. `handlePreflight` — responde `OPTIONS` con 204 + cabeceras
2. `jeffCorsMiddleware()` — middleware hono/cors con origen reflejado
3. `app.onError` / `app.notFound` — incluir `corsHeaders(origin)` para que errores no rompan CORS

## Cloudflare

No hace falta regla extra en el dashboard si el Worker devuelve las cabeceras. Si el preflight falla **sin** `Access-Control-Allow-Origin`, suele ser:

- Worker no desplegado o caído (secretos `AUTH_DATABASE_URL`, `LAB_JWT_SECRET`)
- Versión antigua sin middleware CORS — redeploy tras push a `main`

## Verificar

```bash
curl -i -X OPTIONS "https://system-login.jeffaporta.workers.dev/auth/token" \
  -H "Origin: https://jeff-aporta.github.io" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type"
```

Debe incluir `Access-Control-Allow-Origin: https://jeff-aporta.github.io`.
