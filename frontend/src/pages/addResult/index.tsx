import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useTranslation } from 'react-i18next';
import { Paper, Box, Typography, TextField, Divider, Stack, Button, CircularProgress, Snackbar, Alert, AlertProps } from "@mui/material";
// @ts-ignore
import Grid from '@mui/material/GridLegacy';
import { ExamPayload, Entry } from "../../types";

// === Hilfsfunktionen und Konstanten ===
const onlyDigits = (s: string) => s.replace(`/\D+/g`, "");

// Definieren des Formularzustands an einer zentralen Stelle für einfaches Zurücksetzen
const initialFormState = {
  name: "",
  ap1: "",
  ap2: {
    planning: { main: "", extra: "" },
    development: { main: "", extra: "" },
    economy: { main: "", extra: "" },
    pw: {
      presentation: "",
      project: "",
    },
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

interface ExamPartRowProps {
  title: string;
  mainField: { key: string; label: string; value: string };
  extraField?: { key: string; label: string; value: string };
  errors: FormErrors;
  handleChange: (key: string, value: string) => void;
  isExtraDisabled: boolean;
}

const ExamPartRow: React.FC<ExamPartRowProps> = ({ title, mainField, extraField, errors, handleChange, isExtraDisabled }) => {
  const { t } = useTranslation();
  return (
    <Grid item xs={12}>
      <Typography variant="h6" gutterBottom>{title}</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            label={mainField.label}
            value={mainField.value}
            onChange={(e) => handleChange(mainField.key, e.target.value)}
            fullWidth
            error={!!errors[mainField.key]}
            helperText={errors[mainField.key] ?? t('add.helper.optional')}
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
              helperText={isExtraDisabled ? t('add.helper.extraDisabled') : (errors[extraField.key] ?? t('add.helper.optional'))}
              inputProps={numericInputProps}
            />
          )}
        </Grid>
      </Grid>
    </Grid>
  );
};

interface AddResultProps {
  entryToEdit?: Entry | null;
  onSaveSuccess?: () => void;
  onCancel?: () => void;
}

// Konvertierungsfunktion, um ein Entry-Objekt in den Formularzustand zu überführen
const convertEntryToFormState = (entry: Entry): FormState => {
  const toString = (val: number | null | undefined) => (val != null ? String(val) : "");
  return {
    name: entry.name || "",
    ap1: toString(entry.ap1),
    ap2: {
      planning: {
        main: toString(entry.ap2?.planning?.main),
        extra: toString(entry.ap2?.planning?.extra),
      },
      development: {
        main: toString(entry.ap2?.development?.main),
        extra: toString(entry.ap2?.development?.extra),
      },
      economy: {
        main: toString(entry.ap2?.economy?.main),
        extra: toString(entry.ap2?.economy?.extra),
      },
      pw: {
        presentation: toString(entry.ap2?.pw?.presentation),
        project: toString(entry.ap2?.pw?.project),
      },
    },
  };
};

interface SnackbarState {
  open: boolean;
  message: string;
  severity: AlertProps['severity'];
}

