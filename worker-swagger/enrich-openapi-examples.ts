/**
 * Inyecta ejemplos request/response con contexto en un OpenAPI 3.0 spec.
 */
import type { OpenApiSpec } from "./swagger.js";
import { OPENAPI_OPERATION_EXAMPLES, opKey, type ExampleDoc, type OperationExampleSet } from "./openapi-examples.js";

type MediaContent = Record<string, unknown>;

function hasExamples(media: MediaContent | undefined): boolean {
  if (!media) return false;
  return media.example != null || (media.examples != null && Object.keys(media.examples as object).length > 0);
}

function toOpenApiExamples(doc: ExampleDoc) {
  return {
    default: {
      summary: doc.summary,
      description: doc.description,
      value: doc.value,
    },
  };
}

function applyExampleToMedia(media: MediaContent, doc: ExampleDoc) {
  if (hasExamples(media)) return;
  media.examples = toOpenApiExamples(doc);
  media.example = doc.value;
}

function applyRequestExamples(
  requestBody: Record<string, unknown> | undefined,
  set: OperationExampleSet | undefined,
) {
  if (!requestBody?.content || !set?.request) return;
  const content = requestBody.content as Record<string, MediaContent>;
  for (const [mediaType, doc] of Object.entries(set.request)) {
    if (!content[mediaType]) continue;
    applyExampleToMedia(content[mediaType], doc);
  }
}

function applyResponseExamples(
  responses: Record<string, unknown> | undefined,
  set: OperationExampleSet | undefined,
  method: string,
  path: string,
  operation: Record<string, unknown>,
) {
  if (!responses) return;
  for (const [status, rawResp] of Object.entries(responses)) {
    if (!rawResp || typeof rawResp !== "object") continue;
    const resp = rawResp as Record<string, unknown>;
    const content = resp.content as Record<string, MediaContent> | undefined;
    if (!content?.["application/json"]) continue;
    const media = content["application/json"];
    if (hasExamples(media)) continue;

    const explicit = set?.responses?.[status];
    if (explicit) {
      applyExampleToMedia(media, explicit);
      continue;
    }

    const fallback = fallbackResponseExample(status, method, path, operation, resp.description);
    if (fallback) applyExampleToMedia(media, fallback);
  }
}

function fallbackResponseExample(
  status: string,
  method: string,
  path: string,
  operation: Record<string, unknown>,
  description?: unknown,
): ExampleDoc | null {
  const desc = String(description ?? "");
  const secured = Array.isArray(operation.security) && operation.security.length > 0;

  if (status === "401") {
    return {
      summary: "No autorizado",
      description: secured
        ? "Falta header Authorization: Bearer o el JWT expiró."
        : "Credenciales o token inválidos.",
      value: { ok: false, error: secured ? "Bearer token requerido" : "Credenciales inválidas" },
    };
  }
  if (status === "403") {
    return {
      summary: "Prohibido",
      description: "El JWT es válido pero el usuario no tiene permiso para esta operación.",
      value: { ok: false, error: "Sin permiso" },
    };
  }
  if (status === "404") {
    return {
      summary: "No encontrado",
      description: `Recurso inexistente en ${method.toUpperCase()} ${path}.`,
      value: { ok: false, error: "No encontrado" },
    };
  }
  if (status === "429") {
    return {
      summary: "Demasiadas peticiones",
      description: "Penalización temporal (login o rate limit).",
      value: { ok: false, error: "Demasiados intentos", retryAfterSeconds: 60 },
    };
  }
  if (status === "503") {
    return {
      summary: "Servicio no disponible",
      description: "BD o dependencia externa caída.",
      value: { ok: false, error: "Servicio no disponible", detail: "Reintenta en unos segundos" },
    };
  }
  if (status === "400") {
    return {
      summary: "Petición inválida",
      description: "Revisa parámetros de path/query o el JSON del body.",
      value: { ok: false, error: "Parámetros inválidos" },
    };
  }
  if (status.startsWith("2")) {
    return {
      summary: desc || "Respuesta exitosa",
      description: `Resultado esperado de ${method.toUpperCase()} ${path}. Ajusta según el schema.`,
      value: { ok: true, data: null, _endpoint: `${method.toUpperCase()} ${path}` },
    };
  }
  return null;
}

function fallbackRequestExample(
  method: string,
  path: string,
  requestBody: Record<string, unknown>,
): OperationExampleSet["request"] | undefined {
  const content = requestBody.content as Record<string, MediaContent> | undefined;
  if (!content) return undefined;

  if (content["application/json"] && !hasExamples(content["application/json"])) {
    return {
      "application/json": {
        summary: "Cuerpo JSON de ejemplo",
        description: `Payload mínimo para ${method.toUpperCase()} ${path}. Completa campos requeridos del schema.`,
        value: {},
      },
    };
  }
  if (content["multipart/form-data"] && !hasExamples(content["multipart/form-data"])) {
    return {
      "multipart/form-data": {
        summary: "Multipart",
        description: "Adjunta archivo en Try it out (campo file/binary del schema).",
        value: { file: "(binary)" },
      },
    };
  }
  return undefined;
}

function enrichOperation(method: string, path: string, operation: Record<string, unknown>) {
  const key = opKey(method, path);
  const set = OPENAPI_OPERATION_EXAMPLES[key];

  applyRequestExamples(operation.requestBody as Record<string, unknown>, set);
  if (!set?.request && operation.requestBody) {
    const fb = fallbackRequestExample(method, path, operation.requestBody as Record<string, unknown>);
    if (fb) applyRequestExamples(operation.requestBody as Record<string, unknown>, { request: fb });
  }

  applyResponseExamples(
    operation.responses as Record<string, unknown>,
    set,
    method,
    path,
    operation,
  );
}

/** Añade ejemplos con explicación contextual a todas las operaciones del spec. */
export function enrichOpenApiWithExamples(spec: OpenApiSpec): OpenApiSpec {
  const paths = spec.paths ?? {};
  const nextPaths: Record<string, unknown> = {};

  for (const [path, pathItem] of Object.entries(paths)) {
    if (!pathItem || typeof pathItem !== "object") {
      nextPaths[path] = pathItem;
      continue;
    }
    const item = { ...(pathItem as Record<string, unknown>) };
    for (const method of ["get", "post", "put", "patch", "delete", "options", "head"]) {
      const op = item[method];
      if (!op || typeof op !== "object") continue;
      const cloned = { ...(op as Record<string, unknown>) };
      enrichOperation(method, path, cloned);
      item[method] = cloned;
    }
    nextPaths[path] = item;
  }

  return { ...spec, paths: nextPaths };
}
