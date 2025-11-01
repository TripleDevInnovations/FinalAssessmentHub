import { useState, useMemo } from "react";
import {
  Typography,
  Grid,
  CircularProgress,
  Snackbar,
  Alert,
  Box,
  Drawer,
  useTheme,
  useMediaQuery,
  Paper,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useEntries } from "../../hooks/useEntries";
import EntryListItem from "../../components/EntryListItem";
import EntryDetail from "../../components/EntryDetail";

export default function ListResultsPage(): JSX.Element {
  const { t } = useTranslation();
  const { entries, loading, error, selectedId, setSelectedId, deleteEntry } = useEntries();
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" as const });
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [drawerOpen, setDrawerOpen] = useState(false);

  const selectedEntry = useMemo(() => entries.find((e) => e.id === selectedId) ?? null, [entries, selectedId]);

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('results.confirm_delete_entry'))) return;
    try {
      await deleteEntry(id);
      setSnack({ open: true, msg: t('results.entry_deleted'), severity: "success" });
    } catch (err: any) {
      setSnack({ open: true, msg: `${t('results.error_prefix')}: ${err.message}`, severity: "error" });
    }
  };

  const handleSnackClose = () => setSnack((s) => ({ ...s, open: false }));

  const listContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Typography variant="h6" sx={{ p: 2, pb: 1 }}>{t('results.entries_count', { count: entries.length })}</Typography>
      <Box sx={{ overflowY: 'auto', flexGrow: 1 }}>
        {entries.map((entry) => (
          <EntryListItem
            key={entry.id}
            entry={entry}
            isSelected={entry.id === selectedId}
            onSelect={(id) => {
              setSelectedId(id);
              if (isMobile) {
                setDrawerOpen(false);
              }
            }}
          />
        ))}
      </Box>
    </Box>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, p: 2 }}>
          <CircularProgress size={20} />
          <Typography>{t('results.loading_entries')}</Typography>
        </Box>
      );
    }
    if (error) {
      return <Typography color="error" sx={{p: 2}}>{t('results.error_prefix')}: {error}</Typography>;
    }
    if (entries.length === 0) {
      return <Typography color="text.secondary" sx={{p: 2}}>{t('results.no_entries_yet')}</Typography>;
    }

    // Mobile Ansicht
    if (isMobile) {
      return (
        <>
          <Drawer
            variant="temporary"
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            ModalProps={{ keepMounted: true }}
            sx={{ '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 300 } }}
          >
            {listContent}
          </Drawer>
          <EntryDetail
            entry={selectedEntry}
            onDelete={handleDelete}
            onMenu={() => setDrawerOpen(true)}
          />
        </>
      );
    }

    // Desktop Ansicht
    return (
      <Grid container sx={{ height: 'calc(100vh - 200px)' }}>
        <Grid item md={4} lg={3} sx={{ borderRight: '1px solid', borderColor: 'divider', height: '100%' }}>
          {listContent}
        </Grid>
        <Grid item md={8} lg={9} sx={{ height: '100%', overflowY: 'auto' }}>
          <EntryDetail
            entry={selectedEntry}
            onDelete={handleDelete}
          />
        </Grid>
      </Grid>
    );
  };

  return (
    <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
      {renderContent()}
      <Snackbar open={snack.open} autoHideDuration={4000} onClose={handleSnackClose}>
        <Alert onClose={handleSnackClose} severity={snack.severity} sx={{ width: "100%" }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Paper>
  );
}