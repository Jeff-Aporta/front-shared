/**
 * Fuente canónica — copiar a {backend}/src/lib/swagger.ts
 * Swagger UI + OpenAPI JSON en /ui y /doc, con panel de JWT de prueba (system-login).
 */
import { swaggerUI } from "@hono/swagger-ui";
import type { Context, Env, Hono } from "hono";

/** Swagger UI 5.31+ — estilos dark-mode nativos (`html.dark-mode`). */
const SWAGGER_UI_VERSION = "5.31.0";

export type FrontLink = { label: string; url: string };

/** Paneles GH Pages por servicio (sincronizar con main-orchestrator/src/catalog.ts). */
export const GH_PAGES_FRONTS: Record<string, FrontLink> = {
  "main-orchestrator": {
    label: "main-orchestrator-front",
    url: "https://jeff-aporta.github.io/main-orchestrator-front/",
  },
  "system-login": {
    label: "system-login-front",
    url: "https://jeff-aporta.github.io/system-login-front/",
  },
  flsjeff: { label: "flsjeff-front", url: "https://jeff-aporta.github.io/flsjeff-front/" },
  conversations: {
    label: "conversations-front",
    url: "https://jeff-aporta.github.io/conversations-front/",
  },
  iatools: { label: "iatools-front", url: "https://jeff-aporta.github.io/iatools-front/" },
  jagudeloe: { label: "jagudeloe-front", url: "https://jeff-aporta.github.io/jagudeloe-front/" },
};

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
   * Prefijo público cuando `mountSwagger` va en un sub-router montado en `/api`.
   * Usar `""` si montas en la app raíz (p. ej. langlab legacy).
   */
  apiPrefix?: string;
  /**
   * Base URL para el panel JWT. Por defecto "" = mismo origen (requiere mountAuthProxy).
   * Pasa SYSTEM_LOGIN_URL_PROD solo si no usas proxy.
   */
  authLoginUrl?: string;
  title?: string;
  /** Lookup en GH_PAGES_FRONTS si no pasas frontUrl/frontLinks. */
  serviceId?: string;
  /** Enlace único al panel GH Pages (override). */
  frontUrl?: string;
  frontLabel?: string;
  /** Varios enlaces al pie (p. ej. Swagger agregado del orquestador). */
  frontLinks?: FrontLink[];
  /** Si se define, /doc devuelve el spec agregado en runtime. */
  resolveSpec?: (c: Context) => Promise<OpenApiSpec> | OpenApiSpec;
};

function resolveFrontLinks(opts: MountSwaggerOpts): FrontLink[] {
  if (opts.frontLinks?.length) return opts.frontLinks;
  if (opts.frontUrl) {
    return [{ label: opts.frontLabel ?? "GitHub Pages", url: opts.frontUrl }];
  }
  if (opts.serviceId && GH_PAGES_FRONTS[opts.serviceId]) {
    return [GH_PAGES_FRONTS[opts.serviceId]];
  }
  return [];
}

export function mountSwagger<E extends Env = Env>(
  app: Hono<E>,
  spec: OpenApiSpec,
  opts: MountSwaggerOpts = {},
) {
  const docPath = opts.docPath ?? "/doc";
  const uiPath = opts.uiPath ?? "/ui";
  const apiPrefix = opts.apiPrefix ?? "/api";
  const specUrl = apiPrefix ? `${apiPrefix}${docPath}` : docPath;
  const authLoginUrl = opts.authLoginUrl ?? "";
  const title = opts.title ?? spec.info.title + " — Swagger";
  const frontFooterHtml = buildFrontFooterHtml(resolveFrontLinks(opts));

  app.get(docPath, async (c) => {
    if (opts.resolveSpec) {
      const url = new URL(c.req.url);
      if (url.searchParams.has("fresh")) {
        try {
          const { clearAggregatedSpecCache } = await import("../openapi/aggregate.js");
          clearAggregatedSpecCache();
        } catch {
          /* solo main-orchestrator */
        }
      }
      const resolved = await opts.resolveSpec(c);
      return c.json(resolved);
    }
    return c.json(spec);
  });
  app.get(
    uiPath,
    swaggerUI({
      version: SWAGGER_UI_VERSION,
      url: specUrl,
      persistAuthorization: true,
      title,
      manuallySwaggerUIHtml: (asset) =>
        buildSwaggerUiFragment(asset, specUrl, authLoginUrl, frontFooterHtml),
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
          "Token de acceso. Pide uno de prueba con el botón superior o pega el tuyo en Authorize.",
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
            description: "Tu contraseña (el panel la envía codificada automáticamente).",
          },
        },
      },
    },
  },
};

