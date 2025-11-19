import { useState, useMemo } from "react";
import {
    Typography,
    CircularProgress,
    Snackbar,
    Alert,
    Box,
    Drawer,
    useTheme,
    useMediaQuery,
    Paper,
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    DialogActions,
    Button,
    DialogContentText
} from "@mui/material";
import type { AlertColor } from '@mui/material';
// @ts-ignore
import Grid from '@mui/material/GridLegacy';
import { useTranslation } from "react-i18next";
import { useEntries } from "../../hooks/useEntries";
import EntryListItem from "../../components/EntryListItem";
import EntryDetail from "../../components/EntryDetail";
import CloseIcon from '@mui/icons-material/Close';
import AddResult from "../addResult";

export default function ListResultsPage(): JSX.Element {
    const { t } = useTranslation();
    const { entries, loading, error, selectedId, setSelectedId, refetchEntries, deleteEntry } = useEntries();
    const [snack, setSnack] = useState<{ open: boolean; msg: string; severity: AlertColor; }>({
        open: false,
        msg: '',
        severity: 'success'
    });
    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [idToDelete, setIdToDelete] = useState<string | null>(null);

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const [drawerOpen, setDrawerOpen] = useState(false);

    const selectedEntry = useMemo(() => entries.find((e) => e.id === selectedId) ?? null, [entries, selectedId]);

    const handleEdit = (id: string) => {
        setSelectedId(id);
        setEditModalOpen(true);
    };

    const handleCloseEditModal = () => {
        setEditModalOpen(false);
    };

    const handleSaveSuccess = () => {
        handleCloseEditModal();
        refetchEntries();
    };

    // Öffnet den Bestätigungsdialog zum Löschen
    const handleDelete = (id: string) => {
        setIdToDelete(id);
        setDeleteDialogOpen(true);
    };

    // Schließt den Bestätigungsdialog
    const handleCloseDeleteDialog = () => {
        setDeleteDialogOpen(false);
        setIdToDelete(null);
    };

    // Führt die Löschaktion aus und schließt den Dialog
    const handleConfirmDelete = async () => {
        if (!idToDelete) return;
        try {
            await deleteEntry(idToDelete);
            setSnack({ open: true, msg: t('results.entry_deleted'), severity: "success" });
        } catch (err: any) {
            setSnack({ open: true, msg: `${t('results.error_prefix')}: ${err.message}`, severity: "error" });
        } finally {
            handleCloseDeleteDialog();
        }
    };

    const handleSnackClose = () => setSnack((s) => ({ ...s, open: false }));

    const listContent = (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Typography variant="h6" sx={{ p: 2, pb: 1 }}>
                {t('results.entries_count', { count: entries.length })}
            </Typography>
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
            return <Typography color="error" sx={{ p: 2 }}>{t('results.error_prefix')}: {error}</Typography>;
        }
        if (entries.length === 0) {
            return <Typography color="text.secondary" sx={{ p: 2 }}>{t('results.no_entries_yet')}</Typography>;
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
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onMenu={() => setDrawerOpen(true)}
                    />
                </>
            );
        }

        // Desktop Ansicht
        return (
            <Grid container sx={{ height: 'calc(100vh - 150px)', flexWrap: 'nowrap' }}>
                <Grid
                    item
                    sx={{
                        borderRight: '1px solid',
                        borderColor: 'divider',
                        height: '100%',
                        flex: '0 0 auto',
                    }}
                >
                    {listContent}
                </Grid>
                <Grid
                    item
                    sx={{
                        height: '100%',
                        overflowY: 'auto',
                        flex: '1 1 auto',
                        minWidth: 0,
                    }}
                >
                    <EntryDetail
                        entry={selectedEntry}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                </Grid>
            </Grid>
        );
    };

    return (
        <Paper elevation={3} sx={{ borderRadius: 2}}>
            {renderContent()}

            {/* Edit Dialog */}
            <Dialog open={isEditModalOpen} onClose={handleCloseEditModal} fullWidth maxWidth="md">
                <DialogTitle sx={{ m: 0, p: 2 }}>
                    {t('edit.dialogTitle', 'Eintrag bearbeiten')}
                    <IconButton
                        aria-label="close"
                        onClick={handleCloseEditModal}
                        sx={{ position: 'absolute', right: 8, top: 8, color: (theme) => theme.palette.grey[500] }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <AddResult
                        entryToEdit={selectedEntry}
                        onSaveSuccess={handleSaveSuccess}
                        onCancel={handleCloseEditModal}
                    />
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={handleCloseDeleteDialog}
            >
                <DialogTitle>
                    {t('results.confirm_delete_title', 'Eintrag löschen?')}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {t('results.confirm_delete_entry', 'Möchtest du diesen Eintrag wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.')}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDeleteDialog}>{t('common.cancel', 'Abbrechen')}</Button>
                    <Button onClick={handleConfirmDelete} color="error" autoFocus>
                        {t('common.delete', 'Löschen')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar open={snack.open} autoHideDuration={4000} onClose={handleSnackClose}>
                <Alert onClose={handleSnackClose} severity={snack.severity} sx={{ width: "100%" }}>
                    {snack.msg}
                </Alert>
            </Snackbar>
        </Paper>
    );
}