/** Estilo login alineado con driver JSX de tickets (gradiente + tarjeta con banda). */

export const LOGIN_SUBTITLE_DEFAULT =
  "Use su usuario y contraseña de la organización. La misma sesión sirve en todas las aplicaciones.";

export function loginPageSx(extra = {}) {
  return {
    flex: 1,
    minHeight: "100vh",
    width: "100%",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    p: { xs: 2, sm: 3 },
    background: (t) =>
      t.palette.mode === "dark"
        ? "radial-gradient(ellipse 120% 80% at 50% -20%, rgba(99,102,241,0.18), transparent 55%), linear-gradient(180deg, #0b1220 0%, #0f172a 100%)"
        : "radial-gradient(ellipse 120% 80% at 50% -20%, rgba(30,144,255,0.12), transparent 55%), linear-gradient(180deg, #f0f6ff 0%, #f8fafc 100%)",
    ...extra,
  };
}

export function loginCardSx(extra = {}) {
  return {
    width: "100%",
    maxWidth: 440,
    borderRadius: 2.5,
    overflow: "hidden",
    border: 1,
    borderColor: "divider",
    bgcolor: "background.paper",
    boxShadow: (t) =>
      t.palette.mode === "dark"
        ? "0 4px 24px rgba(0,0,0,0.25)"
        : "0 8px 32px rgba(15,23,42,0.07)",
    ...extra,
  };
}

export function loginHeaderBandSx(accent = "#1e90ff") {
  return {
    px: { xs: 2, sm: 2.5 },
    py: 1.75,
    borderBottom: 1,
    borderColor: "divider",
    background: (t) =>
      t.palette.mode === "dark"
        ? `linear-gradient(90deg, ${accent}33, transparent 70%)`
        : `linear-gradient(90deg, ${accent}1f, transparent 70%)`,
    borderLeft: 4,
    borderLeftColor: accent,
  };
}

export function loginIconBoxSx(accent = "#1e90ff") {
  return {
    width: 36,
    height: 36,
    borderRadius: 1.5,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    background: `linear-gradient(135deg, ${accent}, ${accent}99)`,
    color: "#fff",
    boxShadow: `0 4px 12px ${accent}44`,
  };
}

/** Banda superior estilo SectionCard (tk JSX). */
export function LoginHeaderBand(React, MUI, UI, { icon, title, accent }) {
  const color = accent || "#1e90ff";
  return React.createElement(
    MUI.Box,
    { sx: loginHeaderBandSx(color) },
    React.createElement(
      MUI.Stack,
      { direction: "row", spacing: 1.25, alignItems: "center" },
      React.createElement(
        MUI.Box,
        { sx: loginIconBoxSx(color) },
        React.createElement(UI.Icon, { icon: icon || "mdi:shield-key-outline", size: 20 }),
      ),
      React.createElement(MUI.Typography, { variant: "subtitle1", sx: { fontWeight: 700, letterSpacing: -0.2 } }, title),
    ),
  );
}
