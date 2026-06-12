/**
 * ISA Front — punto de entrada ESM (runtime, sin build).
 * jsDelivr: …/front-shared@main/cdn/isa/js/index.js
 */
import "./core/caesar.js";
import { CDN_BASE, UI_CDN_BASE, MAIN_ORCHESTRATOR_URL_LOCAL, MAIN_ORCHESTRATOR_URL_PROD, GATEWAY_URL_LOCAL, GATEWAY_URL_PROD } from "./core/constants.js";
import { createApiConfig, registerConfig, initGatewayPreference } from "./core/config.js";
import { rewriteFlsItem, rewriteViaGateway } from "./core/gateway-url.js";
import { createAuth, registerAuth } from "./core/auth.js";
import { makeDodgerTheme, createThemeApi, registerTheme } from "./ui/theme.js";
import { createWidgets, registerWidgets } from "./ui/widgets.js";
import { createLoginGates, registerLoginGates } from "./ui/login-gate.js";
import { registerApp } from "./core/register-app.js";
import { REALTIME, wsUrlFromHttpBase, createRealtime, registerRealtime, REALTIME_EVENT } from "./core/realtime.js";
import { showToast, registerToast, TOAST_EVENT } from "./ui/toast.js";
import { createSqlExec, registerSqlExec } from "./ui/sql-exec.js";
import { CAPABILITY_CATALOG, blockReasonFor, resolveCapId } from "./core/capabilities.js";
import { sanitizeUserMessage } from "./core/sanitize-user-message.js";
import {
  registerFeedback,
  registerFeedbackGlobal,
  createToastApi,
  createProcessApi,
} from "./ui/feedback/register.js";
import {
  toastSuccess,
  toastError,
  toastInfo,
  toastWarning,
  toastShow,
  requestConfirm,
  FEEDBACK_TOAST_EVENT,
} from "./ui/feedback/toast-bus.js";
import { createProcessRunner, FEEDBACK_PROCESS_EVENT } from "./ui/feedback/process-bus.js";
import { formatLocalDate, formatLocalDateTime } from "./core/format.js";
import { estimatePromptTokens } from "./core/prompt-tokens.js";

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
  initGatewayPreference,
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
  formatLocalDate,
  formatLocalDateTime,
  estimatePromptTokens,
  CAPABILITY_CATALOG,
  blockReasonFor,
  resolveCapId,
  sanitizeUserMessage,
  createSqlExec,
  registerSqlExec,
  registerFeedback,
  registerFeedbackGlobal,
  createToastApi,
  createProcessApi,
  createProcessRunner,
  toastSuccess,
  toastError,
  toastInfo,
  toastWarning,
  toastShow,
  requestConfirm,
  FEEDBACK_TOAST_EVENT,
  FEEDBACK_PROCESS_EVENT,
  Layout: {},
};

if (typeof window !== "undefined" && window.React && window.MaterialUI) {
  registerFeedbackGlobal(window.React, window.MaterialUI);
}

window.__isaFrontReady = Promise.resolve(true);
