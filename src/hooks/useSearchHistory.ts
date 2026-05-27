import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthReady } from "@/hooks/useAuthReady";
import { runAsync } from "@/lib/asyncRequest";

export interface SearchHistoryItem {
  id: string;
  query: string;
  search_type: string | null;
  created_at: string;
  player_count: number | null;
  max_players: number | null;
}

export const useSearchHistory = () => {
  const { user, isReady, isAuthenticated } = useAuthReady();
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const abortRef = useRef<AbortController | null>(null);
  const requestSeqRef = useRef(0);

  const fetchHistory = useCallback(async () => {
    if (!isReady) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const requestId = ++requestSeqRef.current;
    try {
      if (!isAuthenticated || !user) {
        setHistory([]);
        setIsLoading(false);
        return;
      }

      const outcome = await runAsync(async (signal) => {
        const { data, error } = await supabase
          .from('search_history')
          .select('id, query, search_type, created_at, player_count, max_players')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20)
          .abortSignal(signal);
        if (error) throw error;
        return data || [];
      }, { timeoutMs: 7000, retries: 0, signal: controller.signal, label: 'search-history' });

      if (requestSeqRef.current !== requestId || controller.signal.aborted) return;
      if (!outcome.ok) throw outcome.error;
      setHistory(outcome.data);
    } catch (err) {
      console.error("Error fetching search history:", err);
    } finally {
      if (requestSeqRef.current === requestId) setIsLoading(false);
    }
  }, [isAuthenticated, isReady, user]);

  useEffect(() => {
    if (isReady) fetchHistory();
    return () => abortRef.current?.abort();
  }, [fetchHistory, isReady]);

  // Live-refresh player counts for each history item on every load
  useEffect(() => {
    if (!isAuthenticated || !user || history.length === 0) return;
    let cancelled = false;

    (async () => {
      const updates = await Promise.all(
        history.map(async (item) => {
          try {
            const { data, error } = await supabase.functions.invoke('cfx-lookup', {
              body: { serverCode: item.query, skipWebhook: true },
            });
            if (error || !data || data.error) return null;
            const pc = data.playerCount ?? data.players?.length ?? 0;
            const mp = data.maxPlayers ?? 0;
            if (pc === item.player_count && mp === item.max_players) return null;
            return { id: item.id, player_count: pc, max_players: mp };
          } catch {
            return null;
          }
        })
      );
      if (cancelled) return;
      const changed = updates.filter((u): u is { id: string; player_count: number; max_players: number } => u !== null);
      if (changed.length === 0) return;

      setHistory((prev) =>
        prev.map((h) => {
          const u = changed.find((c) => c.id === h.id);
          return u ? { ...h, player_count: u.player_count, max_players: u.max_players } : h;
        })
      );

      // Persist updates in the background
      for (const u of changed) {
        void supabase
          .from('search_history')
          .update({ player_count: u.player_count, max_players: u.max_players })
          .eq('id', u.id)
          .eq('user_id', user.id);
      }
    })();

    return () => { cancelled = true; };
    // Re-run only when the set of item ids changes, not on every player_count tweak
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user, history.map((h) => h.id).join(',')]);


  const clearHistory = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) return;

      const { error } = await supabase
        .from('search_history')
        .delete()
        .eq('user_id', session.session.user.id);

      if (error) throw error;
      setHistory([]);
    } catch (err) {
      console.error("Error clearing history:", err);
    }
  };

  const removeHistoryItem = async (id: string) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) return false;

      setHistory((prev) => prev.filter((item) => item.id !== id));

      const { error } = await supabase
        .from('search_history')
        .delete()
        .eq('id', id)
        .eq('user_id', session.session.user.id);

      if (error) {
        await fetchHistory();
        throw error;
      }
      return true;
    } catch (err) {
      console.error("Error removing history item:", err);
      return false;
    }
  };

  return {
    history,
    isLoading,
    refetch: fetchHistory,
    clearHistory,
    removeHistoryItem,
  };
};
