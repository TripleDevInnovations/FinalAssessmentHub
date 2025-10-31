import { Box, Typography, Paper, Grid, IconButton, Divider, Button } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { Entry } from "../types";

interface Props {
    entry: Entry | null;
    onDelete: (id: string) => void;
    onUnselect: () => void;
}

const EntryDetail = ({ entry, onDelete, onUnselect }: EntryDetailProps) => {
    if (!entry) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '50vh' }}>
                <Typography variant="h6" color="text.secondary">
                    Wähle links einen Eintrag aus.
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Typography variant="h5" component="h2">{entry.name}</Typography>
                <IconButton color="error" aria-label="löschen" onClick={() => onDelete(entry.id)}>
                    <DeleteIcon />
                </IconButton>
            </Box>
            <Divider sx={{ my: 2 }} />

            {/* Detail-Inhalte */}
            <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
                <Grid container spacing={2}>
                    {/* Abschlussprüfung 1 */}
                    <Grid item xs={12} sm={4}>
                        <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                            <Typography variant="subtitle2">Abschlussprüfung 1</Typography>
                            <Typography fontSize="1.25rem" fontWeight={600}>
                                {entry.ap1}
                            </Typography>
                        </Paper>
                    </Grid>

                    {/* Betriebliche Projektarbeit */}
                    <Grid item xs={12} sm={8}>
                        <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                            <Typography variant="subtitle2">Betriebliche Projektarbeit</Typography>
                            <Typography>
                                Präsentation und Fachgespräch: <strong>{entry.pw?.presentation ?? "-"}</strong>
                            </Typography>
                            <Typography>
                                Planen und Umsetzen: <strong>{entry.pw?.project ?? "-"}</strong>
                            </Typography>
                        </Paper>
                    </Grid>

                    {/* Abschlussprüfung 2 */}
                    <Grid item xs={12}>
                        <Paper variant="outlined" sx={{ p: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Abschlussprüfung 2
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={4}>
                                    <Typography variant="caption">Planen eines Softwareproduktes</Typography>
                                    <Typography>
                                        <strong>{entry.ap2?.planning?.main ?? "-"}</strong> / MEPR:{" "}
                                        <strong>{entry.ap2?.planning?.extra ?? "-"}</strong>
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <Typography variant="caption">Entwicklung und Umsetzung von Algorithmen</Typography>
                                    <Typography>
                                        <strong>{entry.ap2?.development?.main ?? "-"}</strong> / MEPR:{" "}
                                        <strong>{entry.ap2?.development?.extra ?? "-"}</strong>
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <Typography variant="caption">Wirtschafts- und Sozialkunde</Typography>
                                    <Typography>
                                        <strong>{entry.ap2?.economy?.main ?? "-"}</strong> / MEPR:{" "}
                                        <strong>{entry.ap2?.economy?.extra ?? "-"}</strong>
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>
                </Grid>
            </Box>

            {/* Footer mit Button */}
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="outlined" onClick={onUnselect}>
                    Auswahl aufheben
                </Button>
            </Box>
        </Box>
    );
};

export default EntryDetail;