export default function AddResult({ entryToEdit, onSaveSuccess }: AddResultProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<FormState>(initialFormState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    severity: "success",
    message: ""
  });
  const isEditMode = !!entryToEdit;

  // Formular mit Daten füllen, wenn ein Eintrag zum Bearbeiten übergeben wird
  useEffect(() => {
    if (entryToEdit) {
      setForm(convertEntryToFormState(entryToEdit));
    } else {
      setForm(initialFormState); // Zurücksetzen, wenn kein Eintrag mehr da ist
    }
  }, [entryToEdit]);


  const extrasDisabled = useMemo(() => {
    const filledExtras = [form.ap2.planning.extra, form.ap2.development.extra, form.ap2.economy.extra].filter(Boolean);
    return {
      planning: filledExtras.length > 0 && !form.ap2.planning.extra,
      development: filledExtras.length > 0 && !form.ap2.development.extra,
      economy: filledExtras.length > 0 && !form.ap2.economy.extra,
    };
  }, [form.ap2]);

  const handleChange = useCallback((key: string, value: string) => {
    const isNumeric = !key.includes("name");
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
        if (key !== 'ap2.planning.extra') next.ap2.planning.extra = "";
        if (key !== 'ap2.development.extra') next.ap2.development.extra = "";
        if (key !== 'ap2.economy.extra') next.ap2.economy.extra = "";
      }
      return next;
    });
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }, []);

  const validate = () => {
    const newErrors: FormErrors = {};
    if (!form.name.trim()) newErrors.name = t('add.validation.nameRequired');

    const fieldsToValidate = {
      'ap1': form.ap1,
      'ap2.planning.main': form.ap2.planning.main,
      'ap2.planning.extra': form.ap2.planning.extra,
      'ap2.development.main': form.ap2.development.main,
      'ap2.development.extra': form.ap2.development.extra,
      'ap2.economy.main': form.ap2.economy.main,
      'ap2.economy.extra': form.ap2.economy.extra,
      'ap2.pw.presentation': form.ap2.pw.presentation,
      'ap2.pw.project': form.ap2.pw.project,
    };

    Object.entries(fieldsToValidate).forEach(([key, value]) => {
      const v = String(value).trim();
      if (v === "") return; // Leere Felder sind gültig

      if (!/^\d+$/.test(v) || Number(v) < 0 || Number(v) > 100) {
        newErrors[key] = t('add.validation.valueBetween');
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildPayload = (): ExamPayload => {
    const toNumberOrUndefined = (val: string) => val.trim() === "" ? undefined : Number(val);

    return {
      name: form.name.trim(),
      ap1: toNumberOrUndefined(form.ap1),
      ap2: {
        planning: {
          main: toNumberOrUndefined(form.ap2.planning.main),
          extra: toNumberOrUndefined(form.ap2.planning.extra)
        },
        development: {
          main: toNumberOrUndefined(form.ap2.development.main),
          extra: toNumberOrUndefined(form.ap2.development.extra)
        },
        economy: {
          main: toNumberOrUndefined(form.ap2.economy.main),
          extra: toNumberOrUndefined(form.ap2.economy.extra)
        },
        pw: {
          presentation: toNumberOrUndefined(form.ap2.pw.presentation),
          project: toNumberOrUndefined(form.ap2.pw.project)
        }
      }
    };
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validate()) {
      setSnackbar({ open: true, severity: "error", message: t('add.snackbar.validationError') });
      return;
    }
    setLoading(true);

    const payload = buildPayload();
    // URL und Methode basierend auf isEditMode anpassen (mit korrektem Endpunkt)
    const url = isEditMode
      ? `http://127.0.0.1:8000/exam/${entryToEdit.id}` // <-- KORRIGIERTER ENDPUNKT
      : "http://127.0.0.1:8000/exam/save";
    const method = isEditMode ? "PUT" : "POST";


    try {
      const resp = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (resp.ok) {
        setSnackbar({ open: true, severity: "success", message: t(isEditMode ? 'add.snackbar.updateSuccess' : 'add.snackbar.saveSuccess') });
        if (onSaveSuccess) {
          onSaveSuccess(); // Callback für Parent-Komponente
        } else {
          setForm(initialFormState); // Nur im Hinzufügen-Modus zurücksetzen
          setErrors({});
        }
      } else {
        const text = await resp.text() || `${resp.status} ${resp.statusText}`;
        setSnackbar({ open: true, severity: "error", message: t('add.snackbar.serverError', { error: text }) });
      }
    } catch (err: any) {
      setSnackbar({ open: true, severity: "error", message: t('add.snackbar.networkError', { error: err?.message ?? err }) });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm(isEditMode && entryToEdit ? convertEntryToFormState(entryToEdit) : initialFormState);
    setErrors({});
  }

  const handleSnackbarClose = () => setSnackbar((s) => ({ ...s, open: false }));


  return (
    <Paper elevation={isEditMode ? 0 : 3} sx={{ p: { xs: 2, md: 4 }, borderRadius: 2 }}>
      <Box mb={2}>
        <Typography variant="h5" component="h1" gutterBottom>
          {isEditMode ? t('add.edit.title') : t('add.title')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {isEditMode ? t('edit.subtitle') : t('add.subtitle')}
        </Typography>
      </Box>
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              label={t('add.nicknameLabel')}
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              fullWidth
              required
              error={!!errors.name}
              helperText={errors.name}
              autoComplete="name"
            />
          </Grid>
          <Divider sx={{ width: "100%", my: 2 }} />
          <ExamPartRow
            title={t('add.ap1.title')}
            mainField={{ key: "ap1", label: t('add.ap1.mainLabel'), value: form.ap1 }}
            errors={errors}
            handleChange={handleChange}
            isExtraDisabled={false}
          />
          <Divider sx={{ width: "100%", my: 2 }} />
          <ExamPartRow
            title={t('add.ap2.planning.title')}
            mainField={{ key: "ap2.planning.main", label: t('add.ap2.planning.mainLabel'), value: form.ap2.planning.main }}
            extraField={{ key: "ap2.planning.extra", label: t('add.ap2.planning.extraLabel'), value: form.ap2.planning.extra }}
            errors={errors}
            handleChange={handleChange}
            isExtraDisabled={extrasDisabled.planning}
          />
          <Divider sx={{ width: "100%", my: 2 }} />
          <ExamPartRow
            title={t('add.ap2.development.title')}
            mainField={{ key: "ap2.development.main", label: t('add.ap2.development.mainLabel'), value: form.ap2.development.main }}
            extraField={{ key: "ap2.development.extra", label: t('add.ap2.development.extraLabel'), value: form.ap2.development.extra }}
            errors={errors}
            handleChange={handleChange}
            isExtraDisabled={extrasDisabled.development}
          />
          <Divider sx={{ width: "100%", my: 2 }} />
          <ExamPartRow
            title={t('add.ap2.economy.title')}
            mainField={{ key: "ap2.economy.main", label: t('add.ap2.economy.mainLabel'), value: form.ap2.economy.main }}
            extraField={{ key: "ap2.economy.extra", label: t('add.ap2.economy.extraLabel'), value: form.ap2.economy.extra }}
            errors={errors}
            handleChange={handleChange}
            isExtraDisabled={extrasDisabled.economy}
          />
          <Divider sx={{ width: "100%", my: 2 }} />
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>{t('add.projectWork.title')}</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label={t('add.projectWork.implementationLabel')}
                  value={form.ap2.pw.project}
                  onChange={(e) => handleChange('ap2.pw.project', e.target.value)}
                  fullWidth
                  error={!!errors['ap2.pw.project']}
                  helperText={errors['ap2.pw.project'] ?? t('add.helper.optional')}
                  inputProps={numericInputProps}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label={t('add.projectWork.presentationLabel')}
                  value={form.ap2.pw.presentation}
                  onChange={(e) => handleChange('ap2.pw.presentation', e.target.value)}
                  fullWidth
                  error={!!errors['ap2.pw.presentation']}
                  helperText={errors['ap2.pw.presentation'] ?? t('add.helper.optional')}
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
                  {t('add.submitButton')}
                </Button>
                {loading && (
                  <CircularProgress
                    size={24}
                    sx={{ color: "primary.main", position: "absolute", top: "50%", left: "50%", marginTop: "-12px", marginLeft: "-12px" }}
                  />
                )}
              </Box>
              <Button variant="outlined" color="secondary" onClick={resetForm} disabled={loading}>
                {t('add.resetButton')}
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
