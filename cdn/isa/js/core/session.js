import { AUTH_DEFAULTS as D, MAIN_ORCHESTRATOR_LS_KEY } from "./constants.js";
import { wrapPassword } from "./caesar.js";
import { createTokenStore, isTokenValid } from "./token-store.js";

/** Sesión JWT por aplicación (rol + claim app en token). */
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
    });
    window.dispatchEvent(new Event(authEvt));
  }

  function clearSession() {
    store.clear();
    window.dispatchEvent(new Event(authEvt));
  }

  let session = readSession();

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

  function appHeader() {
    return { "X-App-Id": appId };
  }

  function authHeader() {
    return isLoggedIn() ? { Authorization: "Bearer " + session.token, ...appHeader() } : {};
  }

  async function login(user, pass) {
    const res = await fetch(authUrl("/api/auth/token"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: user.trim(),
        password: wrapPassword(pass),
        app: appId,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.token) {
      const err = new Error(data.error || "Login falló (" + res.status + ")");
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
    };
    saveSession(session);
    return session;
  }

  function logout() {
    session = null;
    clearSession();
  }

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
  bag.Session = {
    current,
    isLoggedIn,
    username,
    authHeader,
    appHeader,
    appId: () => appId,
    login,
    logout,
    EVENT: authEvt,
  };
  /** Puente para AppShell / widgets que esperan Auth. */
  bag.Auth = {
    isLoggedIn,
    username,
    authHeader,
    appHeader,
    appId: () => appId,
    login,
    logout,
    EVENT: authEvt,
    LOGIN_URL: opts.loginUrl || D.loginUrl,
    AUTH_ONLINE: authOnline,
  };
  window[ns] = bag;

  if (isLoggedIn()) {
    window.dispatchEvent(new Event(authEvt));
  }
}
