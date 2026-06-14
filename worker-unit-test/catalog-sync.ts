import type { UnitTestPathEntry, UnitTestProtocol, UnitTestRootSummary } from "./types.js";

/** Normaliza path OpenAPI → clave comparable */
export function pathKey(method: string, path: string): string {
  return `${method.toUpperCase()} ${path}`;
}

export function splitOpenApiPaths(
  openApiPaths: Record<string, Record<string, unknown>>,
): { method: string; path: string }[] {
  const out: { method: string; path: string }[] = [];
  for (const [path, ops] of Object.entries(openApiPaths || {})) {
    for (const method of Object.keys(ops || {})) {
      if (["get", "post", "put", "patch", "delete", "head"].includes(method.toLowerCase())) {
        out.push({ method: method.toUpperCase(), path });
      }
    }
  }
  return out;
}

export function buildRootUnitTestSummary(
  protocol: UnitTestProtocol,
  openApiPaths: Record<string, Record<string, unknown>>,
  apiPrefix = "/api",
): UnitTestRootSummary {
  const openapiKeys = new Set(
    splitOpenApiPaths(openApiPaths).map((p) => pathKey(p.method, p.path)),
  );
  const catalogKeys = new Set(protocol.paths.map((p) => pathKey(p.method, p.path)));

  const missingInCatalog: string[] = [];
  for (const k of openapiKeys) {
    if (!catalogKeys.has(k)) missingInCatalog.push(k);
  }
  const extraInCatalog: string[] = [];
  for (const k of catalogKeys) {
    if (!openapiKeys.has(k)) extraInCatalog.push(k);
  }

  const testable = protocol.paths.filter((p) => !p.omit);
  const omit = protocol.paths.filter((p) => p.omit);

  return {
    run: `${apiPrefix}/run-unit-test`,
    catalog: `${apiPrefix}/unit-test-catalog.json`,
    pathCount: protocol.paths.length,
    testableCount: testable.length,
    omitCount: omit.length,
    sequenceCount: protocol.sequences.length,
    inSync: missingInCatalog.length === 0 && extraInCatalog.length === 0,
    missingInCatalog,
    extraInCatalog,
  };
}

export function contextMarkdown(
  protocol: UnitTestProtocol,
  summary: UnitTestRootSummary,
  opts?: { jwt?: boolean },
): string {
  const testable = protocol.paths.filter((p) => !p.omit);
  const omitted = protocol.paths.filter((p) => p.omit);
  const lines = [
    `## Test unitario — ${protocol.serviceName}`,
    "",
    `**Servicio:** \`${protocol.service}\` · **Secuencias:** ${protocol.sequences.length}`,
    "",
    opts?.jwt
      ? "✅ **JWT de sesión detectado** — los pasos que lo requieren se ejecutan."
      : "⚠️ **Sin JWT** — inicia sesión en Swagger para probar publish (403 vía orquestador).",
    "",
    "ℹ️ Fallos `ENOTFOUND` / `Failed to connect to mssql` indican **red/VPN hacia MSSQL**, no autenticación.",
    "",
    "### Paths a probar",
    ...testable.map((p) => `- \`${p.method} ${p.path}\` — ${p.nombre}`),
    "",
    "### Omitidos (utilerías / sin sentido de test)",
    ...(omitted.length
      ? omitted.map((p) => `- \`${p.method} ${p.path}\` — ${p.omitReason || p.omit}`)
      : ["- _(ninguno)_"]),
    "",
    summary.inSync
      ? "✅ Catálogo **sincronizado** con OpenAPI."
      : `⚠️ **Desincronizado:** faltan ${summary.missingInCatalog.length}, sobran ${summary.extraInCatalog.length} en catálogo.`,
    "",
    `IDs de prueba: usuario \`${protocol.testIds.user}\`, conv \`${protocol.testIds.conversation}\`.`,
  ];
  return lines.join("\n");
}

export function defaultOmitReason(kind: UnitTestPathEntry["omit"]): string {
  switch (kind) {
    case "health":
      return "Health/ping — utilería operativa, no requiere test funcional.";
    case "options":
      return "OPTIONS — CORS preflight, no requiere test.";
    case "meta":
      return "Meta/documentación — no es lógica de negocio.";
    case "docs":
      return "Swagger/OpenAPI — utilería de documentación.";
    case "websocket":
      return "WebSocket — fuera del alcance del runner HTTP.";
    default:
      return "Omitido del protocolo.";
  }
}
