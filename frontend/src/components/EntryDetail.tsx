import { Box, Typography, IconButton, Divider, Button, Chip, Stack } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import MenuIcon from '@mui/icons-material/Menu';
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
  if (!entry) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', p: 3 }}>
        <Typography variant="h6" color="text.secondary">
          Wähle einen Eintrag aus der Liste aus, um die Details zu sehen.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header mit Zurück-Button für Mobile */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          {onMenu && (
            <IconButton
              color="inherit"
              aria-label="Menü öffnen"
              edge="start"
              onClick={onMenu}
              sx={{ m: 2, display: 'inline-flex' }}
            >
              <MenuIcon />
            </IconButton>)}
          <Typography variant="h5" component="h2">{entry.name}</Typography>
        </Stack>
        <IconButton color="error" aria-label="löschen" onClick={() => onDelete(entry.id)}>
          <DeleteIcon />
        </IconButton>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Detail-Inhalte mit Stack */}
      <Stack spacing={4} sx={{ flexGrow: 1, overflowY: 'auto', pr: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="flex-start">
          <DetailSection title="Abschlussprüfung 1">
            {/* --- KORREKTUR HIER --- */}
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography fontSize="1.5rem" fontWeight={600}>{entry.ap1}</Typography>
              <Chip label="Punkte" size="small" variant="outlined" />
            </Stack>
          </DetailSection>

          <DetailSection title="Betriebliche Projektarbeit">
            <Typography>Präsentation: <strong>{entry.pw?.presentation ?? "-"}</strong></Typography>
            <Typography>Dokumentation: <strong>{entry.pw?.project ?? "-"}</strong></Typography>
          </DetailSection>
        </Stack>

        <DetailSection title="Abschlussprüfung 2">
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
            <Box>
              <Typography variant="caption">Planen eines Softwareproduktes</Typography>
              <Typography><strong>{entry.ap2?.planning?.main ?? "-"}</strong> / MEPR: <strong>{entry.ap2?.planning?.extra ?? "-"}</strong></Typography>
            </Box>
            <Box>
              <Typography variant="caption">Entwicklung und Umsetzung</Typography>
              <Typography><strong>{entry.ap2?.development?.main ?? "-"}</strong> / MEPR: <strong>{entry.ap2?.development?.extra ?? "-"}</strong></Typography>
            </Box>
            <Box>
              <Typography variant="caption">Wirtschafts- und Sozialkunde</Typography>
              <Typography><strong>{entry.ap2?.economy?.main ?? "-"}</strong> / MEPR: <strong>{entry.ap2?.economy?.extra ?? "-"}</strong></Typography>
            </Box>
          </Stack>
        </DetailSection>
      </Stack>
    </Box>
  );
};

export default EntryDetail;
