/**
 * Ejemplos request/response con contexto para Swagger UI (OpenAPI 3).
 * Clave: "METHOD /path" (path literal OpenAPI, con {param}).
 */

export type ExampleDoc = {
  summary: string;
  description: string;
  value: unknown;
};

export type OperationExampleSet = {
  request?: Record<string, ExampleDoc>;
  responses?: Record<string, ExampleDoc>;
};

export function opKey(method: string, path: string): string {
  return `${method.toUpperCase()} ${path}`;
}

const JWT_SAMPLE =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJKQUdVREVMT0UiLCJ1c2VybmFtZSI6IkpBR1VREVMT0UifQ.example";

const authLoginReq: ExampleDoc = {
  summary: "Login lab (usuario activo)",
  description:
    "Usuario BD_AUTH con acceso a la app. En Swagger UI la contraseña se envía con codificación Caesar automática desde el panel superior.",
  value: { username: "JAGUDELOE", password: "••••" },
};

const authLoginOk: ExampleDoc = {
  summary: "JWT de sesión (30 días)",
  description:
    "Token Bearer para el resto de endpoints. Copia `token` en Authorize o usa el panel «JWT de prueba».",
  value: {
    ok: true,
    token: JWT_SAMPLE,
    tokenType: "Bearer",
    expiresAt: "2026-07-18T12:00:00.000Z",
    expiresInDays: 30,
    username: "JAGUDELOE",
    role: "ADMIN",
    app: "isa-patyia",
    capabilities: ["patyia.scrum", "sql.exec.isa"],
    capabilityCatalog: [{ id: "patyia.scrum", label: "Tableros SCRUM" }],
  },
};

const authTestOk: ExampleDoc = {
  summary: "JWT Swagger (1 hora)",
  description: "Mismo formato que login; claim `purpose=swagger-test`. Ideal para probar endpoints desde esta UI.",
  value: {
    ok: true,
    token: JWT_SAMPLE,
    tokenType: "Bearer",
    expiresAt: "2026-06-18T19:00:00.000Z",
    username: "JAGUDELOE",
    purpose: "swagger-test",
  },
};

const auth401: ExampleDoc = {
  summary: "Credenciales inválidas",
  description: "Usuario inexistente, inactivo o contraseña incorrecta.",
  value: { ok: false, error: "Credenciales inválidas" },
};

const auth429: ExampleDoc = {
  summary: "Penalización por intentos",
  description: "Demasiados fallos seguidos; espera `retryAfterSeconds` antes de reintentar.",
  value: { ok: false, error: "Demasiados intentos fallidos. Espera antes de reintentar.", retryAfterSeconds: 120 },
};

const bearer401: ExampleDoc = {
  summary: "JWT ausente o inválido",
  description: "Obtén token con POST /api/auth/test-token o pégalo en Authorize.",
  value: { ok: false, error: "Bearer token requerido" },
};

const healthOk: ExampleDoc = {
  summary: "Servicio operativo",
  description: "Health check estándar del Worker.",
  value: { ok: true, service: "example-api", version: "1.0.0" },
};

