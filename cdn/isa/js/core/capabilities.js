/**
 * Espejo cliente del cat?logo de capacidades (solo mensajes UI).
 * La autorizaci?n real la resuelve el servicio de acceso en BD_AUTH.
 */
export const CAPABILITY_CATALOG = [
  {
    id: "sql.exec.isa",
    label: "Ejecutar SQL en bit?cora",
    denyLoggedOut: "Inicia sesi?n para ejecutar consultas SQL de la bit?cora",
    denyForbidden: "No tienes permiso para ejecutar SQL en la bit?cora",
  },
  {
    id: "sql.exec.mssql.paty",
    label: "Ejecutar SQL de escritura en PatyIA",
    denyLoggedOut: "Inicia sesi?n para ejecutar SQL en PatyIA",
    denyForbidden: "No tienes permiso para ejecutar SQL en PatyIA",
  },
  {
    id: "sql.exec.mssql.paty.instrucciones",
    label: "Actualizar instrucciones de PatyIA",
    denyLoggedOut: "Inicia sesi?n para guardar instrucciones",
    denyForbidden: "No tienes permiso para actualizar instrucciones",
  },
  {
    id: "sql.exec.mssql.clientesis",
    label: "Ejecutar SQL de escritura en ClientesIS",
    denyLoggedOut: "Inicia sesi?n para ejecutar SQL en ClientesIS",
    denyForbidden: "No tienes permiso para ejecutar SQL en ClientesIS",
  },
  {
    id: "langlab.guardar",
    label: "Guardar instrucciones de prompts",
    denyLoggedOut: "Inicia sesi?n para guardar instrucciones",
    denyForbidden: "No tienes permiso para guardar instrucciones",
  },
  {
    id: "signalr",
    label: "Notificaciones en tiempo real",
    denyLoggedOut: "Inicia sesi?n para recibir notificaciones en tiempo real",
    denyForbidden: "Sin permiso para notificaciones en tiempo real",
  },
  {
    id: "cf-ai.tools",
    label: "Workers AI (cf-ai)",
    denyLoggedOut: "Inicia sesi?n para usar Workers AI",
    denyForbidden: "No tienes permiso para invocar cf-ai",
  },
  {
    id: "sql.query.db",
    label: "Consultas BD en lenguaje natural",
    denyLoggedOut: "Inicia sesi?n para consultar la base de datos",
    denyForbidden: "No tienes permiso para consultas BD en lenguaje natural",
  },
  {
    id: "sql.query.tk",
    label: "Consultas SELECT en tickets (BD_ISADOC)",
    denyLoggedOut: "Inicia sesi?n para consultar tickets",
    denyForbidden: "No tienes permiso para consultar tickets en BD",
  },
  {
    id: "sql.query.mssql.paty",
    label: "Consultas SELECT en Paty staging (MSSQL)",
    denyLoggedOut: "Inicia sesi?n para consultar Paty staging",
    denyForbidden: "No tienes permiso para consultar MSSQL Paty",
  },
];

const BY_ID = new Map(CAPABILITY_CATALOG.map((c) => [c.id, c]));

export function getCapabilityMeta(id) {
  return BY_ID.get(id);
}

export function blockReasonFor(capId, { loggedIn, username }) {
  const meta = BY_ID.get(capId);
  if (!meta) return "Permiso no configurado";
  if (!loggedIn) return meta.denyLoggedOut;
  if (username) {
    return meta.denyForbidden;
  }
  return meta.denyForbidden;
}

/** Alias legacy ? capacidad can?nica. */
export const LEGACY_CAP_MAP = {
  ejecutar_sql: "sql.exec.isa",
  ejecutar_mssql: "sql.exec.mssql.paty",
  ejecutar_mssql_instrucciones: "sql.exec.mssql.paty.instrucciones",
  guardar_langlab: "langlab.guardar",
};

export function resolveCapId(capOrLegacy) {
  return LEGACY_CAP_MAP[capOrLegacy] || capOrLegacy;
}
