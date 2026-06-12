import { registerConfig } from "./config.js";
import { registerAuth } from "./auth.js";
import { registerSession } from "./session.js";
import { registerTheme } from "../ui/theme.js";
import { registerWidgets } from "../ui/widgets.js";
import { registerLoginGates } from "../ui/login-gate.js";
import { registerRealtime } from "./realtime.js";
import { registerToast } from "../ui/toast.js";

/**
 * Registra módulos compartidos en window[ns].
 */
export function registerApp(opts) {
  const ns = opts.ns;
  if (!ns) throw new Error("ISAFront.registerApp: ns requerido");
  const appId = String(opts.appId || opts.app || "").trim();
  window[ns] = window[ns] || {};
  if (appId) window[ns].APP_ID = appId;

  if (opts.api !== false) {
    registerConfig(ns, opts.api && typeof opts.api === "object" ? opts.api : {});
  }

  if (opts.session) {
    if (!appId) throw new Error("ISAFront.registerApp: app/appId requerido con session");
    const sessionOpts =
      typeof opts.session === "object" ? { ...opts.session, appId } : { appId };
    registerSession(ns, sessionOpts);
  } else if (opts.auth !== false) {
    if (!appId) throw new Error("ISAFront.registerApp: app/appId requerido con auth/loginGate");
    const authOpts = typeof opts.auth === "object" ? { ...opts.auth, appId } : { appId };
    registerAuth(ns, authOpts);
  }

  if (opts.theme !== false) {
    registerTheme(ns, typeof opts.theme === "object" ? opts.theme : {});
  }

  if (opts.widgets !== false) {
    registerWidgets(ns, typeof opts.widgets === "object" ? opts.widgets : {});
  }

  const lg = opts.loginGate;
  if (lg) {
    const gateOpts = typeof lg === "object" ? lg : {};
    registerLoginGates(ns, gateOpts);
    if (lg === "redirect" || (typeof lg === "object" && lg.mode === "redirect")) {
      window[ns].UI.LoginGate = window[ns].UI.LoginGateRedirect;
    }
  }

  if (opts.realtime) {
    registerRealtime(ns, typeof opts.realtime === "object" ? opts.realtime : {});
  }

  if (opts.toast !== false) {
    registerToast(ns);
  }
}
