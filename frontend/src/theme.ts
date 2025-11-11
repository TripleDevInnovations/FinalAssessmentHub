import { PaletteMode } from "@mui/material";
import { createTheme } from "@mui/material/styles";

const getTheme = (mode: PaletteMode) =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: "#1976d2",
      },
    },
  });

export default getTheme;