export const OPENAPI_OPERATION_EXAMPLES: Record<string, OperationExampleSet> = {
  [opKey("POST", "/api/auth/token")]: {
    request: { "application/json": authLoginReq },
    responses: { "200": authLoginOk, "401": auth401, "429": auth429 },
  },
  [opKey("POST", "/api/auth/test-token")]: {
    request: { "application/json": authLoginReq },
    responses: { "200": authTestOk, "401": auth401, "429": auth429 },
  },
  [opKey("GET", "/api/auth/me")]: {
    responses: {
      "200": {
        summary: "Claims del JWT activo",
        description: "Útil para depurar expiración y subject sin llamar al perfil completo.",
        value: { ok: true, username: "JAGUDELOE", role: "ADMIN", exp: 1780000000, sub: "JAGUDELOE" },
      },
      "401": bearer401,
    },
  },
  [opKey("GET", "/api/auth/profile")]: {
    responses: {
      "200": {
        summary: "Perfil + permisos",
        description: "Rol, apps permitidas y capacidades resueltas para el front.",
        value: {
          ok: true,
          username: "JAGUDELOE",
          role: "ADMIN",
          displayName: "Jeff Aporta",
          apps: ["isa-patyia", "jagudeloe-front"],
          capabilities: ["patyia.scrum", "sql.exec.isa"],
        },
      },
      "401": bearer401,
    },
  },
  [opKey("POST", "/api/auth/service-token")]: {
    request: {
      "application/json": {
        summary: "Token de integración SQL",
        description: "Solicita JWT acotado a un endpoint langlab/SQL según permisos del usuario.",
        value: { method: "POST", path: "/pg/langlab/exec" },
      },
    },
    responses: {
      "200": {
        summary: "Token de servicio emitido",
        description: "JWT de corta duración para llamadas server-to-server autorizadas.",
        value: { ok: true, token: JWT_SAMPLE, expiresAt: "2026-06-18T13:00:00.000Z" },
      },
      "403": { summary: "Sin permiso SQL", description: "El usuario no tiene scope para ese path.", value: { ok: false, error: "Sin permiso" } },
    },
  },
  [opKey("GET", "/api/session")]: {
    responses: {
      "200": {
        summary: "Sesión del usuario",
        description: "Estado de login para fronts ISA (username, rol, apps).",
        value: { ok: true, loggedIn: true, username: "JAGUDELOE", role: "ADMIN", app: "isa-patyia" },
      },
      "401": bearer401,
    },
  },
  [opKey("GET", "/api/services")]: {
    responses: {
      "200": {
        summary: "Apps y servicios visibles",
        description: "Catálogo filtrado por permisos del usuario autenticado.",
        value: {
          ok: true,
          apps: [
            { id: "isa-patyia", name: "ISA PatyIA", frontUrl: "https://jeff-aporta.github.io/isa-patyia/" },
            { id: "jagudeloe-front", name: "JAGUDELOE", frontUrl: "https://jeff-aporta.github.io/jagudeloe-front/" },
          ],
        },
      },
      "401": bearer401,
    },
  },
  [opKey("GET", "/")]: {
    responses: { "200": healthOk },
  },
  [opKey("GET", "/api/health")]: {
    responses: { "200": healthOk },
  },
  [opKey("GET", "/api/routes")]: {
    responses: {
      "200": {
        summary: "Tabla de enrutamiento",
        description: "Prefijos del orquestador → Worker destino.",
        value: {
          ok: true,
          routes: [
            { prefix: "/api/conversaciones", service: "conversations" },
            { prefix: "/api/scrum", service: "scrum" },
          ],
        },
      },
    },
  },
  [opKey("GET", "/api/catalog")]: {
    responses: {
      "200": {
        summary: "Catálogo de apps",
        description: "Metadatos de fronts y APIs del ecosistema Jeff-Aporta.",
        value: { ok: true, apps: [{ id: "isa-patyia", name: "ISA PatyIA", swaggerUrl: "https://main-orchestrator.jeffaporta.workers.dev/api/swagger" }] },
      },
    },
  },
  [opKey("GET", "/api/conversaciones")]: {
    responses: {
      "200": {
        summary: "Listado de hilos",
        description: "Conversaciones recientes del usuario (Neon BD_CONVERSACIONES).",
        value: {
          ok: true,
          rows: [{ iconversacion: 1, titulo: "Prueba Swagger", nombreUsuario: "JAGUDELOE", hilo: "general", updatedAt: "2026-06-18T10:00:00Z" }],
        },
      },
      "401": bearer401,
    },
  },
  [opKey("POST", "/api/conversaciones")]: {
    request: {
      "application/json": {
        summary: "Nueva conversación",
        description: "Crea hilo vacío antes de enviar el primer mensaje de chat.",
        value: { titulo: "Prueba Swagger", nombreUsuario: "JAGUDELOE", hilo: "general" },
      },
    },
    responses: {
      "201": {
        summary: "Conversación creada",
        description: "Usa `iconversacion` en GET /api/conversacion/{id}.",
        value: { ok: true, iconversacion: 42 },
      },
      "401": bearer401,
    },
  },
  [opKey("GET", "/api/conversacion/{id}")]: {
    responses: {
      "200": {
        summary: "Detalle con turnos",
        description: "Historial completo de mensajes user/assistant del hilo.",
        value: {
          ok: true,
          iconversacion: 1,
          titulo: "Prueba Swagger",
          turnos: [{ role: "user", content: "Hola PatyIA" }, { role: "assistant", content: "Hola, ¿en qué te ayudo?" }],
        },
      },
      "404": { summary: "No encontrada", description: "ID inexistente o sin permiso.", value: { ok: false, error: "no encontrada" } },
    },
  },
  [opKey("GET", "/api/conversacion/{id}/logs")]: {
    responses: {
      "200": {
        summary: "Logs técnicos del hilo",
        description: "Eventos de depuración (tokens, herramientas, errores).",
        value: { ok: true, rows: [{ ts: "2026-06-18T10:01:00Z", level: "info", message: "chat completion ok" }] },
      },
      "400": { summary: "ID inválido", description: "El path `{id}` debe ser numérico.", value: { ok: false, error: "id inválido" } },
    },
  },
  [opKey("GET", "/api/instrucciones")]: {
    responses: {
      "200": {
        summary: "Instrucciones IA",
        description: "Prompts publicados para el asistente (staging PatyIA).",
        value: { ok: true, rows: [{ id: 1, nombre: "default", activo: true }] },
      },
    },
  },
  [opKey("GET", "/api/tipos-consulta")]: {
    responses: {
      "200": {
        summary: "Tipos de consulta",
        description: "Clasificación de intenciones para routing del chat.",
        value: { ok: true, rows: [{ id: 1, codigo: "general", etiqueta: "General" }] },
      },
    },
  },
  [opKey("GET", "/api/scrum/boards")]: {
    responses: {
      "200": {
        summary: "Tableros visibles",
        description: "Filtrado por app (`?app=isa-patyia`) y membresía del usuario.",
        value: {
          ok: true,
          boards: [{
            id: "d4a008a4-aa13-4805-891d-b6949f8a66b7",
            title: "APP PatyIA Insoft",
            visibility: "public",
            myRole: "editor",
            publicSlug: "app-patyia-insoft-km91j2",
          }],
        },
      },
    },
  },
  [opKey("POST", "/api/scrum/boards")]: {
    request: {
      "application/json": {
        summary: "Crear tablero SCRUM",
        description: "Tres columnas por defecto: Pendiente, En progreso, Finalizado.",
        value: {
          title: "APP PatyIA Insoft",
          description: "Tareas de desarrollo",
          boardType: "scrum",
          visibility: "public",
          members: [{ username: "KEVIN", boardRole: "editor" }, { username: "VIVIANA", boardRole: "readonly" }],
        },
      },
    },
    responses: {
      "201": {
        summary: "Tablero creado",
        description: "Incluye columnas y slug público si `visibility=public`.",
        value: { ok: true, board: { id: "d4a008a4-aa13-4805-891d-b6949f8a66b7", title: "APP PatyIA Insoft", publicSlug: "app-patyia-insoft-km91j2" } },
      },
    },
  },
  [opKey("GET", "/api/scrum/boards/{id}")]: {
    responses: {
      "200": {
        summary: "Tablero completo",
        description: "Columnas, tareas, hitos y permisos efectivos.",
        value: {
          ok: true,
          board: { id: "d4a008a4-aa13-4805-891d-b6949f8a66b7", title: "APP PatyIA Insoft" },
          columns: [
            { id: "c1", columnKey: "pending", title: "Pendiente" },
            { id: "c2", columnKey: "in_progress", title: "En progreso" },
            { id: "c3", columnKey: "done", title: "Finalizado" },
          ],
          tasks: [],
        },
      },
    },
  },
  [opKey("POST", "/api/scrum/boards/{id}/tasks")]: {
    request: {
      "application/json": {
        summary: "Nueva tarea",
        description: "Indica `columnId` de la columna destino (p. ej. Pendiente).",
        value: { columnId: "c1", title: "Integrar lightbox en PatyIA", assignedTo: "KEVIN" },
      },
    },
    responses: {
      "201": {
        summary: "Tarea creada",
        description: "Usa el id en PATCH /api/scrum/tasks/{id} para mover entre columnas.",
        value: { ok: true, task: { id: "t1", title: "Integrar lightbox en PatyIA", columnId: "c1" } },
      },
    },
  },
  [opKey("GET", "/api/images")]: {
    responses: {
      "200": {
        summary: "Galería reciente",
        description: "Metadatos de imágenes subidas (sin bytes). Paginación con limit/offset.",
        value: { ok: true, items: [{ id: "demo-image", url: "https://flsjeff.jeffaporta.workers.dev/api/raw/uploads/demo.webp", mime: "image/webp" }] },
      },
    },
  },
  [opKey("POST", "/api/images")]: {
    request: {
      "multipart/form-data": {
        summary: "Subir imagen",
        description: "Campo `file` binario. Genera variantes y URLs en la respuesta.",
        value: { file: "(binary — selecciona archivo en Try it out)" },
      },
    },
    responses: {
      "201": {
        summary: "Imagen registrada",
        description: "Incluye id, deleteKey y URLs de variantes.",
        value: { ok: true, id: "demo-image", deleteKey: "delete-key-demo" },
      },
    },
  },
  [opKey("GET", "/api/tk/{space}/tickets")]: {
    responses: {
      "200": {
        summary: "Tickets del space",
        description: "Lista tk_* de PatyIA o ClientesIS con tiempo total acumulado.",
        value: { ok: true, rows: [{ iticket: "TK-1429373", titulo: "Mejora UX", activo: true }], tiempoTotalMinutos: 120 },
      },
    },
  },
  [opKey("POST", "/api/tk/{space}/tickets")]: {
    request: {
      "application/json": {
        summary: "Upsert ticket",
        description: "Crea o actualiza según iticket/título. Usado desde jagudeloe-front.",
        value: { titulo: "Ticket de prueba", solicitante: "swagger", descripcion: "Contexto para clasificación IA", resumen: "Upsert desde Swagger" },
      },
    },
    responses: {
      "200": {
        summary: "Ticket guardado",
        description: "JSON puro; el HTML se renderiza en el front.",
        value: { ok: true, iticket: "TK-1429373", titulo: "Ticket de prueba" },
      },
    },
  },
  [opKey("POST", "/api/tools/responses")]: {
    request: {
      "application/json": {
        summary: "Chat LLM",
        description: "Cascada cf-ai → Groq → Cerebras. Envía messages o content + system opcional.",
        value: { system: "Eres un asistente conciso.", messages: [{ role: "user", content: "Resume PatyIA en una línea." }] },
      },
    },
    responses: {
      "200": {
        summary: "Respuesta del modelo",
        description: "Indica provider/keyLabel usados para depuración de rotación.",
        value: { ok: true, content: "PatyIA es el asistente staging de InSoft.", provider: "cf-ai", keyLabel: "workers-ai" },
      },
    },
  },
  [opKey("POST", "/api/cf-ai/tools/text/responses")]: {
    request: {
      "application/json": {
        summary: "Texto vía Workers AI",
        description: "Mínimo: `content` con una pregunta. El worker elige modelo por defecto.",
        value: { content: "Resume Workers AI en 2 frases." },
      },
    },
    responses: {
      "200": {
        summary: "Inferencia OK",
        description: "Campo `model` indica el modelo Cloudflare usado.",
        value: { ok: true, tool: "text/responses", model: "@cf/meta/llama-3.1-8b-instruct-fast", data: { content: "Workers AI ejecuta modelos en la edge…" } },
      },
    },
  },
  [opKey("GET", "/api/isa/{project}/bitacora")]: {
    responses: {
      "200": {
        summary: "Bitácora del proyecto",
        description: "Segmentos markdown públicos; con JWT incluye transcripciones de video.",
        value: { ok: true, project: "patyia", segments: [{ id: "intro", title: "Introducción", mdPath: "bitacora/intro.md" }] },
      },
    },
  },
};
