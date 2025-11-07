import React, { useEffect, useState } from "react";
import {
  Card,
  Typography,
  IconButton,
  Button,
  Chip,
  Stack,
  Divider,
  CircularProgress,
  Alert,
  Tooltip,
  Grid,
  Box,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import MenuIcon from "@mui/icons-material/Menu";
import CalculateIcon from "@mui/icons-material/Calculate";
// @ts-ignore
import { useTranslation, TFunction } from "react-i18next";
import { Entry, CalculationResult, GradeAndPoints } from "../types";
import { useSpeechSynthesis } from "../hooks/useSpeechSynthesis"; // Pfad bleibt gleich
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import StopIcon from '@mui/icons-material/Stop'; // Importiere das Stop-Icon

const API_BASE_URL = "http://127.0.0.1:8000";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle }) => (
  <>
    <Typography variant="h6" fontWeight="bold" gutterBottom>
      {title}
    </Typography>
    {subtitle && (
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        {subtitle}
      </Typography>
    )}
  </>
);

interface EntryDetailHeaderProps {
  entry: Entry;
  calculation: CalculationResult | null;
  isCalculating: boolean;
  isSpeaking: boolean; // Neue Prop für den Wiedergabestatus
  onMenu?: () => void;
  onCalculate: () => void;
  onDelete: () => void;
  onReadAloud: () => void; // Umbenannt zu onReadAloud zur Klarheit
  t: TFunction;
}

const EntryDetailHeader: React.FC<EntryDetailHeaderProps> = ({
  entry,
  calculation,
  isCalculating,
  isSpeaking,
  onMenu,
  onCalculate,
  onDelete,
  onReadAloud,
  t,
}) => (
  <Stack
    direction="row"
    justifyContent="space-between"
    alignItems="center"
    flexWrap="wrap"
    spacing={2}
  >
    <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
      {onMenu && (
        <IconButton
          aria-label={t("results.open_menu_aria")}
          onClick={onMenu}
          sx={{ display: { md: "none" } }}
        >
          <MenuIcon />
        </IconButton>
      )}
      <Typography variant="h4" fontWeight="bold" noWrap>
        {entry.name}
      </Typography>
    </Stack>
    <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
      <Button
        variant="contained"
        startIcon={
          isCalculating ? (
            <CircularProgress size={18} color="inherit" />
          ) : (
            <CalculateIcon />
          )
        }
        onClick={onCalculate}
        disabled={
          isCalculating ||
          !entry.ap1 ||
          !entry.ap2?.planning?.main ||
          !entry.ap2?.development?.main ||
          !entry.ap2?.economy?.main ||
          !entry.ap2?.pw?.presentation ||
          !entry.ap2?.pw?.project
        }
      >
        {t("results.calculate_button")}
      </Button>
      {calculation && (
        <Tooltip title={isSpeaking ? t("results.stop_read_aloud_aria", "Vorlesen stoppen") : t("results.read_aloud_aria", "Ergebnis vorlesen")}>
          <IconButton
            aria-label={isSpeaking ? t("results.stop_read_aloud_aria", "Vorlesen stoppen") : t("results.read_aloud_aria", "Ergebnis vorlesen")}
            onClick={onReadAloud}
          >
            {isSpeaking ? <StopIcon /> : <VolumeUpIcon />}
          </IconButton>
        </Tooltip>
      )}
      <IconButton
        color="error"
        onClick={onDelete}
        aria-label={t("results.delete_aria")}
      >
        <DeleteIcon />
      </IconButton>
    </Stack>
  </Stack>
);

interface ExamPartCardProps {
  label: string;
  mainValue?: number | string | null;
  extraValue?: number | string | null;
  calculation?: GradeAndPoints;
  t: TFunction;
}

