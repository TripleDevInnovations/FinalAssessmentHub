import React, { useState, useMemo, useEffect } from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import { PaletteMode } from "@mui/material";
import getTheme from "./theme";
import TopBar from "./components/TopBar";
import TabPanel from "./components/TabPanel";
import AddResult from "./pages/addResult";
import ListResults from "./pages/listResults";
import SettingsPage from "./pages/settings";
import InformationPage from "./pages/information";


const App: React.FC = () => {
  const [tabIndex, setTabIndex] = useState<number>(0);
  const [mode, setMode] = useState<PaletteMode>('light');

  useEffect(() => {
    const fetchAndSetTheme = async () => {
      const isDarkMode = await window.electronAPI.getInitialTheme();
      setMode(isDarkMode ? 'dark' : 'light');
    };

    fetchAndSetTheme();
  }, []);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  const toggleColorMode = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    window.electronAPI.setTheme(newMode);
  };


  const theme = useMemo(() => getTheme(mode), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          bgcolor: "background.default"
        }}
      >
        <Box sx={{ flex: "0 0 auto" }}>
          <TopBar value={tabIndex} onChange={handleTabChange} />
        </Box>

        <Container
          sx={{
            flex: "1 1 auto",
            py: 4,
            overflow: "auto"
          }}
        >
          <TabPanel value={tabIndex} index={0}>
            <AddResult />
          </TabPanel>

          <TabPanel value={tabIndex} index={1}>
            <ListResults />
          </TabPanel>

          <TabPanel value={tabIndex} index={2}>
            <SettingsPage toggleColorMode={toggleColorMode} currentMode={mode} />
          </TabPanel>
          <TabPanel value={tabIndex} index={3}><InformationPage /></TabPanel>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default App;
