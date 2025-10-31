import { useState, useEffect, useCallback } from "react";
import { Entry } from "../types";

const BASE_URL = "http://127.0.0.1:8000";

export const useEntries = () => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchEntries = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${BASE_URL}/exam/list`);
        if (!res.ok) {
          throw new Error(`Fehler beim Laden: ${res.status} ${res.statusText}`);
        }
        const data = (await res.json()) as Entry[];
        setEntries(data);
        if (data.length > 0 && !selectedId) {
          setSelectedId(data[0].id);
        }
      } catch (err: any) {
        setError(err?.message ?? "Unbekannter Fehler");
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Abhängigkeit `selectedId` entfernt, um Neuladen bei Auswahl zu verhindern

  const deleteEntry = useCallback(async (id: string): Promise<void> => {
    try {
      const res = await fetch(`${BASE_URL}/exam/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const bodyMsg = (await res.text().catch(() => '')) ? ` — ${await res.text()}` : '';
        throw new Error(`Löschen fehlgeschlagen: ${res.status}${bodyMsg}`);
      }
      
      let nextSelectedId: string | null = null;
      const remaining = entries.filter((e) => e.id !== id);
      
      if (selectedId === id) {
          nextSelectedId = remaining.length > 0 ? remaining[0].id : null;
      } else {
          nextSelectedId = selectedId;
      }

      setEntries(remaining);
      setSelectedId(nextSelectedId);

    } catch (err: any) {
        // Fehler an die aufrufende Komponente weitergeben, um z.B. Snackbar anzuzeigen
        throw err;
    }
  }, [entries, selectedId]);

  return { entries, loading, error, selectedId, setSelectedId, deleteEntry };
};
