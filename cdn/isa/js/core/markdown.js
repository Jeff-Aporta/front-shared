/**
 * Markdown → HTML (marked GFM; fallback plaintext).
 * @module markdown
 */
import { ensureMarked } from "./lazy-assets.js";

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
      const html = window.marked.parse(String(src), {
        async: false,
        gfm: true,
        breaks: false,
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
