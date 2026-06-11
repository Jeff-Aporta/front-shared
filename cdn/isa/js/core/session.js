import { AUTH_DEFAULTS as D } from "./constants.js";
import { wrapPassword } from "./caesar.js";

/** Sesión JWT enriquecida (rol) — system-login front y apps con login propio. */
export function registerSession(ns, opts = {}) {
  const sessionKey = opts.sessionKey || D.sessionKey;
  const authEvt = opts.authEvent || D.authEvent;
  const authLocalKey = opts.authLocalKey || D.authLocalKey;
  const authLocal = opts.authLocal || D.authLocal;
  const authOnline = opts.authOnline || D.authOnline;

  function authBase() {
    try {
      if (localStorage.getItem(authLocalKey) === "1") return authLocal;
    } catch (e) {}
    return authOnline;
  }

  function authUrl(path) {
    return authBase().replace(/\/$/, "") + (path.charAt(0) === "/" ? path : "/" + path);
  }

  function readSession() {
    try {
      const v = sessionStorage.getItem(sessionKey);
      return v ? JSON.parse(v) : null;
    } catch (e) {
      return null;
    }
  }

  function saveSession(data) {
    sessionStorage.setItem(
      sessionKey,
      JSON.stringify({
        username: data.username,
        role: data.role ?? null,
        token: data.token,
        expiresAt: data.expiresAt ?? null,
      }),
    );
    window.dispatchEvent(new Event(authEvt));
  }

  function clearSession() {
    sessionStorage.removeItem(sessionKey);
    window.dispatchEvent(new Event(authEvt));
  }

  let session = readSession();

  function current() {
    session = session ?? readSession();
    return session;
  }

  function isLoggedIn() {
    session = session ?? readSession();
    if (!session?.token) return false;
    if (session.expiresAt && new Date(session.expiresAt).getTime() < Date.now()) return false;
    return true;
  }

  function username() {
    return current()?.username ?? null;
  }

  function authHeader() {
    return isLoggedIn() ? { Authorization: "Bearer " + session.token } : {};
  }

  async function login(user, pass) {
    const res = await fetch(authUrl("/auth/token"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: user.trim(), password: wrapPassword(pass) }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.token) {
      const err = new Error(data.error || "Login falló (" + res.status + ")");
      if (data.retryAfterSeconds) err.retryAfterSeconds = data.retryAfterSeconds;
      throw err;
    }
    session = {
      username: data.username || user,
      role: data.role || null,
      token: data.token,
      expiresAt: data.expiresAt || null,
    };
    saveSession(session);
    return session;
  }

  function logout() {
    session = null;
    clearSession();
  }

  const bag = window[ns] || {};
  bag.AuthApi = {
    AUTH_LOCAL: authLocal,
    AUTH_ONLINE: authOnline,
    SESSION_KEY: sessionKey,
    SESSION_EVT: authEvt,
    authBase,
    authUrl,
    saveSession,
    readSession,
    isLoggedIn,
    authHeader,
  };
  bag.Session = {
    current,
    isLoggedIn,
    username,
    authHeader,
    login,
    logout,
    EVENT: authEvt,
  };
  /** Puente para AppShell / widgets que esperan Auth. */
  bag.Auth = {
    isLoggedIn,
    username,
    authHeader,
    login,
    logout,
    EVENT: authEvt,
    LOGIN_URL: opts.loginUrl || D.loginUrl,
    AUTH_ONLINE: authOnline,
  };
  window[ns] = bag;
}
