/**
 * Cliente `GET /api/permissions/me` — un único fetch por sesión (TTL configurable).
 *
 * Uso:
 *   import { loadPermissionsMe, clearPermissionsMeCache } from "front-shared/cdn/isa/js/core/auth/permissions-me.js";
 *   const caps = await loadPermissionsMe(apiBase, jwt);   // { capabilities, isWildcard, ... } o null
 *   if (caps?.capabilities?.canEditInstrucciones) ...
 *
 * Cache: sessionStorage[insoft:permissions-me] con campo `iat + ttlMs`.
 * Invalidar con `clearPermissionsMeCache()` al cambiar JWT, role, o tras 401.
 */

const SS_KEY = "insoft:permissions-me";

function readCache(username) {
    try {
        const raw = sessionStorage.getItem(SS_KEY);
        if (!raw) return null;
        const obj = JSON.parse(raw);
        if (!obj || obj.username !== username) return null;
        if (!obj.iat || !obj.ttlMs) return null;
        if (Date.now() - obj.iat > obj.ttlMs) return null;
        return obj.data || null;
    } catch {
        return null;
    }
}

function writeCache(username, data) {
    try {
        sessionStorage.setItem(SS_KEY, JSON.stringify({
            username,
            iat: Date.now(),
            ttlMs: data?.ttlMs ?? 60_000,
            data,
        }));
    } catch {
        /* ignore quota */
    }
}

export function clearPermissionsMeCache() {
    try { sessionStorage.removeItem(SS_KEY); } catch { /* ignore */ }
}

/**
 * @param {string} apiBase — sin slash final.
 * @param {string|null} [jwt] — token bearer. Si falta, retorna null.
 * @param {{ fetchImpl?: typeof fetch, force?: boolean }} [opts]
 * @returns {Promise<null | { kind: string, version: number, username: string, roles: string[], jerarquias: string[], jerarquiaMax: string, isWildcard: boolean, permisos: object, permisosEfectivos: object, restricciones: object, capabilities: object, iat: number, ttlMs: number }>}
 */
export async function loadPermissionsMe(apiBase, jwt, opts = {}) {
    const base = String(apiBase ?? "").replace(/\/+$/, "");
    const token = String(jwt ?? "").trim();
    if (!base || !token) return null;
    const username = parseUsernameFromJwt(token);
    if (!username) return null;
    const f = opts.fetchImpl ?? fetch;
    if (!opts.force) {
        const cached = readCache(username);
        if (cached) return cached;
    }
    const res = await f(`${base}/api/permissions/me`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        credentials: "omit",
    });
    if (res.status === 401) {
        clearPermissionsMeCache();
        return null;
    }
    if (!res.ok) return null;
    const json = await res.json();
    const data = json?.respuesta ?? json?.body ?? null;
    if (!data || data.kind !== "insoft.permissions-me") return null;
    writeCache(username, data);
    return data;
}

/** Decodifica payload JWT (sin verificar firma) para extraer el iusuario. */
function parseUsernameFromJwt(token) {
    try {
        const parts = token.split(".");
        if (parts.length < 2) return null;
        const padded = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const json = atob(padded + "==".slice(0, (4 - (padded.length % 4)) % 4));
        const obj = JSON.parse(json);
        const u = String(obj.iusuario ?? obj.username ?? "").trim();
        return u ? u.toUpperCase() : null;
    } catch {
        return null;
    }
}