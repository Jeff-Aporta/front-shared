#!/usr/bin/env node
/**
 * Genera swagger-templates.ts desde templates/*.css y *.html
 * Uso: node embed-templates.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const TPL = join(ROOT, "templates");

function escForBacktick(s) {
  return s.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
}

function readTpl(name) {
  return readFileSync(join(TPL, name), "utf8").trim();
}

const shellCss = escForBacktick(readTpl("swagger-shell.css"));
const toastCss = escForBacktick(readTpl("swagger-toast.css"));
const authHtml = escForBacktick(readTpl("swagger-auth-shell.html"));

const out = `/** GENERADO — editar templates/ y correr: node embed-templates.mjs */
export const SWAGGER_SHELL_CSS = \`${shellCss}\`;
export const SWAGGER_TOAST_CSS = \`${toastCss}\`;
export const SWAGGER_AUTH_SHELL_HTML = \`${authHtml}\`;
`;

writeFileSync(join(ROOT, "swagger-templates.ts"), out, "utf8");
console.log("embed-templates: wrote swagger-templates.ts");
