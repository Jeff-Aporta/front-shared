/** CodeMirror 5 — panel reutilizable con botón copiar (ISAFront). */
import { CDN_BASE } from "../core/constants.js";

export function ensureCodeMirrorCss() {
  if (typeof document === "undefined") return;
  if (document.querySelector("link[data-isa-cm-css]")) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = CDN_BASE + "/css/code-mirror.css";
  link.setAttribute("data-isa-cm-css", "1");
  document.head.appendChild(link);
}

function resolveMode(opts = {}) {
  if (opts.json) return { name: "javascript", json: true };
  if (opts.mode === "sql") return "text/x-sql";
  return opts.mode || "javascript";
}

function toastCopied() {
  const fb = window.ISAFront?.Feedback?.toast;
  if (fb?.success) {
    fb.success("Copiado al portapapeles");
    return;
  }
  if (typeof window.ISAFront?.showToast === "function") {
    window.ISAFront.showToast({ message: "Copiado al portapapeles", severity: "success" });
  }
}

async function copyText(text) {
  const s = String(text ?? "");
  if (!s) return;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(s);
      toastCopied();
      return;
    }
  } catch {
    /* fallback */
  }
  const ta = document.createElement("textarea");
  ta.value = s;
  ta.setAttribute("readonly", "");
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand("copy");
    toastCopied();
  } catch {
    /* ignore */
  }
  document.body.removeChild(ta);
}

/**
 * Monta CodeMirror 5 en un contenedor DOM.
 * @returns {import("codemirror").Editor | null}
 */
export function mountCodeMirror(host, opts = {}) {
  ensureCodeMirrorCss();
  const CM = window.CodeMirror;
  if (!CM || !host) return null;

  const readOnly = !!opts.readOnly;
  const cm = CM(host, {
    value: opts.value ?? "",
    mode: resolveMode(opts),
    theme: opts.theme ?? "dracula",
    lineNumbers: opts.lineNumbers !== false,
    lineWrapping: !!opts.lineWrapping,
    readOnly,
    tabSize: 2,
    indentUnit: 2,
    indentWithTabs: false,
    viewportMargin: opts.viewportMargin ?? (readOnly ? Infinity : 10),
    extraKeys: readOnly
      ? {}
      : { Tab: (editor) => editor.replaceSelection("  ", "end") },
  });

  if (typeof opts.onChange === "function") {
    cm.on("change", () => opts.onChange(cm.getValue(), cm));
  }

  return cm;
}

export function destroyCodeMirror(cm) {
  if (!cm) return;
  const wrapper = cm.getWrapperElement?.();
  wrapper?.parentNode?.removeChild(wrapper);
}

export function createCodeMirrorPanel(React, MUI) {
  const { useRef, useEffect } = React;

  function CodeMirrorPanel({
    value = "",
    onChange,
    readOnly = false,
    json = false,
    mode,
    minHeight = "8rem",
    maxHeight,
    fill = false,
    className = "",
    copyTitle = "Copiar",
    placeholder = "",
    lineWrapping = false,
    lineNumbers = true,
  }) {
    const hostRef = useRef(null);
    const cmRef = useRef(null);
    const onChangeRef = useRef(onChange);
    const syncingRef = useRef(false);

    useEffect(() => {
      onChangeRef.current = onChange;
    }, [onChange]);

    useEffect(() => {
      const host = hostRef.current;
      if (!host) return undefined;

      if (typeof window.CodeMirror === "undefined") return undefined;

      const cm = mountCodeMirror(host, {
        value: value || "",
        json,
        mode,
        readOnly,
        lineWrapping,
        lineNumbers,
        onChange: readOnly
          ? undefined
          : (next) => {
            if (syncingRef.current) return;
            onChangeRef.current?.(next);
          },
      });
      cmRef.current = cm;

      const onResize = () => cm?.refresh?.();
      window.addEventListener("resize", onResize);
      const t = setTimeout(onResize, 0);

      return () => {
        clearTimeout(t);
        window.removeEventListener("resize", onResize);
        destroyCodeMirror(cm);
        cmRef.current = null;
      };
    }, [json, mode, readOnly, lineWrapping, lineNumbers]);

    useEffect(() => {
      const cm = cmRef.current;
      if (!cm) return;
      const cur = cm.getValue();
      const next = value ?? "";
      if (cur === next) return;
      syncingRef.current = true;
      const scroll = cm.getScrollInfo();
      const cursor = cm.getCursor();
      cm.setValue(next);
      cm.scrollTo(scroll.left, scroll.top);
      if (next && !readOnly) cm.setCursor(cursor);
      syncingRef.current = false;
    }, [value, readOnly]);

    useEffect(() => {
      const cm = cmRef.current;
      if (!cm) return;
      const t = setTimeout(() => cm.refresh(), 0);
      return () => clearTimeout(t);
    }, [minHeight, maxHeight, fill]);

    const panelClass = [
      "isa-cm-panel",
      fill ? "isa-cm-panel--fill" : "",
      className,
    ].filter(Boolean).join(" ");

    const hostStyle = { minHeight };
    if (maxHeight) hostStyle.maxHeight = maxHeight;

    if (typeof window.CodeMirror === "undefined") {
      return React.createElement(
        "div",
        { className: panelClass },
        React.createElement(
          "div",
          { className: "isa-cm-panel__toolbar" },
          React.createElement(
            MUI.Tooltip,
            { title: copyTitle },
            React.createElement(
              MUI.IconButton,
              {
                size: "small",
                className: "isa-cm-panel__copy",
                "aria-label": copyTitle,
                onClick: () => copyText(value),
              },
              React.createElement("iconify-icon", {
                icon: "mdi:content-copy",
                width: "1.1em",
                height: "1.1em",
              }),
            ),
          ),
        ),
        readOnly
          ? React.createElement("pre", {
            className: "isa-cm-fallback",
            style: hostStyle,
          }, value || placeholder)
          : React.createElement("textarea", {
            className: "isa-cm-fallback",
            style: hostStyle,
            value,
            placeholder,
            readOnly,
            spellCheck: false,
            onChange: (e) => onChange?.(e.target.value),
          }),
      );
    }

    return React.createElement(
      "div",
      { className: panelClass },
      React.createElement(
        "div",
        { className: "isa-cm-panel__toolbar" },
        React.createElement(
          MUI.Tooltip,
          { title: copyTitle },
          React.createElement(
            MUI.IconButton,
            {
              size: "small",
              className: "isa-cm-panel__copy",
              "aria-label": copyTitle,
              onClick: () => copyText(cmRef.current?.getValue?.() ?? value),
            },
            React.createElement("iconify-icon", {
              icon: "mdi:content-copy",
              width: "1.1em",
              height: "1.1em",
            }),
          ),
        ),
      ),
      React.createElement("div", { className: "isa-cm-host", ref: hostRef, style: hostStyle }),
    );
  }

  return { CodeMirrorPanel };
}

export function registerCodeMirror(React, MUI) {
  ensureCodeMirrorCss();
  const api = createCodeMirrorPanel(React, MUI);
  window.ISAFront = window.ISAFront || {};
  window.ISAFront.CodeMirrorPanel = api.CodeMirrorPanel;
  window.ISAFront.mountCodeMirror = mountCodeMirror;
  window.ISAFront.destroyCodeMirror = destroyCodeMirror;
  window.ISAFront.ensureCodeMirrorCss = ensureCodeMirrorCss;
  return api;
}