const ExamPartCard: React.FC<ExamPartCardProps> = ({
  label,
  mainValue,
  extraValue,
  calculation,
  t,
}) => (
  <Grid item xs={12} sm={6} md={4}>
    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
      {label}
    </Typography>
    <Stack direction="column" spacing={1} alignItems="center" flexWrap="wrap">
      <Typography variant="body1" fontWeight="medium">
        {mainValue ?? "-"}
        {extraValue && ` / ${extraValue ?? "-"} (MEPR)`}
      </Typography>
      {calculation && calculation.grade !== null && (
        <Stack direction="row" spacing={1} alignItems="center">
          <Tooltip title={t("results.grade") ?? "Berechneter Wert"}>
            <Chip size="small" label={calculation?.grade?.toString()} />
          </Tooltip>
          {extraValue && calculation.points !== null && (
            <Typography variant="caption" color="text.secondary">
              {calculation.points} {t("results.points") ?? "P"}
            </Typography>
          )}
        </Stack>
      )}
    </Stack>
  </Grid>
);

interface EntryDetailProps {
  entry: Entry | null;
  onDelete: (id: string) => void;
  onMenu?: () => void;
}

const EntryDetail: React.FC<EntryDetailProps> = ({ entry, onDelete, onMenu }) => {
  const { t, i18n } = useTranslation();
  const { speak, cancel, isSpeaking } = useSpeechSynthesis(); // Hook mit neuen Funktionen
  const [calculation, setCalculation] = useState<CalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calcError, setCalcError] = useState<string | null>(null);

  useEffect(() => {
    setCalculation(null);
    setCalcError(null);
    setIsCalculating(false);
    cancel(); // Stoppt die Sprachausgabe beim Wechsel des Eintrags
  }, [entry?.id, cancel]);

  const generateSpokenText = (result: CalculationResult) => {
    const parts = [
      t("results.speak.ap1", { grade: result.AP1.grade, points: result.AP1.points }),
      t("results.speak.ap2_planning", { grade: result.AP2.planning.grade, points: result.AP2.planning.points }),
      t("results.speak.ap2_development", { grade: result.AP2.development.grade, points: result.AP2.development.points }),
      t("results.speak.ap2_economy", { grade: result.AP2.economy.grade, points: result.AP2.economy.points }),
      t("results.speak.pw_project", { grade: result.AP2.pw.project.grade, points: result.AP2.pw.project.points }),
      t("results.speak.pw_presentation", { grade: result.AP2.pw.presentation.grade, points: result.AP2.pw.presentation.points }),
      t("results.speak.pw_overall", { grade: result.AP2.pw.overall.grade, points: result.AP2.pw.overall.points }),
      t("results.speak.overall", { grade: result.Overall.grade, points: result.Overall.points }),
    ];
    return parts.join(". ");
  };

  const handleCalculate = async (entryId: string) => {
    setIsCalculating(true);
    setCalcError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/exam/calculate/${entryId}`);
      if (!res.ok) {
        throw new Error(`${t("results.calculation_failed", "Berechnung fehlgeschlagen")}: ${res.statusText}`);
      }
      const json = await res.json();
      setCalculation(json.data as CalculationResult);
    } catch (err: any) {
      setCalcError(err?.message ?? t("results.unknown_error", "Unbekannter Fehler"));
    } finally {
      setIsCalculating(false);
    }
  };

  if (!entry) {
    return (
      <Typography
        variant="h6"
        color="text.secondary"
        align="center"
        sx={{ mt: 4 }}
      >
        {t("results.select_entry_prompt")}
      </Typography>
    );
  }

  return (
    <Stack spacing={3} sx={{ p: { xs: 2, md: 4 } }}>
      <EntryDetailHeader
        entry={entry}
        calculation={calculation}
        isCalculating={isCalculating}
        isSpeaking={isSpeaking} // isSpeaking Prop übergeben
        onMenu={onMenu}
        onCalculate={() => handleCalculate(entry.id)}
        onDelete={() => onDelete(entry.id)}
        onReadAloud={() => {
          // Logik zum Starten/Stoppen der Wiedergabe
          if (isSpeaking) {
            cancel();
          } else if (calculation) {
            speak(generateSpokenText(calculation), i18n.language);
          }
        }}
        t={t}
      />

      <Divider />

      {calculation && (
        <Alert
          severity={calculation.Passed ? "success" : "error"}
          sx={{ alignItems: "center", p: 2, ".MuiAlert-message": { width: '100%' } }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems="center"
            spacing={{ xs: 1, sm: 2 }}
            sx={{ width: "100%" }}
          >
            <Typography variant="h5" fontWeight="bold">
              {calculation.Passed ? t("results.passed") : t("results.failed")}
            </Typography>
            <Stack direction="row" spacing={1.5} alignItems="baseline">
              <Typography variant="h6" fontWeight="medium">
                {t("results.overall")}:
              </Typography>
              <Typography
                variant="h4"
                fontWeight="bold"
                color={calculation.Passed ? "success.dark" : "error.dark"}
              >
                {calculation.Overall.grade}
              </Typography>
              <Typography variant="h6" color="text.secondary">
                ({calculation.Overall.points} {t("results.points")})
              </Typography>
            </Stack>
          </Stack>
        </Alert>
      )}

      <Grid container spacing={4}>
        {/* AP1 */}
        <Grid item xs={12} sm={6} md={4}>
          <Card variant="outlined" sx={{ p: 2, height: "100%" }}>
            <SectionHeader
              title={t("results.exam_1") ?? "Abschlussprüfung — Teil 1"}
            />
            <ExamPartCard
              label={t("")}
              mainValue={entry.ap1}
              calculation={calculation?.AP1}
              t={t}
            />
          </Card>
        </Grid>
        {/* AP2 & PW */}
        <Grid item xs={12} sm={6} md={8}>
          <Card variant="outlined" sx={{ p: 2, height: "100%" }}>
            <SectionHeader
              title={t("results.exam_2") ?? "Abschlussprüfung — Teil 2"}
              subtitle={t("results.exam2_subtitle") ?? ""}
            />
            <Grid container spacing={2}>
              <ExamPartCard
                label={t("results.plan_software_product")}
                mainValue={entry.ap2.planning.main}
                extraValue={entry.ap2.planning.extra}
                calculation={calculation?.AP2?.planning}
                t={t}
              />
              <ExamPartCard
                label={t("results.development_and_implementation")}
                mainValue={entry.ap2.development.main}
                extraValue={entry.ap2.development.extra}
                calculation={calculation?.AP2?.development}
                t={t}
              />
              <ExamPartCard
                label={
                  t("results.economics_and_social_studies") ??
                  "Wirtschafts- und Sozialkunde"
                }
                mainValue={entry.ap2.economy.main}
                extraValue={entry.ap2.economy.extra}
                calculation={calculation?.AP2?.economy}
                t={t}
              />
            </Grid>
            <Divider sx={{ my: 2 }} />
            <Box
              sx={{
                mt: 2,
                p: 2,
                borderRadius: 2, // Abgerundete Ecken
                bgcolor: "action.hover", // Theming-fähige Hintergrundfarbe
              }}
            >
              <SectionHeader
                title={t("results.project_work") ?? "Betriebliche Projektarbeit"}
              />
              <Grid container spacing={2}>
                <ExamPartCard
                  label={t("results.documentation") ?? "Dokumentation"}
                  mainValue={entry?.ap2?.pw?.project}
                  calculation={calculation?.AP2?.pw?.project}
                  t={t}
                />
                <ExamPartCard
                  label={
                    t("results.presentation") ?? "Präsentation & Fachgespräch"
                  }
                  mainValue={entry?.ap2?.pw?.presentation}
                  calculation={calculation?.AP2?.pw?.presentation}
                  t={t}
                />
              </Grid>
              {calculation?.AP2?.pw?.overall && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography variant="subtitle1" fontWeight="bold">
                      {t("results.project_work_overall") ??
                        "Gesamtergebnis Projektarbeit"}
                    </Typography>
                    <Stack
                      direction="row"
                      spacing={1.5}
                      alignItems="center"
                    >
                      <Tooltip title={t("results.grade") ?? "Note"}>
                        <Chip
                          label={calculation.AP2.pw.overall.grade}
                          color="primary"
                        />
                      </Tooltip>
                      <Typography variant="body1" color="text.secondary">
                        ({calculation.AP2.pw.overall.points}{" "}
                        {t("results.points") ?? "P"})
                      </Typography>
                    </Stack>
                  </Stack>
                </>
              )}
            </Box>
          </Card>
        </Grid>
      </Grid>
      {/* Status / Fehler */}
      {calcError && <Alert severity="error">{calcError}</Alert>}
    </Stack>
  );
};

export default EntryDetail;