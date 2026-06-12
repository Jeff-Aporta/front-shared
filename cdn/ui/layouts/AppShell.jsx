/**
 * Layout estándar Jeff-Aporta: AppBar homogéneo + tema + TargetSwitch + contenido.
 * Requiere ISAFront.registerApp previo (ns con Theme, UI, Auth opcional).
 * jsDelivr: …/front-shared@main/cdn/ui/layouts/AppShell.jsx
 */
(function () {
  "use strict";
  const MUI = MaterialUI;

  function AppShell(props) {
    const bag = window[props.ns];
    if (!bag?.Theme || !bag?.UI) throw new Error("AppShell: registrar ISAFront para " + props.ns + " antes de renderizar");
    const UI = bag.UI;
    const tm = bag.Theme.useThemeMode();
    const Auth = bag.Auth;
    const showTarget = props.showTarget !== false;
    const showTheme = props.showTheme !== false;
    const showAuthChip = props.showAuthChip !== false && Auth?.isLoggedIn?.();
    const showLogout = props.showLogout !== false && Auth?.isLoggedIn?.();

    const bar = (
      <MUI.AppBar position="static" color="default" elevation={0} sx={{ borderBottom: 1, borderColor: "divider", flexShrink: 0 }}>
        <MUI.Toolbar sx={{ gap: 1, flexWrap: "wrap" }}>
          {props.icon ? <UI.Icon icon={props.icon} size={26} /> : null}
          <MUI.Typography variant="h6" sx={{ mr: 1 }}>{props.title}</MUI.Typography>
          <MUI.Box sx={{ flexGrow: 1 }} />
          {props.toolbarExtra || null}
          {showAuthChip && Auth ? <MUI.Chip size="small" label={Auth.username()} variant="outlined" /> : null}
          {showTarget ? <UI.TargetSwitch /> : null}
          {showLogout && Auth ? <MUI.Button size="small" onClick={() => Auth.logout()}>Salir</MUI.Button> : null}
          {showTheme ? <UI.ThemeSwitch mode={tm.mode} onToggle={tm.toggle} /> : null}
        </MUI.Toolbar>
      </MUI.AppBar>
    );

    const frame = (
      <MUI.Box sx={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {bar}
        <MUI.Box sx={{ flex: 1, minHeight: 0, overflow: "auto" }}>{props.children}</MUI.Box>
      </MUI.Box>
    );

    const body = props.loginGate && UI.LoginGate ? <UI.LoginGate>{frame}</UI.LoginGate> : frame;
    return (
      <MUI.ThemeProvider theme={tm.theme}>
        <MUI.CssBaseline />
        {body}
      </MUI.ThemeProvider>
    );
  }

  window.ISAFront = window.ISAFront || {};
  window.ISAFront.Layout = window.ISAFront.Layout || {};
  window.ISAFront.Layout.AppShell = AppShell;
})();
