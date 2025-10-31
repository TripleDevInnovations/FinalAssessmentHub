import React from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";

import logo_white from "../assets/logo_white.png";


interface TopBarProps {
  value: number;
  onChange: (event: React.SyntheticEvent, newValue: number) => void;
  title?: string;
}

const TopBar: React.FC<TopBarProps> = ({ value, onChange, title = "Final Assessment Hub" }) => {
  return (
    <AppBar position="static" color="primary" elevation={2}>
      <Toolbar sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Avatar
            src={logo_white}
            alt="Logo"
            variant="square"
            sx={{ width: 36, height: 36 }}
          />
          <Typography variant="h6" component="div" sx={{ whiteSpace: "nowrap" }}>
            {title}
          </Typography>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Tabs
            value={value}
            onChange={onChange}
            aria-label="Hauptmenü Tabs"
            textColor="inherit"
            indicatorColor="secondary"
            variant="standard"
            sx={{ minHeight: 48 }}
          >
            <Tab label="Hinzufügen" id="tab-0" aria-controls="tabpanel-0" />
            <Tab label="Ergebnisse" id="tab-1" aria-controls="tabpanel-1" />
          </Tabs>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default TopBar;
