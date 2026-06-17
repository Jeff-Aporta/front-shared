/**
 * Layout estándar Jeff-Aporta: AppBar + filas de tabs + TargetSwitch (chip) + body sin scroll global.
 * Requiere ISAFront.registerApp previo (ns con Theme, UI, Auth/Session opcional).
 */
(function () {
  "use strict";
  const MUI = MaterialUI;
  const React = window.React;

  const TAB_LABEL_STYLE = { display: "inline-flex", alignItems: "center", gap: "10px" };
  const TOOLBAR_MIN_H = 48;
  const TOOLBAR_TAB_H = 36;
  const BRAND_HOME_EVENT = "isa:brand-home";

  function readMetaTag(name) {
    var el = document.querySelector('meta[name="' + name + '"]');
    return el ? String(el.getAttribute("content") || "").trim() : "";
  }

  function ensureAppMeta() {
    if (typeof globalThis.AppMeta !== "undefined") {
      if (globalThis.AppMeta.cfg) return globalThis.AppMeta.cfg;
      if (typeof globalThis.AppMeta.initFromDocument === "function") {
        return globalThis.AppMeta.initFromDocument();
      }
    }
    return {
      shortName: readMetaTag("application-name") || document.title || "App",
      title: document.title || "App",
      icon: readMetaTag("app-icon") || "mdi:application-outline",
    };
  }

  function resolveBrand(props) {
    const meta = ensureAppMeta();
    return {
      title: props.title != null ? props.title : (meta.shortName || meta.title || "App"),
      icon: props.icon != null ? props.icon : (meta.icon || "mdi:application-outline"),
    };
  }

  function defaultBrandClick() {
    if (window.ISAFront && typeof window.ISAFront.goBrandHome === "function") {
      window.ISAFront.goBrandHome();
      return;
    }
    window.dispatchEvent(new CustomEvent(BRAND_HOME_EVENT, { bubbles: true }));
  }

  function resolveBrandClick(props) {
    if (props.onBrandClick === false || props.brandClick === false) return null;
    if (typeof props.onBrandClick === "function") return props.onBrandClick;
    return defaultBrandClick;
  }

  function navTabRowSx(minH) {
    return {
      minHeight: minH,
      flexShrink: 0,
      "& .MuiTabs-root": { minHeight: minH },
      "& .MuiTabs-scroller": { display: "flex", alignItems: "center" },
      "& .MuiTabs-list": { alignItems: "center" },
      "& .MuiTab-root": {
        minHeight: minH,
        textTransform: "none",
        py: 0.75,
        display: "inline-flex",
        alignItems: "center",
      },
    };
  }

  function bagUi(ns) {
    const bag = window[ns];
    if (!bag?.UI) throw new Error("NavTabRow: registrar ISAFront para " + ns);
    return bag.UI;
  }

  function NavTabLabel(props) {
    const UI = props.UI || bagUi(props.ns);
    return React.createElement(
      "span",
      { style: TAB_LABEL_STYLE },
      React.createElement(UI.Icon, { icon: props.icon, size: 18 }),
      React.createElement("span", null, props.label),
    );
  }

  /** Fila de tabs con icono + etiqueta (estilo jagudeloe). */
  function NavTabRow(props) {
    const UI = props.UI || bagUi(props.ns);
    const minH = props.minHeight != null ? props.minHeight : 44;
    const tabs = props.tabs || [];
    return React.createElement(
      MUI.Tabs,
      {
        value: props.value,
        onChange: function (_e, v) {
          if (v != null && props.onChange) props.onChange(v);
        },
        variant: props.variant || "scrollable",
        sx: Object.assign(navTabRowSx(minH), props.sx || {}),
      },
      tabs.map(function (t) {
        return React.createElement(MUI.Tab, {
          key: t.id,
          value: t.id,
          label: React.createElement(NavTabLabel, {
            UI: UI,
            icon: t.icon,
            label: t.label || t.title || t.id,
          }),
        });
      }),
    );
  }

  /** Contenedor de vista con fila de tabs inferior opcional y área scroll interna. */
  function ViewFrame(props) {
    return React.createElement(
      MUI.Box,
      { className: "isa-view-frame", sx: { display: "flex", flexDirection: "column", height: "100%", minHeight: 0 } },
      props.navRow
        ? React.createElement(NavTabRow, Object.assign({ minHeight: 40 }, props.navRow, {
            sx: Object.assign(
              { px: 1, borderBottom: 1, borderColor: "divider" },
              props.navRow.sx || {},
            ),
          }))
        : null,
      React.createElement(
        MUI.Box,
        {
          className: props.scroll !== false ? "isa-scroll-panel" : "isa-layout-body",
          sx: Object.assign({ flex: 1, minHeight: 0, overflow: props.scroll === false ? "hidden" : "auto" }, props.bodySx || {}),
        },
        props.children,
      ),
    );
  }

  function AppShell(props) {
    const bag = window[props.ns];
    if (!bag?.Theme || !bag?.UI) {
      throw new Error("AppShell: registrar ISAFront para " + props.ns + " antes de renderizar");
    }
    const UI = bag.UI;
    const tm = bag.Theme.useThemeMode();
    const Auth = bag.Auth;
    const Session = bag.Session;
    function targetSwitchAllowed() {
      if (props.showTarget === false) return false;
      if (props.showTarget === true) return true;
      return !!(Session && Session.can && Session.can("infra.target.switch"));
    }
    const showTarget = targetSwitchAllowed();
    const showTheme = props.showTheme !== false;
    const showAuthChip = props.showAuthChip === true && Auth?.isLoggedIn?.();
    const showLogout = props.showLogout === true && Auth?.isLoggedIn?.();
    const navRows = Array.isArray(props.navRows) ? props.navRows : [];
    const toolbarNav = navRows[0] || null;
    const subNavRows = navRows.slice(1);
    const FP = UI.FeedbackProvider;
    const brand = resolveBrand(props);
    const brandClick = resolveBrandClick(props);
    const showTitle = props.showTitle !== false;

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
        {
          variant: "dense",
          sx: {
            gap: 1,
            minHeight: TOOLBAR_MIN_H,
            px: { xs: 1, sm: 2 },
            flexWrap: "nowrap",
            alignItems: "center",
          },
        },
        brand.icon || brand.title
          ? React.createElement(
              MUI.Box,
              {
                className: brandClick ? "isa-app-brand isa-app-brand--clickable" : "isa-app-brand",
                onClick: brandClick || undefined,
                onKeyDown:
                  brandClick
                    ? function (e) {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          brandClick();
                        }
                      }
                    : undefined,
                role: brandClick ? "button" : undefined,
                tabIndex: brandClick ? 0 : undefined,
                title: brandClick ? "Inicio" : undefined,
                sx: {
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.75,
                  flexShrink: 0,
                  mr: 1,
                  borderRadius: 1,
                  px: brandClick ? 0.5 : 0,
                  py: brandClick ? 0.25 : 0,
                  cursor: brandClick ? "pointer" : "default",
                  "&:hover": brandClick ? { bgcolor: "action.hover" } : {},
                },
              },
              brand.icon
                ? React.createElement(UI.Icon, { icon: brand.icon, size: props.iconSize || 24 })
                : null,
              showTitle && brand.title
                ? React.createElement(MUI.Typography, { variant: "h6", component: "span", sx: { flexShrink: 0 } }, brand.title)
                : null,
            )
          : null,
        toolbarNav
          ? React.createElement(
              MUI.Box,
              { sx: { flex: 1, minWidth: 0, display: "flex", alignItems: "center" } },
              React.createElement(NavTabRow, Object.assign({}, toolbarNav, {
                ns: props.ns,
                minHeight: toolbarNav.minHeight != null ? toolbarNav.minHeight : TOOLBAR_TAB_H,
                sx: Object.assign({ flex: 1, minHeight: TOOLBAR_TAB_H }, toolbarNav.sx || {}),
              })),
            )
          : React.createElement(MUI.Box, { sx: { flex: 1 } }),
        React.createElement(
          MUI.Stack,
          {
            direction: "row",
            spacing: 1,
            alignItems: "center",
            sx: { flexShrink: 0 },
          },
          props.toolbarExtra || null,
          showAuthChip && Auth
            ? (window.ISAFront.UI?.UserSessionMenu
              ? React.createElement(window.ISAFront.UI.UserSessionMenu, {
                  ns: props.ns,
                  username: Auth.username(),
                  role: Auth.role?.() || "",
                  onLogout: function () { Auth.logout(); },
                  showTarget: showTarget,
                  runUnitTestUrl: props.runUnitTestUrl,
                  getAuthHeaders: props.getAuthHeaders,
                  unitTestTitle: props.unitTestTitle,
                })
              : React.createElement(MUI.Chip, { size: "small", label: Auth.username(), variant: "outlined" }))
            : null,
          showTarget && !showAuthChip ? React.createElement(UI.TargetSwitch, null) : null,
          props.toolbarActions || null,
          showLogout && Auth
            ? React.createElement(MUI.Button, { size: "small", onClick: function () { Auth.logout(); } }, "Salir")
            : null,
          showTheme ? React.createElement(UI.ThemeSwitch, { mode: tm.mode, onToggle: tm.toggle }) : null,
          props.toolbarEnd || null,
        ),
      ),
      subNavRows.map(function (row, i) {
        return React.createElement(NavTabRow, Object.assign({ key: row.id || "nav-" + i, ns: props.ns }, row, {
          sx: Object.assign({ px: 1, borderTop: 1, borderColor: "divider" }, row.sx || {}),
        }));
      }),
    );

    const bodyOverflow = props.bodyScroll === true ? "auto" : "hidden";
    const frame = React.createElement(
      MUI.Box,
      { className: "isa-layout-root", sx: { height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" } },
      bar,
      React.createElement(
        MUI.Box,
        {
          className: "isa-layout-body",
          sx: { flex: 1, minHeight: 0, overflow: bodyOverflow, display: "flex", flexDirection: "column" },
        },
        props.children,
      ),
    );

    const gated = props.loginGate && UI.LoginGate ? React.createElement(UI.LoginGate, null, frame) : frame;
    const wrapped = FP ? React.createElement(FP, null, gated) : gated;

    return React.createElement(
      MUI.ThemeProvider,
      { theme: tm.theme },
      React.createElement(MUI.CssBaseline, null),
      wrapped,
    );
  }

  window.ISAFront = window.ISAFront || {};
  window.ISAFront.Layout = window.ISAFront.Layout || {};
  window.ISAFront.Layout.NavTabLabel = NavTabLabel;
  window.ISAFront.Layout.NavTabRow = NavTabRow;
  window.ISAFront.Layout.ViewFrame = ViewFrame;
  window.ISAFront.Layout.goBrandHome = defaultBrandClick;
  window.ISAFront.Layout.AppShell = AppShell;
})();
