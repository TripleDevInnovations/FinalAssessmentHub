import React from "react";
import { Box, Typography, Switch, FormControlLabel, PaletteMode } from "@mui/material";

interface SettingsPageProps {
  toggleColorMode: () => void;
  currentMode: PaletteMode;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ toggleColorMode, currentMode }) => {
  return (
    <Box
      sx={{
        p: 2,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <Typography variant="h4" component="h1" gutterBottom>
        Settings
      </Typography>
      <FormControlLabel
        control={
          <Switch
            checked={currentMode === 'dark'}
            onChange={toggleColorMode}
          />
        }
        label="Dark Mode"
      />
    </Box>
  );
};

export default SettingsPage;
