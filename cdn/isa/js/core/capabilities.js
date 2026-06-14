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
    id: "patyia.instrucciones.read",
    label: "Consultar instrucciones PatyIA staging",
    denyLoggedOut: "Inicia sesi?n para consultar instrucciones PatyIA",
    denyForbidden: "No tienes permiso para consultar instrucciones PatyIA",
  },
  {
    id: "patyia.instrucciones.publish",
    label: "Publicar instrucciones PatyIA staging",
    denyLoggedOut: "Inicia sesi?n para guardar instrucciones",
    denyForbidden: "No tienes permiso para publicar instrucciones PatyIA",
  },
  {
    id: "patyia.conversacion.log",
    label: "Consultar log de conversaci?n PatyIA",
    denyLoggedOut: "Inicia sesi?n para consultar logs de conversaci?n",
    denyForbidden: "No tienes permiso para consultar logs PatyIA",
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
  ejecutar_mssql: "patyia.instrucciones.publish",
  ejecutar_mssql_instrucciones: "patyia.instrucciones.publish",
  guardar_langlab: "langlab.guardar",
};

export function resolveCapId(capOrLegacy) {
  return LEGACY_CAP_MAP[capOrLegacy] || capOrLegacy;
}
