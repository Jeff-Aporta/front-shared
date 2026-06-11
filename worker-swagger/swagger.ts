/**
 * Fuente canónica — copiar a {backend}/src/lib/swagger.ts
 * Swagger UI + OpenAPI JSON en /ui y /doc, con panel de JWT de prueba (system-login).
 */
import { swaggerUI } from "@hono/swagger-ui";
import type { Env, Hono } from "hono";

export type OpenApiSpec = {
  openapi: string;
  info: { title: string; version: string; description?: string };
  servers?: { url: string; description?: string }[];
  tags?: { name: string; description?: string }[];
  paths: Record<string, unknown>;
  components?: Record<string, unknown>;
};

export const SYSTEM_LOGIN_URL_PROD = "https://system-login.jeffaporta.workers.dev";
export const SYSTEM_LOGIN_URL_LOCAL = "http://localhost:8781";

export type MountSwaggerOpts = {
  docPath?: string;
  uiPath?: string;
  /**
   * Base URL para el panel JWT. Por defecto "" = mismo origen (requiere mountAuthProxy).
   * Pasa SYSTEM_LOGIN_URL_PROD solo si no usas proxy.
   */
  authLoginUrl?: string;
  title?: string;
};

export function mountSwagger<E extends Env = Env>(
  app: Hono<E>,
  spec: OpenApiSpec,
  opts: MountSwaggerOpts = {},
) {
  const docPath = opts.docPath ?? "/doc";
  const uiPath = opts.uiPath ?? "/ui";
  const authLoginUrl = opts.authLoginUrl ?? "";
  const title = opts.title ?? spec.info.title + " — Swagger";

  app.get(docPath, (c) => c.json(spec));
  app.get(
    uiPath,
    swaggerUI({
      url: docPath,
      persistAuthorization: true,
      title,
      manuallySwaggerUIHtml: (asset) => buildSwaggerUiFragment(asset, docPath, authLoginUrl),
    }),
  );
}

export const jsonResponse = (description: string, schema: Record<string, unknown> = { type: "object" }) => ({
  description,
  content: { "application/json": { schema } },
});

export const bearerSecurity = [{ Bearer: [] as string[] }];

export function bearerComponents() {
  return {
    securitySchemes: {
      Bearer: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description:
          "JWT de system-login. Usa el panel «JWT de prueba» arriba (POST /auth/test-token, 1 h) o Authorize con un token propio.",
      },
    },
  };
}

const authCredBody = {
  required: true,
  content: {
    "application/json": {
      schema: {
        type: "object",
        required: ["username", "password"],
        properties: {
          username: { type: "string", example: "admin" },
          password: {
            type: "string",
            description: "Contraseña con transporte César (el panel Swagger la codifica automáticamente).",
          },
        },
      },
    },
  },
};

/** Rutas Auth documentadas en cada Worker (proxy → system-login, salvo system-login nativo). */
export function authOpenApiPaths(opts: { proxied?: boolean } = {}) {
  const note = opts.proxied !== false
    ? "Proxy al servicio system-login (autenticación centralizada)."
    : "Autenticación centralizada Jeff-Aporta.";
  return {
    "/auth/token": {
      post: {
        tags: ["Auth"],
        summary: "Login — JWT 30 días",
        description: note,
        requestBody: authCredBody,
        responses: {
          "200": jsonResponse("JWT emitido"),
          "401": jsonResponse("Credenciales inválidas"),
          "429": jsonResponse("Penalización por intentos"),
        },
      },
    },
    "/auth/test-token": {
      post: {
        tags: ["Auth"],
        summary: "JWT de prueba Swagger — 1 hora",
        description:
          note + " Emite JWT con purpose=swagger-test. Usar desde el panel superior o Try it out.",
        requestBody: authCredBody,
        responses: {
          "200": jsonResponse("JWT de prueba emitido"),
          "401": jsonResponse("Credenciales inválidas"),
          "429": jsonResponse("Penalización por intentos"),
        },
      },
    },
  };
}

