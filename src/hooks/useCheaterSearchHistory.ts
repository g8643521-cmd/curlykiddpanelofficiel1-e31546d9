import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthReady } from "@/hooks/useAuthReady";

export interface CheaterSearchMetadata {
  sx_username?: string | null;
  sx_avatar_url?: string | null;
  sx_avatar_hash?: string | null;
  sx_discord_id?: string | null;
  sx_tickets?: number;
  sx_guilds?: number;
  sx_flagged?: boolean;
  sx_guild_names?: string[];
  db_confirmed?: number;
  db_suspected?: number;
  db_total?: number;
  query_type?: "discord" | "steam" | "fivem" | "license" | "name";
  source?: "cheaters_db" | "player_locator";
}

export interface CheaterSearchHistoryItem {
  id: string;
  query: string;
  created_at: string;
  results_count: number | null;
  metadata: CheaterSearchMetadata;
}

const detectQueryType = (q: string): CheaterSearchMetadata["query_type"] => {
  if (/^\d{17,19}$/.test(q)) return "discord";
  if (/^steam:/i.test(q) || /^[a-f0-9]{15,17}$/i.test(q)) return "steam";
  if (/^fivem:/i.test(q)) return "fivem";
  if (/^license:/i.test(q) || /^[a-f0-9]{40}$/i.test(q)) return "license";
  return "name";
};

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
        .select("id, query, created_at, player_count, metadata")
        .eq("user_id", user.id)
        .eq("search_type", "cheater")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      if (seqRef.current !== seq) return;
      setHistory(
        (data || []).map((r: any) => ({
          id: r.id,
          query: r.query,
          created_at: r.created_at,
          results_count: r.player_count,
          metadata: (r.metadata as CheaterSearchMetadata) || {},
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
    async (query: string, resultsCount: number, metadata: CheaterSearchMetadata = {}) => {
      try {
        const { data: session } = await supabase.auth.getSession();
        const uid = session?.session?.user?.id;
        if (!uid) return;
        const meta: CheaterSearchMetadata = {
          query_type: detectQueryType(query),
          ...metadata,
        };
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
          metadata: meta,
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
