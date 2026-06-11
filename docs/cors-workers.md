# CORS en Workers Jeff-Aporta

Fronts en **GitHub Pages** o **Live Server** (`http://127.0.0.1:*`) llaman al orquestador **`https://main-orchestrator.jeffaporta.workers.dev`** (URL en `front-shared/constants.js`).

## Orígenes permitidos

- `https://*.github.io`
- `http://localhost:*` / `http://127.0.0.1:*`
- `https://*.workers.dev`

## Fuente canónica

Copiar `front-shared/worker-swagger/cors.ts` → `{backend}/src/lib/cors.ts`

Incluye:

1. `handlePreflight` — `OPTIONS` → 204 + cabeceras
2. `jeffCorsMiddleware()` — hono/cors con origen reflejado
3. `withCors(res, origin)` — respuestas crudas de proxy (gateway)
4. `app.onError` / `app.notFound` — errores con CORS

## Gateway langlab

El catch-all devuelve `Response` de `fetch()` upstream; **debe** fusionar CORS en `proxy.ts` (no basta el middleware Hono).

## Verificar orquestador

```bash
curl -i -X OPTIONS "https://main-orchestrator.jeffaporta.workers.dev/api/session" \
  -H "Origin: http://127.0.0.1:5503" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: authorization,content-type"
```

Debe incluir `Access-Control-Allow-Origin: http://127.0.0.1:5503`.

## Cloudflare

Si el preflight falla sin `Access-Control-Allow-Origin`:

- Gateway/worker no desplegado — push + Actions
- Versión antigua sin `cors.ts` — redeploy
