import { DODGER } from "../core/constants.js";

const NEON = {
  blue: DODGER,
  cyan: "#00e5ff",
  purple: "#6366f1",
};

/** Sin mayúsculas forzadas — cada label define su propia capitalización. */
export const dodgerComponentOverrides = {
  MuiCssBaseline: {
    styleOverrides: {
      body: ({ theme }) =>
        theme.palette.mode === "dark"
          ? {
              background: "linear-gradient(180deg, #060d18 0%, #0a1628 45%, #0f172a 100%)",
              backgroundAttachment: "fixed",
            }
          : {
              background: "linear-gradient(180deg, #eef4ff 0%, #f5f9ff 50%, #f8fafc 100%)",
              backgroundAttachment: "fixed",
            },
    },
  },
  MuiButton: {
    styleOverrides: {
      root: { textTransform: "none" },
      containedPrimary: {
        boxShadow: "0 0 20px rgba(30,144,255,0.35)",
        "&:hover": { boxShadow: "0 0 28px rgba(30,144,255,0.55)" },
      },
    },
  },
  MuiTab: {
    styleOverrides: {
      root: {
        textTransform: "none",
        transition: "color 0.2s, text-shadow 0.2s",
        "&.Mui-selected": { textShadow: "0 0 14px rgba(30,144,255,0.55)" },
      },
    },
  },
  MuiTabs: {
    styleOverrides: {
      indicator: {
        height: 3,
        borderRadius: 2,
        background: "linear-gradient(90deg, #1e90ff, #6366f1)",
        boxShadow: "0 0 14px rgba(30,144,255,0.75)",
      },
    },
  },
  MuiToggleButton: {
    styleOverrides: {
      root: { textTransform: "none" },
    },
  },
  MuiAppBar: {
    styleOverrides: {
      root: ({ theme }) =>
        theme.palette.mode === "dark"
          ? {
              background: "linear-gradient(90deg, rgba(6,13,24,0.97) 0%, rgba(15,35,70,0.94) 48%, rgba(35,18,65,0.97) 100%)",
              backdropFilter: "blur(14px)",
              borderBottom: "1px solid rgba(30,144,255,0.28)",
              boxShadow: "0 4px 32px rgba(30,144,255,0.12), inset 0 -1px 0 rgba(0,229,255,0.06)",
              color: theme.palette.text.primary,
            }
          : {
              background: "linear-gradient(90deg, rgba(255,255,255,0.96) 0%, rgba(240,247,255,0.96) 50%, rgba(248,250,255,0.98) 100%)",
              backdropFilter: "blur(12px)",
              borderBottom: "1px solid rgba(30,144,255,0.18)",
              boxShadow: "0 4px 24px rgba(30,144,255,0.08)",
              color: theme.palette.text.primary,
            },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: ({ theme }) => ({
        backgroundImage: "none",
        ...(theme.palette.mode === "dark" ? { backdropFilter: "blur(10px)" } : {}),
      }),
      outlined: ({ theme }) =>
        theme.palette.mode === "dark"
          ? {
              background: "linear-gradient(145deg, rgba(15,34,54,0.78), rgba(11,18,32,0.9))",
              borderColor: "rgba(30,144,255,0.22)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.04)",
            }
          : {
              background: "linear-gradient(145deg, rgba(255,255,255,0.95), rgba(240,247,255,0.88))",
              borderColor: "rgba(30,144,255,0.16)",
              boxShadow: "0 8px 28px rgba(15,23,42,0.06)",
            },
      elevation: ({ theme }) =>
        theme.palette.mode === "dark"
          ? {
              background: "linear-gradient(145deg, rgba(15,34,54,0.96), rgba(11,18,32,0.98))",
              border: "1px solid rgba(30,144,255,0.28)",
              boxShadow: "0 12px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)",
            }
          : {
              background: "linear-gradient(145deg, rgba(255,255,255,0.98), rgba(240,247,255,0.94))",
              border: "1px solid rgba(30,144,255,0.18)",
              boxShadow: "0 12px 32px rgba(15,23,42,0.08)",
            },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: ({ theme }) => ({
        backgroundImage: "none",
        borderRadius: 14,
        ...(theme.palette.mode === "dark"
          ? {
              background: "linear-gradient(145deg, rgba(15,34,54,0.96), rgba(11,18,32,0.98))",
              border: "1px solid rgba(30,144,255,0.28)",
              boxShadow: "0 12px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)",
              color: theme.palette.text.primary,
            }
          : {
              background: "linear-gradient(145deg, rgba(255,255,255,0.98), rgba(240,247,255,0.94))",
              border: "1px solid rgba(30,144,255,0.18)",
              boxShadow: "0 12px 32px rgba(15,23,42,0.08)",
              color: theme.palette.text.primary,
            }),
      }),
    },
  },
  MuiAutocomplete: {
    styleOverrides: {
      paper: ({ theme }) => ({
        backgroundImage: "none",
        marginTop: 4,
        ...(theme.palette.mode === "dark"
          ? {
              background: "linear-gradient(145deg, rgba(15,34,54,0.98), rgba(11,18,32,0.99))",
              border: "1px solid rgba(30,144,255,0.22)",
              boxShadow: "0 8px 28px rgba(0,0,0,0.35)",
              color: theme.palette.text.primary,
            }
          : {
              background: "linear-gradient(145deg, rgba(255,255,255,0.98), rgba(240,247,255,0.95))",
              border: "1px solid rgba(30,144,255,0.16)",
              boxShadow: "0 8px 24px rgba(15,23,42,0.08)",
              color: theme.palette.text.primary,
            }),
      }),
      option: ({ theme }) => ({
        "&[aria-selected='true']": {
          backgroundColor: theme.palette.mode === "dark"
            ? "rgba(30,144,255,0.18) !important"
            : "rgba(30,144,255,0.12) !important",
        },
        "&.Mui-focused": {
          backgroundColor: theme.palette.mode === "dark"
            ? "rgba(30,144,255,0.12) !important"
            : "rgba(30,144,255,0.08) !important",
        },
      }),
      listbox: ({ theme }) => ({
        color: theme.palette.text.primary,
      }),
    },
  },
  MuiBackdrop: {
    styleOverrides: {
      root: ({ theme }) => ({
        backgroundColor: theme.palette.mode === "dark"
          ? "rgba(3, 8, 16, 0.72)"
          : "rgba(10, 37, 64, 0.32)",
      }),
    },
  },
  MuiIconButton: {
    styleOverrides: {
      root: {
        transition: "box-shadow 0.2s",
        "&:hover": { boxShadow: "0 0 12px rgba(30,144,255,0.25)" },
      },
    },
  },
};

