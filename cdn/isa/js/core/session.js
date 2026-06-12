import { AUTH_DEFAULTS as D, MAIN_ORCHESTRATOR_LS_KEY } from "./constants.js";
import { wrapPassword } from "./caesar.js";
import { createTokenStore, isTokenValid } from "./token-store.js";
import { blockReasonFor, resolveCapId } from "./capabilities.js";
import { sanitizeUserMessage } from "./sanitize-user-message.js";

/** Sesión JWT por aplicación + capacidades de servicio (resueltas en system-login). */
export function registerSession(ns, opts = {}) {
  const appId = String(opts.appId || opts.app || "").trim();
  if (!appId) throw new Error("registerSession: appId requerido");
  const sessionKey = opts.sessionKey || `${D.sessionKey}:${appId}`;
  const authEvt = opts.authEvent || D.authEvent;
  const authLocalKey = opts.authLocalKey || D.authLocalKey;
  const authLocal = opts.authLocal || D.authLocal;
  const authOnline = opts.authOnline || D.authOnline;
  const store = createTokenStore(sessionKey);

  function authBase() {
    try {
      if (localStorage.getItem(MAIN_ORCHESTRATOR_LS_KEY) === "1") return authLocal;
    } catch (e) {
      /* ignore */
    }
    return authOnline;
  }

  function authUrl(path) {
    return authBase().replace(/\/$/, "") + (path.charAt(0) === "/" ? path : "/" + path);
  }

  function readSession() {
    const data = store.read();
    if (!data) return null;
    if (data.app && data.app !== appId) {
      store.clear();
      return null;
    }
    if (!isTokenValid(data)) {
      store.clear();
      return null;
    }
    return data;
  }

  function saveSession(data) {
    store.save({
      username: data.username,
      role: data.role ?? null,
      token: data.token,
      expiresAt: data.expiresAt ?? null,
      app: appId,
      capabilities: Array.isArray(data.capabilities) ? data.capabilities : [],
    });
    window.dispatchEvent(new Event(authEvt));
  }

  function clearSession() {
    store.clear();
    window.dispatchEvent(new Event(authEvt));
  }

  let session = readSession();
  let refreshPromise = null;

  function current() {
    session = readSession();
    return session;
  }

  function isLoggedIn() {
    session = readSession();
    return isTokenValid(session);
  }

  function username() {
    return current()?.username ?? null;
  }

  function capabilities() {
    const s = current();
    return Array.isArray(s?.capabilities) ? s.capabilities : [];
  }

  function can(capOrLegacy) {
    const capId = resolveCapId(capOrLegacy);
    if (!isLoggedIn()) return false;
    return capabilities().includes(capId);
  }

  function blockReason(capOrLegacy) {
    const capId = resolveCapId(capOrLegacy);
    return blockReasonFor(capId, {
      loggedIn: isLoggedIn(),
      username: username(),
    });
  }

  function appHeader() {
    return { "X-App-Id": appId };
  }

  function authHeader() {
    return isLoggedIn() ? { Authorization: "Bearer " + session.token, ...appHeader() } : {};
  }

  async function refreshProfile() {
    if (!isLoggedIn()) return null;
    if (refreshPromise) return refreshPromise;
    refreshPromise = (async () => {
      try {
        const res = await fetch(authUrl("/api/session"), {
          headers: { Accept: "application/json", ...authHeader() },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) return null;
        const s = current();
        if (!s) return null;
        const next = {
          ...s,
          role: data.user?.role ?? s.role,
          capabilities: Array.isArray(data.capabilities) ? data.capabilities : [],
        };
        session = next;
        saveSession(next);
        return next;
      } catch {
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
    return refreshPromise;
  }

  async function login(user, pass) {
    const res = await fetch(authUrl("/api/auth/token"), {
      method: "POST",
      headers: { "Content-Type": "application/json", ...appHeader() },
      body: JSON.stringify({
        username: user.trim(),
        password: wrapPassword(pass),
        app: appId,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.token) {
      let msg = "No se pudo iniciar sesión";
      if (res.status === 401 || res.status === 403) msg = "Usuario o contraseña incorrectos";
      else if (data.error) msg = sanitizeUserMessage(data.error, msg);
      const err = new Error(msg);
      if (data.retryAfterSeconds) err.retryAfterSeconds = data.retryAfterSeconds;
      throw err;
    }
    if (data.app && data.app !== appId) {
      throw new Error("Token emitido para otra aplicación");
    }
    session = {
      username: data.username || user,
      role: data.role || null,
      token: data.token,
      expiresAt: data.expiresAt || null,
      app: appId,
      capabilities: Array.isArray(data.capabilities) ? data.capabilities : [],
    };
    saveSession(session);
    if (!session.capabilities.length) {
      await refreshProfile();
    }
    return session;
  }

  function logout() {
    session = null;
    clearSession();
  }

  const sessionApi = {
    current,
    isLoggedIn,
    username,
    authHeader,
    appHeader,
    appId: () => appId,
    login,
    logout,
    refreshProfile,
    capabilities,
    can,
    blockReason,
    EVENT: authEvt,
  };

  const bag = window[ns] || {};
  bag.APP_ID = appId;
  bag.AuthApi = {
    AUTH_LOCAL: authLocal,
    AUTH_ONLINE: authOnline,
    SESSION_KEY: sessionKey,
    SESSION_EVT: authEvt,
    APP_ID: appId,
    authBase,
    authUrl,
    saveSession,
    readSession,
    isLoggedIn,
    authHeader,
    appHeader,
  };
  bag.Session = sessionApi;
  bag.Auth = {
    isLoggedIn,
    username,
    authHeader,
    appHeader,
    appId: () => appId,
    login,
    logout,
    refreshProfile,
    capabilities,
    can,
    blockReason,
    EVENT: authEvt,
    LOGIN_URL: opts.loginUrl || D.loginUrl,
    AUTH_ONLINE: authOnline,
  };
  window[ns] = bag;

  if (isLoggedIn()) {
    const s = current();
    if (!Array.isArray(s?.capabilities) || !s.capabilities.length) {
      refreshProfile().catch(() => {});
    }
    window.dispatchEvent(new Event(authEvt));
  }
}
