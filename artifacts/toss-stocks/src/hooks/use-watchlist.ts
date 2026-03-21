import { useState, useEffect, useCallback } from "react";

export interface WatchlistGroup {
  id: string;
  name: string;
  stocks: string[];
}

const STORAGE_KEY = "wonkwang_watchlist";

function loadGroups(): WatchlistGroup[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [{ id: "default", name: "기본 관심 종목", stocks: [] }];
}

function saveGroups(groups: WatchlistGroup[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
}

export function useWatchlist() {
  const [groups, setGroups] = useState<WatchlistGroup[]>(loadGroups);

  useEffect(() => {
    saveGroups(groups);
  }, [groups]);

  const isWatched = useCallback(
    (ticker: string) => groups.some((g) => g.stocks.includes(ticker)),
    [groups]
  );

  const getGroupsForTicker = useCallback(
    (ticker: string) => groups.filter((g) => g.stocks.includes(ticker)),
    [groups]
  );

  const toggleWatch = useCallback((ticker: string, groupId = "default") => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        return g.stocks.includes(ticker)
          ? { ...g, stocks: g.stocks.filter((t) => t !== ticker) }
          : { ...g, stocks: [...g.stocks, ticker] };
      })
    );
  }, []);

  const addToGroup = useCallback((ticker: string, groupId: string) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId && !g.stocks.includes(ticker)
          ? { ...g, stocks: [...g.stocks, ticker] }
          : g
      )
    );
  }, []);

  const removeFromGroup = useCallback((ticker: string, groupId: string) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId ? { ...g, stocks: g.stocks.filter((t) => t !== ticker) } : g
      )
    );
  }, []);

  const createGroup = useCallback((name: string) => {
    const id = `group_${Date.now()}`;
    setGroups((prev) => [...prev, { id, name, stocks: [] }]);
    return id;
  }, []);

  const renameGroup = useCallback((id: string, name: string) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === id ? { ...g, name } : g))
    );
  }, []);

  const deleteGroup = useCallback((id: string) => {
    setGroups((prev) => prev.filter((g) => g.id !== id));
  }, []);

  return {
    groups,
    isWatched,
    getGroupsForTicker,
    toggleWatch,
    addToGroup,
    removeFromGroup,
    createGroup,
    renameGroup,
    deleteGroup,
  };
}
