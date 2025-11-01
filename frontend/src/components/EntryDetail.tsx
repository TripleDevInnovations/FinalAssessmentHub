import { Box, Typography, IconButton, Divider, Chip, Stack } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import MenuIcon from '@mui/icons-material/Menu';
import { useTranslation } from "react-i18next";
import { Entry } from "../types";

interface Props {
  entry: Entry | null;
  onDelete: (id: string) => void;
  onMenu?: () => void;
}

const DetailSection = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <Box>
    <Typography variant="overline" color="text.secondary">{title}</Typography>
    {children}
  </Box>
);

const EntryDetail = ({ entry, onDelete, onMenu }: Props) => {
  const { t } = useTranslation();

  if (!entry) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', p: 3 }}>
        <Typography variant="h6" color="text.secondary">{t('results.select_entry_prompt')}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          {onMenu && (
            <IconButton
              color="inherit"
              aria-label={t('results.open_menu_aria')}
              edge="start"
              onClick={onMenu}
              sx={{ m: 2, display: 'inline-flex' }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h5" component="h2">{entry.name}</Typography>
        </Stack>
        <IconButton color="error" aria-label={t('results.delete_aria')} onClick={() => onDelete(entry.id)}>
          <DeleteIcon />
        </IconButton>
      </Box>
      <Divider sx={{ mb: 3 }} />
      <Stack spacing={4} sx={{ flexGrow: 1, overflowY: 'auto', pr: 2 }}>
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
      </Stack>
    </Box>
  );
};

export default EntryDetail;