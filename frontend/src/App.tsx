import React, { useMemo, useState } from "react";
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
  CircularProgress,
  Divider
} from "@mui/material";

type FinalExamResultInput = {
  Name: string;
  AP1: string;
  AP2_1_1: string;
  AP2_1_2: string; // Zusatzprüfung für Teil 1 (optional)
  AP2_2_1: string;
  AP2_2_2: string; // Zusatzprüfung für Teil 2 (optional)
  AP2_3_1: string;
  AP2_3_2: string; // Zusatzprüfung für Teil 3 (optional)
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
  const [snackbar, setSnackbar] = useState<{ open: boolean; severity: "success" | "error"; message: string }>(
    {
      open: false,
      severity: "success",
      message: ""
    }
  );

  // Nur Ziffern erlauben (als String), erlaubt leeres Feld beim Tippen
  const onlyDigits = (s: string) => s.replace(/\D+/g, "");

  // Validierung:
  // - Name ist Pflicht
  // - Pflichtfelder (ohne die drei Zusatzprüfungen) müssen eine ganze Zahl 0-100 enthalten
  // - Zusatzprüfungen (AP2_1_2, AP2_2_2, AP2_3_2) sind optional — werden nur validiert, wenn sie nicht leer sind
  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FinalExamResultInput, string>> = {};

    if (!form.Name.trim()) newErrors.Name = "Name ist erforderlich.";

    // Pflichtfelder (ohne Zusatzprüfungen)
    const requiredFields: (keyof Omit<FinalExamResultInput, "Name">)[] = [
      "AP1",
      "AP2_1_1",
      "AP2_2_1",
      "AP2_3_1",
      "ML1",
      "ML2"
    ];

    requiredFields.forEach((f) => {
      const v = form[f].trim();
      if (v === "") {
        newErrors[f] = "Erforderlich";
        return;
      }
      if (!/^\d+$/.test(v)) {
        newErrors[f] = "Nur ganze Zahlen (0–100)";
        return;
      }
      const num = Number(v);
      if (num < 0 || num > 100) newErrors[f] = "Wert muss zwischen 0 und 100 liegen";
    });

    // Zusatzprüfungen: optional — nur prüfen, wenn ausgefüllt
    const optionalFields: (keyof FinalExamResultInput)[] = ["AP2_1_2", "AP2_2_2", "AP2_3_2"];
    optionalFields.forEach((f) => {
      const v = form[f].trim();
      if (v === "") return; // optional
      if (!/^\d+$/.test(v)) {
        newErrors[f] = "Nur ganze Zahlen (0–100)";
        return;
      }
      const num = Number(v);
      if (num < 0 || num > 100) newErrors[f] = "Wert muss zwischen 0 und 100 liegen";
    });

    // Zusätzliche Regel: von den drei Zusatzprüfungen darf höchstens eine ausgefüllt sein
    const zusatzFilled = optionalFields.map((k) => form[k].trim() !== "").filter(Boolean).length;
    if (zusatzFilled > 1) {
      newErrors.AP2_1_2 = "Es darf höchstens eine Zusatzprüfung ausgefüllt sein";
      newErrors.AP2_2_2 = "Es darf höchstens eine Zusatzprüfung ausgefüllt sein";
      newErrors.AP2_3_2 = "Es darf höchstens eine Zusatzprüfung ausgefüllt sein";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Change-Handler: Name bleibt frei; numerische Felder werden sofort gefiltert (nur Ziffern).
  // Außerdem: Exklusivität für die drei Zusatzprüfungen (AP2_1_2, AP2_2_2, AP2_3_2)
  const handleChange = (key: keyof FinalExamResultInput) => (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    if (key !== "Name") {
      value = onlyDigits(value);
      if (value.length > 3) value = value.slice(0, 3); // max 3 digits (0-100)
    }

    setForm((prev) => {
      const next = { ...prev, [key]: value };

      // Wenn eine der Zusatzprüfungen gesetzt wird, leere die anderen beiden
      const zusatzKeys: (keyof FinalExamResultInput)[] = ["AP2_1_2", "AP2_2_2", "AP2_3_2"];
      if (zusatzKeys.includes(key) && value.trim() !== "") {
        for (const k of zusatzKeys) {
          if (k !== key) next[k] = "";
        }
      }

      return next;
    });

    // Fehler für das Feld zurücksetzen während des Tippens
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

    // Payload: Zusatzprüfungen => 0, falls leer
    const payload = {
      Name: form.Name.trim(),
      AP1: Number(form.AP1),
      AP2_1_1: Number(form.AP2_1_1),
      AP2_1_2: form.AP2_1_2.trim() === "" ? 0 : Number(form.AP2_1_2),
      AP2_2_1: Number(form.AP2_2_1),
      AP2_2_2: form.AP2_2_2.trim() === "" ? 0 : Number(form.AP2_2_2),
      AP2_3_1: Number(form.AP2_3_1),
      AP2_3_2: form.AP2_3_2.trim() === "" ? 0 : Number(form.AP2_3_2),
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

  // Steuerung: falls eine Zusatzprüfung ausgefüllt ist, werden die anderen deaktiviert
  const zusatz1Filled = form.AP2_1_2.trim() !== "";
  const zusatz2Filled = form.AP2_2_2.trim() !== "";
  const zusatz3Filled = form.AP2_3_2.trim() !== "";

  const ap2_1_2_disabled = zusatz2Filled || zusatz3Filled;
  const ap2_2_2_disabled = zusatz1Filled || zusatz3Filled;
  const ap2_3_2_disabled = zusatz1Filled || zusatz2Filled;

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
              Trage Name des Berechnungseintrages und Ergebnisse der Prüfungen (0–100 Pkt.) ein und klicke auf
              „Absenden“.
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Grid container spacing={2}>
              {/* NAME */}
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

              <Divider sx={{ width: "100%", my: 1 }} />

              {/* ABSCHLUSSPRÜFUNG 1 */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Abschlussprüfung 1
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Thema: Einrichten eines IT-gestützten Arbeitsplatzes.
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Abschlussprüfung 1 - Punkte"
                      value={form.AP1}
                      onChange={handleChange("AP1")}
                      fullWidth
                      required
                      error={!!errors.AP1}
                      helperText={errors.AP1 ?? "0–100"}
                      inputProps={{ inputMode: "numeric", pattern: "[0-9]*", min: 0, max: 100 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ height: "100%" }} />
                  </Grid>
                </Grid>
              </Grid>

              <Divider sx={{ width: "100%", my: 2 }} />

              {/* ABSCHLUSSPRÜFUNG 2 - TEIL 1 (zwei Felder nebeneinander, gleich groß) */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Abschlussprüfung 2 — Teil 1
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Thema: Planen eines Softwareprodukts.
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Teil 1.1 (Punkte)"
                      value={form.AP2_1_1}
                      onChange={handleChange("AP2_1_1")}
                      fullWidth
                      required
                      error={!!errors.AP2_1_1}
                      helperText={errors.AP2_1_1 ?? "0–100"}
                      inputProps={{ inputMode: "numeric", pattern: "[0-9]*", min: 0, max: 100 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Teil 1.2 (Zusatzprüfung, optional)"
                      value={form.AP2_1_2}
                      onChange={handleChange("AP2_1_2")}
                      fullWidth
                      required={false}
                      disabled={ap2_1_2_disabled}
                      error={!!errors.AP2_1_2}
                      helperText={
                        ap2_1_2_disabled
                          ? "Deaktiviert, weil eine andere Zusatzprüfung ausgefüllt wurde"
                          : errors.AP2_1_2 ?? "falls vorhanden"
                      }
                      inputProps={{ inputMode: "numeric", pattern: "[0-9]*", min: 0, max: 100 }}
                    />
                  </Grid>
                </Grid>
              </Grid>

              <Divider sx={{ width: "100%", my: 2 }} />

              {/* ABSCHLUSSPRÜFUNG 2 - TEIL 2 (zwei Felder nebeneinander) */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Abschlussprüfung 2 — Teil 2
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Themen: Entwicklung und Umsetzung von Algorithmen/
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Teil 2.1 (Punkte)"
                      value={form.AP2_2_1}
                      onChange={handleChange("AP2_2_1")}
                      fullWidth
                      required
                      error={!!errors.AP2_2_1}
                      helperText={errors.AP2_2_1 ?? "0–100"}
                      inputProps={{ inputMode: "numeric", pattern: "[0-9]*", min: 0, max: 100 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Teil 2.2 (Zusatzprüfung, optional)"
                      value={form.AP2_2_2}
                      onChange={handleChange("AP2_2_2")}
                      fullWidth
                      required={false}
                      disabled={ap2_2_2_disabled}
                      error={!!errors.AP2_2_2}
                      helperText={
                        ap2_2_2_disabled
                          ? "Deaktiviert, weil eine andere Zusatzprüfung ausgefüllt wurde"
                          : errors.AP2_2_2 ?? "falls vorhanden"
                      }
                      inputProps={{ inputMode: "numeric", pattern: "[0-9]*", min: 0, max: 100 }}
                    />
                  </Grid>
                </Grid>
              </Grid>

              <Divider sx={{ width: "100%", my: 2 }} />

              {/* ABSCHLUSSPRÜFUNG 2 - TEIL 3 (zwei Felder nebeneinander) */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Abschlussprüfung 2 — Teil 3
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Themen: Wirtschafts- und Sozialkunde
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Teil 3.1 (Punkte)"
                      value={form.AP2_3_1}
                      onChange={handleChange("AP2_3_1")}
                      fullWidth
                      required
                      error={!!errors.AP2_3_1}
                      helperText={errors.AP2_3_1 ?? "0–100"}
                      inputProps={{ inputMode: "numeric", pattern: "[0-9]*", min: 0, max: 100 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Teil 3.2 (Zusatzprüfung, optional)"
                      value={form.AP2_3_2}
                      onChange={handleChange("AP2_3_2")}
                      fullWidth
                      required={false}
                      disabled={ap2_3_2_disabled}
                      error={!!errors.AP2_3_2}
                      helperText={
                        ap2_3_2_disabled
                          ? "Deaktiviert, weil eine andere Zusatzprüfung ausgefüllt wurde"
                          : errors.AP2_3_2 ?? "falls vorhanden"
                      }
                      inputProps={{ inputMode: "numeric", pattern: "[0-9]*", min: 0, max: 100 }}
                    />
                  </Grid>
                </Grid>
              </Grid>

              <Divider sx={{ width: "100%", my: 2 }} />

              {/* MÜNDLICHE LEISTUNGEN */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Mündliche Leistungen
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Themen: Betriebliche Projektarbeit
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Mündliche Leistung 1"
                      value={form.ML1}
                      onChange={handleChange("ML1")}
                      fullWidth
                      required
                      error={!!errors.ML1}
                      helperText={errors.ML1 ?? "0–100"}
                      inputProps={{ inputMode: "numeric", pattern: "[0-9]*", min: 0, max: 100 }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Mündliche Leistung 2"
                      value={form.ML2}
                      onChange={handleChange("ML2")}
                      fullWidth
                      required
                      error={!!errors.ML2}
                      helperText={errors.ML2 ?? "0–100"}
                      inputProps={{ inputMode: "numeric", pattern: "[0-9]*", min: 0, max: 100 }}
                    />
                  </Grid>
                </Grid>
              </Grid>

              <Grid item xs={12}>
                <Stack direction="row" spacing={2} alignItems="center">
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
              </Grid>
            </Grid>
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
