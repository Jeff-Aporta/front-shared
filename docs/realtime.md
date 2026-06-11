# Realtime (WebSocket) — Jeff-Aporta

Notificaciones en tiempo real vía **Cloudflare Durable Objects** en el orquestador (`main-orchestrator`).

## Endpoint

| Ruta | Uso |
|------|-----|
| `WS /api/ws` | Conexión WebSocket (desde `wss://{orquestador}/api/ws`) |
| `GET /` | Salud (sin prefijo `/api`) |

Tras un `POST /api/isa/{project}/checks` exitoso, el orquestador emite a todos los clientes conectados:

```json
{
  "type": "checks.updated",
  "project": "patyia",
  "revisadoKey": "patyia:bitacora:2026-06-10",
  "checked": true,
  "at": 1718112000000
}
```

## front-shared (CDN)

| Módulo | Descripción |
|--------|-------------|
| `cdn/isa/js/core/realtime.js` | Cliente WebSocket + reconexión + evento `isa:realtime` |
| `cdn/isa/js/ui/toast.js` | Toasts DOM ligeros (`ISAFront.showToast`) |

Registro en cada front:

```javascript
ISAFront.registerApp({
  ns: "ISAJ",
  realtime: true,  // conecta a wss://{Config.base()}/api/ws
  toast: true,     // window.ISAJ.Toast.show({ message, severity })
});
```

Escuchar mensajes:

```javascript
window.addEventListener(ISAFront.REALTIME_EVENT, (e) => {
  const msg = e.detail;
  if (msg.type === ISAFront.REALTIME.CHECKS_UPDATED) { /* … */ }
});
```

## jagudeloe (implementado)

- `js/ui/realtime.tsx` — hook `useRealtimeNotifications`
- `App.tsx` — toast + recarga checks al recibir `checks.updated`
- SignalR eliminado del `index.html`

## Añadir a otro front

1. `registerApp({ realtime: true })` en `isa-setup.ts`
2. Copiar/adaptar `realtime.tsx` o escuchar `isa:realtime`
3. Mostrar toast con `window.{NS}.Toast.show(...)`

Requiere **Workers Paid** o migración `new_sqlite_classes` para Durable Objects (configurado en `main-orchestrator/backend/wrangler.toml`).
