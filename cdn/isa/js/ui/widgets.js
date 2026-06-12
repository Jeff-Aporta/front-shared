/** Icon, ThemeSwitch, TargetSwitch, utilidades UI. */
export function createWidgets(React, MUI, ns, opts = {}) {
  const targetStyle = opts.targetStyle || "chip";
  const cfg = () => window[ns].Config;

  function Icon(props) {
    return React.createElement("iconify-icon", {
      icon: props.icon,
      style: Object.assign(
        { fontSize: props.size || 20, display: "inline-flex", alignItems: "center", verticalAlign: "middle" },
        props.style,
      ),
    });
  }

  function ThemeSwitch(props) {
    const title = props.mode === "dark" ? "Claro" : "Oscuro";
    return React.createElement(
      MUI.Tooltip,
      { title },
      React.createElement(
        MUI.IconButton,
        { color: "inherit", size: "small", onClick: props.onToggle },
        React.createElement(Icon, {
          icon: props.mode === "dark" ? "mdi:weather-sunny" : "mdi:weather-night",
        }),
      ),
    );
  }

  function sessionApi() {
    const bag = window[ns] || {};
    return bag.Session || bag.Auth || null;
  }

  function TargetSwitchChip() {
    const sess = sessionApi();
    const [loggedIn, setLoggedIn] = React.useState(() => sess?.isLoggedIn?.() ?? false);
    const [local, setLocal] = React.useState(() => (loggedIn ? cfg().isLocal() : false));

    React.useEffect(() => {
      const onAuth = () => setLoggedIn(sess?.isLoggedIn?.() ?? false);
      const authEvt = sess?.EVENT;
      if (authEvt) window.addEventListener(authEvt, onAuth);
      return () => { if (authEvt) window.removeEventListener(authEvt, onAuth); };
    }, []);

    React.useEffect(() => {
      const onEvt = () => setLocal(loggedIn ? cfg().isLocal() : false);
      window.addEventListener(cfg().EVENT, onEvt);
      return () => window.removeEventListener(cfg().EVENT, onEvt);
    }, [loggedIn]);

    React.useEffect(() => {
      if (!loggedIn) {
        if (cfg().isLocal()) cfg().setLocal(false);
        setLocal(false);
      }
    }, [loggedIn]);

    const isLocal = loggedIn && local;
    const label = cfg().label();
    const tip = loggedIn
      ? (isLocal ? "Entorno de desarrollo (local)" : "Entorno de producción")
      : "Producción (inicia sesión para cambiar el entorno)";

    return React.createElement(
      MUI.Tooltip,
      { title: tip },
      React.createElement(
        MUI.Box,
        { sx: { display: "inline-flex", alignItems: "center" } },
        React.createElement(MUI.Chip, {
          size: "small",
          color: isLocal ? "warning" : "primary",
          variant: "outlined",
          disabled: !loggedIn,
          icon: React.createElement(Icon, {
            icon: isLocal ? "mdi:laptop" : "mdi:cloud-outline",
            size: 16,
          }),
          label: loggedIn ? label : "Producción",
          onClick: loggedIn ? () => cfg().setLocal(!local) : undefined,
          sx: {
            cursor: loggedIn ? "pointer" : "default",
            height: "auto",
            minHeight: 28,
            py: 0.375,
            "& .MuiChip-label": { px: 1.25, py: 0.25 },
            "& .MuiChip-icon": { ml: 0.75, mr: -0.25 },
          },
        }),
      ),
    );
  }

  function TargetSwitchForm() {
    const [local, setLocal] = React.useState(cfg().isLocal());
    React.useEffect(() => {
      const h = () => setLocal(cfg().isLocal());
      window.addEventListener(cfg().EVENT, h);
      return () => window.removeEventListener(cfg().EVENT, h);
    }, []);
    return React.createElement(MUI.FormControlLabel, {
      control: React.createElement(MUI.Switch, {
        size: "small",
        checked: local,
        onChange: (_e, v) => cfg().setLocal(v),
      }),
      label: cfg().label(),
    });
  }

  function TargetSwitch() {
    return targetStyle === "switch"
      ? React.createElement(TargetSwitchForm, null)
      : React.createElement(TargetSwitchChip, null);
  }

  function Loading(props) {
    return React.createElement(
      MUI.Box,
      { sx: { display: "flex", alignItems: "center", gap: 1, p: 3, color: "text.secondary" } },
      React.createElement(MUI.CircularProgress, { size: 20 }),
      React.createElement("span", null, props.label || "Cargando…"),
    );
  }

  function ErrorBox(props) {
    return React.createElement(
      MUI.Alert,
      { severity: "error", sx: { my: 2 } },
      props.message || "Error",
    );
  }

  function humanSize(bytes) {
    if (!bytes && bytes !== 0) return "-";
    const u = ["B", "KB", "MB", "GB"];
    let i = 0;
    let n = bytes;
    while (n >= 1024 && i < u.length - 1) {
      n /= 1024;
      i++;
    }
    return n.toFixed(n < 10 && i > 0 ? 1 : 0) + " " + u[i];
  }

  return { Icon, ThemeSwitch, TargetSwitch, Loading, ErrorBox, humanSize };
}

export function registerWidgets(ns, opts) {
  const React = window.React;
  const MUI = window.MaterialUI;
  if (!React || !MUI) throw new Error("ISAFront.registerWidgets requiere React/MUI");
  window[ns] = window[ns] || {};
  window[ns].UI = createWidgets(React, MUI, ns, opts);
}
