/** LoginGate — pantalla inline o redirección al panel de acceso (estilo tk JSX). */
import {
  LOGIN_SUBTITLE_DEFAULT,
  loginPageSx,
  loginCardSx,
  LoginHeaderBand,
  contapymeLoginTextFieldProps,
} from "./login-surface.js";
import { normalizeContapymeLoginId } from "../core/format.js";

export function createLoginGates(React, MUI, ns, UI, opts = {}) {
  const Auth = () => window[ns].Auth;
  const subtitle = opts.subtitle || LOGIN_SUBTITLE_DEFAULT;
  const accent = opts.accent || "#1e90ff";
  const icon = opts.icon || "mdi:shield-key-outline";

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

  function LoginFields({ user, setUser, pass, setPass, showPass, setShowPass, err, onLogin, extraActions }) {
    return React.createElement(
      MUI.Box,
      { sx: { p: { xs: 2, sm: 2.5, md: 3 } } },
      React.createElement(MUI.Typography, { variant: "body2", color: "text.secondary", sx: { mb: 2, lineHeight: 1.6 } }, subtitle),
      err ? React.createElement(MUI.Alert, { severity: "error", sx: { mb: 2 } }, err) : null,
      React.createElement(MUI.TextField, contapymeLoginTextFieldProps({
        fullWidth: true,
        size: "small",
        required: true,
        sx: { mb: 2 },
        value: user,
        onChange: (e) => setUser(e.target.value),
        onKeyDown: (e) => { if (e.key === "Enter") onLogin(); },
      })),
      React.createElement(MUI.TextField, {
        label: "Contraseña",
        type: showPass ? "text" : "password",
        fullWidth: true,
        size: "small",
        required: true,
        sx: { mb: 2 },
        value: pass,
        onChange: (e) => setPass(e.target.value),
        onKeyDown: (e) => { if (e.key === "Enter") onLogin(); },
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
        { direction: "row", spacing: 1, flexWrap: "wrap", useFlexGap: true },
        React.createElement(
          MUI.Button,
          {
            variant: "contained",
            onClick: onLogin,
          },
          "Entrar",
        ),
        extraActions,
      ),
    );
  }

  function LoginGateInline(props) {
    const [ok, setOk] = React.useState(Auth().isLoggedIn());
    const [user, setUser] = React.useState("");
    const [pass, setPass] = React.useState("");
    const [showPass, setShowPass] = React.useState(false);
    const [err, setErr] = React.useState("");
    useAuthSync(setOk);
    if (ok) return props.children;

    async function onLogin() {
      setErr("");
      try {
        await Auth().login(normalizeContapymeLoginId(user), pass);
        setOk(true);
      } catch (e) {
        setErr(e.message);
      }
    }

    return React.createElement(
      MUI.Box,
      { sx: loginPageSx() },
      React.createElement(
        MUI.Paper,
        { elevation: 0, className: "isa-login-card isa-glass-card", sx: loginCardSx() },
        LoginHeaderBand(React, MUI, UI, { icon, title: "Iniciar sesión", accent }),
        React.createElement(LoginFields, {
          user,
          setUser,
          pass,
          setPass,
          showPass,
          setShowPass,
          err,
          onLogin,
          extraActions: React.createElement(
            MUI.Button,
            { href: Auth().LOGIN_URL, target: "_blank", rel: "noreferrer" },
            "Abrir panel de acceso",
          ),
        }),
      ),
    );
  }

  function LoginGateRedirect(props) {
    const [ok, setOk] = React.useState(Auth().isLoggedIn());
    useAuthSync(setOk);
    if (ok) return props.children;

    const message = opts.redirectMessage || subtitle;
    const redirectIcon = opts.redirectIcon || icon;

    return React.createElement(
      MUI.Box,
      { sx: loginPageSx() },
      React.createElement(
        MUI.Paper,
        { elevation: 0, className: "isa-login-card isa-glass-card", sx: loginCardSx({ textAlign: "center" }) },
        LoginHeaderBand(React, MUI, UI, { icon: redirectIcon, title: "Inicia sesión", accent }),
        React.createElement(
          MUI.Box,
          { sx: { p: { xs: 2, sm: 2.5, md: 3 } } },
          React.createElement(MUI.Typography, { variant: "body2", color: "text.secondary", sx: { mb: 2.5, lineHeight: 1.6 } }, message),
          React.createElement(
            MUI.Stack,
            { direction: "row", spacing: 1, justifyContent: "center", flexWrap: "wrap", useFlexGap: true },
            React.createElement(
              MUI.Button,
              { variant: "contained", href: Auth().LOGIN_URL, target: "_blank", rel: "noreferrer" },
              "Abrir panel de acceso",
            ),
            React.createElement(
              MUI.Button,
              { variant: "outlined", onClick: () => setOk(Auth().isLoggedIn()) },
              "Ya inicié sesión",
            ),
          ),
        ),
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
