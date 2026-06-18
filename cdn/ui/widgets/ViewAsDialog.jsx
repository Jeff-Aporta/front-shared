/**
 * Diálogo admin — seleccionar usuario para «ver como».
 */
(function () {
  "use strict";
  const React = window.React;
  const MUI = MaterialUI;

  function ViewAsDialog(props) {
    const open = Boolean(props.open);
    const ns = props.ns || "ISA";
    const bag = window[ns] || {};
    const Session = bag.Session;
    const UI = bag.UI || window.ISAFront.UI || {};
    const Icon = UI.Icon;

    const [query, setQuery] = React.useState("");
    const [rows, setRows] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [err, setErr] = React.useState("");
    const [busy, setBusy] = React.useState("");

    React.useEffect(function () {
      if (!open || !Session?.fetchViewAsCatalog) return undefined;
      let alive = true;
      setLoading(true);
      setErr("");
      setQuery("");
      Session.fetchViewAsCatalog()
        .then(function (users) { if (alive) setRows(users); })
        .catch(function (e) {
          if (alive) setErr(e instanceof Error ? e.message : String(e));
        })
        .finally(function () { if (alive) setLoading(false); });
      return function () { alive = false; };
    }, [open]);

    const filtered = React.useMemo(function () {
      const q = String(query || "").trim().toLowerCase();
      if (!q) return rows;
      return rows.filter(function (r) {
        const u = String(r.username || "").toLowerCase();
        const d = String(r.displayName || "").toLowerCase();
        return u.includes(q) || d.includes(q);
      });
    }, [rows, query]);

    function close() {
      if (busy) return;
      props.onClose?.();
    }

    async function pick(username) {
      if (!Session?.setViewAs || busy) return;
      setBusy(username);
      setErr("");
      try {
        await Session.setViewAs(username);
        props.onSelected?.(username);
        props.onClose?.();
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e));
      } finally {
        setBusy("");
      }
    }

    return React.createElement(
      MUI.Dialog,
      { open: open, onClose: close, maxWidth: "xs", fullWidth: true, scroll: "paper" },
      React.createElement(
        MUI.DialogTitle,
        { sx: { display: "flex", alignItems: "center", gap: 1, py: 1.5 } },
        Icon ? React.createElement(Icon, { icon: "mdi:account-switch-outline", size: 20 }) : null,
        React.createElement("span", null, "Ver como"),
      ),
      React.createElement(
        MUI.DialogContent,
        { dividers: true },
        React.createElement(
          MUI.Typography,
          { variant: "body2", color: "text.secondary", sx: { mb: 1.5 } },
          "Simula la sesión de otro usuario: permisos, herramientas y JWT portal como si hubieras iniciado con esa cuenta. Solo administradores.",
        ),
        err
          ? React.createElement(MUI.Alert, { severity: "error", sx: { mb: 1.5 } }, err)
          : null,
        React.createElement(MUI.TextField, {
          size: "small",
          fullWidth: true,
          label: "Buscar usuario",
          value: query,
          onChange: function (e) { setQuery(e.target.value); },
          sx: { mb: 1.5 },
          autoFocus: true,
        }),
        loading
          ? React.createElement(MUI.Box, { sx: { display: "flex", justifyContent: "center", py: 3 } },
            React.createElement(MUI.CircularProgress, { size: 28 }),
          )
          : React.createElement(
            MUI.List,
            { dense: true, sx: { maxHeight: 320, overflow: "auto" } },
            filtered.map(function (row) {
              const active = props.currentViewAs === row.username;
              return React.createElement(
                MUI.ListItemButton,
                {
                  key: row.username,
                  selected: active,
                  disabled: Boolean(busy),
                  onClick: function () { pick(row.username); },
                },
                React.createElement(
                  MUI.ListItemText,
                  {
                    primary: row.displayName || row.username,
                    secondary: (row.role ? row.role + " · " : "") + row.username,
                  },
                ),
                busy === row.username
                  ? React.createElement(MUI.CircularProgress, { size: 18 })
                  : active
                    ? React.createElement(MUI.Chip, { size: "small", label: "Activo", color: "secondary" })
                    : null,
              );
            }),
            !filtered.length && !loading
              ? React.createElement(
                MUI.Typography,
                { variant: "body2", color: "text.secondary", sx: { py: 2, textAlign: "center" } },
                "Sin usuarios",
              )
              : null,
          ),
      ),
      React.createElement(
        MUI.DialogActions,
        null,
        props.currentViewAs && Session?.clearViewAs
          ? React.createElement(
            MUI.Button,
            {
              color: "warning",
              disabled: Boolean(busy),
              onClick: function () {
                setBusy("clear");
                Session.clearViewAs()
                  .then(function () { props.onCleared?.(); props.onClose?.(); })
                  .catch(function (e) { setErr(e instanceof Error ? e.message : String(e)); })
                  .finally(function () { setBusy(""); });
              },
            },
            "Dejar de simular",
          )
          : null,
        React.createElement(MUI.Button, { onClick: close, disabled: Boolean(busy) }, "Cerrar"),
      ),
    );
  }

  window.ISAFront = window.ISAFront || {};
  window.ISAFront.UI = window.ISAFront.UI || {};
  window.ISAFront.UI.ViewAsDialog = ViewAsDialog;
})();
