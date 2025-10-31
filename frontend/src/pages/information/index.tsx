import React from "react";
import { Box, Typography } from "@mui/material";

const InformationPage: React.FC = () => {
  return (
    <Box
      sx={{
        p: 4,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
      }}
    >
      <Typography variant="h4" component="h1">
        Information
      </Typography>
    </Box>
  );
};

export default InformationPage;
