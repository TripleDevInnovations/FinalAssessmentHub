import React, { useEffect, useState } from "react";
import {
  Typography,
  Paper,
  Grid,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
  Box,
  Card,
  CardContent,
  CardActionArea,
  CardActions,
  Avatar,
  Divider,
  IconButton,
} from "@mui/material";
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
  const [selectedId, setSelectedId] = useState<string | null>(null);

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
        if (mounted) {
          setEntries(Array.isArray(data) ? data : []);
          // falls noch keine Auswahl vorhanden ist, erste wählen
          if (!selectedId && Array.isArray(data) && data.length > 0) {
            setSelectedId(data[0].id);
          }
        }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // nur beim Mount laden

  const handleDelete = async (id: string) => {
    const ok = window.confirm("Eintrag wirklich löschen?");
    if (!ok) return;
    try {
      const res = await fetch(`${BASE}/exam/${id}`, { method: "DELETE" });
      if (!res.ok) {
        let bodyMsg = "";
        try {
          const text = await res.text();
          if (text) bodyMsg = ` — ${text}`;
        } catch {}
        throw new Error(`Löschen fehlgeschlagen: ${res.status}${bodyMsg}`);
      }
      setEntries((prev) => prev.filter((e) => e.id !== id));
      // falls das gelöschte Element ausgewählt war, wähle ein neues (oder null)
      setSelectedId((cur) => {
        if (cur === id) {
          const remaining = entries.filter((e) => e.id !== id);
          return remaining.length > 0 ? remaining[0].id : null;
        }
        return cur;
      });
      setSnack({ open: true, msg: "Eintrag gelöscht", severity: "success" });
    } catch (err: any) {
      console.error(err);
      setSnack({ open: true, msg: `Löschen fehlgeschlagen: ${err?.message ?? "Unbekannter Fehler"}`, severity: "error" });
    }
  };

  const selectedEntry = entries.find((e) => e.id === selectedId) ?? null;

  return (
    <Paper elevation={3} sx={{  p: { xs: 2, md: 4 }, borderRadius: 2 }}>
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
        <Grid container spacing={2}>
          {/* LEFT: Liste der Namen als Cards */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 1, height: "70vh", overflow: "auto" }}>
              <Box sx={{ display: "flex", gap: 1, flexDirection: "column" }}>
                {entries.map((entry) => {
                  const isSelected = entry.id === selectedId;
                  const initials = entry.name
                    .split(" ")
                    .map((s) => s[0]?.toUpperCase() ?? "")
                    .slice(0, 2)
                    .join("");
                  return (
                    <Card
                      key={entry.id}
                      variant="outlined"
                      sx={{
                        mb: 1,
                        borderColor: isSelected ? "primary.main" : undefined,
                        boxShadow: isSelected ? 3 : 0,
                      }}
                    >
                      <CardActionArea onClick={() => setSelectedId(entry.id)}>
                        <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                          <Avatar>{initials}</Avatar>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography noWrap fontWeight={isSelected ? 600 : 500}>
                              {entry.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" noWrap>
                              ID: {entry.id}
                            </Typography>
                          </Box>
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  );
                })}
              </Box>
            </Paper>
          </Grid>

          {/* RIGHT: Detail-View */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2, minHeight: "70vh" }}>
              {selectedEntry ? (
                <Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2 }}>
                    <Box>
                      <Typography variant="h6">{selectedEntry.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        ID: {selectedEntry.id}
                      </Typography>
                    </Box>

                    <Box sx={{ display: "flex", gap: 1 }}>
                      <IconButton
                        color="error"
                        aria-label="löschen"
                        onClick={() => handleDelete(selectedEntry.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <Paper variant="outlined" sx={{ p: 1 }}>
                        <Typography variant="subtitle2">AP1</Typography>
                        <Typography fontSize="1.25rem" fontWeight={600}>
                          {selectedEntry.ap1}
                        </Typography>
                      </Paper>
                    </Grid>

                    <Grid item xs={12} sm={8}>
                      <Paper variant="outlined" sx={{ p: 1 }}>
                        <Typography variant="subtitle2">Mündliche Leistungen</Typography>
                        <Typography>
                          Presentation: <strong>{selectedEntry.ml?.presentation ?? "-"}</strong> — Project:{" "}
                          <strong>{selectedEntry.ml?.project ?? "-"}</strong>
                        </Typography>
                      </Paper>
                    </Grid>

                    <Grid item xs={12}>
                      <Paper variant="outlined" sx={{ p: 1 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          AP2 Details
                        </Typography>

                        <Grid container spacing={1}>
                          <Grid item xs={12} sm={4}>
                            <Typography variant="caption">Planning</Typography>
                            <Typography>
                              Main: <strong>{selectedEntry.ap2?.planning?.main ?? "-"}</strong> / Extra:{" "}
                              <strong>{selectedEntry.ap2?.planning?.extra ?? "-"}</strong>
                            </Typography>
                          </Grid>

                          <Grid item xs={12} sm={4}>
                            <Typography variant="caption">Development</Typography>
                            <Typography>
                              Main: <strong>{selectedEntry.ap2?.development?.main ?? "-"}</strong> / Extra:{" "}
                              <strong>{selectedEntry.ap2?.development?.extra ?? "-"}</strong>
                            </Typography>
                          </Grid>

                          <Grid item xs={12} sm={4}>
                            <Typography variant="caption">Economy</Typography>
                            <Typography>
                              Main: <strong>{selectedEntry.ap2?.economy?.main ?? "-"}</strong> / Extra:{" "}
                              <strong>{selectedEntry.ap2?.economy?.extra ?? "-"}</strong>
                            </Typography>
                          </Grid>
                        </Grid>
                      </Paper>
                    </Grid>
                  </Grid>

                  <CardActions sx={{ justifyContent: "flex-end", mt: 2 }}>
                    <Button variant="outlined" onClick={() => setSelectedId(null)}>
                      Auswahl aufheben
                    </Button>
                  </CardActions>
                </Box>
              ) : (
                <Box sx={{ textAlign: "center", py: 6 }}>
                  <Typography variant="h6" color="text.secondary">
                    Wähle links einen Eintrag aus, um die Details anzuzeigen.
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
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
    </Paper>
  );
}
