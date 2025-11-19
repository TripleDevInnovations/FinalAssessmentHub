import React, { useCallback, useEffect, useState } from "react";
import {
  Card,
  Typography,
  IconButton,
  Chip,
  Stack,
  Divider,
  CircularProgress,
  Alert,
  Tooltip,
  Box,
  List,
  ListItem,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import MenuIcon from "@mui/icons-material/Menu";
// @ts-ignore
import { useTranslation, TFunction } from "react-i18next";
import { Entry, CalculationResult, GradeAndPoints } from "../types";
import { useSpeechSynthesis } from "../hooks/useSpeechSynthesis";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import StopIcon from '@mui/icons-material/Stop';
import EditIcon from '@mui/icons-material/Edit';

const API_BASE_URL = "http://127.0.0.1:8000";

// --- Hilfskomponenten (unverändert) ---

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle }) => (
  <>
    <Typography variant="h5" fontWeight="bold" gutterBottom>
      {title}
    </Typography>
    {subtitle && (
      <Typography variant="subtitle1" color="text.secondary" sx={{ mt: -1, mb: 1 }}>
        {subtitle}
      </Typography>
    )}
  </>
);

interface EntryDetailHeaderProps {
  entry: Entry;
  isCalculating: boolean;
  isSpeaking: boolean;
  onMenu?: () => void;
  onEdit: () => void;
  onDelete: () => void;
  showReadAloudButton: boolean;
  onReadAloud: () => void;
  t: TFunction;
}

const EntryDetailHeader: React.FC<EntryDetailHeaderProps> = ({
  entry,
  isCalculating,
  isSpeaking,
  onMenu,
  onEdit,
  onDelete,
  showReadAloudButton,
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
      {isCalculating && <CircularProgress size={24} />}
    </Stack>
    <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
      {showReadAloudButton && (
        <Tooltip title={isSpeaking ? t("results.stop_read_aloud_aria") : t("results.read_aloud_aria")}>
          <IconButton
            aria-label={isSpeaking ? t("results.stop_read_aloud_aria") : t("results.read_aloud_aria")}
            onClick={onReadAloud}
          >
            {isSpeaking ? <StopIcon /> : <VolumeUpIcon />}
          </IconButton>
        </Tooltip>
      )}
      <IconButton onClick={onEdit} aria-label={t("results.edit_aria")}>
        <EditIcon />
      </IconButton>
      <IconButton color="error" onClick={onDelete} aria-label={t("results.delete_aria")}>
        <DeleteIcon />
      </IconButton>
    </Stack>
  </Stack>
);

interface ResultRowProps {
  label: string;
  value: number | string | null | undefined;
  extraValue?: number | string | null | undefined;
  extraLabel?: string;
  calculation?: GradeAndPoints;
  t: TFunction;
}

const ResultRow: React.FC<ResultRowProps> = ({ label, value, extraValue, extraLabel = "MEPR", calculation, t }) => (
  <Stack
    direction={{ xs: "column", sm: "row" }}
    justifyContent="space-between"
    alignItems={{ xs: "flex-start", sm: "center" }}
    spacing={{ xs: 1, sm: 2 }}
    sx={{ py: 1.5, borderBottom: '1px solid', borderColor: 'divider', '&:last-of-type': { borderBottom: 'none' } }}
  >
    <Box>
      <Typography fontWeight="medium">{label}</Typography>
      <Typography variant="body2" color="text.secondary">
        {t("results.points", "Eingabe (Punkte)")}: {value ?? "-"}
        {extraValue != null && ` / ${extraValue} (${extraLabel})`}
      </Typography>
    </Box>
    {calculation && calculation.grade !== null && (
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ bgcolor: 'action.hover', p: 1, borderRadius: 2 }}>
        <Tooltip title={t("results.grade") ?? "Note"}>
          <Chip size="small" label={calculation.grade!.toString()} color="primary" />
        </Tooltip>
        {calculation.points !== null && (
          <Typography variant="body1" fontWeight="medium">
            {calculation.points} {t("results.points") ?? "P"}
          </Typography>
        )}
      </Stack>
    )}
  </Stack>
);


