/**
 * Markdown + HTML inline/bloques → HTML (marked GFM; fallback plaintext).
 * CommonMark pasa HTML crudo; útil en prompts con etiquetas semánticas.
 * @module markdown
 */
import { ensureMarked } from "./lazy-assets.js";

let markedConfigured = false;

function configureMarked() {
  if (markedConfigured || typeof window.marked?.use !== "function") return;
  window.marked.use({
    gfm: true,
    breaks: false,
    pedantic: false,
  });
  markedConfigured = true;
}

/**
 * @param {string} src
 * @returns {string}
 */
export function mdToHtml(src) {
  if (!src) return "";
  if (typeof window.marked === "undefined") {
    ensureMarked().catch(() => { /* fallback plaintext */ });
  }
  try {
    if (typeof window.marked?.parse === "function") {
      configureMarked();
      const html = window.marked.parse(String(src), {
        async: false,
        gfm: true,
        breaks: false,
        pedantic: false,
      });
      return String(html)
        .replace(/<table(\s|>)/g, '<div class="md-table-wrap"><table$1')
        .replace(/<\/table>/g, "</table></div>");
    }
  } catch { /* ignore */ }
  return String(src)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br />");
}
