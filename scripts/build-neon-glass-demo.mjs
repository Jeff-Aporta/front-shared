/**
 * Empaqueta CSS del kit neon-glass para el demo GH Pages (front-shared/demo/neon-glass).
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { minifyCss } from "./lib/minify-css.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const KIT_CSS = join(root, "cdn", "isa", "css", "kits", "neon-glass", "neon-glass.css");
const CDN_DIR = join(root, "cdn");
const OUT_DEMO = join(root, "demo", "neon-glass", "cdn", "neon-glass.min.css");
const OUT_CDN = join(CDN_DIR, "neon-glass.min.css");

function build() {
  const css = readFileSync(KIT_CSS, "utf8");
  const min = minifyCss(css);
  mkdirSync(dirname(OUT_DEMO), { recursive: true });
  writeFileSync(OUT_DEMO, min, "utf8");
  writeFileSync(OUT_CDN, min, "utf8");
  console.log("neon-glass demo CSS OK");
  console.log("  ", OUT_DEMO);
}

build();