function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Fragmento HTML insertado en <body> por @hono/swagger-ui (no documento completo). */
function buildSwaggerUiFragment(
  asset: { css: string[]; js: string[] },
  docPath: string,
  authLoginUrl: string,
): string {
  const specUrl = escHtml(docPath);
  const authBase = authLoginUrl
    ? escHtml(authLoginUrl.replace(/\/$/, ""))
    : "";
  const cssLinks = asset.css.map((url) => `<link rel="stylesheet" href="${escHtml(url)}" />`).join("\n");
  const jsScripts = asset.js
    .map((url) => `<script src="${escHtml(url)}" crossorigin="anonymous"><\/script>`)
    .join("\n");

  return `
<style>
  #swagger-auth-panel {
    font-family: system-ui, sans-serif;
    padding: 12px 16px;
    background: #1b2638;
    color: #e8eef7;
    border-bottom: 1px solid #2d3a4f;
  }
  #swagger-auth-panel h2 { margin: 0 0 8px; font-size: 14px; font-weight: 600; }
  #swagger-auth-panel .row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
  #swagger-auth-panel label { font-size: 12px; display: flex; flex-direction: column; gap: 2px; }
  #swagger-auth-panel input {
    padding: 6px 8px; border-radius: 4px; border: 1px solid #3d4f6a;
    background: #0f1623; color: #e8eef7; min-width: 140px;
  }
  #swagger-auth-panel button {
    padding: 7px 12px; border-radius: 4px; border: none; background: #1976d2;
    color: #fff; cursor: pointer; font-size: 13px;
  }
  #swagger-auth-panel button:disabled { opacity: 0.6; cursor: wait; }
  #swagger-auth-status { margin-top: 8px; font-size: 12px; min-height: 1.2em; }
  #swagger-auth-status.ok { color: #81c784; }
  #swagger-auth-status.err { color: #ff8a80; }
  #swagger-auth-hint { font-size: 11px; opacity: 0.75; margin-top: 4px; }
</style>
<div id="swagger-auth-panel">
  <h2>JWT de prueba (1 hora)</h2>
  <div class="row">
    <label>Usuario<input id="swagger-auth-user" type="text" autocomplete="username" placeholder="usuario"/></label>
    <label>Contraseña<input id="swagger-auth-pass" type="password" autocomplete="current-password" placeholder="••••"/></label>
    <button type="button" id="swagger-auth-btn">Obtener JWT y autorizar</button>
    <button type="button" id="swagger-auth-clear" style="background:#455a64">Limpiar</button>
  </div>
  <div id="swagger-auth-status"></div>
  <div id="swagger-auth-hint">POST /auth/test-token${authBase ? " → " + authBase : " (proxy system-login)"} · Válido 1 h · purpose=swagger-test</div>
</div>
<div id="swagger-ui"></div>
${cssLinks}
${jsScripts}
<script>
(function () {
  var specUrl = "${specUrl}";
  var AUTH_BASE = "${authBase}";
  if (!AUTH_BASE) {
    AUTH_BASE = location.origin;
  } else if ((location.hostname === "localhost" || location.hostname === "127.0.0.1") && AUTH_BASE.indexOf("system-login.jeffaporta") >= 0) {
    AUTH_BASE = "http://localhost:8781";
  }
  var PREFIX = "abc123";
  var SUFFIX = "xyz987";
  var STORAGE_KEY = "jeffaporta:swagger-test-jwt";

  function caesarShiftForDate(d) { return d.getUTCDate(); }
  function caesarEncode(text, shift) {
    return text.split("").map(function (c) {
      var code = c.charCodeAt(0);
      if (code >= 65 && code <= 90) return String.fromCharCode(((code - 65 + shift) % 26) + 65);
      if (code >= 97 && code <= 122) return String.fromCharCode(((code - 97 + shift) % 26) + 97);
      return c;
    }).join("");
  }
  function wrapPassword(plain) {
    if (!plain) return plain;
    return caesarEncode(PREFIX + plain + SUFFIX, caesarShiftForDate(new Date()));
  }

  function setStatus(msg, kind) {
    var el = document.getElementById("swagger-auth-status");
    if (!el) return;
    el.textContent = msg || "";
    el.className = kind || "";
  }

  function authorizeSwagger(token) {
    if (!window.ui) return false;
    try {
      window.ui.authActions.authorize({
        Bearer: {
          name: "Bearer",
          schema: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
          value: token,
        },
      });
      return true;
    } catch (e) { return false; }
  }

  function clearSwaggerAuth() {
    try { if (window.ui) window.ui.authActions.logout(["Bearer"]); } catch (e) { /* ignore */ }
    try { sessionStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
    setStatus("", "");
  }

  async function fetchTestJwt(username, password) {
    var res = await fetch(AUTH_BASE + "/auth/test-token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ username: username, password: wrapPassword(password) }),
    });
    var data = {};
    try { data = await res.json(); } catch (e) { /* ignore */ }
    if (!res.ok || !data.ok || !data.token) {
      var err = data.error || ("HTTP " + res.status);
      if (data.retryAfterSeconds) err += " (reintenta en " + data.retryAfterSeconds + " s)";
      throw new Error(err);
    }
    return data;
  }

  async function onAuthClick() {
    var userEl = document.getElementById("swagger-auth-user");
    var passEl = document.getElementById("swagger-auth-pass");
    var btn = document.getElementById("swagger-auth-btn");
    var username = (userEl && userEl.value || "").trim();
    var password = passEl ? passEl.value : "";
    if (!username || !password) {
      setStatus("Usuario y contraseña requeridos.", "err");
      return;
    }
    if (btn) btn.disabled = true;
    setStatus("Solicitando JWT…", "");
    try {
      var data = await fetchTestJwt(username, password);
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
          token: data.token, expiresAt: data.expiresAt, username: data.username,
        }));
      } catch (e) { /* ignore */ }
      if (!authorizeSwagger(data.token)) {
        setStatus("JWT obtenido. Usa Authorize y pega el token si no se aplicó solo.", "err");
        return;
      }
      setStatus("Autorizado como " + data.username + " · expira " + (data.expiresAt || "en 1 h"), "ok");
    } catch (e) {
      setStatus(e.message || String(e), "err");
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  function restoreStoredJwt() {
    try {
      var raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var saved = JSON.parse(raw);
      if (!saved.token) return;
      if (saved.expiresAt && new Date(saved.expiresAt).getTime() <= Date.now()) {
        sessionStorage.removeItem(STORAGE_KEY);
        return;
      }
      if (authorizeSwagger(saved.token)) {
        setStatus(
          "Sesión restaurada" + (saved.username ? " (" + saved.username + ")" : "") +
            (saved.expiresAt ? " · expira " + saved.expiresAt : ""),
          "ok",
        );
      }
    } catch (e) { /* ignore */ }
  }

  document.getElementById("swagger-auth-btn").addEventListener("click", onAuthClick);
  document.getElementById("swagger-auth-clear").addEventListener("click", clearSwaggerAuth);

  window.onload = function () {
    if (typeof SwaggerUIBundle === "undefined") {
      setStatus("No se pudo cargar Swagger UI.", "err");
      return;
    }
    window.ui = SwaggerUIBundle({
      url: specUrl,
      dom_id: "#swagger-ui",
      deepLinking: true,
      persistAuthorization: true,
      onComplete: function () { restoreStoredJwt(); },
    });
  };
})();
<\/script>`;
}
