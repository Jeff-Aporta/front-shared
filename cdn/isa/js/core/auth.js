import { AUTH_DEFAULTS as D, MAIN_ORCHESTRATOR_LS_KEY } from "./constants.js";
import { wrapPassword } from "./caesar.js";
import { createTokenStore, isTokenValid } from "./token-store.js";

/** Auth consumer — login contra system-login (sesión compartida). */
export function createAuth(opts = {}) {
  const sessionKey = opts.sessionKey || D.sessionKey;
  const authEvt = opts.authEvent || D.authEvent;
  const authLocalKey = opts.authLocalKey || D.authLocalKey;
  const authLocal = opts.authLocal || D.authLocal;
  const authOnline = opts.authOnline || D.authOnline;
  const loginUrl = opts.loginUrl || D.loginUrl;
  const store = createTokenStore(sessionKey);

  function read() {
    const data = store.read();
    if (!data) return null;
    if (!isTokenValid(data)) {
      store.clear();
      return null;
    }
    return data;
  }

  function authBase() {
    try {
      if (localStorage.getItem(MAIN_ORCHESTRATOR_LS_KEY) === "1") return authLocal;
    } catch (e) {
      /* ignore */
    }
    return authOnline;
  }

  function isLoggedIn() {
    return isTokenValid(read());
  }

  function username() {
    return read()?.username ?? null;
  }

  function authHeader() {
    const s = read();
    return s?.token ? { Authorization: "Bearer " + s.token } : {};
  }

  async function login(user, pass) {
    const res = await fetch(authBase().replace(/\/$/, "") + "/api/auth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: user, password: wrapPassword(pass) }),
    });
    const data = await res.json();
    if (!res.ok || !data.token) throw new Error(data.error || "Login fallido");
    store.save({
      username: data.username || user,
      token: data.token,
      expiresAt: data.expiresAt ?? null,
    });
    window.dispatchEvent(new Event(authEvt));
  }

  function logout() {
    store.clear();
    window.dispatchEvent(new Event(authEvt));
  }

  const auth = {
    isLoggedIn,
    username,
    authHeader,
    login,
    logout,
    LOGIN_URL: loginUrl,
    EVENT: authEvt,
    AUTH_ONLINE: authOnline,
  };

  if (isLoggedIn()) {
    window.dispatchEvent(new Event(authEvt));
  }

  return auth;
}

export function registerAuth(ns, opts) {
  window[ns] = window[ns] || {};
  window[ns].Auth = createAuth(opts);
}
