import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthReady } from "@/hooks/useAuthReady";

export interface CheaterSearchHistoryItem {
  id: string;
  query: string;
  created_at: string;
  results_count: number | null;
}

export const useCheaterSearchHistory = () => {
  const { user, isReady, isAuthenticated } = useAuthReady();
  const [history, setHistory] = useState<CheaterSearchHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const seqRef = useRef(0);

  const fetchHistory = useCallback(async () => {
    if (!isReady) return;
    const seq = ++seqRef.current;
    try {
      if (!isAuthenticated || !user) {
        setHistory([]);
        setIsLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("search_history")
        .select("id, query, created_at, player_count")
        .eq("user_id", user.id)
        .eq("search_type", "cheater")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      if (seqRef.current !== seq) return;
      setHistory(
        (data || []).map((r) => ({
          id: r.id,
          query: r.query,
          created_at: r.created_at,
          results_count: r.player_count,
        }))
      );
    } catch (err) {
      console.error("Error fetching cheater history:", err);
    } finally {
      if (seqRef.current === seq) setIsLoading(false);
    }
  }, [isReady, isAuthenticated, user]);

  useEffect(() => {
    if (isReady) fetchHistory();
  }, [fetchHistory, isReady]);

  const logCheaterSearch = useCallback(
    async (query: string, resultsCount: number) => {
      try {
        const { data: session } = await supabase.auth.getSession();
        const uid = session?.session?.user?.id;
        if (!uid) return;
        // Remove existing entry for the same query, then insert
        await supabase
          .from("search_history")
          .delete()
          .eq("user_id", uid)
          .eq("search_type", "cheater")
          .eq("query", query);
        await supabase.from("search_history").insert({
          user_id: uid,
          query,
          search_type: "cheater",
          player_count: resultsCount,
          max_players: 0,
        });
        void fetchHistory();
      } catch (err) {
        console.error("Failed to log cheater search:", err);
      }
    },
    [fetchHistory]
  );

  const removeItem = useCallback(
    async (id: string) => {
      try {
        const { data: session } = await supabase.auth.getSession();
        const uid = session?.session?.user?.id;
        if (!uid) return false;
        setHistory((prev) => prev.filter((i) => i.id !== id));
        const { error } = await supabase
          .from("search_history")
          .delete()
          .eq("id", id)
          .eq("user_id", uid);
        if (error) {
          await fetchHistory();
          return false;
        }
        return true;
      } catch {
        return false;
      }
    },
    [fetchHistory]
  );

  const clearAll = useCallback(async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      const uid = session?.session?.user?.id;
      if (!uid) return;
      const { error } = await supabase
        .from("search_history")
        .delete()
        .eq("user_id", uid)
        .eq("search_type", "cheater");
      if (error) throw error;
      setHistory([]);
    } catch (err) {
      console.error("Error clearing cheater history:", err);
    }
  }, []);

  return { history, isLoading, refetch: fetchHistory, logCheaterSearch, removeItem, clearAll };
};
