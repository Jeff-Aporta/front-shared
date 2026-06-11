/**
 * ISA Front — punto de entrada ESM (runtime, sin build).
 * jsDelivr: …/front-shared@main/cdn/isa/js/index.js
 */
import "./core/caesar.js";
import { CDN_BASE, UI_CDN_BASE } from "./core/constants.js";
import { createApiConfig, registerConfig } from "./core/config.js";
import { createAuth, registerAuth } from "./core/auth.js";
import { makeDodgerTheme, createThemeApi, registerTheme } from "./ui/theme.js";
import { createWidgets, registerWidgets } from "./ui/widgets.js";
import { createLoginGates, registerLoginGates } from "./ui/login-gate.js";
import { registerApp } from "./core/register-app.js";

window.ISAFront = {
  CDN_BASE,
  uiBase: UI_CDN_BASE,
  cssUrl: CDN_BASE + "/css/base.css",
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
  Layout: {},
};

window.__isaFrontReady = Promise.resolve(true);
