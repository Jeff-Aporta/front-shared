const { Box, Typography, Chip, Stack } = MaterialUI;
const UI = window.ISAFront?.UI;

const MODULES = [
  { icon: "mdi:view-dashboard-outline", title: "AppShell", desc: "Layout, tabs, toolbar y scroll body." },
  { icon: "mdi:palette-outline", title: "Tema", desc: "Dark/light con neon-theme y localStorage." },
  { icon: "mdi:shield-key-outline", title: "Auth", desc: "Sesión compartida vía system-login." },
  { icon: "mdi:code-braces", title: "Boot", desc: "stack.mjs, boot-helper, import maps." },
  { icon: "mdi:bell-outline", title: "Toast", desc: "Feedback y notificaciones MUI." },
  { icon: "mdi:palette-swatch-outline", title: "neon-glass", desc: "Kit glass — catálogo en demo/neon-glass/." },
  { icon: "mdi:github", title: "CDN", desc: "jsDelivr gh/Jeff-Aporta/front-shared@pin/cdn" },
];

function DemoCard({ icon, title, desc }) {
  return (
    <Box className="fs-demo-card">
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>
        {UI?.Icon ? <UI.Icon icon={icon} size={20} /> : null}
        <Typography variant="subtitle2" fontWeight={700}>
          {title}
        </Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary">
        {desc}
      </Typography>
    </Box>
  );
}

function App() {
  const Shell = window.ISAFront?.Layout?.AppShell;
  if (!Shell) {
    return React.createElement(Typography, { sx: { p: 2 } }, "AppShell no cargó");
  }

  return React.createElement(
    Shell,
    {
      ns: "ISA",
      title: "front-shared",
      icon: "mdi:package-variant-closed",
      showTarget: false,
      bodyScroll: true,
      navRows: [
        {
          id: "demo",
          value: "stack",
          onChange: () => {},
          tabs: [{ id: "stack", label: "Stack", icon: "mdi:layers-outline" }],
        },
      ],
    },
    React.createElement(
      Box,
      { sx: { p: { xs: 1.5, sm: 2 }, maxWidth: 960, mx: "auto" } },
      React.createElement(
        Typography,
        { variant: "h5", fontWeight: 700, gutterBottom: true },
        "Stack ISAFront",
      ),
      React.createElement(
        Typography,
        { variant: "body2", color: "text.secondary", sx: { mb: 2 } },
        "Biblioteca común para fronts Jeff-Aporta / InSoft. Este demo monta AppShell real desde el CDN publicado.",
      ),
      React.createElement(Chip, {
        size: "small",
        label: "Jeff-Aporta/front-shared",
        variant: "outlined",
        sx: { mb: 2 },
      }),
      React.createElement(
        Box,
        { className: "fs-demo-grid" },
        MODULES.map((m) => React.createElement(DemoCard, { key: m.title, ...m })),
      ),
    ),
  );
}

const root = document.getElementById("root");
ReactDOM.createRoot(root).render(React.createElement(App));
