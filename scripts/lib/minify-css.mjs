/** Minificador CSS ligero (sin dependencias) — suficiente para CDN _dist. */
export function minifyCss(css) {
  return String(css || "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([{}:;,>+~])\s*/g, "$1")
    .trim();
}
