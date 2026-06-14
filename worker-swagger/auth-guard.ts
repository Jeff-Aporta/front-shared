/**
 * Fuente canónica — copiar a {backend}/src/lib/auth-guard.ts
 * Política: GET/HEAD/OPTIONS públicos; mutaciones requieren JWT + permiso BD_AUTH.
 * JWT y permisos: delegados a system-login (verify-access).
 */
import type { MiddlewareHandler } from "hono";

export type AuthGuardEnv = {
  LAB_JWT_SECRET?: string;
  SYSTEM_LOGIN_URL?: string;
};

const SKIP_PREFIXES = ["/api/auth/", "/api/swagger"];

const PROTECTED_GET = new Set(["/api/creds"]);

function normalizePath(path: string): string {
  const p = path.trim();
  if (!p) return "/";
  const withSlash = p.startsWith("/") ? p : `/${p}`;
  return withSlash.endsWith("/") && withSlash.length > 1 ? withSlash.slice(0, -1) : withSlash;
}

function isSafeMethod(method: string): boolean {
  const m = method.toUpperCase();
  return m === "GET" || m === "HEAD" || m === "OPTIONS";
}

function requiresAuthOnGet(path: string): boolean {
  return PROTECTED_GET.has(normalizePath(path));
}

function shouldSkip(path: string): boolean {
  return SKIP_PREFIXES.some((p) => path === p || path.startsWith(p));
}

function isPublicRequest(method: string, path: string): boolean {
  if (shouldSkip(path)) return true;
  if (isSafeMethod(method) && !requiresAuthOnGet(path)) return true;
  return false;
}

export function bearerToken(header?: string): string | null {
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice(7).trim() || null;
}

export async function requireAuth(
  env: AuthGuardEnv,
  header?: string,
): Promise<{ username: string } | Response> {
  const token = bearerToken(header);
  if (!token) {
    return Response.json({ ok: false, error: "Authorization Bearer requerido" }, { status: 401 });
  }
  const secret = env.LAB_JWT_SECRET?.trim();
  if (!secret || secret.length < 16) {
    return Response.json(
      { ok: false, error: "Use system-login verify-access; LAB_JWT_SECRET no configurado localmente" },
      { status: 503 },
    );
  }
  try {
    const { jwtVerify } = await import("jose");
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
      algorithms: ["HS256"],
    });
    const username = String(payload.sub || payload.username || "");
    if (!username) throw new Error("JWT sin subject");
    return { username };
  } catch {
    return Response.json({ ok: false, error: "Token inválido o expirado" }, { status: 401 });
  }
}

export async function verifyAccess(
  env: AuthGuardEnv,
  header: string | undefined,
  method: string,
  apiPath: string,
  appId?: string | null,
): Promise<{ username: string; allowed: boolean } | Response> {
  const m = method.toUpperCase();
  const path = normalizePath(apiPath);

  if (isPublicRequest(m, path)) {
    return { username: "", allowed: true };
  }

  if (!bearerToken(header)) {
    return Response.json({ ok: false, error: "Authorization Bearer requerido" }, { status: 401 });
  }

  const base = (env.SYSTEM_LOGIN_URL || "https://system-login.jeffaporta.workers.dev").replace(/\/$/, "");
  const app = appId?.trim() || undefined;
  try {
    const res = await fetch(`${base}/api/auth/verify-access`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(header ? { Authorization: header } : {}),
        ...(app ? { "X-App-Id": app } : {}),
      },
      body: JSON.stringify({ method: m, path, ...(app ? { app } : {}) }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      allowed?: boolean;
      username?: string;
      error?: string;
    };
    if (!res.ok || !data.ok) {
      const status = res.status === 401 ? 401 : res.status >= 400 ? res.status : 403;
      return Response.json(
        { ok: false, error: data.error || "Verificación de permisos fallida", method: m, path },
        { status },
      );
    }
    if (!data.allowed) {
      return Response.json(
        {
          ok: false,
          error: "Sin permiso para este endpoint",
          method: m,
          path,
          username: data.username,
        },
        { status: 403 },
      );
    }
    return { username: data.username || "", allowed: true };
  } catch {
    return Response.json({ ok: false, error: "Servicio de auth no disponible" }, { status: 503 });
  }
}

export function apiAuthGuard<E extends AuthGuardEnv>(): MiddlewareHandler<{ Bindings: E; Variables: { authUser?: string } }> {
  return async (c, next) => {
    const path = normalizePath(new URL(c.req.url).pathname);
    const method = c.req.method;
    if (isPublicRequest(method, path)) return next();

    const result = await verifyAccess(
      c.env,
      c.req.header("authorization"),
      method,
      path,
      c.req.header("X-App-Id"),
    );
    if (result instanceof Response) return result;
    c.set("authUser", result.username);
    return next();
  };
}