export function makeDodgerTheme(MUI, mode) {
  const dark = mode === "dark";
  return MUI.createTheme({
    palette: {
      mode,
      primary: { main: NEON.blue, light: "#63b3ff", dark: "#1565c0" },
      secondary: { main: NEON.purple, light: "#818cf8", dark: "#4f46e5" },
      info: { main: NEON.cyan },
      background: dark
        ? { default: "#060d18", paper: "#0f2236" }
        : { default: "#eef4ff", paper: "#ffffff" },
      text: dark
        ? { primary: "#e8f4ff", secondary: "#9ec5eb" }
        : { primary: "#0a2540", secondary: "#4a6278" },
      divider: dark ? "rgba(30,144,255,0.18)" : "rgba(10,37,64,0.1)",
    },
    shape: { borderRadius: 12 },
    typography: {
      fontFamily: '"IBM Plex Sans", "Space Grotesk", system-ui, sans-serif',
      h4: { fontFamily: '"Space Grotesk", "IBM Plex Sans", sans-serif', fontWeight: 700, letterSpacing: -0.5 },
      h5: { fontFamily: '"Space Grotesk", "IBM Plex Sans", sans-serif', fontWeight: 700 },
      h6: { fontFamily: '"Space Grotesk", "IBM Plex Sans", sans-serif', fontWeight: 600 },
    },
    components: dodgerComponentOverrides,
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

    React.useEffect(() => {
      try {
        document.documentElement.setAttribute("data-mui-color-scheme", mode);
        document.documentElement.style.colorScheme = mode;
      } catch (e) {}
    }, [mode]);

    const toggle = React.useCallback(() => {
      setMode((m) => {
        const n = m === "dark" ? "light" : "dark";
        try {
          localStorage.setItem(lsKey, n);
          document.documentElement.setAttribute("data-mui-color-scheme", n);
          document.documentElement.style.colorScheme = n;
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
