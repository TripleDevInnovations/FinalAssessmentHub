import React from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";
import SettingsIcon from "@mui/icons-material/Settings";
import InfoIcon from "@mui/icons-material/Info";
import { useTranslation } from 'react-i18next';

import logo_white from "../assets/logo_white.png";


interface TopBarProps {
  value: number;
  onChange: (event: React.SyntheticEvent, newValue: number) => void;
  title?: string;
}

const TopBar: React.FC<TopBarProps> = ({ value, onChange, title = "Final Assessment Hub" }) => {
  const { t } = useTranslation();
  return (
    <AppBar position="static" color="primary" elevation={2}>
      <Toolbar sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Avatar
            src={logo_white}
            alt={t("topbar.logoAlt")}
            variant="square"
            sx={{ width: 36, height: 36 }}
          />
          <Typography
            variant="h6"
            component="div"
            sx={{ whiteSpace: "nowrap" }}
          >
            {title || t("topbar.title")}
          </Typography>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Tabs
            value={value}
            onChange={onChange}
            aria-label={t("topbar.mainMenu")}
            textColor="inherit"
            indicatorColor="secondary"
            variant="standard"
            sx={{ minHeight: 48 }}
          >
            <Tab
              label={t("topbar.add")}
              id="tab-0"
              aria-controls="tabpanel-0"
            />
            <Tab
              label={t("topbar.results")}
              id="tab-1"
              aria-controls="tabpanel-1"
            />
            <Tab
              icon={<SettingsIcon />}
              id="tab-2"
              aria-controls="tabpanel-2"
              aria-label={t("topbar.settings")}
            />
            <Tab
              icon={<InfoIcon />}
              id="tab-3"
              aria-controls="tabpanel-3"
              aria-label={t("topbar.info")}
            />
          </Tabs>
        </Box>
      </Toolbar>
    </AppBar>
  );
};


export default TopBar;
