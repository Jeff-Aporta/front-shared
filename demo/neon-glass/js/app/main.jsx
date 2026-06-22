import { NeonGlassCatalog } from "../../../../cdn/isa/js/ui/kits/neon-glass/catalog/NeonGlassCatalog.jsx";

const { useState, useMemo } = React;
const { ThemeProvider, createTheme, CssBaseline, IconButton, AppBar, Toolbar, Typography, Box } = MaterialUI;

const LS_KEY = "jeffaporta:neon-glass-demo-theme";

function readMode() {
  try {
    const v = localStorage.getItem(LS_KEY);
    if (v === "light" || v === "dark") return v;
  } catch (_) {}
  return document.documentElement.dataset.muiColorScheme === "light" ? "light" : "dark";
}

function App() {
  const [mode, setMode] = useState(readMode);
  const theme = useMemo(
    () => createTheme({
      palette: { mode },
      typography: { fontFamily: '"IBM Plex Sans", system-ui, sans-serif' },
    }),
    [mode],
  );

  function toggle() {
    const next = mode === "dark" ? "light" : "dark";
    setMode(next);
    document.documentElement.dataset.muiColorScheme = next;
    document.documentElement.classList.toggle("dark-mode", next === "dark");
    try { localStorage.setItem(LS_KEY, next); } catch (_) {}
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: mode === "dark" ? "rgba(11,18,32,0.85)" : "rgba(255,255,255,0.9)", backdropFilter: "blur(10px)" }}>
        <Toolbar variant="dense">
          <Typography variant="subtitle1" sx={{ flex: 1, fontWeight: 700 }}>neon-glass catalog</Typography>
          <IconButton color="inherit" onClick={toggle} aria-label="Tema">{mode === "dark" ? "☀" : "☾"}</IconButton>
        </Toolbar>
      </AppBar>
      <Box component="main"><NeonGlassCatalog /></Box>
    </ThemeProvider>
  );
}

const root = document.getElementById("root");
ReactDOM.createRoot(root).render(React.createElement(App));
