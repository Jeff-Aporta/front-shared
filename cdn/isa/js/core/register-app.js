import { registerConfig } from "./config.js";
import { registerAuth } from "./auth.js";
import { registerSession } from "./session.js";
import { registerTheme } from "../ui/theme.js";
import { registerWidgets } from "../ui/widgets.js";
import { registerLoginGates } from "../ui/login-gate.js";

/**
 * Registra módulos compartidos en window[ns].
 */
export function registerApp(opts) {
  const ns = opts.ns;
  if (!ns) throw new Error("ISAFront.registerApp: ns requerido");
  window[ns] = window[ns] || {};

  if (opts.api) registerConfig(ns, opts.api);

  if (opts.session) {
    registerSession(ns, typeof opts.session === "object" ? opts.session : {});
  } else if (opts.auth !== false) {
    registerAuth(ns, typeof opts.auth === "object" ? opts.auth : {});
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
}
