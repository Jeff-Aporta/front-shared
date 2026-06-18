/**

 * Diálogo admin — suplantación con Autocomplete asíncrono (búsqueda en API).

 */

(function () {

  "use strict";

  const React = window.React;

  const MUI = MaterialUI;



  const SEARCH_DEBOUNCE_MS = 320;

  const SEARCH_MIN_CHARS = 1;



  function ViewAsDialog(props) {

    const open = Boolean(props.open);

    const ns = props.ns || "ISA";

    const bag = window[ns] || {};

    const Session = bag.Session;

    const UI = bag.UI || window.ISAFront.UI || {};

    const Icon = UI.Icon;



    const searchFn = Session?.searchSuplantacionUsers || Session?.searchViewAsUsers;



    const [inputValue, setInputValue] = React.useState("");

    const [options, setOptions] = React.useState([]);

    const [loading, setLoading] = React.useState(false);

    const [err, setErr] = React.useState("");

    const [busy, setBusy] = React.useState("");

    const debounceRef = React.useRef(null);

    const requestIdRef = React.useRef(0);



    React.useEffect(function () {

      if (!open) return undefined;

      setInputValue("");

      setOptions([]);

      setErr("");

      setLoading(false);

      if (debounceRef.current) clearTimeout(debounceRef.current);

      return function () {

        if (debounceRef.current) clearTimeout(debounceRef.current);

      };

    }, [open]);



    function runSearch(query) {

      const q = String(query || "").trim();

      if (!searchFn) {

        setErr("Búsqueda de suplantación no disponible en esta versión del front.");

        setOptions([]);

        return;

      }

      if (q.length < SEARCH_MIN_CHARS) {

        setOptions([]);

        setLoading(false);

        return;

      }

      const reqId = ++requestIdRef.current;

      setLoading(true);

      setErr("");

      searchFn(q, 5)

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



    function scheduleSearch(query) {

      if (debounceRef.current) clearTimeout(debounceRef.current);

      const q = String(query || "").trim();

      if (q.length < SEARCH_MIN_CHARS) {

        setOptions([]);

        setLoading(false);

        return;

      }

      setLoading(true);

      debounceRef.current = setTimeout(function () {

        runSearch(q);

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



    function optionLabel(row) {

      if (!row) return "";

      const name = row.displayName || row.username || "";

      const role = row.role ? " · " + row.role : "";

      return name + role + " (" + row.username + ")";

    }



    return React.createElement(

      MUI.Dialog,

      {

        open: open,

        onClose: close,

        maxWidth: "xs",

        fullWidth: true,

        scroll: "paper",

        disableRestoreFocus: true,

        slotProps: { root: { sx: { zIndex: 1500 } } },

      },

      React.createElement(

        MUI.DialogTitle,

        { sx: { display: "flex", alignItems: "center", gap: 1, py: 1.5 } },

        Icon ? React.createElement(Icon, { icon: "mdi:account-switch-outline", size: 20 }) : null,

        React.createElement("span", null, "Suplantación"),

      ),

      React.createElement(

        MUI.DialogContent,

        { dividers: true },

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

        React.createElement(MUI.Autocomplete, {

          fullWidth: true,

          size: "small",

          openOnFocus: false,

          autoHighlight: true,

          clearOnBlur: false,

          loading: loading || Boolean(busy),

          disabled: Boolean(busy),

          options: options,

          inputValue: inputValue,

          filterOptions: function (x) { return x; },

          getOptionLabel: optionLabel,

          isOptionEqualToValue: function (a, b) {

            return String(a?.username) === String(b?.username);

          },

          noOptionsText: inputValue.trim().length < SEARCH_MIN_CHARS

            ? "Escribe al menos " + SEARCH_MIN_CHARS + " carácter para buscar"

            : "Sin resultados",

          loadingText: "Buscando…",

          onInputChange: function (_e, value, reason) {

            if (reason === "reset") return;

            setInputValue(value);

            scheduleSearch(value);

          },

          onChange: function (_e, value) {

            if (value?.username) pick(value.username);

          },

          renderOption: function (liProps, row) {

            const active = props.currentViewAs === row.username;

            return React.createElement(

              MUI.Box,

              Object.assign({}, liProps, {

                component: "li",

                key: row.username,

                sx: { display: "flex", alignItems: "center", gap: 1, py: 0.75 },

              }),

              React.createElement(

                MUI.Box,

                { sx: { flex: 1, minWidth: 0 } },

                React.createElement(MUI.Typography, { variant: "body2", sx: { fontWeight: 600 } },

                  row.displayName || row.username,

                ),

                React.createElement(MUI.Typography, { variant: "caption", color: "text.secondary" },

                  (row.role ? row.role + " · " : "") + row.username,

                ),

              ),

              busy === row.username

                ? React.createElement(MUI.CircularProgress, { size: 18 })

                : active

                  ? React.createElement(MUI.Chip, { size: "small", label: "Activo", color: "secondary" })

                  : null,

            );

          },

          renderInput: function (params) {

            return React.createElement(MUI.TextField, Object.assign({}, params, {

              label: "Buscar usuario",

              placeholder: "Nombre o usuario…",

              autoFocus: true,

              InputProps: Object.assign({}, params.InputProps, {

                  endAdornment: React.createElement(

                    React.Fragment,

                    null,

                    loading ? React.createElement(MUI.CircularProgress, { color: "inherit", size: 18 }) : null,

                    params.InputProps.endAdornment,

                  ),

                }),

            }));

          },

        }),

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

})();

