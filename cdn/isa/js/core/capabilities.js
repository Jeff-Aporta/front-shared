/**
 * Espejo cliente del catálogo de capacidades (solo mensajes UI).
 * La autorización real la resuelve system-login en BD_AUTH.
 */
export const CAPABILITY_CATALOG = [
  {
    id: "sql.exec.isa",
    label: "Ejecutar SQL en bitácora ISA",
    denyLoggedOut: "Inicia sesión en JAGUDELOE para ejecutar consultas SQL de la bitácora",
    denyForbidden:
      "La ejecución SQL en bitácora es un servicio exclusivo de JAGUDELOE (no basta con acceder a la app)",
  },
  {
    id: "sql.exec.mssql.paty",
    label: "Ejecutar SQL de escritura en PatyIA (MSSQL staging)",
    denyLoggedOut: "Inicia sesión para ejecutar SQL en PatyIA staging",
    denyForbidden:
      "No tienes permiso para ejecutar SQL en PatyIA. Solo JAGUDELOE u operadores autorizados pueden hacerlo",
  },
  {
    id: "sql.exec.mssql.paty.instrucciones",
    label: "Actualizar instrucciones INSTRUCCION en PatyIA staging",
    denyLoggedOut: "Inicia sesión para guardar instrucciones en PatyIA",
    denyForbidden: "Sin permiso para actualizar INSTRUCCION en PatyIA staging",
  },
  {
    id: "sql.exec.mssql.clientesis",
    label: "Ejecutar SQL de escritura en ClientesIS (MSSQL)",
    denyLoggedOut: "Inicia sesión para ejecutar SQL en ClientesIS",
    denyForbidden: "No tienes permiso para ejecutar SQL en ClientesIS",
  },
  {
    id: "langlab.guardar",
    label: "Guardar instrucciones en LangLab",
    denyLoggedOut: "Inicia sesión para guardar instrucciones",
    denyForbidden: "Sin permiso para guardar instrucciones en LangLab",
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
