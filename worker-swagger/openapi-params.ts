/**
 * Parámetros OpenAPI 3.0 con tipos adecuados para Swagger UI (select, defaults, ejemplos).
 * Copiar a {backend}/src/lib/openapi-params.ts junto con swagger.ts.
 */

export type OpenApiParameter = {
  name: string;
  in: "path" | "query" | "header" | "cookie";
  required?: boolean;
  description?: string;
  schema: Record<string, unknown>;
};

function pathParam(
  name: string,
  schema: Record<string, unknown>,
  opts?: { description?: string },
): OpenApiParameter {
  return { name, in: "path", required: true, description: opts?.description, schema };
}

function queryParam(
  name: string,
  schema: Record<string, unknown>,
  opts?: { required?: boolean; description?: string },
): OpenApiParameter {
  return { name, in: "query", required: opts?.required, description: opts?.description, schema };
}

/** Path con enum → `<select>` en Swagger UI. */
export function pathEnum(
  name: string,
  values: readonly string[],
  opts?: { description?: string; example?: string },
): OpenApiParameter {
  const sample = opts?.example ?? values[0];
  return pathParam(
    name,
    { type: "string", enum: [...values], default: sample, example: sample },
    opts,
  );
}

export function pathString(name: string, example: string, description?: string): OpenApiParameter {
  return pathParam(name, { type: "string", default: example, example }, { description });
}

export function pathInteger(name: string, example: number, description?: string): OpenApiParameter {
  return pathParam(
    name,
    { type: "integer", format: "int64", default: example, example },
    { description },
  );
}

export function queryInteger(
  name: string,
  defaultValue: number,
  opts?: { description?: string; minimum?: number; maximum?: number },
): OpenApiParameter {
  const schema: Record<string, unknown> = {
    type: "integer",
    default: defaultValue,
    example: defaultValue,
  };
  if (opts?.minimum != null) schema.minimum = opts.minimum;
  if (opts?.maximum != null) schema.maximum = opts.maximum;
  return queryParam(name, schema, { description: opts?.description });
}

export function queryEnum(
  name: string,
  values: readonly string[],
  defaultValue?: string,
  description?: string,
): OpenApiParameter {
  const sample = defaultValue ?? values[0];
  return queryParam(
    name,
    { type: "string", enum: [...values], default: sample, example: sample },
    { description },
  );
}

export function queryBoolString(name: string, description?: string): OpenApiParameter {
  return queryEnum(name, ["true", "false", "1", "0"], "true", description);
}

export function queryString(name: string, example: string, description?: string): OpenApiParameter {
  return queryParam(name, { type: "string", default: example, example }, { description });
}

export const queryLimit = (def = 50, max = 500) =>
  queryInteger("limit", def, { description: "Máximo de filas", minimum: 1, maximum: max });

export const queryOffset = (def = 0) =>
  queryInteger("offset", def, { description: "Desplazamiento (paginación)", minimum: 0 });

// --- Valores de prueba (dominio Jeff-Aporta) ---

export const TK_SPACES = ["patyia", "clientesis"] as const;
export const TK_TICKET_ID = "TK-1429373";

export const ISA_PROJECTS = ["isa-doc", "patyia", "clientesis"] as const;
export const ENTITY_PAGE = "catalogo";
export const ENTITY_SLUG = "proyecto";
export const ENTITY_PK = "1";

export const CONVERSATION_ID = 1;
export const FLSJEFF_FILE_ID = "demo-image";

export const IATOOLS_CAPABILITIES = [
  "responses",
  "speech2text",
  "text2speech",
  "embeddings",
  "rerank",
  "proofread",
  "chat",
  "whisper",
] as const;

export const tkSpaceParam = () =>
  pathEnum("space", TK_SPACES, { description: "Space de tickets tk_* (proyecto)" });

export const tkTicketParam = () =>
  pathString("iticket", TK_TICKET_ID, "ID del ticket (`TK-1429373` o numérico en seed)");

export const isaProjectParam = () =>
  pathEnum("project", ISA_PROJECTS, { description: "Proyecto ISA / bitácora" });

export const entityProjectParam = () =>
  pathEnum("project", ISA_PROJECTS, {
    example: "isa-doc",
    description: "Proyecto (patyia, clientesis…)",
  });

export const entityPageParam = () =>
  pathString("page", ENTITY_PAGE, "Sección/página dentro del proyecto");

export const entitySlugParam = () =>
  pathString("entity", ENTITY_SLUG, "Slug del tipo de entidad (catálogo)");

export const entityPkParam = () =>
  pathString("ientityid", ENTITY_PK, "Identificador de la fila");

export const conversationIdParam = () =>
  pathInteger("id", CONVERSATION_ID, "ID numérico de la conversación");

export const flsjeffIdParam = () =>
  pathString("id", FLSJEFF_FILE_ID, "ID del recurso en R2/Neon");

export const flsjeffRawKeyParam = () =>
  pathString("key", "uploads/demo-image.webp", "Clave del objeto en R2");
