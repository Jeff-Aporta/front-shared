import { AUTH_DEFAULTS as D } from "./constants.js";
import { wrapPassword } from "./caesar.js";

/** Auth consumer — login contra system-login (sesión compartida). */
export function createAuth(opts = {}) {
  const sessionKey = opts.sessionKey || D.sessionKey;
  const authEvt = opts.authEvent || D.authEvent;
  const authLocalKey = opts.authLocalKey || D.authLocalKey;
  const authLocal = opts.authLocal || D.authLocal;
  const authOnline = opts.authOnline || D.authOnline;
  const loginUrl = opts.loginUrl || D.loginUrl;

  function read() {
    try {
      const v = sessionStorage.getItem(sessionKey);
      return v ? JSON.parse(v) : null;
    } catch (e) {
      return null;
    }
  }

  function authBase() {
    try {
      if (localStorage.getItem(authLocalKey) === "1") return authLocal;
    } catch (e) {}
    return authOnline;
  }

  function isLoggedIn() {
    const s = read();
    if (!s?.token) return false;
    if (s.expiresAt && new Date(s.expiresAt).getTime() < Date.now()) return false;
    return true;
  }

  function username() {
    return read()?.username ?? null;
  }

  function authHeader() {
    const s = read();
    return s?.token ? { Authorization: "Bearer " + s.token } : {};
  }

  async function login(user, pass) {
    const res = await fetch(authBase().replace(/\/$/, "") + "/auth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: user, password: wrapPassword(pass) }),
    });
    const data = await res.json();
    if (!res.ok || !data.token) throw new Error(data.error || "Login fallido");
    sessionStorage.setItem(
      sessionKey,
      JSON.stringify({
        username: data.username || user,
        token: data.token,
        expiresAt: data.expiresAt ?? null,
      }),
    );
    window.dispatchEvent(new Event(authEvt));
  }

  function logout() {
    sessionStorage.removeItem(sessionKey);
    window.dispatchEvent(new Event(authEvt));
  }

  return {
    isLoggedIn,
    username,
    authHeader,
    login,
    logout,
    LOGIN_URL: loginUrl,
    EVENT: authEvt,
    AUTH_ONLINE: authOnline,
  };
}

export function registerAuth(ns, opts) {
  window[ns] = window[ns] || {};
  window[ns].Auth = createAuth(opts);
}
