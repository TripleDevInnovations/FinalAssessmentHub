import React, { useEffect, useState } from "react";
import {
    Typography,
    Paper,
    Stack,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Grid,
    Button,
    CircularProgress,
    Snackbar,
    Alert,
    Box,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DeleteIcon from "@mui/icons-material/Delete";

/** Typen passend zum Beispiel-JSON */
interface AP2Category {
    main: number;
    extra: number;
}
interface AP2 {
    planning: AP2Category;
    development: AP2Category;
    economy: AP2Category;
}
interface ML {
    presentation: number;
    project: number;
}
interface Entry {
    id: string;
    name: string;
    ap1: number;
    ap2: AP2;
    ml: ML;
}

export default function ListResults(): JSX.Element {
    const [entries, setEntries] = useState<Entry[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [snack, setSnack] = useState<{ open: boolean; msg: string; severity?: "success" | "error" | "info" }>(
        { open: false, msg: "", severity: "info" }
    );

    const BASE = "http://127.0.0.1:8000";

    useEffect(() => {
        let mounted = true;
        const fetchEntries = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`${BASE}/exam/all`);
                if (!res.ok) throw new Error(`Fehler beim Laden: ${res.status} ${res.statusText}`);
                const data = (await res.json()) as Entry[];
                if (mounted) setEntries(Array.isArray(data) ? data : []);
            } catch (err: any) {
                console.error(err);
                if (mounted) setError(err?.message ?? "Unbekannter Fehler");
            } finally {
                if (mounted) setLoading(false);
            }
        };
        fetchEntries();
        return () => {
            mounted = false;
        };
    }, []);

    const handleDelete = async (id: string) => {
        const ok = window.confirm("Eintrag wirklich löschen?");
        if (!ok) return;
        try {
            const res = await fetch(`${BASE}/exam/${id}`, { method: "DELETE" });
            if (!res.ok) {
                // falls Backend eine Fehlermeldung im Body zurückgibt, versuche sie zu lesen
                let bodyMsg = "";
                try {
                    const text = await res.text();
                    if (text) bodyMsg = ` — ${text}`;
                } catch { }
                throw new Error(`Löschen fehlgeschlagen: ${res.status}${bodyMsg}`);
            }
            // erfolgreich: lokal entfernen
            setEntries((prev) => prev.filter((e) => e.id !== id));
            setSnack({ open: true, msg: "Eintrag gelöscht", severity: "success" });
        } catch (err: any) {
            console.error(err);
            setSnack({ open: true, msg: `Löschen fehlgeschlagen: ${err?.message ?? "Unbekannter Fehler"}`, severity: "error" });
        }
    };

    return (
        <div>
            <Typography variant="h5" gutterBottom>
                Gespeicherte Einträge ({entries.length})
            </Typography>

            {loading ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <CircularProgress size={20} />
                    <Typography>lade Einträge…</Typography>
                </Box>
            ) : error ? (
                <Paper sx={{ p: 2 }}>
                    <Typography color="error">Fehler: {error}</Typography>
                </Paper>
            ) : entries.length === 0 ? (
                <Paper sx={{ p: 2 }}>
                    <Typography color="text.secondary">Noch keine Einträge vorhanden.</Typography>
                </Paper>
            ) : (
                <Stack spacing={2}>
                    {entries.map((entry) => (
                        <Accordion key={entry.id}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography sx={{ flexGrow: 1 }}>{entry.name}</Typography>
                                <Typography color="text.secondary" sx={{ ml: 2 }}>
                                    ID: {entry.id}
                                </Typography>
                            </AccordionSummary>

                            <AccordionDetails>
                                <Grid container spacing={1}>
                                    <Grid item xs={12}>
                                        <Typography variant="subtitle2">AP1</Typography>
                                        <Typography>{entry.ap1}</Typography>
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="subtitle2">AP2 — Planning (main / extra)</Typography>
                                        <Typography>
                                            {entry.ap2?.planning?.main ?? "-"} / {entry.ap2?.planning?.extra ?? "-"}
                                        </Typography>
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="subtitle2">AP2 — Development (main / extra)</Typography>
                                        <Typography>
                                            {entry.ap2?.development?.main ?? "-"} / {entry.ap2?.development?.extra ?? "-"}
                                        </Typography>
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="subtitle2">AP2 — Economy (main / extra)</Typography>
                                        <Typography>
                                            {entry.ap2?.economy?.main ?? "-"} / {entry.ap2?.economy?.extra ?? "-"}
                                        </Typography>
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="subtitle2">Mündliche Leistungen (Presentation / Project)</Typography>
                                        <Typography>
                                            {entry.ml?.presentation ?? "-"} / {entry.ml?.project ?? "-"}
                                        </Typography>
                                    </Grid>

                                    <Grid item xs={12} sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
                                        <Button
                                            startIcon={<DeleteIcon />}
                                            color="error"
                                            onClick={() => handleDelete(entry.id)}
                                            size="small"
                                        >
                                            Löschen
                                        </Button>
                                    </Grid>
                                </Grid>
                            </AccordionDetails>
                        </Accordion>
                    ))}
                </Stack>
            )}

            <Snackbar
                open={snack.open}
                autoHideDuration={4000}
                onClose={() => setSnack((s) => ({ ...s, open: false }))}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert onClose={() => setSnack((s) => ({ ...s, open: false }))} severity={snack.severity} sx={{ width: "100%" }}>
                    {snack.msg}
                </Alert>
            </Snackbar>
        </div>
    );
}
