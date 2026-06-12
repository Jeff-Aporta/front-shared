/**
 * Proxy de auth hacia system-login — copiar a {backend}/src/lib/auth-proxy.ts
 * Permite POST /auth/token y /auth/test-token en cada Worker (mismo origen para Swagger UI).
 */
import type { Context, Env, Hono } from "hono";
import { withCors } from "./cors.js";
import { SYSTEM_LOGIN_URL_LOCAL, SYSTEM_LOGIN_URL_PROD } from "./swagger.js";

export type AuthProxyEnv = { SYSTEM_LOGIN_URL?: string };

export function resolveSystemLoginBase(env: AuthProxyEnv | undefined, requestUrl: string): string {
  const fromEnv = env?.SYSTEM_LOGIN_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  try {
    const host = new URL(requestUrl).hostname;
    if (host === "localhost" || host === "127.0.0.1") return SYSTEM_LOGIN_URL_LOCAL;
  } catch {
    /* ignore */
  }
  return SYSTEM_LOGIN_URL_PROD;
}

function passthroughAuthHeaders(c: Context): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": c.req.header("Content-Type") || "application/json",
    Accept: "application/json",
  };
  for (const name of ["Origin", "Referer", "X-App-Id"]) {
    const v = c.req.header(name);
    if (v) headers[name] = v;
  }
  return headers;
}

async function forwardAuthPost(c: Context, path: string): Promise<Response> {
  const env = c.env as AuthProxyEnv | undefined;
  const base = resolveSystemLoginBase(env, c.req.url);
  const body = await c.req.text();
  const res = await fetch(`${base}${path}`, {
    method: "POST",
    headers: passthroughAuthHeaders(c),
    body,
  });
  const text = await res.text();
  const headers = new Headers();
  const ct = res.headers.get("Content-Type");
  if (ct) headers.set("Content-Type", ct);
  const retryAfter = res.headers.get("Retry-After");
  if (retryAfter) headers.set("Retry-After", retryAfter);
  return withCors(new Response(text, { status: res.status, headers }), c.req.header("Origin"));
}

/** Monta proxy de auth (excepto en system-login, que ya expone las rutas nativas). */
export function mountAuthProxy<E extends Env = Env>(app: Hono<E>): void {
  app.post("/auth/token", (c) => forwardAuthPost(c, "/api/auth/token"));
  app.post("/auth/test-token", (c) => forwardAuthPost(c, "/api/auth/test-token"));
}
