import { writeFileSync, copyFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const core = join(dirname(fileURLToPath(import.meta.url)), "..", "cdn", "isa", "js", "core");
const shims = {
  "constants.js": "config/constants.js",
  "config.js": "config/config.js",
  "auth.js": "auth/auth.js",
  "session.js": "auth/session.js",
  "service-session.js": "auth/service-session.js",
  "token-store.js": "auth/token-store.js",
  "caesar.js": "auth/caesar.js",
  "login-credentials.js": "auth/login-credentials.js",
  "api-http.js": "http/api-http.js",
  "gateway-url.js": "http/gateway-url.js",
  "gateway-legacy.js": "http/gateway-legacy.js",
  "capabilities.js": "caps/capabilities.js",
  "cap-endpoints.js": "caps/cap-endpoints.js",
  "realtime.js": "realtime/realtime.js",
  "platform-bridge.js": "platform/platform-bridge.js",
  "brand-home.js": "platform/brand-home.js",
  "url-state.js": "platform/url-state.js",
  "format.js": "util/format.js",
  "sanitize-user-message.js": "util/sanitize-user-message.js",
  "markdown.js": "util/markdown.js",
  "prompt-tokens.js": "util/prompt-tokens.js",
  "lazy-assets.js": "util/lazy-assets.js",
  "register-app.js": "boot/register-app.js",
  "runtime.js": "boot/runtime.js",
};

for (const [file, target] of Object.entries(shims)) {
  let content = `/** Compat CDN — canon: core/${target} */\nexport * from "./${target}";\n`;
  if (file === "caesar.js") content += `import "./${target}";\n`;
  writeFileSync(join(core, file), content);
}
copyFileSync(join(core, "platform", "app-meta.js"), join(core, "app-meta.js"));
copyFileSync(join(core, "boot", "theme-init.mjs"), join(core, "theme-init.mjs"));
console.log("core shims:", Object.keys(shims).length);
