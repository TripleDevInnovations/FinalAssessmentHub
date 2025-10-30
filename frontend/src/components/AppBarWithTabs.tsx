import React, { useState } from "react";
import { AppBar, Toolbar, Typography, Tabs, Tab } from "@mui/material";

type Props = { onTabChange: (v: number) => void };

function AppBarWithTabsInner({ onTabChange }: Props) {
  console.log("AppBarWithTabs render"); // <-- zum Debuggen
  const [localTab, setLocalTab] = useState(0);

  const handleChange = (_: React.SyntheticEvent, v: number) => {
    setLocalTab(v);
    onTabChange(v);
  };

  return (
    <AppBar position="static" sx={{ width: "100vw", left: 0, right: 0 }}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Final Assessment Hub
        </Typography>

        <Tabs value={localTab} onChange={handleChange} textColor="inherit" indicatorColor="secondary">
          <Tab label="Eintrag" />
          <Tab label="Einträge" />
        </Tabs>
      </Toolbar>
    </AppBar>
  );
}

// Memoize the whole component so it only re-renders when onTabChange identity changes.
// Since setTab from useState is stable, parent can pass it directly.
export default React.memo(AppBarWithTabsInner);
