/**
 * Swagger UI HTML + helpers OpenAPI compartidos (Azure Functions y Workers).
 * Consumir vía npm `@jeff-aporta/front-shared/worker-swagger/swagger-ui-shared`.
 */
import {
  SWAGGER_TOAST_HTML,
  SWAGGER_TOAST_SCRIPT,
} from "./swagger-toast.js";
import {
  SWAGGER_AUTH_SHELL_HTML,
  SWAGGER_SHELL_CSS,
  SWAGGER_TOAST_CSS,
} from "./swagger-templates.js";

/** Swagger UI 5.31+ — estilos dark-mode nativos (`html.dark-mode`). */
export const SWAGGER_UI_VERSION = "5.31.0";

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
  "cf-ai": { label: "cf-ai-front", url: "https://jeff-aporta.github.io/cf-ai-front/" },
  "iss-patyia": { label: "isa-patyia", url: "https://jeff-aporta.github.io/isa-patyia/" },
  "iss-patyia-bridge": { label: "isa-patyia", url: "https://jeff-aporta.github.io/isa-patyia/" },
  "iss-ayudascpia": { label: "isa-patyia", url: "https://jeff-aporta.github.io/isa-patyia/" },
};

export const SYSTEM_LOGIN_URL_PROD = "https://system-login.jeffaporta.workers.dev";
export const SYSTEM_LOGIN_URL_LOCAL = "http://localhost:8781";

/** Añade enlace Markdown al panel GH Pages en info.description (idempotente). */
export function openApiDescriptionWithFront(description: string, link: FrontLink | null): string {
  if (!link?.url) return description;
  if (description.includes(link.url)) return description;
  const panelLine = `**Panel:** [${link.label}](${link.url})`;
  const base = description.trim();
  return base ? `${base}\n\n${panelLine}` : panelLine;
}

export type SwaggerUiHtmlOpts = {
  authLoginUrl?: string;
  title?: string;
  frontLinks?: FrontLink[];
  /** Clave en GH_PAGES_FRONTS si no se pasan frontLinks */
  frontLinkKey?: string;
};

function resolveFrontLinks(opts: SwaggerUiHtmlOpts): FrontLink[] {
  if (opts.frontLinks?.length) return opts.frontLinks;
  if (opts.frontLinkKey) {
    const link = GH_PAGES_FRONTS[opts.frontLinkKey];
    return link ? [link] : [];
  }
  return [];
}

/** HTML completo para GET /api/swagger (dark + panel auth system-login). */
export function buildSwaggerUiHtml(openApiJsonUrl: string, opts: SwaggerUiHtmlOpts = {}): string {
  const specUrl = escHtml(openApiJsonUrl);
  const authLoginUrl = opts.authLoginUrl ?? SYSTEM_LOGIN_URL_PROD;
  const frontFooterHtml = buildFrontFooterHtml(resolveFrontLinks(opts));
  const asset = {
    css: [`https://cdn.jsdelivr.net/npm/swagger-ui-dist@${SWAGGER_UI_VERSION}/swagger-ui.css`],
    js: [`https://cdn.jsdelivr.net/npm/swagger-ui-dist@${SWAGGER_UI_VERSION}/swagger-ui-bundle.js`],
  };
  const fragment = buildSwaggerUiFragment(asset, specUrl, authLoginUrl, frontFooterHtml);
  const title = escHtml(opts.title ?? "API");
  return `<!DOCTYPE html>
<html lang="es" class="dark-mode">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${title}</title>
</head>
<body>
${fragment}
</body>
</html>`;
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
  ${SWAGGER_SHELL_CSS}
  ${SWAGGER_TOAST_CSS}
</style>
${SWAGGER_AUTH_SHELL_HTML}
${SWAGGER_TOAST_HTML}
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

  ${SWAGGER_TOAST_SCRIPT}

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
    var res;
    try {
      res = await fetch(AUTH_BASE + "/api/auth/test-token", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ username: username, password: wrapPassword(password) }),
      });
    } catch (e) {
      throw new Error("No se pudo conectar con el servicio de autenticación.");
    }
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
          { noToast: true },
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