// --- Hauptkomponente (angepasst) ---
interface EntryDetailProps {
  entry: Entry | null;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onMenu?: () => void;
}

const EntryDetail: React.FC<EntryDetailProps> = ({ entry, onEdit, onDelete, onMenu }) => {
  const { t, i18n } = useTranslation();
  const { speak, cancel, isSpeaking } = useSpeechSynthesis();
  const [calculation, setCalculation] = useState<CalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calcError, setCalcError] = useState<string | null>(null);

  const allFieldsFilled =
    !!entry &&
    entry.ap1 != null &&
    entry.ap2?.planning?.main != null &&
    entry.ap2?.development?.main != null &&
    entry.ap2?.economy?.main != null &&
    entry.ap2?.pw?.presentation != null &&
    entry.ap2?.pw?.project != null;

  useEffect(() => {
    setCalculation(null);
    setCalcError(null);
    setIsCalculating(false);
    cancel();
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
      t("results.speak.ap2_overall", { grade: result.AP2.overall.grade, points: result.AP2.overall.points }),
      t("results.speak.overall", { grade: result.Overall.grade, points: result.Overall.points }),
    ];
    return parts.join(". ");
  };

  const handleCalculate = useCallback(async (entryId: string) => {
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
  }, [t]);

  useEffect(() => {
    if (!entry) {
      return;
    }
    if (allFieldsFilled) {
      handleCalculate(entry.id);
    } else {
      setCalculation(null);
    }
  }, [entry, handleCalculate, allFieldsFilled]);

  if (!entry) {
    return (
      <Typography variant="h6" color="text.secondary" align="center" sx={{ mt: 4 }}>
        {t("results.select_entry_prompt")}
      </Typography>
    );
  }

  return (
    <Stack spacing={4} sx={{ p: { xs: 2, md: 4 } }}>
      <EntryDetailHeader
        entry={entry}
        isCalculating={isCalculating}
        isSpeaking={isSpeaking}
        onMenu={onMenu}
        onEdit={() => onEdit(entry.id)}
        onDelete={() => onDelete(entry.id)}
        showReadAloudButton={allFieldsFilled}
        onReadAloud={() => {
          if (isSpeaking) {
            cancel();
          } else if (calculation) {
            speak(generateSpokenText(calculation), i18n.language);
          }
        }}
        t={t}
      />
      <Divider />

      {calcError && <Alert severity="error">{calcError}</Alert>}

      {calculation && (
        <Alert severity={calculation.Status.passed ? "success" : "error"} sx={{ p: 2 }}>
          <Stack spacing={1.5}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              alignItems="center"
              spacing={{ xs: 1, sm: 2 }}
              sx={{ width: "100%" }}
            >
              <Typography variant="h5" fontWeight="bold">
                {calculation.Status.passed ? t("results.passed") : t("results.failed")}
              </Typography>
              <Stack direction="row" spacing={1.5} alignItems="baseline">
                <Typography variant="h6" fontWeight="medium">{t("results.overall")}:</Typography>
                <Typography
                  variant="h4"
                  fontWeight="bold"
                  color={calculation.Status.passed ? "success.dark" : "error.dark"}
                >
                  {calculation.Overall.grade}
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  ({calculation.Overall.points} {t("results.points")})
                </Typography>
              </Stack>
            </Stack>
            {!calculation.Status.passed && calculation.Status.reasons.length > 0 && (
              <Box sx={{ pt: 1 }}>
                <Typography variant="subtitle1" fontWeight="bold">{t("results.reasons.text")}:</Typography>
                <List dense sx={{ listStyleType: 'disc', pl: 2.5, py: 0 }}>
                  {calculation.Status.reasons.map((reason, index) => (
                    <ListItem key={index} sx={{ display: 'list-item', p: 0 }}>
                      <Typography variant="body2">{t(`results.reasons.${reason}`)}</Typography>
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Stack>
        </Alert>
      )}

      <Card variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
        <SectionHeader title={t("results.exam_1") ?? "Abschlussprüfung — Teil 1"} />
        <ResultRow label={""} value={entry.ap1} calculation={calculation?.AP1} t={t} />
      </Card>

      {/* --- ÄNDERUNG START: Alles für AP2 in einer Card zusammengefasst --- */}
      <Card variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
        <SectionHeader title={t("results.exam_2") ?? "Abschlussprüfung — Teil 2"} />
        <ResultRow
          label={t("results.plan_software_product")}
          value={entry.ap2?.planning?.main}
          extraValue={entry.ap2?.planning?.extra}
          calculation={calculation?.AP2.planning}
          t={t}
        />
        <ResultRow
          label={t("results.development_and_implementation")}
          value={entry.ap2?.development?.main}
          extraValue={entry.ap2?.development?.extra}
          calculation={calculation?.AP2.development}
          t={t}
        />
        <ResultRow
          label={t("results.economics_and_social_studies") ?? "Wirtschafts- und Sozialkunde"}
          value={entry.ap2?.economy?.main}
          extraValue={entry.ap2?.economy?.extra}
          calculation={calculation?.AP2.economy}
          t={t}
        />

        {/* --- NEU: Visueller Trenner und Überschrift für die Projektarbeit --- */}
        <Divider sx={{ my: 2 }} />
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          {t("results.project_work") ?? "Betriebliche Projektarbeit"}
        </Typography>

        {/* --- Bestehender Code für die Projektarbeit hierher verschoben --- */}
        <ResultRow
          label={t("results.documentation") ?? "Dokumentation"}
          value={entry.ap2?.pw?.project}
          calculation={calculation?.AP2.pw.project}
          t={t}
        />
        <ResultRow
          label={t("results.presentation") ?? "Präsentation & Fachgespräch"}
          value={entry.ap2?.pw?.presentation}
          calculation={calculation?.AP2.pw.presentation}
          t={t}
        />

        {calculation?.AP2.pw.overall && (
          <>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ py: 1.5 }}
            >
              <Typography variant="subtitle1" fontWeight="bold">
                {t("results.project_work_overall") ?? "Gesamtergebnis Projektarbeit"}
              </Typography>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Tooltip title={t("results.grade") ?? "Note"}>
                  <Chip label={calculation.AP2.pw.overall.grade} color="primary" />
                </Tooltip>
                <Typography variant="body1" color="text.secondary">
                  {calculation.AP2.pw.overall.points}{" "}{t("results.points") ?? "P"}
                </Typography>
              </Stack>
            </Stack>
          </>
        )}

        {/* --- NEU: Gesamtergebnis für die gesamte Abschlussprüfung 2 --- */}
        {calculation?.AP2.overall && (
          <>
            <Divider sx={{ my: 2 }} />
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ py: 1, bgcolor: 'action.selected', p: 1.5, borderRadius: 2 }}
            >
              <Typography variant="h6" fontWeight="bold">
                {t("results.exam_2_overall") ?? "Gesamtergebnis AP2"}
              </Typography>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Tooltip title={t("results.grade") ?? "Note"}>
                  <Chip label={calculation.AP2.overall.grade} color="secondary" size="medium" />
                </Tooltip>
                <Typography variant="h6" fontWeight="bold">
                  {calculation.AP2.overall.points}{" "}{t("results.points") ?? "P"}
                </Typography>
              </Stack>
            </Stack>
          </>
        )}
      </Card>
      {/* --- ÄNDERUNG ENDE: Die separate Card für die Projektarbeit wurde entfernt --- */}
    </Stack>
  );
};

export default EntryDetail;