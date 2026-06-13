/**
 * Espejo cliente del catálogo de capacidades (solo mensajes UI).
 * La autorización real la resuelve el servicio de acceso en BD_AUTH.
 */
export const CAPABILITY_CATALOG = [
  {
    id: "sql.exec.isa",
    label: "Ejecutar SQL en bitácora",
    denyLoggedOut: "Inicia sesión para ejecutar consultas SQL de la bitácora",
    denyForbidden: "No tienes permiso para ejecutar SQL en la bitácora",
  },
  {
    id: "sql.exec.mssql.paty",
    label: "Ejecutar SQL de escritura en PatyIA",
    denyLoggedOut: "Inicia sesión para ejecutar SQL en PatyIA",
    denyForbidden: "No tienes permiso para ejecutar SQL en PatyIA",
  },
  {
    id: "sql.exec.mssql.paty.instrucciones",
    label: "Actualizar instrucciones de PatyIA",
    denyLoggedOut: "Inicia sesión para guardar instrucciones",
    denyForbidden: "No tienes permiso para actualizar instrucciones",
  },
  {
    id: "sql.exec.mssql.clientesis",
    label: "Ejecutar SQL de escritura en ClientesIS",
    denyLoggedOut: "Inicia sesión para ejecutar SQL en ClientesIS",
    denyForbidden: "No tienes permiso para ejecutar SQL en ClientesIS",
  },
  {
    id: "langlab.guardar",
    label: "Guardar instrucciones de prompts",
    denyLoggedOut: "Inicia sesión para guardar instrucciones",
    denyForbidden: "No tienes permiso para guardar instrucciones",
  },
  {
    id: "signalr",
    label: "Notificaciones en tiempo real",
    denyLoggedOut: "Inicia sesión para recibir notificaciones en tiempo real",
    denyForbidden: "Sin permiso para notificaciones en tiempo real",
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

/** Alias legacy → capacidad canónica. */
export const LEGACY_CAP_MAP = {
  ejecutar_sql: "sql.exec.isa",
  ejecutar_mssql: "sql.exec.mssql.paty",
  ejecutar_mssql_instrucciones: "sql.exec.mssql.paty.instrucciones",
  guardar_langlab: "langlab.guardar",
};

export function resolveCapId(capOrLegacy) {
  return LEGACY_CAP_MAP[capOrLegacy] || capOrLegacy;
}