/** Rutas Auth documentadas en cada Worker (proxy → system-login, salvo system-login nativo). */
export function authOpenApiPaths(opts: { proxied?: boolean } = {}) {
  const note = opts.proxied !== false
    ? "Usa el mismo login que el resto del ecosistema."
    : "Inicio de sesión del ecosistema Jeff-Aporta.";
  return {
    "/api/auth/token": {
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
    "/api/auth/test-token": {
      post: {
        tags: ["Auth"],
        summary: "JWT de prueba Swagger — 1 hora",
        description:
          note + " Token de prueba válido 1 hora. Úsalo desde el panel superior.",
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

function buildFrontFooterHtml(links: FrontLink[]): string {
  if (!links.length) return "";
  const items = links
    .map(
      (l) =>
        `<li><a href="${escHtml(l.url)}" target="_blank" rel="noopener noreferrer">${escHtml(l.label)}</a></li>`,
    )
    .join("\n      ");
  const heading = links.length > 1 ? "Paneles en GitHub Pages" : "Panel en GitHub Pages";
  return `
<footer id="swagger-front-footer">
  <p>${heading}</p>
  <ul>
      ${items}
  </ul>
</footer>`;
}

/** Fragmento HTML insertado en <body> por @hono/swagger-ui (no documento completo). */
function buildSwaggerUiFragment(
  asset: { css: string[]; js: string[] },
  docPath: string,
  authLoginUrl: string,
  frontFooterHtml: string,
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
  html.dark-mode,
  html.dark-mode body {
    background: #1C2022;
    color: #E4E6E6;
    margin: 0;
  }
  #swagger-auth-bar {
    font-family: system-ui, sans-serif;
    padding: 10px 16px;
    background: #1b2638;
    color: #e8eef7;
    border-bottom: 1px solid #2d3a4f;
    display: flex; flex-wrap: wrap; gap: 8px; align-items: center;
  }
  #swagger-auth-bar h2 { margin: 0; font-size: 14px; font-weight: 600; flex: 1 1 auto; }
  #swagger-auth-bar button {
    padding: 7px 12px; border-radius: 4px; border: none; background: #1976d2;
    color: #fff; cursor: pointer; font-size: 13px;
  }
  #swagger-auth-bar button.secondary { background: #455a64; }
  #swagger-auth-bar button:disabled { opacity: 0.6; cursor: wait; }
  #swagger-auth-status { font-size: 12px; flex: 1 1 100%; min-height: 1.2em; }
  #swagger-auth-status.ok { color: #81c784; }
  #swagger-auth-status.err { color: #ff8a80; }
  .swagger-modal {
    position: fixed; inset: 0; z-index: 9999;
    display: flex; align-items: center; justify-content: center;
  }
  .swagger-modal.hidden { display: none; }
  .swagger-modal-backdrop {
    position: absolute; inset: 0; background: rgba(0,0,0,0.55);
  }
  .swagger-modal-dialog {
    position: relative; z-index: 1; width: min(420px, 92vw);
    background: #1b2638; color: #e8eef7; border-radius: 8px;
    border: 1px solid #2d3a4f; padding: 16px 18px 18px;
    box-shadow: 0 12px 40px rgba(0,0,0,0.45);
    font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
  }
  .swagger-modal-dialog h3 { margin: 0 0 12px; font-size: 16px; font-weight: 600; }
  .swagger-modal-dialog label {
    display: flex; flex-direction: column; gap: 6px;
    font-size: 12px; font-weight: 500; margin-bottom: 12px;
    color: #b0bec5;
  }
  .swagger-modal-dialog input[type="text"],
  .swagger-modal-dialog input[type="password"],
  .swagger-modal-dialog textarea {
    display: block; width: 100%; box-sizing: border-box;
    padding: 9px 11px; border-radius: 6px; border: 1px solid #3d4f6a;
    background: #0f1623; color: #e8eef7; font-family: inherit; font-size: 14px;
    line-height: 1.35; outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .swagger-modal-dialog input::placeholder,
  .swagger-modal-dialog textarea::placeholder { color: #6b7a90; opacity: 1; }
  .swagger-modal-dialog input:focus,
  .swagger-modal-dialog textarea:focus {
    border-color: #64b5f6;
    box-shadow: 0 0 0 2px rgba(100, 181, 246, 0.28);
  }
  .swagger-modal-dialog textarea { min-height: 100px; resize: vertical; font-family: ui-monospace, monospace; font-size: 13px; }
  .swagger-modal-actions {
    display: flex; gap: 10px; justify-content: flex-end; margin-top: 14px; flex-wrap: wrap;
  }
  .swagger-modal-dialog button,
  .swagger-modal-actions button {
    padding: 8px 14px; border-radius: 6px; border: none;
    background: #1976d2; color: #fff; cursor: pointer;
    font-size: 13px; font-weight: 500; font-family: inherit;
    line-height: 1.25; transition: filter 0.15s, opacity 0.15s;
  }
  .swagger-modal-dialog button.secondary,
  .swagger-modal-actions button.secondary { background: #455a64; color: #eceff1; }
  .swagger-modal-dialog button:hover:not(:disabled),
  .swagger-modal-actions button:hover:not(:disabled) { filter: brightness(1.08); }
  .swagger-modal-dialog button:active:not(:disabled),
  .swagger-modal-actions button:active:not(:disabled) { filter: brightness(0.95); }
  .swagger-modal-dialog button:disabled,
  .swagger-modal-actions button:disabled { opacity: 0.6; cursor: wait; }
  .swagger-modal-hint { font-size: 11px; opacity: 0.75; margin: 0 0 12px; line-height: 1.45; }
  .swagger-modal-remember {
    display: flex; align-items: center; gap: 8px;
    font-size: 12px; margin: 0 0 12px; color: #b0bec5; cursor: pointer; user-select: none;
  }
  .swagger-modal-remember input[type="checkbox"] {
    width: 15px; height: 15px; margin: 0; padding: 0; accent-color: #1976d2; cursor: pointer;
  }
  #swagger-front-footer {
    font-family: system-ui, sans-serif;
    margin: 32px auto 48px;
    padding: 16px 24px;
    max-width: 1460px;
    border-top: 1px solid #2d3a4f;
    color: #b0bec5;
    font-size: 13px;
  }
  #swagger-front-footer p { margin: 0 0 8px; font-weight: 600; color: #e4e6e6; }
  #swagger-front-footer ul { margin: 0; padding: 0; list-style: none; display: flex; flex-wrap: wrap; gap: 8px 20px; }
  #swagger-front-footer a { color: #64b5f6; text-decoration: none; }
  #swagger-front-footer a:hover { text-decoration: underline; }
</style>
<div id="swagger-auth-bar">
  <h2>Autenticación Swagger</h2>
  <button type="button" id="swagger-open-login">Iniciar sesión</button>
  <button type="button" id="swagger-open-jwt" class="secondary">Pegar JWT</button>
  <button type="button" id="swagger-auth-clear" class="secondary">Limpiar</button>
  <div id="swagger-auth-status"></div>
</div>
<div id="swagger-login-modal" class="swagger-modal hidden" aria-hidden="true">
  <div class="swagger-modal-backdrop" data-close="login"></div>
  <div class="swagger-modal-dialog" role="dialog" aria-labelledby="swagger-login-title">
    <h3 id="swagger-login-title">Iniciar sesión</h3>
    <p class="swagger-modal-hint">Obtiene JWT de prueba (1 h) vía POST /api/auth/test-token${authBase ? " → " + authBase : " (proxy system-login)"}.</p>
    <label>Usuario<input id="swagger-auth-user" type="text" autocomplete="username" placeholder="usuario"/></label>
    <label>Contraseña<input id="swagger-auth-pass" type="password" autocomplete="current-password" placeholder="••••"/></label>
    <label class="swagger-modal-remember"><input id="swagger-auth-remember" type="checkbox" checked /> Recordar usuario y contraseña</label>
    <div class="swagger-modal-actions">
      <button type="button" class="secondary" data-close="login">Cancelar</button>
      <button type="button" id="swagger-auth-btn">Obtener JWT y autorizar</button>
    </div>
  </div>
</div>
<div id="swagger-jwt-modal" class="swagger-modal hidden" aria-hidden="true">
  <div class="swagger-modal-backdrop" data-close="jwt"></div>
  <div class="swagger-modal-dialog" role="dialog" aria-labelledby="swagger-jwt-title">
    <h3 id="swagger-jwt-title">Pegar JWT</h3>
    <p class="swagger-modal-hint">Pega el token Bearer (con o sin prefijo «Bearer »). También puedes usar el botón Authorize nativo de Swagger UI.</p>
    <label>Token<textarea id="swagger-jwt-paste" placeholder="eyJhbG…"></textarea></label>
    <div class="swagger-modal-actions">
      <button type="button" class="secondary" data-close="jwt">Cancelar</button>
      <button type="button" id="swagger-jwt-apply">Aplicar JWT</button>
    </div>
  </div>
</div>
<div id="swagger-ui"></div>
${frontFooterHtml}
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
  var CREDENTIALS_KEY = "jeffaporta:swagger-login-creds";

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

  function encodeStoredSecret(plain) {
    if (!plain) return "";
    try { return btoa(unescape(encodeURIComponent(PREFIX + plain + SUFFIX))); } catch (e) { return ""; }
  }
  function decodeStoredSecret(enc) {
    if (!enc) return "";
    try {
      var raw = decodeURIComponent(escape(atob(enc)));
      if (raw.indexOf(PREFIX) === 0 && raw.slice(-SUFFIX.length) === SUFFIX) {
        return raw.slice(PREFIX.length, raw.length - SUFFIX.length);
      }
      return "";
    } catch (e) { return ""; }
  }

  function loadCredentials() {
    var userEl = document.getElementById("swagger-auth-user");
    var passEl = document.getElementById("swagger-auth-pass");
    var remEl = document.getElementById("swagger-auth-remember");
    try {
      var raw = localStorage.getItem(CREDENTIALS_KEY);
      if (!raw) return;
      var saved = JSON.parse(raw);
      if (userEl && saved.username) userEl.value = saved.username;
      if (passEl && saved.passwordEnc) passEl.value = decodeStoredSecret(saved.passwordEnc);
      if (remEl) remEl.checked = saved.remember !== false;
    } catch (e) { /* ignore */ }
  }

  function saveCredentials(username, password) {
    var remEl = document.getElementById("swagger-auth-remember");
    var remember = remEl ? !!remEl.checked : false;
    try {
      if (!remember) {
        localStorage.removeItem(CREDENTIALS_KEY);
        return;
      }
      localStorage.setItem(CREDENTIALS_KEY, JSON.stringify({
        remember: true,
        username: username,
        passwordEnc: encodeStoredSecret(password),
      }));
    } catch (e) { /* ignore */ }
  }

  function setStatus(msg, kind) {
    var el = document.getElementById("swagger-auth-status");
    if (!el) return;
    el.textContent = msg || "";
    el.className = kind || "";
  }

  function formatLocalDateTime(iso) {
    if (!iso) return "";
    var s = String(iso).trim();
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    var d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(s);
    if (isNaN(d.getTime())) return s;
    return d.toLocaleString(undefined, {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      hour12: false,
    });
  }

  function getStoredJwt() {
    try {
      var raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var saved = JSON.parse(raw);
      if (!saved.token) return null;
      if (saved.expiresAt && new Date(saved.expiresAt).getTime() <= Date.now()) {
        sessionStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return saved.token;
    } catch (e) { return null; }
  }

  function injectBearerIfNeeded(req) {
    if (!req.headers) req.headers = {};
    if (req.headers.Authorization || req.headers.authorization) return req;
    var token = getStoredJwt();
    if (token) req.headers.Authorization = "Bearer " + token;
    return req;
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
    var res = await fetch(AUTH_BASE + "/api/auth/test-token", {
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

  function openModal(id) {
    var el = document.getElementById(id);
    if (!el) return;
    if (id === "swagger-login-modal") loadCredentials();
    el.classList.remove("hidden");
    el.setAttribute("aria-hidden", "false");
  }
  function closeModal(id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.classList.add("hidden");
    el.setAttribute("aria-hidden", "true");
  }

  function normalizeJwt(raw) {
    var t = (raw || "").trim();
    if (/^bearer\\s+/i.test(t)) t = t.replace(/^bearer\\s+/i, "");
    return t;
  }

  function applyJwtPaste() {
    var ta = document.getElementById("swagger-jwt-paste");
    var token = normalizeJwt(ta ? ta.value : "");
    if (!token) {
      setStatus("Pega un JWT válido.", "err");
      return;
    }
    if (!authorizeSwagger(token)) {
      setStatus("No se pudo autorizar. Comprueba el token.", "err");
      return;
    }
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ token: token }));
    } catch (e) { /* ignore */ }
    setStatus("JWT aplicado manualmente.", "ok");
    closeModal("swagger-jwt-modal");
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
      saveCredentials(username, password);
      setStatus("Autorizado como " + data.username + " · expira " + (data.expiresAt ? formatLocalDateTime(data.expiresAt) : "en 1 h"), "ok");
      closeModal("swagger-login-modal");
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
            (saved.expiresAt ? " · expira " + formatLocalDateTime(saved.expiresAt) : ""),
          "ok",
        );
      }
    } catch (e) { /* ignore */ }
  }

  document.getElementById("swagger-auth-btn").addEventListener("click", onAuthClick);
  document.getElementById("swagger-auth-clear").addEventListener("click", clearSwaggerAuth);
  document.getElementById("swagger-open-login").addEventListener("click", function () { openModal("swagger-login-modal"); });
  document.getElementById("swagger-open-jwt").addEventListener("click", function () { openModal("swagger-jwt-modal"); });
  document.getElementById("swagger-jwt-apply").addEventListener("click", applyJwtPaste);
  var rememberEl = document.getElementById("swagger-auth-remember");
  if (rememberEl) {
    rememberEl.addEventListener("change", function () {
      if (!rememberEl.checked) {
        try { localStorage.removeItem(CREDENTIALS_KEY); } catch (e) { /* ignore */ }
      } else {
        var userEl = document.getElementById("swagger-auth-user");
        var passEl = document.getElementById("swagger-auth-pass");
        saveCredentials((userEl && userEl.value || "").trim(), passEl ? passEl.value : "");
      }
    });
  }
  loadCredentials();
  document.querySelectorAll("[data-close]").forEach(function (el) {
    el.addEventListener("click", function () {
      var which = el.getAttribute("data-close");
      if (which === "login") closeModal("swagger-login-modal");
      if (which === "jwt") closeModal("swagger-jwt-modal");
    });
  });

  window.onload = function () {
    if (typeof SwaggerUIBundle === "undefined") {
      setStatus("No se pudo cargar Swagger UI.", "err");
      return;
    }
    document.documentElement.classList.add("dark-mode");
    window.ui = SwaggerUIBundle({
      url: specUrl,
      dom_id: "#swagger-ui",
      deepLinking: true,
      persistAuthorization: true,
      syntaxHighlight: { activated: true, theme: "monokai" },
      requestInterceptor: injectBearerIfNeeded,
      onComplete: function () { restoreStoredJwt(); },
    });
  };
})();
<\/script>`;
}
