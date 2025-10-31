import React, { useState, useCallback, useMemo } from "react";
import {
  Paper, Box, Typography, Grid, TextField, Divider, Stack, Button, CircularProgress, Snackbar, Alert
} from "@mui/material";

import { ExamPayload } from "../../types";

// === Hilfsfunktionen und Konstanten ===

const onlyDigits = (s: string) => s.replace(`/\D+/g`, "");

// Definieren des Formularzustands an einer zentralen Stelle für einfaches Zurücksetzen
const initialFormState = {
  Name: "",
  AP1: "",
  AP2: {
    planning: { main: "", extra: "" },
    development: { main: "", extra: "" },
    economy: { main: "", extra: "" },
  },
  PW: {
    presentation: "",
    project: "",
  },
};

type FormState = typeof initialFormState;
type FormErrors = { [key: string]: any }; // Für Einfachheit, kann detaillierter typisiert werden

// Props für numerische Felder, um Wiederholungen im JSX zu vermeiden
const numericInputProps = {
  inputMode: "numeric" as const,
  pattern: "`[0-9]*`",
  min: 0,
  max: 100,
};

// === Wiederverwendbare Sub-Komponente für Prüfungsabschnitte ===

interface ExamPartRowProps {
  title: string;
  mainField: { key: string; label: string; value: string };
  extraField?: { key: string; label: string; value: string };
  errors: FormErrors;
  handleChange: (key: string, value: string) => void;
  isExtraDisabled: boolean;
}

const ExamPartRow: React.FC<ExamPartRowProps> = ({ title, mainField, extraField, errors, handleChange, isExtraDisabled }) => (
  <Grid item xs={12}>
    <Typography variant="h6" gutterBottom>{title}</Typography>
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
        <TextField
          label={mainField.label}
          value={mainField.value}
          onChange={(e) => handleChange(mainField.key, e.target.value)}
          fullWidth
          required
          error={!!errors[mainField.key]}
          helperText={errors[mainField.key] ?? "0–100"}
          inputProps={numericInputProps}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        {extraField && (
          <TextField
            label={extraField.label}
            value={extraField.value}
            onChange={(e) => handleChange(extraField.key, e.target.value)}
            fullWidth
            disabled={isExtraDisabled}
            error={!!errors[extraField.key]}
            helperText={isExtraDisabled ? "Deaktiviert, da eine andere Zusatzprüfung aktiv ist" : (errors[extraField.key] ?? "Optional")}
            inputProps={numericInputProps}
          />
        )}
      </Grid>
    </Grid>
  </Grid>
);


// === Hauptkomponente ===

