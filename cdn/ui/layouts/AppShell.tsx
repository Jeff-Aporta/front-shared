/**
 * Layout estándar Jeff-Aporta: AppBar homogéneo + tema + TargetSwitch + contenido.
 * Requiere ISAFront.registerApp previo (ns con Theme, UI, Auth opcional).
 *
 * jsDelivr: …/front-shared@main/cdn/ui/layouts/AppShell.tsx
 */
(function () {
  "use strict";
  const MUI = MaterialUI;

  function AppShell(props: AppShellProps) {
    const bag = (window as unknown as Record<string, AppNamespace | undefined>)[props.ns];
    if (!bag?.Theme || !bag?.UI) {
      throw new Error("AppShell: registrar ISAFront para " + props.ns + " antes de renderizar");
    }
    const UI = bag.UI;
    const tm = bag.Theme.useThemeMode();
    const Auth = bag.Auth;
    const showTarget = props.showTarget !== false;
    const showTheme = props.showTheme !== false;
    const showAuthChip = props.showAuthChip !== false && Auth?.isLoggedIn?.();
    const showLogout = props.showLogout !== false && Auth?.isLoggedIn?.();

    const bar = React.createElement(
      MUI.AppBar,
      {
        position: "static",
        color: "default",
        elevation: 0,
        sx: { borderBottom: 1, borderColor: "divider", flexShrink: 0 },
      },
      React.createElement(
        MUI.Toolbar,
        { sx: { gap: 1, flexWrap: "wrap" } },
        props.icon
          ? React.createElement(UI.Icon, { icon: props.icon, size: 26 })
          : null,
        React.createElement(MUI.Typography, { variant: "h6", sx: { mr: 1 } }, props.title),
        React.createElement(MUI.Box, { sx: { flexGrow: 1 } }),
        props.toolbarExtra || null,
        showAuthChip && Auth
          ? React.createElement(MUI.Chip, { size: "small", label: Auth.username(), variant: "outlined" })
          : null,
        showTarget ? React.createElement(UI.TargetSwitch, null) : null,
        showLogout && Auth
          ? React.createElement(MUI.Button, { size: "small", onClick: () => Auth.logout() }, "Salir")
          : null,
        showTheme ? React.createElement(UI.ThemeSwitch, { mode: tm.mode, onToggle: tm.toggle }) : null,
      ),
    );

    const main = React.createElement(
      MUI.Box,
      { sx: { flex: 1, minHeight: 0, overflow: "auto" } },
      props.children,
    );

    const frame = React.createElement(
      MUI.Box,
      { sx: { height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" } },
      bar,
      main,
    );

    const body = props.loginGate && UI.LoginGate
      ? React.createElement(UI.LoginGate, null, frame)
      : frame;

    return React.createElement(
      MUI.ThemeProvider,
      { theme: tm.theme },
      React.createElement(MUI.CssBaseline, null),
      body,
    );
  }

  window.ISAFront = window.ISAFront || ({} as IsaFrontApi);
  window.ISAFront.Layout = window.ISAFront.Layout || ({} as IsaFrontApi["Layout"]);
  window.ISAFront.Layout.AppShell = AppShell;
})();
