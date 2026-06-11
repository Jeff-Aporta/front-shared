/**
 * ISA Front — punto de entrada ESM (runtime, sin build).
 * jsDelivr: …/front-shared@main/cdn/isa/js/index.js
 */
import "./core/caesar.js";
import { CDN_BASE, UI_CDN_BASE, MAIN_ORCHESTRATOR_URL_LOCAL, MAIN_ORCHESTRATOR_URL_PROD, GATEWAY_URL_LOCAL, GATEWAY_URL_PROD } from "./core/constants.js";
import { createApiConfig, registerConfig } from "./core/config.js";
import { rewriteFlsItem, rewriteViaGateway } from "./core/gateway-url.js";
import { createAuth, registerAuth } from "./core/auth.js";
import { makeDodgerTheme, createThemeApi, registerTheme } from "./ui/theme.js";
import { createWidgets, registerWidgets } from "./ui/widgets.js";
import { createLoginGates, registerLoginGates } from "./ui/login-gate.js";
import { registerApp } from "./core/register-app.js";
import { REALTIME, wsUrlFromHttpBase, createRealtime, registerRealtime, REALTIME_EVENT } from "./core/realtime.js";
import { showToast, registerToast, TOAST_EVENT } from "./ui/toast.js";

window.ISAFront = {
  CDN_BASE,
  uiBase: UI_CDN_BASE,
  cssUrl: CDN_BASE + "/css/base.css",
  MAIN_ORCHESTRATOR_URL_PROD,
  MAIN_ORCHESTRATOR_URL_LOCAL,
  GATEWAY_URL_PROD,
  GATEWAY_URL_LOCAL,
  rewriteViaGateway,
  rewriteFlsItem,
  createApiConfig,
  registerConfig,
  createAuth,
  registerAuth,
  makeDodgerTheme,
  createThemeApi,
  registerTheme,
  createWidgets,
  registerWidgets,
  createLoginGates,
  registerLoginGates,
  registerApp,
  REALTIME,
  REALTIME_EVENT,
  wsUrlFromHttpBase,
  createRealtime,
  registerRealtime,
  showToast,
  registerToast,
  TOAST_EVENT,
  Layout: {},
};

window.__isaFrontReady = Promise.resolve(true);
