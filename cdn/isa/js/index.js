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
import { createLoginButton, registerLoginButton } from "./ui/login-button.js";
import { registerApp } from "./core/register-app.js";
import { REALTIME, wsUrlFromHttpBase, createRealtime, registerRealtime, REALTIME_EVENT } from "./core/realtime.js";
import { showToast, registerToast, TOAST_EVENT } from "./ui/toast.js";
import { createSqlExec, registerSqlExec } from "./ui/sql-exec.js";
import { registerCodeMirror } from "./ui/code-mirror.js";
import { CAPABILITY_CATALOG, blockReasonFor, resolveCapId } from "./core/capabilities.js";
import { sanitizeUserMessage } from "./core/sanitize-user-message.js";
import {
  DEFAULT_FETCH_TIMEOUT_MS,
  isDevHost,
  localDevHint,
  sanitizeApiError,
  normalizeApiPath,
  apiUrl,
  wrapFetchError,
  fetchRaw,
  parseJsonResponse,
  basesFor,
  createCapFetch,
  createApiFetch,
  encodeSqlQueryParam,
  rowVal,
  humanPermissionError,
  handleApiError,
} from "./core/api-http.js";
import { createServiceSession } from "./core/service-session.js";
import { buildCapEndpointMap, canAny } from "./core/cap-endpoints.js";
import { getReact, getReactDOM, getMaterialUI } from "./core/runtime.js";
import { createUrlState, b64urlEncode, b64urlDecode, goBrandHome, BRAND_HOME_EVENT } from "./core/url-state.js";
import { createPlatformBridge } from "./core/platform-bridge.js";
import { migrateLegacyGatewayKeys, GATEWAY_LEGACY_LS_KEYS } from "./core/gateway-legacy.js";
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
  toastFromPayload,
} from "./ui/feedback/toast-bus.js";
import { createProcessRunner, FEEDBACK_PROCESS_EVENT } from "./ui/feedback/process-bus.js";
import { formatLocalDate, formatLocalDateTime } from "./core/format.js";
import { estimatePromptTokens } from "./core/prompt-tokens.js";
import {
  ensureLazyStylesheet,
  loadLazyScript,
  loadLazyScriptsSequential,
  ensureCodeMirrorLoaded,
  ensureCodeMirrorStyles,
  ensureMarked,
} from "./core/lazy-assets.js";
import { mdToHtml } from "./core/markdown.js";
import {
  LOGIN_SUBTITLE_DEFAULT,
  loginPageSx,
  loginCardSx,
  loginHeaderBandSx,
  loginIconBoxSx,
  LoginHeaderBand,
} from "./ui/login-surface.js";

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
  ensureLazyStylesheet,
  loadLazyScript,
  loadLazyScriptsSequential,
  ensureCodeMirrorLoaded,
  ensureCodeMirrorStyles,
  ensureMarked,
  mdToHtml,
  CAPABILITY_CATALOG,
  blockReasonFor,
  resolveCapId,
  sanitizeUserMessage,
  sanitizeApiError,
  normalizeApiPath,
  DEFAULT_FETCH_TIMEOUT_MS,
  isDevHost,
  localDevHint,
  apiUrl,
  wrapFetchError,
  fetchRaw,
  parseJsonResponse,
  basesFor,
  createCapFetch,
  createApiFetch,
  encodeSqlQueryParam,
  rowVal,
  humanPermissionError,
  handleApiError,
  createServiceSession,
  buildCapEndpointMap,
  canAny,
  getReact,
  getReactDOM,
  getMaterialUI,
  createUrlState,
  b64urlEncode,
  b64urlDecode,
  goBrandHome,
  BRAND_HOME_EVENT,
  createPlatformBridge,
  migrateLegacyGatewayKeys,
  GATEWAY_LEGACY_LS_KEYS,
  Runtime: { getReact, getReactDOM, getMaterialUI },
  createSqlExec,
  registerSqlExec,
  registerCodeMirror,
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
  registerCodeMirror(window.React, window.MaterialUI);
}

window.__isaFrontReady = Promise.resolve(true);
