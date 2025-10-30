// App.tsx
import React, { useMemo, useState } from "react";
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Container
} from "@mui/material";

import AppBarWithTabs from "./components/AppBarWithTabs";
import AddResult from "./pages/addResult";
import ListResults from "./pages/listResults";

export default function App() {
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
      <AppBarWithTabs onTabChange={setTab} />
      <Container> {tab === 0 ? <AddResult /> : <ListResults />} </Container>
    </ThemeProvider>
  );
}