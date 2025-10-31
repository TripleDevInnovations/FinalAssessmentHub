import React, { useState } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import TopBar from "./components/TopBar";
import TabPanel from "./components/TabPanel";
import AddResult from "./pages/addResult";
import ListResults from "./pages/listResults";

const App: React.FC = () => {
  const [tabIndex, setTabIndex] = useState<number>(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <TopBar value={tabIndex} onChange={handleTabChange} />
      <Container sx={{ py: 4 }}>
        <TabPanel value={tabIndex} index={0}>
          <AddResult />
        </TabPanel>
        <TabPanel value={tabIndex} index={1}>
          <ListResults />
        </TabPanel>
      </Container>
    </Box>
  );
};

export default App;
