import { DODGER } from "../core/constants.js";

export function makeDodgerTheme(MUI, mode) {
  const dark = mode === "dark";
  return MUI.createTheme({
    palette: {
      mode,
      primary: { main: DODGER, light: "#63b3ff", dark: "#1565c0" },
      secondary: { main: "#63b3ff" },
      background: dark
        ? { default: "#0a1929", paper: "#0f2236" }
        : { default: "#f0f6ff", paper: "#ffffff" },
      text: dark
        ? { primary: "#e3f2fd", secondary: "#7fb4e6" }
        : { primary: "#0a2540", secondary: "#3a6ea5" },
    },
    shape: { borderRadius: 10 },
    typography: { fontFamily: '"IBM Plex Sans", system-ui, sans-serif' },
  });
}

export function createThemeApi(React, MUI, lsKey) {
  function initialMode() {
    try {
      const v = localStorage.getItem(lsKey);
      if (v === "light" || v === "dark") return v;
    } catch (e) {}
    return "dark";
  }

  function useThemeMode() {
    const [mode, setMode] = React.useState(initialMode());
    const toggle = React.useCallback(() => {
      setMode((m) => {
        const n = m === "dark" ? "light" : "dark";
        try {
          localStorage.setItem(lsKey, n);
        } catch (e) {}
        return n;
      });
    }, []);
    const theme = React.useMemo(() => makeDodgerTheme(MUI, mode), [mode]);
    return { mode, toggle, theme };
  }

  return {
    makeTheme: (mode) => makeDodgerTheme(MUI, mode),
    useThemeMode,
    DODGER,
  };
}

export function registerTheme(ns, opts) {
  const React = window.React;
  const MUI = window.MaterialUI;
  if (!React || !MUI) throw new Error("ISAFront.registerTheme requiere React/MUI (cargar stack.mjs antes)");
  const lsKey = opts?.lsKey || ns.toLowerCase() + ":theme";
  window[ns] = window[ns] || {};
  window[ns].Theme = createThemeApi(React, MUI, lsKey);
}
