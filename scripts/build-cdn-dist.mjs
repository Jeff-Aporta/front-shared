/**
 * Genera cdn/_dist/ — CSS/JS minificados para consumo jsDelivr (producción).
 * Fuente editable en cdn/isa/; _dist se commitea para GH Pages.
 */
import { readFileSync, writeFileSync, mkdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { minifyCss } from "./lib/minify-css.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const cdn = join(root, "cdn");
const dist = join(cdn, "_dist");
const isa = join(cdn, "isa");
const require = createRequire(import.meta.url);
const esbuild = require("esbuild");

const versions = JSON.parse(readFileSync(join(cdn, "versions.json"), "utf8"));
const ref = versions.frontSharedRef || "main";

const REACT_BANNER =
  "const React=globalThis.React;const MaterialUI=globalThis.MaterialUI;const ReactDOM=globalThis.ReactDOM;";

const CSS_BUNDLES = [
  { out: "isa/css/base.min.css", src: ["isa/css/base.css"] },
  { out: "isa/css/feedback.min.css", src: ["isa/css/feedback.css"] },
  { out: "isa/css/code-mirror.min.css", src: ["isa/css/code-mirror.css"] },
  { out: "isa/css/kits/neon-glass.min.css", src: ["isa/css/kits/neon-glass/neon-glass.css"] },
];

const JS_BUNDLES = [
  { out: "isa/js/index.min.js", entry: "isa/js/index.js" },
  { out: "isa/js/kits/neon-glass.min.js", entry: "isa/js/ui/kits/neon-glass/lazy-entry.js" },
];

function ensureDir(filePath) {
  mkdirSync(dirname(filePath), { recursive: true });
}

function buildCss() {
  const manifest = {};
  for (const { out, src } of CSS_BUNDLES) {
    const raw = src.map((rel) => readFileSync(join(cdn, rel), "utf8")).join("\n");
    const min = minifyCss(raw);
    const dest = join(dist, out);
    ensureDir(dest);
    writeFileSync(dest, min, "utf8");
    manifest[out] = { bytes: Buffer.byteLength(min), src };
    console.log("  css", out, `(${manifest[out].bytes} B)`);
  }
  return manifest;
}

function buildJs() {
  const manifest = {};
  const shared = {
    bundle: true,
    minify: true,
    legalComments: "none",
    target: "es2022",
    format: "esm",
    jsx: "transform",
    jsxFactory: "React.createElement",
    jsxFragment: "React.Fragment",
    loader: { ".jsx": "jsx" },
    banner: { js: REACT_BANNER },
    absWorkingDir: cdn,
  };

  for (const { out, entry } of JS_BUNDLES) {
    const dest = join(dist, out);
    ensureDir(dest);
    esbuild.buildSync({ ...shared, entryPoints: [entry], outfile: join(dist, out) });
    const bytes = statSync(dest).size;
    manifest[out] = { bytes, entry };
    console.log("  js ", out, `(${bytes} B)`);
  }
  return manifest;
}

function writeManifest(css, js) {
  const manifest = {
    frontSharedRef: ref,
    builtAt: new Date().toISOString(),
    note: "Artefactos minificados — boot-helper usa _dist en producción (no localhost).",
    css,
    js,
  };
  writeFileSync(join(dist, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n", "utf8");
}

function main() {
  console.log("build-cdn-dist → cdn/_dist/");
  mkdirSync(dist, { recursive: true });
  const css = buildCss();
  const js = buildJs();
  writeManifest(css, js);
  console.log("cdn/_dist OK — ref", ref);
}

main();
