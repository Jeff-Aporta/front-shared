/**
 * Diálogo admin — suplantación: búsqueda + lista en Popper (portal, fuera del scroll del modal).
 */
(function () {
  "use strict";

  const React = window.React;
  const MUI = MaterialUI;

  const SEARCH_DEBOUNCE_MS = 320;
  const SEARCH_MIN_CHARS = 1;
  const INITIAL_SUGGESTIONS = 5;

  function ViewAsDialog(props) {
    const open = Boolean(props.open);
    const ns = props.ns || "ISA";
    const bag = window[ns] || {};
    const Session = bag.Session;
    const UI = bag.UI || window.ISAFront.UI || {};
    const Icon = UI.Icon;

    const searchFn = Session?.searchSuplantacionUsers || Session?.searchViewAsUsers;
    const catalogFn = Session?.fetchSuplantacionCatalog || Session?.fetchViewAsCatalog;

    const [inputValue, setInputValue] = React.useState("");
    const [options, setOptions] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [err, setErr] = React.useState("");
    const [busy, setBusy] = React.useState("");
    const debounceRef = React.useRef(null);
    const requestIdRef = React.useRef(0);
    const anchorRef = React.useRef(null);
    const [anchorEl, setAnchorEl] = React.useState(null);
    const [anchorWidth, setAnchorWidth] = React.useState(null);

    async function fetchUsers(query, limit) {
      const q = String(query ?? "").trim();
      if (catalogFn && !q) {
        const users = await catalogFn();
        const list = Array.isArray(users) ? users : [];
        if (!list.length) {
          throw new Error("El catálogo de suplantación está vacío o no está desplegado en el servidor.");
        }
        return list.slice(0, limit);
      }
      if (!searchFn) {
        throw new Error("Búsqueda de suplantación no disponible. Recarga con Ctrl+F5.");
      }
      const users = await searchFn(q, limit);
      const list = Array.isArray(users) ? users : [];
      if (!list.length && !q) {
        throw new Error("No se recibieron usuarios. Verifica deploy de system-login (suplantación/catalog).");
      }
      return list;
    }

    function loadSuggestions(query) {
      if (!catalogFn && !searchFn) {
        setErr("Búsqueda de suplantación no disponible. Recarga con Ctrl+F5.");
        setOptions([]);
        setLoading(false);
        return;
      }
      const reqId = ++requestIdRef.current;
      setLoading(true);
      setErr("");
      fetchUsers(query, INITIAL_SUGGESTIONS)
        .then(function (users) {
          if (reqId !== requestIdRef.current) return;
          setOptions(users);
        })
        .catch(function (e) {
          if (reqId !== requestIdRef.current) return;
          setErr(e instanceof Error ? e.message : String(e));
          setOptions([]);
        })
        .finally(function () {
          if (reqId !== requestIdRef.current) return;
          setLoading(false);
        });
    }

    React.useEffect(function () {
      if (!open) return undefined;
      setInputValue("");
      setOptions([]);
      setErr("");
      if (debounceRef.current) clearTimeout(debounceRef.current);
      loadSuggestions("");
      return function () {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        requestIdRef.current += 1;
      };
    }, [open]);

    function scheduleSearch(query) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      const q = String(query || "").trim();
      debounceRef.current = setTimeout(function () {
        loadSuggestions(q.length >= SEARCH_MIN_CHARS ? q : "");
      }, SEARCH_DEBOUNCE_MS);
    }

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

    function optionSecondary(row) {
      const label = row.displayName && row.displayName.trim().toUpperCase() !== row.username
        ? row.displayName.trim()
        : null;
      return [label, row.role].filter(Boolean).join(" · ");
    }

    const showList = open && (loading || options.length > 0 || Boolean(inputValue.trim()));

    React.useEffect(function () {
      if (!showList || !anchorEl) return undefined;
      function syncWidth() {
        if (anchorEl) setAnchorWidth(anchorEl.getBoundingClientRect().width);
      }
      syncWidth();
      window.addEventListener("resize", syncWidth);
      return function () { window.removeEventListener("resize", syncWidth); };
    }, [showList, anchorEl, inputValue, options.length, loading]);

    function setSearchAnchor(node) {
      anchorRef.current = node;
      setAnchorEl(node);
    }

    function listPaperChildren() {
      return [
        loading && !options.length
          ? React.createElement(
            MUI.Box,
            { key: "loading", sx: { display: "flex", alignItems: "center", gap: 1, px: 2, py: 1.5 } },
            React.createElement(MUI.CircularProgress, { size: 18 }),
            React.createElement(MUI.Typography, { variant: "body2", color: "text.secondary" }, "Buscando…"),
          )
          : null,
        !loading && !options.length
          ? React.createElement(
            MUI.Typography,
            { key: "empty", variant: "body2", color: "text.secondary", sx: { px: 2, py: 1.5 } },
            "Sin resultados",
          )
          : null,
        options.map(function (row) {
          const active = props.currentViewAs === row.username;
          const picking = busy === row.username;
          return React.createElement(
            MUI.ListItemButton,
            {
              key: row.username,
              disabled: Boolean(busy),
              selected: active,
              onClick: function () { pick(row.username); },
              sx: { py: 0.75 },
            },
            React.createElement(
              MUI.ListItemText,
              {
                primary: row.username,
                secondary: optionSecondary(row) || null,
                primaryTypographyProps: { fontWeight: 600, variant: "body2" },
                secondaryTypographyProps: { variant: "caption" },
              },
            ),
            picking
              ? React.createElement(MUI.CircularProgress, { size: 18 })
              : active
                ? React.createElement(MUI.Chip, { size: "small", label: "Activo", color: "secondary" })
                : null,
          );
        }),
      ];
    }

    return React.createElement(
      MUI.Dialog,
      {
        open: open,
        onClose: close,
        maxWidth: "xs",
        fullWidth: true,
        scroll: "body",
        disableRestoreFocus: true,
        className: "isa-view-as-dialog",
        slotProps: {
          paper: { className: "isa-view-as-dialog__paper" },
        },
      },
      React.createElement(
        MUI.DialogTitle,
        { sx: { display: "flex", alignItems: "center", gap: 1, py: 1.5 } },
        Icon ? React.createElement(Icon, { icon: "mdi:account-switch-outline", size: 20 }) : null,
        React.createElement("span", null, "Suplantación"),
      ),
      React.createElement(
        MUI.DialogContent,
        { dividers: true, sx: { pt: 1.5, overflow: "visible" } },
        React.createElement(
          MUI.Typography,
          { variant: "body2", color: "text.secondary", sx: { mb: 1.5 } },
          "Actúa con la sesión de otro usuario: permisos, herramientas y JWT portal como si hubieras iniciado con esa cuenta. Solo administradores.",
        ),
        err
          ? React.createElement(MUI.Alert, { severity: "error", sx: { mb: 1.5 } }, err)
          : null,
        props.currentViewAs
          ? React.createElement(MUI.Chip, {
            size: "small",
            color: "secondary",
            label: "Suplantando · " + props.currentViewAs,
            sx: { mb: 1.5 },
          })
          : null,
        React.createElement(
          MUI.Box,
          {
            ref: setSearchAnchor,
            className: "isa-view-as-dialog__search",
            sx: { position: "relative" },
          },
          React.createElement(MUI.TextField, {
            fullWidth: true,
            size: "small",
            label: "Buscar usuario",
            placeholder: "Nombre o usuario…",
            autoFocus: true,
            disabled: Boolean(busy),
            value: inputValue,
            onChange: function (e) {
              const v = e.target.value;
              setInputValue(v);
              scheduleSearch(v);
            },
            slotProps: {
              input: {
                endAdornment: loading
                  ? React.createElement(MUI.InputAdornment, {
                    position: "end",
                    children: React.createElement(MUI.CircularProgress, { color: "inherit", size: 18 }),
                  })
                  : null,
              },
            },
            sx: showList
              ? {
                "& .MuiOutlinedInput-root": {
                  borderBottomLeftRadius: 0,
                  borderBottomRightRadius: 0,
                },
              }
              : undefined,
          }),
        ),
        showList && anchorEl
          ? React.createElement(
            MUI.Popper,
            {
              open: true,
              anchorEl: anchorEl,
              placement: "bottom-start",
              className: "isa-view-as-dialog__popper",
              sx: { zIndex: 1400, width: anchorWidth || anchorEl.offsetWidth || undefined },
              modifiers: [
                { name: "offset", options: { offset: [0, 0] } },
                { name: "preventOverflow", options: { padding: 8, altBoundary: true } },
              ],
            },
            React.createElement(
              MUI.Paper,
              {
                elevation: 8,
                className: "isa-view-as-dialog__list",
                sx: {
                  maxHeight: 280,
                  overflow: "auto",
                  borderTopLeftRadius: 0,
                  borderTopRightRadius: 0,
                  width: "100%",
                  boxSizing: "border-box",
                },
              },
              listPaperChildren(),
            ),
          )
          : null,
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
            "Dejar de suplantar",
          )
          : null,
        React.createElement(MUI.Button, { onClick: close, disabled: Boolean(busy) }, "Cerrar"),
      ),
    );
  }

  window.ISAFront = window.ISAFront || {};
  window.ISAFront.UI = window.ISAFront.UI || {};
  window.ISAFront.UI.ViewAsDialog = ViewAsDialog;
  ["ISA", "ISAJ"].forEach(function (ns) {
    const bag = window[ns];
    if (!bag) return;
    bag.UI = bag.UI || {};
    bag.UI.ViewAsDialog = ViewAsDialog;
  });
})();
