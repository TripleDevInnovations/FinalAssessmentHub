import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  IconButton,
  Divider,
  Chip,
  Stack,
  Button,
  CircularProgress,
  Alert,
  Card,
  Grid,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import MenuIcon from "@mui/icons-material/Menu";
import CalculateIcon from "@mui/icons-material/Calculate";
import { useTranslation } from "react-i18next";
import { Entry, CalculationResult } from "../types"; // Stelle sicher, dass 'CalculationResult' aus deinen Typen importiert wird

const ResultDisplay = ({ data, t }: { data: CalculationResult, t: (key: string) => string }) => (
  <Card variant="outlined" sx={{ mt: 3, p: 2, backgroundColor: 'action.hover', borderStyle: 'dashed' }}>
    <Typography variant="h6" gutterBottom>{t('results.calculation_result')}</Typography>
    <Grid container spacing={3}>
      {/* Gesamtergebnis */}
      <Grid item xs={12}>
        <Typography variant="overline">{t('results.overall_result')}</Typography>
        <Typography variant="h4" color="primary">
          {t('results.grade')}: <strong>{data.overall.grade}</strong> ({data.overall.points} {t('results.points')})
        </Typography>
      </Grid>
      
      {/* Aufschlüsselung */}
      <Grid item xs={12} sm={6} md={4}>
        <Typography fontWeight="bold">{t('results.exam_1')}</Typography>
        <Typography>{t('results.grade')}: {data.AP1.grade} ({data.AP1.points} P.)</Typography>
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <Typography fontWeight="bold">{t('results.project_work')}</Typography>
        <Typography>{t('results.documentation')}: {data.PW.project.grade} ({data.PW.project.points} P.)</Typography>
        <Typography>{t('results.presentation')}: {data.PW.presentation.grade} ({data.PW.presentation.points} P.)</Typography>
      </Grid>
      <Grid item xs={12} md={4}>
        <Typography fontWeight="bold">{t('results.exam_2')}</Typography>
        <Typography>{t('results.plan_software_product')}: {data.AP2.planning.grade} ({data.AP2.planning.points} P.)</Typography>
        <Typography>{t('results.development_and_implementation')}: {data.AP2.development.grade} ({data.AP2.development.points} P.)</Typography>
        <Typography>{t('results.economics_and_social_studies')}: {data.AP2.economy.grade} ({data.AP2.economy.points} P.)</Typography>
      </Grid>
    </Grid>
  </Card>
);

// --- Hilfskomponente für Detail-Sektionen ---
const DetailSection = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <Box>
        <Typography variant="overline" color="text.secondary">{title}</Typography>
        {children}
    </Box>
);

// --- Hauptkomponente ---
interface Props {
  entry: Entry | null;
  onDelete: (id: string) => void;
  onMenu?: () => void;
}

const EntryDetail = ({ entry, onDelete, onMenu }: Props) => {
  const { t } = useTranslation();
  
  // States für die Berechnung
  const [calculation, setCalculation] = useState<CalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calcError, setCalcError] = useState<string | null>(null);

  // Effekt, um die Berechnung zurückzusetzen, wenn ein neuer Eintrag ausgewählt wird
  useEffect(() => {
    setCalculation(null);
    setCalcError(null);
    setIsCalculating(false);
  }, [entry?.id]);

  if (!entry) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', p: 3 }}>
        <Typography variant="h6" color="text.secondary">{t('results.select_entry_prompt')}</Typography>
      </Box>
    );
  }

  // Funktion für den API-Aufruf zur Berechnung
  const handleCalculate = async (entryId: string) => {
    setIsCalculating(true);
    setCalcError(null);
    setCalculation(null); // Alte Ergebnisse sofort ausblenden
    try {
      const res = await fetch(`http://127.0.0.1:8000/exam/calculate/${entryId}`);
      if (!res.ok) {
        throw new Error(`${t('results.calculation_failed', 'Berechnung fehlgeschlagen')}: ${res.statusText}`);
      }
      const result = await res.json();
      setCalculation(result.data); // Das 'data' Objekt aus der Response nutzen
    } catch (err: any) {
      setCalcError(err.message || t('results.unknown_error', 'Unbekannter Fehler'));
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header mit Titel und Aktions-Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          {onMenu && (
            <IconButton color="inherit" aria-label={t('results.open_menu_aria')} edge="start" onClick={onMenu} sx={{ mr: { sm: 2 }, display: { md: 'none' }}}>
                <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h5" component="h2">{entry.name}</Typography>
        </Stack>
        
        <Stack direction="row" spacing={1}>
            <Button
                variant="contained"
                startIcon={isCalculating ? <CircularProgress size={20} color="inherit" /> : <CalculateIcon />}
                onClick={() => handleCalculate(entry.id)}
                disabled={isCalculating}
            >
                {t('results.calculate_button')}
            </Button>
            <IconButton color="error" aria-label={t('results.delete_aria')} onClick={() => onDelete(entry.id)}>
                <DeleteIcon />
            </IconButton>
        </Stack>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Hauptinhalt mit Scroll-Funktion */}
      <Stack spacing={4} sx={{ flexGrow: 1, overflowY: 'auto', pr: { md: 2 } }}>
          
          {/* Bestehende Detail-Ansicht */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="flex-start">
            <DetailSection title={t('results.exam_1')}>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography fontSize="1.5rem" fontWeight={600}>{entry.ap1}</Typography>
                    <Chip label={t('results.points')} size="small" variant="outlined" />
                </Stack>
            </DetailSection>
            <DetailSection title={t('results.project_work')}>
                <Typography>{t('results.presentation')}: <strong>{entry.pw?.presentation ?? "-"}</strong></Typography>
                <Typography>{t('results.documentation')}: <strong>{entry.pw?.project ?? "-"}</strong></Typography>
            </DetailSection>
          </Stack>
          
          <DetailSection title={t('results.exam_2')}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
                  <Box>
                      <Typography variant="caption">{t('results.plan_software_product')}</Typography>
                      <Typography><strong>{entry.ap2?.planning?.main ?? "-"}</strong> / MEPR: <strong>{entry.ap2?.planning?.extra ?? "-"}</strong></Typography>
                  </Box>
                  <Box>
                      <Typography variant="caption">{t('results.development_and_implementation')}</Typography>
                      <Typography><strong>{entry.ap2?.development?.main ?? "-"}</strong> / MEPR: <strong>{entry.ap2?.development?.extra ?? "-"}</strong></Typography>
                  </Box>
                  <Box>
                      <Typography variant="caption">{t('results.economics_and_social_studies')}</Typography>
                      <Typography><strong>{entry.ap2?.economy?.main ?? "-"}</strong> / MEPR: <strong>{entry.ap2?.economy?.extra ?? "-"}</strong></Typography>
                  </Box>
              </Stack>
          </DetailSection>

          {/* Neuer Bereich für die Berechnungsergebnisse */}
          <Box>
              {isCalculating && <Box sx={{display: 'flex', alignItems: 'center', gap: 2}}><CircularProgress size={24} /><Typography>Berechne Ergebnis...</Typography></Box>}
              {calcError && <Alert severity="error">{calcError}</Alert>}
              {calculation && <ResultDisplay data={calculation} t={t} />}
          </Box>
      </Stack>
    </Box>
  );
};

export default EntryDetail;