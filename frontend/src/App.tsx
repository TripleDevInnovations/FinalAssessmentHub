import React, { useState, useMemo } from "react";
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Container,
  Paper,
  Box,
  Typography,
  Grid,
  TextField,
  Button,
  Stack,
  Snackbar,
  Alert,
  CircularProgress
} from "@mui/material";

type FinalExamResultInput = {
  Name: string;
  AP1: string;
  AP2_1_1: string;
  AP2_1_2: string;
  AP2_2_1: string;
  AP2_2_2: string;
  AP2_3_1: string;
  AP2_3_2: string;
  ML1: string;
  ML2: string;
};

const initialState: FinalExamResultInput = {
  Name: "",
  AP1: "",
  AP2_1_1: "",
  AP2_1_2: "",
  AP2_2_1: "",
  AP2_2_2: "",
  AP2_3_1: "",
  AP2_3_2: "",
  ML1: "",
  ML2: ""
};

export default function App(): JSX.Element {
  // Theme (einheitliches Design)
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: "light",
          primary: { main: "#1976d2" },
          secondary: { main: "#00bfa5" }
        },
        components: {
          MuiButton: {
            defaultProps: {
              disableElevation: true
            }
          }
        }
      }),
    []
  );

  const [form, setForm] = useState<FinalExamResultInput>(initialState);
  const [errors, setErrors] = useState<Partial<Record<keyof FinalExamResultInput, string>>>({});
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; severity: "success" | "error"; message: string }>({
    open: false,
    severity: "success",
    message: ""
  });

  // Utility: only accept digits (no decimals), allow empty string while typing
  const isIntegerString = (v: string) => /^\d+$/.test(v);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FinalExamResultInput, string>> = {};

    if (!form.Name.trim()) newErrors.Name = "Name ist erforderlich.";

    const intFields: (keyof Omit<FinalExamResultInput, "Name">)[] = [
      "AP1",
      "AP2_1_1",
      "AP2_1_2",
      "AP2_2_1",
      "AP2_2_2",
      "AP2_3_1",
      "AP2_3_2",
      "ML1",
      "ML2"
    ];

    intFields.forEach((f) => {
      const v = form[f];
      if (v.trim() === "") {
        newErrors[f] = "Erforderlich";
        return;
      }
      if (!isIntegerString(v)) {
        newErrors[f] = "Ganze Zahl (0–100) erwartet";
        return;
      }
      const num = Number(v);
      if (num < 0 || num > 100) newErrors[f] = "Wert zwischen 0 und 100";
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (key: keyof FinalExamResultInput) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // for number fields keep as string so user can delete and edit; validation on submit
    setForm((prev) => ({ ...prev, [key]: value }));
    // clear field error while typing
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const resetForm = () => {
    setForm(initialState);
    setErrors({});
    setSnackbar({ open: false, severity: "success", message: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      setSnackbar({ open: true, severity: "error", message: "Bitte Fehler vor dem Absenden beheben." });
      return;
    }

    // build payload with parsed ints
    const payload = {
      Name: form.Name.trim(),
      AP1: Number(form.AP1),
      AP2_1_1: Number(form.AP2_1_1),
      AP2_1_2: Number(form.AP2_1_2),
      AP2_2_1: Number(form.AP2_2_1),
      AP2_2_2: Number(form.AP2_2_2),
      AP2_3_1: Number(form.AP2_3_1),
      AP2_3_2: Number(form.AP2_3_2),
      ML1: Number(form.ML1),
      ML2: Number(form.ML2)
    };

    setLoading(true);
    try {
      const resp = await fetch("http://127.0.0.1:8000/exam/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (resp.ok) {
        setSnackbar({ open: true, severity: "success", message: "Erfolgreich gespeichert." });
        resetForm();
      } else {
        // try to show helpful server message
        let text = "";
        try {
          text = await resp.text();
        } catch {
          text = `${resp.status} ${resp.statusText}`;
        }
        setSnackbar({ open: true, severity: "error", message: `Serverfehler: ${text}` });
      }
    } catch (err: any) {
      setSnackbar({ open: true, severity: "error", message: `Netzwerkfehler: ${err?.message ?? err}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Paper elevation={3} sx={{ p: { xs: 2, md: 4 }, borderRadius: 2 }}>
          <Box mb={2}>
            <Typography variant="h5" component="h1" gutterBottom>
              Prüfungsergebnisse eintragen
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Trage Name und Punktzahlen (0–100) ein und klicke auf „Absenden“. Alle Felder sind erforderlich.
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Name"
                  value={form.Name}
                  onChange={handleChange("Name")}
                  fullWidth
                  required
                  error={!!errors.Name}
                  helperText={errors.Name}
                  autoComplete="name"
                />
              </Grid>

              {/* Number fields in grid */}
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="AP1"
                  value={form.AP1}
                  onChange={handleChange("AP1")}
                  fullWidth
                  required
                  error={!!errors.AP1}
                  helperText={errors.AP1 ?? "0–100"}
                  inputProps={{ inputMode: "numeric", pattern: "[0-9]*", min: 0, max: 100, step: 1 }}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="AP2_1_1"
                  value={form.AP2_1_1}
                  onChange={handleChange("AP2_1_1")}
                  fullWidth
                  required
                  error={!!errors.AP2_1_1}
                  helperText={errors.AP2_1_1 ?? "0–100"}
                  inputProps={{ inputMode: "numeric", pattern: "[0-9]*", min: 0, max: 100, step: 1 }}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="AP2_1_2"
                  value={form.AP2_1_2}
                  onChange={handleChange("AP2_1_2")}
                  fullWidth
                  required
                  error={!!errors.AP2_1_2}
                  helperText={errors.AP2_1_2 ?? "0–100"}
                  inputProps={{ inputMode: "numeric", pattern: "[0-9]*", min: 0, max: 100, step: 1 }}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="AP2_2_1"
                  value={form.AP2_2_1}
                  onChange={handleChange("AP2_2_1")}
                  fullWidth
                  required
                  error={!!errors.AP2_2_1}
                  helperText={errors.AP2_2_1 ?? "0–100"}
                  inputProps={{ inputMode: "numeric", pattern: "[0-9]*", min: 0, max: 100, step: 1 }}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="AP2_2_2"
                  value={form.AP2_2_2}
                  onChange={handleChange("AP2_2_2")}
                  fullWidth
                  required
                  error={!!errors.AP2_2_2}
                  helperText={errors.AP2_2_2 ?? "0–100"}
                  inputProps={{ inputMode: "numeric", pattern: "[0-9]*", min: 0, max: 100, step: 1 }}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="AP2_3_1"
                  value={form.AP2_3_1}
                  onChange={handleChange("AP2_3_1")}
                  fullWidth
                  required
                  error={!!errors.AP2_3_1}
                  helperText={errors.AP2_3_1 ?? "0–100"}
                  inputProps={{ inputMode: "numeric", pattern: "[0-9]*", min: 0, max: 100, step: 1 }}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="AP2_3_2"
                  value={form.AP2_3_2}
                  onChange={handleChange("AP2_3_2")}
                  fullWidth
                  required
                  error={!!errors.AP2_3_2}
                  helperText={errors.AP2_3_2 ?? "0–100"}
                  inputProps={{ inputMode: "numeric", pattern: "[0-9]*", min: 0, max: 100, step: 1 }}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="ML1"
                  value={form.ML1}
                  onChange={handleChange("ML1")}
                  fullWidth
                  required
                  error={!!errors.ML1}
                  helperText={errors.ML1 ?? "0–100"}
                  inputProps={{ inputMode: "numeric", pattern: "[0-9]*", min: 0, max: 100, step: 1 }}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="ML2"
                  value={form.ML2}
                  onChange={handleChange("ML2")}
                  fullWidth
                  required
                  error={!!errors.ML2}
                  helperText={errors.ML2 ?? "0–100"}
                  inputProps={{ inputMode: "numeric", pattern: "[0-9]*", min: 0, max: 100, step: 1 }}
                />
              </Grid>
            </Grid>

            <Stack direction="row" spacing={2} mt={3} alignItems="center">
              <Box sx={{ position: "relative" }}>
                <Button variant="contained" color="primary" type="submit" disabled={loading}>
                  Absenden
                </Button>
                {loading && (
                  <CircularProgress
                    size={24}
                    sx={{
                      color: "primary.main",
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      marginTop: "-12px",
                      marginLeft: "-12px"
                    }}
                  />
                )}
              </Box>

              <Button variant="outlined" color="secondary" onClick={resetForm} disabled={loading}>
                Zurücksetzen
              </Button>

              <Box ml="auto" sx={{ color: "text.secondary", fontSize: 13 }}>
                Request: <code>http://127.0.0.1:8000/exam/save</code>
              </Box>
            </Stack>
          </Box>
        </Paper>
      </Container>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}
