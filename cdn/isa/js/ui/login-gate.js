/** LoginGate — formulario inline o pantalla de redirección al panel de acceso. */
export function createLoginGates(React, MUI, ns, UI, opts = {}) {
  const Auth = () => window[ns].Auth;
  const subtitle =
    opts.subtitle ||
    "Use su usuario y contraseña de la organización.";

  function useAuthSync(setOk) {
    React.useEffect(() => {
      const sync = () => setOk(Auth().isLoggedIn());
      window.addEventListener(Auth().EVENT, sync);
      window.addEventListener("storage", sync);
      return () => {
        window.removeEventListener(Auth().EVENT, sync);
        window.removeEventListener("storage", sync);
      };
    }, [setOk]);
  }

  function LoginGateInline(props) {
    const [ok, setOk] = React.useState(Auth().isLoggedIn());
    const [user, setUser] = React.useState("");
    const [pass, setPass] = React.useState("");
    const [showPass, setShowPass] = React.useState(false);
    const [err, setErr] = React.useState("");
    useAuthSync(setOk);
    if (ok) return props.children;

    return React.createElement(
      MUI.Paper,
      { sx: { p: 4, maxWidth: 420, mx: "auto", mt: 4 } },
      React.createElement(MUI.Typography, { variant: "h6", gutterBottom: true }, "Iniciar sesión"),
      React.createElement(MUI.Typography, { variant: "body2", color: "text.secondary", sx: { mb: 2 } }, subtitle),
      err
        ? React.createElement(MUI.Alert, { severity: "error", sx: { mb: 2 } }, err)
        : null,
      React.createElement(MUI.TextField, {
        label: "Usuario",
        fullWidth: true,
        size: "small",
        sx: { mb: 2 },
        value: user,
        onChange: (e) => setUser(e.target.value),
      }),
      React.createElement(MUI.TextField, {
        label: "Clave",
        type: showPass ? "text" : "password",
        fullWidth: true,
        size: "small",
        sx: { mb: 2 },
        value: pass,
        onChange: (e) => setPass(e.target.value),
        InputProps: {
          endAdornment: React.createElement(
            MUI.InputAdornment,
            { position: "end" },
            React.createElement(
              MUI.IconButton,
              {
                size: "small",
                edge: "end",
                "aria-label": showPass ? "Ocultar contraseña" : "Mostrar contraseña",
                onClick: () => setShowPass((v) => !v),
              },
              React.createElement(UI.Icon, { icon: showPass ? "mdi:eye-off" : "mdi:eye", size: 20 }),
            ),
          ),
        },
      }),
      React.createElement(
        MUI.Stack,
        { direction: "row", spacing: 1 },
        React.createElement(
          MUI.Button,
          {
            variant: "contained",
            onClick: async () => {
              setErr("");
              try {
                await Auth().login(user, pass);
                setOk(true);
              } catch (e) {
                setErr(e.message);
              }
            },
          },
          "Entrar",
        ),
        React.createElement(
          MUI.Button,
          { href: Auth().LOGIN_URL, target: "_blank", rel: "noreferrer" },
          "Abrir panel de acceso",
        ),
      ),
    );
  }

  function LoginGateRedirect(props) {
    const [ok, setOk] = React.useState(Auth().isLoggedIn());
    useAuthSync(setOk);
    if (ok) return props.children;

    const message = opts.redirectMessage || subtitle;
    const icon = opts.redirectIcon || "mdi:shield-lock-outline";

    return React.createElement(
      MUI.Paper,
      { sx: { p: 4, maxWidth: 480, mx: "auto", mt: 6, textAlign: "center" } },
      React.createElement(UI.Icon, { icon, size: 48 }),
      React.createElement(MUI.Typography, { variant: "h6", sx: { mt: 2 } }, "Inicia sesión"),
      React.createElement(MUI.Typography, { variant: "body2", color: "text.secondary", sx: { my: 2 } }, message),
      React.createElement(
        MUI.Button,
        { variant: "contained", href: Auth().LOGIN_URL, target: "_blank", rel: "noreferrer" },
        "Abrir panel de acceso",
      ),
      React.createElement(
        MUI.Button,
        { sx: { ml: 1 }, onClick: () => setOk(Auth().isLoggedIn()) },
        "Ya inicié sesión",
      ),
    );
  }

  return {
    LoginGate: LoginGateInline,
    LoginGateRedirect,
  };
}

export function registerLoginGates(ns, opts) {
  const React = window.React;
  const MUI = window.MaterialUI;
  if (!React || !MUI) throw new Error("ISAFront.registerLoginGates requiere React/MUI");
  window[ns] = window[ns] || {};
  const UI = window[ns].UI;
  if (!UI) throw new Error("ISAFront.registerLoginGates requiere UI registrada antes");
  const gates = createLoginGates(React, MUI, ns, UI, typeof opts === "object" ? opts : {});
  Object.assign(window[ns].UI, gates);
}