export default function AddResult() {
  const [form, setForm] = useState<FormState>(initialFormState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, severity: "success" as const, message: "" });

  // UseMemo, um zu verhindern, dass die Logik bei jedem Render neu berechnet wird
  const extrasDisabled = useMemo(() => {
    const filledExtras = [form.AP2.planning.extra, form.AP2.development.extra, form.AP2.economy.extra].filter(Boolean);
    return {
      planning: filledExtras.length > 0 && !form.AP2.planning.extra,
      development: filledExtras.length > 0 && !form.AP2.development.extra,
      economy: filledExtras.length > 0 && !form.AP2.economy.extra,
    };
  }, [form.AP2]);

  const handleChange = useCallback((key: string, value: string) => {
    const isNumeric = !key.includes("Name");
    let processedValue = isNumeric ? onlyDigits(value).slice(0, 3) : value;

    setForm((prev) => {
      const keys = key.split('.');
      const next = JSON.parse(JSON.stringify(prev)); // Tiefe Kopie für einfache state-updates
      let current = next;

      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = processedValue;

      // Exklusivität für Zusatzprüfungen
      if (key.includes('extra') && processedValue.trim() !== "") {
        if (key !== 'AP2.planning.extra') next.AP2.planning.extra = "";
        if (key !== 'AP2.development.extra') next.AP2.development.extra = "";
        if (key !== 'AP2.economy.extra') next.AP2.economy.extra = "";
      }

      return next;
    });
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }, []);

  const validate = () => {
    const newErrors: FormErrors = {};
    if (!form.Name.trim()) newErrors.Name = "Name ist erforderlich.";

    const fieldValidations = {
      'AP1': form.AP1,
      'AP2.planning.main': form.AP2.planning.main,
      'AP2.development.main': form.AP2.development.main,
      'AP2.economy.main': form.AP2.economy.main,
      'PW.presentation': form.PW.presentation,
      'PW.project': form.PW.project,
    };

    // Validierung der Pflichtfelder
    Object.entries(fieldValidations).forEach(([key, value]) => {
      const v = value.trim();
      if (v === "") newErrors[key] = "Erforderlich";
      else if (!/^\d+$/.test(v) || Number(v) < 0 || Number(v) > 100) {
        newErrors[key] = "Wert muss zwischen 0 und 100 liegen";
      }
    });

    // Validierung der optionalen Felder
    const optionalFields = {
      'AP2.planning.extra': form.AP2.planning.extra,
      'AP2.development.extra': form.AP2.development.extra,
      'AP2.economy.extra': form.AP2.economy.extra,
    }
    Object.entries(optionalFields).forEach(([key, value]) => {
      const v = value.trim();
      if (v === "") return;
      if (!/^\d+$/.test(v) || Number(v) < 0 || Number(v) > 100) {
        newErrors[key] = "Wert muss zwischen 0 und 100 liegen";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildPayload = (): ExamPayload => ({
    Name: form.Name.trim(),
    AP1: Number(form.AP1),
    AP2: {
      planning: { main: Number(form.AP2.planning.main), extra: form.AP2.planning.extra.trim() === "" ? null : Number(form.AP2.planning.extra) },
      development: { main: Number(form.AP2.development.main), extra: form.AP2.development.extra.trim() === "" ? null : Number(form.AP2.development.extra) },
      economy: { main: Number(form.AP2.economy.main), extra: form.AP2.economy.extra.trim() === "" ? null : Number(form.AP2.economy.extra) }
    },
    PW: { presentation: Number(form.PW.presentation), project: Number(form.PW.project) }
  });


  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validate()) {
      setSnackbar({ open: true, severity: "error", message: "Bitte Fehler vor dem Absenden beheben." });
      return;
    }

    setLoading(true);
    try {
      const resp = await fetch("http://127.0.0.1:8000/exam/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });
      if (resp.ok) {
        setSnackbar({ open: true, severity: "success", message: "Erfolgreich gespeichert." });
        setForm(initialFormState);
        setErrors({});
      } else {
        const text = await resp.text() || `${resp.status} ${resp.statusText}`;
        setSnackbar({ open: true, severity: "error", message: `Serverfehler: ${text}` });
      }
    } catch (err: any) {
      setSnackbar({ open: true, severity: "error", message: `Netzwerkfehler: ${err?.message ?? err}` });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm(initialFormState);
    setErrors({});
  }

  const handleSnackbarClose = () => setSnackbar((s) => ({ ...s, open: false }));

  return (
    <Paper elevation={3} sx={{ p: { xs: 2, md: 4 }, borderRadius: 2 }}>
      <Box mb={2}>
        <Typography variant="h5" component="h1" gutterBottom>Prüfungsergebnisse eintragen</Typography>
        <Typography variant="body2" color="text.secondary">Trage Nickname und Punktzahlen (0–100) ein und klicke auf Absenden.</Typography>
      </Box>

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              label="Nickname"
              value={form.Name}
              onChange={(e) => handleChange('Name', e.target.value)}
              fullWidth
              required
              error={!!errors.Name}
              helperText={errors.Name}
              autoComplete="name"
            />
          </Grid>

          <Divider sx={{ width: "100%", my: 2 }} />

          <ExamPartRow
            title="Abschlussprüfung 1"
            mainField={{ key: "AP1", label: "Teil 1 (Punkte)", value: form.AP1 }}
            errors={errors}
            handleChange={handleChange}
            isExtraDisabled={false}
          />

          <Divider sx={{ width: "100%", my: 2 }} />

          <ExamPartRow
            title="Abschlussprüfung 2 - Planen eines Softwareproduktes"
            mainField={{ key: "AP2.planning.main", label: "Teil 2.1 (Punkte)", value: form.AP2.planning.main }}
            extraField={{ key: "AP2.planning.extra", label: "Teil 2.1 (MEPR)", value: form.AP2.planning.extra }}
            errors={errors}
            handleChange={handleChange}
            isExtraDisabled={extrasDisabled.planning}
          />

          <Divider sx={{ width: "100%", my: 2 }} />

          <ExamPartRow
            title="Abschlussprüfung 2 - Entwicklung und Umsetzung von Algorithmen"
            mainField={{ key: "AP2.development.main", label: "Teil 2.2 (Punkte)", value: form.AP2.development.main }}
            extraField={{ key: "AP2.development.extra", label: "Teil 2.2 (MEPR)", value: form.AP2.development.extra }}
            errors={errors}
            handleChange={handleChange}
            isExtraDisabled={extrasDisabled.development}
          />

          <Divider sx={{ width: "100%", my: 2 }} />

          <ExamPartRow
            title="Abschlussprüfung 2 - Wirtschafts- und Sozialkunde"
            mainField={{ key: "AP2.economy.main", label: "Teil 2.3 (Punkte)", value: form.AP2.economy.main }}
            extraField={{ key: "AP2.economy.extra", label: "Teil 2.3 (MEPR)", value: form.AP2.economy.extra }}
            errors={errors}
            handleChange={handleChange}
            isExtraDisabled={extrasDisabled.economy}
          />

          <Divider sx={{ width: "100%", my: 2 }} />

          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>Betriebliche Projektarbeit</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Präsentation"
                  value={form.PW.presentation}
                  onChange={(e) => handleChange('PW.presentation', e.target.value)}
                  fullWidth
                  required
                  error={!!errors['PW.presentation']}
                  helperText={errors['PW.presentation'] ?? "0–100"}
                  inputProps={numericInputProps}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Planung und Umsetzung"
                  value={form.PW.project}
                  onChange={(e) => handleChange('PW.project', e.target.value)}
                  fullWidth
                  required
                  error={!!errors['PW.project']}
                  helperText={errors['PW.project'] ?? "0–100"}
                  inputProps={numericInputProps}
                />
              </Grid>
            </Grid>
          </Grid>

          <Divider sx={{ width: "100%", my: 2 }} />

          <Grid item xs={12}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ position: "relative" }}>
                <Button variant="contained" color="primary" type="submit" disabled={loading}>
                  Absenden
                </Button>
                {loading && (
                  <CircularProgress size={24} sx={{ color: "primary.main", position: "absolute", top: "50%", left: "50%", marginTop: "-12px", marginLeft: "-12px" }} />
                )}
              </Box>
              <Button variant="outlined" color="secondary" onClick={resetForm} disabled={loading}>
                Zurücksetzen
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
}
