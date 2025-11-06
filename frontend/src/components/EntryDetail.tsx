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
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import MenuIcon from "@mui/icons-material/Menu";
import CalculateIcon from "@mui/icons-material/Calculate";
// @ts-ignore
import { useTranslation, TFunction } from "react-i18next";
import { Entry, CalculationResult } from "../types";
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis'; // Passe den Pfad an
import VolumeUpIcon from '@mui/icons-material/VolumeUp';

const API_BASE_URL = "http://127.0.0.1:8000";

// --- Sub-Komponenten für bessere Lesbarkeit und Wiederverwendbarkeit ---

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
  onMenu?: () => void;
  onCalculate: () => void;
  onDelete: () => void;
  onReadAloud: () => void;
  t: TFunction;
}

const EntryDetailHeader: React.FC<EntryDetailHeaderProps> = ({
  entry,
  calculation,
  isCalculating,
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
      {calculation && (
        <Chip
          label={`${t("results.overall")}: ${calculation.overall.grade} (${calculation.overall.points
            } ${t("results.points")})`}
          color="primary"
          sx={{
            height: "auto",
            fontSize: "1.1rem",
            fontWeight: "bold",
          }}
        />
      )}
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
        disabled={isCalculating}
      >
        {t("results.calculate_button")}
      </Button>
      {calculation && (
        <Tooltip title={t('results.read_aloud_aria', 'Ergebnis vorlesen') ?? ''}>
          <IconButton
            aria-label={t('results.read_aloud_aria', 'Ergebnis vorlesen')}
            onClick={onReadAloud}
          >
            <VolumeUpIcon />
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
  mainValue: number | string;
  extraValue?: number | string | null;
  calculation?: { grade: number; points?: number };
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
        {mainValue}
        {extraValue && ` / ${extraValue} (MEPR)`}
      </Typography>
      {calculation && (
        <Stack direction="row" spacing={1} alignItems="center">
          <Tooltip title={t("results.grade") ?? "Berechneter Wert"}>
            <Chip size="small" label={calculation.grade.toString()} />
          </Tooltip>
          {extraValue && calculation.points !== undefined && (
            <Typography variant="caption" color="text.secondary">
              {calculation.points} {t("results.points") ?? "P"}
            </Typography>
          )}
        </Stack>
      )}
    </Stack>
  </Grid>
);

// --- Hauptkomponente ---

interface EntryDetailProps {
  entry: Entry | null;
  onDelete: (id: string) => void;
  onMenu?: () => void;
}

const EntryDetail: React.FC<EntryDetailProps> = ({ entry, onDelete, onMenu }) => {
  const { t, i18n } = useTranslation();
  const { speak } = useSpeechSynthesis();
  const [calculation, setCalculation] = useState<CalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calcError, setCalcError] = useState<string | null>(null);

  useEffect(() => {
    setCalculation(null);
    setCalcError(null);
    setIsCalculating(false);
  }, [entry?.id]);

  const generateSpokenText = (result: CalculationResult) => {
    const parts = [
      t('results.speak.ap1', {
        grade: result.AP1.grade,
        points: result.AP1.points
      }),
      t('results.speak.ap2_planning', {
        grade: result.AP2.planning.grade,
        points: result.AP2.planning.points
      }),
      t('results.speak.ap2_development', {
        grade: result.AP2.development.grade,
        points: result.AP2.development.points
      }),
      t('results.speak.ap2_economy', {
        grade: result.AP2.economy.grade,
        points: result.AP2.economy.points
      }),
      t('results.speak.pw_project', {
        grade: result.PW.project.grade,
        points: result.PW.project.points
      }),
      t('results.speak.pw_presentation', {
        grade: result.PW.presentation.grade,
        points: result.PW.presentation.points
      }),
      // Das Gesamtergebnis kommt zum Schluss
      t('results.speak.overall', {
        grade: result.overall.grade,
        points: result.overall.points
      })
    ];

    // Fügt die Sätze mit einer kurzen Pause (Punkt und Leerzeichen) zusammen
    return parts.join('. ');
  };

  const handleCalculate = async (entryId: string) => {
    setIsCalculating(true);
    setCalcError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/exam/calculate/${entryId}`);
      if (!res.ok) {
        throw new Error(
          `${t(
            "results.calculation_failed",
            "Berechnung fehlgeschlagen"
          )}: ${res.statusText}`
        );
      }
      const json = await res.json();
      setCalculation(json.data as CalculationResult);
    } catch (err: any) {
      setCalcError(
        err?.message ?? t("results.unknown_error", "Unbekannter Fehler")
      );
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
        onMenu={onMenu}
        onCalculate={() => handleCalculate(entry.id)}
        onDelete={() => onDelete(entry.id)}
        onReadAloud={() => {
          console.log(i18n.language)
          speak(generateSpokenText(calculation!), i18n.language);
        }}
        t={t}
      />
      <Divider />
      <Grid container spacing={4}>
        {/* AP1 */}
        <Grid item xs={12} sm={6} md={4}>
          <Card variant="outlined" sx={{ p: 2, height: "100%" }}>
            <SectionHeader title={t("results.exam_1") ?? "Abschlussprüfung — Teil 1"} />
            <Typography variant="subtitle2" color="text.secondary">
              {t("results.points") ?? "Eingetragen"}
            </Typography>
            <Typography variant="body1" fontWeight="medium" gutterBottom>
              {entry.ap1}
            </Typography>
            {calculation?.AP1 && (
              <>
                <Typography variant="subtitle2" color="text.secondary">
                  {t("results.grade")}
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {calculation.AP1.grade}
                </Typography>
              </>
            )}
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
            <SectionHeader subtitle={t("results.project_work") ?? ""} />
            <Grid container spacing={2}>
              <ExamPartCard
                label={t("results.documentation") ?? "Dokumentation"}
                mainValue={entry.pw.project}
                calculation={calculation?.PW?.project}
                t={t}
              />
              <ExamPartCard
                label={t("results.presentation") ?? "Präsentation"}
                mainValue={entry.pw.presentation}
                calculation={calculation?.PW?.presentation}
                t={t}
              />
            </Grid>
          </Card>
        </Grid>
      </Grid>
      {/* Status / Fehler */}
      {calcError && <Alert severity="error">{calcError}</Alert>}
    </Stack>
  );
};

export default EntryDetail;