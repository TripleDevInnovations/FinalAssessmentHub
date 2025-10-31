import React, { useState } from "react";
import {
  Paper,
  Box,
  Typography,
  Grid,
  TextField,
  Divider,
  Stack,
  Button,
  CircularProgress,
  Snackbar,
  Alert
} from "@mui/material";

const onlyDigits = (s: string) => s.replace(/\D+/g, "");

export default function AddResult() {
  const [form, setForm] = useState({
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
  });

  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; severity: "success" | "error"; message: string }>({
    open: false,
    severity: "success",
    message: ""
  });

  const validate = () => {
    const newErrors: any = {};
    if (!form.Name.trim()) newErrors.Name = "Name ist erforderlich.";

    const required = ["AP1", "AP2_1_1", "AP2_2_1", "AP2_3_1", "ML1", "ML2"];
    required.forEach((k) => {
      const v = (form as any)[k].trim();
      if (v === "") newErrors[k] = "Erforderlich";
      else if (!/^\d+$/.test(v)) newErrors[k] = "Nur ganze Zahlen (0–100)";
      else if (Number(v) < 0 || Number(v) > 100) newErrors[k] = "Wert muss zwischen 0 und 100 liegen";
    });

    const optional = ["AP2_1_2", "AP2_2_2", "AP2_3_2"];
    optional.forEach((k) => {
      const v = (form as any)[k].trim();
      if (v === "") return;
      if (!/^\d+$/.test(v)) newErrors[k] = "Nur ganze Zahlen (0–100)";
      else if (Number(v) < 0 || Number(v) > 100) newErrors[k] = "Wert muss zwischen 0 und 100 liegen";
    });

    const zusatzFilled = optional.map((k) => (form as any)[k].trim() !== "").filter(Boolean).length;
    if (zusatzFilled > 1) optional.forEach((k) => (newErrors[k] = "Es darf höchstens eine Zusatzprüfung ausgefüllt sein"));

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value;
    if (key !== "Name") {
      v = onlyDigits(v);
      if (v.length > 3) v = v.slice(0, 3);
    }

    setForm((p) => {
      const next = { ...p, [key]: v };

      // exclusivity for extras: if one extra is set, clear the others
      const extras = ["AP2_1_2", "AP2_2_2", "AP2_3_2"];
      if (extras.includes(key) && v.trim() !== "") {
        for (const other of extras) {
          if (other !== key) (next as any)[other] = "";
        }
      }

      return next;
    });

    setErrors((p) => ({ ...p, [key]: undefined }));
  };

  const buildPayload = () => ({
    Name: form.Name.trim(),
    AP1: Number(form.AP1),
    ap2: {
      planning: { main: Number(form.AP2_1_1), extra: form.AP2_1_2.trim() === "" ? null : Number(form.AP2_1_2) },
      development: { main: Number(form.AP2_2_1), extra: form.AP2_2_2.trim() === "" ? null : Number(form.AP2_2_2) },
      economy: { main: Number(form.AP2_3_1), extra: form.AP2_3_2.trim() === "" ? null : Number(form.AP2_3_2) }
    },
    ml: { ML1: Number(form.ML1), ML2: Number(form.ML2) }
  });

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validate()) {
      setSnackbar({ open: true, severity: "error", message: "Bitte Fehler vor dem Absenden beheben." });
      return;
    }

    const payload = buildPayload();

    setLoading(true);
    try {
      const resp = await fetch("http://127.0.0.1:8000/exam/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (resp.ok) {
        // versuche JSON zu parsen; falls kein JSON zurückgegeben wird, nutze payload als Fallback
        let data: any = null;
        try {
          // manche Endpunkte liefern evtl. keinen Body => .json() würde werfen
          data = await resp.json();
        } catch {
          data = null;
        }

        setSnackbar({ open: true, severity: "success", message: "Erfolgreich gespeichert." });

        // Wenn der Server eine Antwort zurückgibt, liefern wir diese an onSave weiter.
        // Falls nicht, liefern wir als Fallback das gesendete payload (ohne lokale Speicherung).

        // reset form
        setForm({
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
        });
        setErrors({});
      } else {
        // nicht ok (Status 4xx/5xx) => keine onSave, lediglich Fehler anzeigen
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

  const extrasDisabled = {
    AP2_1_2: form.AP2_2_2.trim() !== "" || form.AP2_3_2.trim() !== "",
    AP2_2_2: form.AP2_1_2.trim() !== "" || form.AP2_3_2.trim() !== "",
    AP2_3_2: form.AP2_1_2.trim() !== "" || form.AP2_2_2.trim() !== ""
  };

  return (
    <Paper elevation={3} sx={{ p: { xs: 2, md: 4 }, borderRadius: 2 }}>
      <Box mb={2}>
        <Typography variant="h5" component="h1" gutterBottom>
          Prüfungsergebnisse eintragen
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Trage Nickname und Punktzahlen (0–100) ein und klicke auf Absenden.
        </Typography>
      </Box>

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              label="Nickname"
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

          {/* AP1 */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Abschlussprüfung 1
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Teil 1 (Punkte)"
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

          {/* AP2 - Teil 1 */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Abschlussprüfung 2 - Planen eines Softwareproduktes
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Teil 2.1 (Punkte)"
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
                  label="Teil 2.1 (MEPR)"
                  value={form.AP2_1_2}
                  onChange={handleChange("AP2_1_2")}
                  fullWidth
                  disabled={extrasDisabled.AP2_1_2}
                  error={!!errors.AP2_1_2}
                  helperText={extrasDisabled.AP2_1_2 ? "Deaktiviert, weil eine andere Zusatzprüfung ausgefüllt wurde" : errors.AP2_1_2 ?? "optional"}
                  inputProps={{ inputMode: "numeric", pattern: "[0-9]*", min: 0, max: 100 }}
                />
              </Grid>
            </Grid>
          </Grid>

          <Divider sx={{ width: "100%", my: 2 }} />

          {/* AP2 - Teil 2 */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Abschlussprüfung 2 - Entwicklung und Umsetzung von Algorithmen
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Teil 2.2 (Punkte)"
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
                  label="Teil 2.2 (MEPR)"
                  value={form.AP2_2_2}
                  onChange={handleChange("AP2_2_2")}
                  fullWidth
                  disabled={extrasDisabled.AP2_2_2}
                  error={!!errors.AP2_2_2}
                  helperText={extrasDisabled.AP2_2_2 ? "Deaktiviert, weil eine andere Zusatzprüfung ausgefüllt wurde" : errors.AP2_2_2 ?? "optional"}
                  inputProps={{ inputMode: "numeric", pattern: "[0-9]*", min: 0, max: 100 }}
                />
              </Grid>
            </Grid>
          </Grid>

          <Divider sx={{ width: "100%", my: 2 }} />

          {/* AP2 - Teil 3 */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Abschlussprüfung 2 - Wirtschafts- und Sozialkunde
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Teil 2.3 (Punkte)"
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
                  label="Teil 2.3 (MEPR)"
                  value={form.AP2_3_2}
                  onChange={handleChange("AP2_3_2")}
                  fullWidth
                  disabled={extrasDisabled.AP2_3_2}
                  error={!!errors.AP2_3_2}
                  helperText={extrasDisabled.AP2_3_2 ? "Deaktiviert, weil eine andere Zusatzprüfung ausgefüllt wurde" : errors.AP2_3_2 ?? "optional"}
                  inputProps={{ inputMode: "numeric", pattern: "[0-9]*", min: 0, max: 100 }}
                />
              </Grid>
            </Grid>
          </Grid>

          <Divider sx={{ width: "100%", my: 2 }} />

          {/* Betriebliche Projektarbeit */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Betriebliche Projektarbeit
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Präsentation"
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
                  label="Planung und Umsetzung"
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
                <Button variant="contained" color="primary" type="submit" disabled={loading} onClick={handleSubmit}>
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

              <Button
                variant="outlined"
                color="secondary"
                onClick={() =>
                  setForm({
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
                  })
                }
                disabled={loading}
              >
                Zurücksetzen
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={() => setSnackbar((s) => ({ ...s, open: false }))} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
}
