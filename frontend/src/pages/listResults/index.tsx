import { useState, useMemo } from "react";
import { Typography, Paper, Grid, CircularProgress, Snackbar, Alert, Box, IconButton, Drawer, useTheme, useMediaQuery } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { useEntries } from "../../hooks/useEntries";
import EntryListItem from "../../components/EntryListItem";
import EntryDetail from "../../components/EntryDetail";

export default function ListResultsPage(): JSX.Element {
  const { entries, loading, error, selectedId, setSelectedId, deleteEntry } = useEntries();
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" as const });
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const selectedEntry = useMemo(
    () => entries.find((e) => e.id === selectedId) ?? null,
    [entries, selectedId]
  );

  const handleDelete = async (id: string) => {
    if (!window.confirm("Eintrag wirklich löschen?")) return;
    try {
      await deleteEntry(id);
      setSnack({ open: true, msg: "Eintrag gelöscht", severity: "success" });
    } catch (err: any) {
      setSnack({ open: true, msg: `Fehler: ${err.message}`, severity: "error" });
    }
  };

  const handleSnackClose = () => setSnack((s) => ({ ...s, open: false }));

  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <CircularProgress size={20} />
          <Typography>lade Einträge…</Typography>
        </Box>
      );
    }
    if (error) {
      return <Typography color="error">Fehler: {error}</Typography>;
    }
    if (entries.length === 0) {
      return <Typography color="text.secondary">Noch keine Einträge vorhanden.</Typography>;
    }

    const listContent = (
    <Paper sx={{ height: '100%', overflow: 'auto', border: 'none', boxShadow: 'none', p: 1, backgroundColor: 'transparent' }}>
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
    </Paper>
  );

  // Mobile Ansicht
  if (isMobile) {
    return (
      <>
        <IconButton
          color="inherit"
          aria-label="Menü öffnen"
          edge="start"
          onClick={handleDrawerToggle}
          sx={{ mb: 2 }}
        >
          <MenuIcon />
        </IconButton>
        <Drawer
          variant="temporary"
          open={drawerOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{ '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 280, p: 1 } }}
        >
          {listContent}
        </Drawer>
        <Paper sx={{ p: 2, minHeight: '70vh' }}>
          <EntryDetail
            entry={selectedEntry}
            onDelete={handleDelete}
            onUnselect={() => setSelectedId(null)}
          />
        </Paper>
      </>
    );
  }

  // Desktop Ansicht
  return (
    <Grid container spacing={2}>
      <Grid item md={4} sx={{ height: '75vh' }}>
        {listContent}
      </Grid>
      <Grid item md={8}>
        <Paper sx={{ p: 2, height: '100%' }}>
          <EntryDetail
            entry={selectedEntry}
            onDelete={handleDelete}
            onUnselect={() => setSelectedId(null)}
          />
        </Paper>
      </Grid>
    </Grid>
  );
};


  return (
    <Paper elevation={3} sx={{ p: { xs: 2, md: 4 }, borderRadius: 2 }}>
      <Typography variant="h5" gutterBottom>
        Gespeicherte Einträge ({entries.length})
      </Typography>

      {renderContent()}

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={handleSnackClose}>
        <Alert onClose={handleSnackClose} severity={snack.severity} sx={{ width: "100%" }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Paper>
  );
}
