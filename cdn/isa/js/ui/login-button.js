import { sanitizeUserMessage } from "../core/sanitize-user-message.js";
import { formatLocalDateTime } from "../core/format.js";

/**
 * Botón de sesión + modal login (MUI). Usa window[ns].AppSession si existe, si no Session.
 * Opciones: showRealtimeDot, showPasswordToggle, showExpiryInTooltip, showIntroText, wrapClass, btnClass.
 */
export function createLoginButton(React, MUI, ns, opts = {}) {
  const { useState, useEffect } = React;
  const {
    Box, Stack, Tooltip, Chip, IconButton, Button,
    Dialog, DialogContent, DialogActions, Typography, Alert, TextField, InputAdornment,
  } = MUI;

  const wrapClass = opts.wrapClass || "header-session-wrap";
  const btnClass = opts.btnClass || "header-session-btn";
  const showRealtimeDot = opts.showRealtimeDot !== false;
  const showPasswordToggle = opts.showPasswordToggle === true;
  const showExpiryInTooltip = opts.showExpiryInTooltip === true;
  const showIntroText = opts.showIntroText === true;

  function authApi() {
    const bag = window[ns] || {};
    return bag.AppSession || bag.Session;
  }

  function sessionApi() {
    return window[ns]?.Session;
  }

  function uiBag() {
    return window[ns]?.UI || {};
  }

  function toast(kind, message) {
    const fb = window[ns]?.Feedback?.toast;
    if (fb?.[kind]) {
      fb[kind](message);
      return;
    }
    const fn = window.ISAFront?.[`toast${kind.charAt(0).toUpperCase()}${kind.slice(1)}`];
    if (typeof fn === "function") fn(message);
  }

  function sanitizeLoginError(raw) {
    return sanitizeUserMessage(raw, "No se pudo iniciar sesión");
  }

  function sessionView(auth) {
    const s = auth.getSession?.() ?? auth.current?.();
    if (!s) return null;
    return {
      username: s.username ?? auth.username?.(),
      role: s.role ?? null,
      expiresAt: s.expiresAt ?? null,
    };
  }

  function LoginButton(props) {
    const auth = authApi();
    if (!auth) throw new Error(`LoginButton: Session no registrado (${ns})`);

    const Icon = uiBag().Icon;
    const authEvt = sessionApi()?.EVENT;
    const [openInternal, setOpenInternal] = useState(false);
    const open = props.loginOpen != null ? props.loginOpen : openInternal;
    const setOpen = props.onLoginOpenChange || setOpenInternal;
    const [user, setUser] = useState("");
    const [pass, setPass] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [err, setErr] = useState("");
    const [busy, setBusy] = useState(false);
    const [, tick] = useState(0);

    const ui = uiBag();
    const rtHookFn = ui.useRealtimeStatus;
    const StatusDot = ui.RealtimeStatusDot;
    const hasRt = showRealtimeDot
      && typeof rtHookFn === "function"
      && typeof StatusDot === "function";
    const rtHook = hasRt ? rtHookFn() : null;
    const realtimeEl = rtHook
      ? React.createElement(StatusDot, {
        tone: rtHook.tone,
        tip: rtHook.tip,
        onReconnect: rtHook.reconnect,
      })
      : null;

    useEffect(() => {
      if (!authEvt) return undefined;
      const onAuth = () => tick((n) => n + 1);
      window.addEventListener(authEvt, onAuth);
      return () => window.removeEventListener(authEvt, onAuth);
    }, [authEvt]);

    async function submit() {
      if (!user.trim() || !pass) {
        setErr("Usuario y contraseña requeridos");
        return;
      }
      setBusy(true);
      setErr("");
      try {
        const session = await auth.login(user.trim(), pass);
        setPass("");
        setShowPass(false);
        setOpen(false);
        const sv = sessionView(auth) || session;
        const role = sv?.role ? ` (${sv.role})` : "";
        toast("success", `Sesión iniciada · ${sv?.username || user.trim()}${role}`);
        props.onLoggedIn?.(sv || session);
      } catch (e) {
        const msg = sanitizeLoginError(e instanceof Error ? e.message : String(e));
        setErr(msg);
        toast("error", msg);
      } finally {
        setBusy(false);
      }
    }

    function logout() {
      auth.logout();
      tick((n) => n + 1);
      toast("info", "Sesión cerrada");
    }

    const session = sessionView(auth);
    const loggedIn = session || (auth.isLoggedIn?.() ? { username: auth.username?.() } : null);

    if (loggedIn?.username) {
      const roleTip = session?.role ? ` · rol ${session.role}` : "";
      let tip = `${loggedIn.username}${roleTip}`;
      if (showExpiryInTooltip && session?.expiresAt) {
        tip = `Expira: ${formatLocalDateTime(session.expiresAt)}`;
      }
      return React.createElement(
        Box,
        {
          component: "span",
          className: wrapClass,
          sx: { display: "inline-flex", alignItems: "center", flexShrink: 0 },
        },
        React.createElement(
          Stack,
          { direction: "row", spacing: 0.75, alignItems: "center", className: btnClass },
          realtimeEl,
          React.createElement(
            Tooltip,
            { title: tip, arrow: true },
            React.createElement(Chip, {
              size: "small",
              color: "success",
              variant: "outlined",
              icon: Icon ? React.createElement(Icon, { icon: "mdi:account-check", size: 16 }) : null,
              label: loggedIn.username,
            }),
          ),
          React.createElement(
            Tooltip,
            { title: "Cerrar sesión", arrow: true },
            React.createElement(
              IconButton,
              {
                size: "small",
                color: "inherit",
                onClick: logout,
                "aria-label": "Cerrar sesión",
              },
              Icon ? React.createElement(Icon, { icon: "mdi:logout" }) : "×",
            ),
          ),
        ),
      );
    }

    const passField = React.createElement(TextField, {
      label: "Contraseña",
      type: showPasswordToggle && showPass ? "text" : "password",
      value: pass,
      onChange: (e) => setPass(e.target.value),
      fullWidth: true,
      size: "small",
      onKeyDown: (e) => { if (e.key === "Enter") submit(); },
      ...(showPasswordToggle && Icon ? {
        InputProps: {
          endAdornment: React.createElement(
            InputAdornment,
            { position: "end" },
            React.createElement(
              IconButton,
              {
                size: "small",
                edge: "end",
                "aria-label": showPass ? "Ocultar contraseña" : "Mostrar contraseña",
                onClick: () => setShowPass((v) => !v),
              },
              React.createElement(Icon, { icon: showPass ? "mdi:eye-off" : "mdi:eye", size: 20 }),
            ),
          ),
        },
      } : {}),
    });

    return React.createElement(
      Box,
      {
        component: "span",
        className: wrapClass,
        sx: { display: "inline-flex", alignItems: "center", flexShrink: 0 },
      },
      React.createElement(
        Stack,
        { direction: "row", spacing: 0.75, alignItems: "center", className: btnClass },
        realtimeEl,
        React.createElement(
          Button,
          {
            size: "small",
            variant: "outlined",
            color: "inherit",
            startIcon: Icon ? React.createElement(Icon, { icon: "mdi:login", size: 18 }) : null,
            onClick: () => setOpen(true),
          },
          "Iniciar sesión",
        ),
      ),
      React.createElement(
        Dialog,
        {
          open,
          onClose: busy ? undefined : () => { setOpen(false); setShowPass(false); },
          maxWidth: "xs",
          fullWidth: true,
          PaperProps: { className: "isa-login-card isa-glass-card", sx: loginCardSx({ maxWidth: 440, m: 1 }) },
        },
        LoginHeaderBand(React, MUI, uiBag(), { icon: "mdi:account-key-outline", title: "Iniciar sesión", accent: "#1e90ff" }),
        React.createElement(
          DialogContent,
          { sx: { pt: 2 } },
          showIntroText ? React.createElement(
            Typography,
            { variant: "body2", color: "text.secondary", sx: { mb: 2, lineHeight: 1.6 } },
            LOGIN_SUBTITLE_DEFAULT,
          ) : null,
          err ? React.createElement(Alert, { severity: "error", sx: { mb: 2 } }, err) : null,
          React.createElement(
            Stack,
            { spacing: 2 },
            React.createElement(TextField, {
              label: "Usuario",
              value: user,
              onChange: (e) => setUser(e.target.value),
              fullWidth: true,
              autoFocus: true,
              size: "small",
            }),
            passField,
          ),
        ),
        React.createElement(
          DialogActions,
          null,
          React.createElement(Button, { onClick: () => setOpen(false), disabled: busy }, "Cancelar"),
          React.createElement(
            Button,
            {
              variant: "contained",
              disabled: busy || !user.trim(),
              onClick: submit,
            },
            busy ? "Entrando…" : "Entrar",
          ),
        ),
      ),
    );
  }

  return { LoginButton };
}

export function registerLoginButton(ns, opts = {}) {
  const React = window.React;
  const MUI = window.MaterialUI;
  if (!React || !MUI) return null;
  const { LoginButton } = createLoginButton(React, MUI, ns, opts);
  window[ns] = window[ns] || {};
  window[ns].UI = window[ns].UI || {};
  window[ns].UI.LoginButton = LoginButton;
  return LoginButton;
}
