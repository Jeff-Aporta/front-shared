/**
 * Chip de usuario con menú: entorno (TargetSwitch), test unitario, cerrar sesión.
 */
(function () {
  "use strict";
  const React = window.React;
  const MUI = MaterialUI;

  function UserSessionMenu(props) {
    const ns = props.ns || "ISA";
    const bag = window[ns] || {};
    const UI = bag.UI || window.ISAFront.UI || {};
    const Icon = UI.Icon;
    const TargetSwitch = UI.TargetSwitch;
    const UnitTestModal = UI.UnitTestStreamModal;
    const [anchor, setAnchor] = React.useState(null);
    const [testOpen, setTestOpen] = React.useState(false);
    const open = Boolean(anchor);
    const username = props.username || "";
    const role = props.role || "";
    const chipSx = props.chipSx || {};

    function closeMenu() { setAnchor(null); }

    return React.createElement(
      React.Fragment,
      null,
      React.createElement(
        MUI.Box,
        {
          component: "span",
          className: "header-session-wrap",
          sx: { display: "inline-flex", alignItems: "center", flexShrink: 0 },
        },
        React.createElement(
          MUI.Stack,
          { direction: "row", spacing: 0.75, alignItems: "center", className: "header-session-btn" },
          props.signalDot || null,
          React.createElement(
            MUI.Tooltip,
            { title: (role ? username + " · rol " + role : username) + " — menú", arrow: true },
            React.createElement(MUI.Chip, {
              size: "small",
              color: "success",
              variant: "outlined",
              icon: Icon ? React.createElement(Icon, { icon: "mdi:account-check", size: 16 }) : null,
              label: username,
              onClick: function (e) { setAnchor(e.currentTarget); },
              sx: Object.assign({ cursor: "pointer" }, chipSx),
              "aria-label": username + (role ? " · rol " + role : ""),
              "aria-haspopup": "true",
              "aria-expanded": open ? "true" : "false",
            }),
          ),
        ),
      ),
      React.createElement(
        MUI.Menu,
        {
          anchorEl: anchor,
          open: open,
          onClose: closeMenu,
          anchorOrigin: { vertical: "bottom", horizontal: "right" },
          transformOrigin: { vertical: "top", horizontal: "right" },
          slotProps: { paper: { sx: { minWidth: 240, mt: 0.5 } } },
        },
        React.createElement(
          MUI.Box,
          { sx: { px: 2, py: 1.25 } },
          React.createElement(MUI.Typography, { variant: "subtitle2" }, username),
          role
            ? React.createElement(MUI.Typography, { variant: "caption", color: "text.secondary" }, "Rol: " + role)
            : null,
        ),
        React.createElement(MUI.Divider, null),
        props.showTarget !== false && TargetSwitch
          ? React.createElement(
              MUI.MenuItem,
              {
                disableRipple: true,
                sx: { cursor: "default", "&:hover": { bgcolor: "transparent" } },
                onClick: function (e) { e.stopPropagation(); },
              },
              React.createElement(
                MUI.Stack,
                { direction: "row", spacing: 1, alignItems: "center", width: "100%", justifyContent: "space-between" },
                React.createElement(MUI.Typography, { variant: "body2" }, "Entorno"),
                React.createElement(TargetSwitch, null),
              ),
            )
          : null,
        props.runUnitTestUrl && UnitTestModal
          ? React.createElement(
              MUI.MenuItem,
              {
                onClick: function () {
                  closeMenu();
                  setTestOpen(true);
                },
              },
              Icon
                ? React.createElement(
                    MUI.ListItemIcon,
                    { sx: { minWidth: 32 } },
                    React.createElement(Icon, { icon: "mdi:flask-outline", size: 18 }),
                  )
                : null,
              React.createElement(MUI.ListItemText, { primary: "Ejecutar test unitario" }),
            )
          : null,
        React.createElement(MUI.Divider, null),
        React.createElement(
          MUI.MenuItem,
          {
            onClick: function () {
              closeMenu();
              if (props.onLogout) props.onLogout();
            },
          },
          Icon
            ? React.createElement(
                MUI.ListItemIcon,
                { sx: { minWidth: 32 } },
                React.createElement(Icon, { icon: "mdi:logout", size: 18 }),
              )
            : null,
          React.createElement(MUI.ListItemText, { primary: "Cerrar sesión" }),
        ),
      ),
      UnitTestModal && props.runUnitTestUrl
        ? React.createElement(UnitTestModal, {
            open: testOpen,
            onClose: function () { setTestOpen(false); },
            runUrl: props.runUnitTestUrl,
            getAuthHeaders: props.getAuthHeaders,
            title: props.unitTestTitle || "Test unitario",
          })
        : null,
    );
  }

  window.ISAFront = window.ISAFront || {};
  window.ISAFront.UI = window.ISAFront.UI || {};
  window.ISAFront.UI.UserSessionMenu = UserSessionMenu;
})();
