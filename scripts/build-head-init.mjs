#!/usr/bin/env node
/**
 * Bundle head común: base-href + app-meta + theme-init + tail → dist/head-init.min.js
 * Publicar front-shared en jsDelivr; consumir una sola URL en index.html.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const cdn = join(root, "cdn");
const dist = join(cdn, "dist");
const versions = JSON.parse(readFileSync(join(cdn, "versions.json"), "utf8"));
const ref = versions.frontSharedRef || "9318276";

const parts = [
  join(cdn, "base-href.js"),
  join(cdn, "isa/js/core/platform/app-meta.js"),
  join(cdn, "isa/js/core/boot/theme-init.mjs"),
  join(cdn, "src/head-init-tail.js"),
];

mkdirSync(dist, { recursive: true });
const bundled = parts.map((p) => readFileSync(p, "utf8")).join("\n;\n");
const outJs = join(dist, "head-init.js");
writeFileSync(outJs, bundled, "utf8");

execSync(`npx --yes esbuild "${outJs}" --minify --outfile="${join(dist, "head-init.min.js")}"`, {
  cwd: root,
  stdio: "inherit",
});

writeFileSync(
  join(cdn, "front-shared-ref.mjs"),
  "/** Pin jsDelivr — sincronizado con versions.json.frontSharedRef al ejecutar npm run build:head. */\nexport const FRONT_SHARED_REF = \"" + ref + "\";\n",
  "utf8",
);

console.log("head-init.min.js OK (ref=" + ref + ")");
