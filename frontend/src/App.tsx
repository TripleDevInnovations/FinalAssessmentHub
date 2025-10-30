import React, { useEffect, useMemo, useState } from "react";
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Tabs,
  Tab,
  Container
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";

import AddResult from "./pages/addResult";
import ListResults from "./pages/listResults";

export default function App(): JSX.Element {
  const theme = useMemo(
    () =>
      createTheme({
        palette: { mode: "light", primary: { main: "#1976d2" }, secondary: { main: "#00bfa5" } },
        components: { MuiButton: { defaultProps: { disableElevation: true } } }
      }),
    []
  );

  const [tab, setTab] = useState(0);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <IconButton edge="start" color="inherit" aria-label="menu" sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Prüfungs-Manager
          </Typography>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} textColor="inherit" indicatorColor="secondary">
            <Tab label="Eintrag" />
            <Tab label="Einträge" />
          </Tabs>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 4 }}>
        {tab === 0 && <AddResult />}
        {tab === 1 && <ListResults />}
      </Container>
    </ThemeProvider>
  );
}
