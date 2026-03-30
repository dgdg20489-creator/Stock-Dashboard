import { useState, useEffect, useCallback } from "react";

export interface DailyMissionState {
  date: string;
  attendance: boolean;
  quiz: boolean;
  trade: boolean;
  points: number;
}

const MISSIONS_KEY = "wonkwang_missions";
const COINS_KEY = "wonkwang_coins";
const UNLOCKED_KEY = "wonkwang_unlocked_items";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function loadMissions(): DailyMissionState {
  try {
    const raw = localStorage.getItem(MISSIONS_KEY);
    if (raw) {
      const data = JSON.parse(raw) as DailyMissionState;
      if (data.date === todayStr()) return data;
    }
  } catch {}
  return { date: todayStr(), attendance: false, quiz: false, trade: false, points: 0 };
}

function loadCoins(): number {
  try {
    return parseInt(localStorage.getItem(COINS_KEY) || "0", 10);
  } catch { return 0; }
}

function loadUnlocked(): string[] {
  try {
    const raw = localStorage.getItem(UNLOCKED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function useMissions() {
  const [missions, setMissions] = useState<DailyMissionState>(loadMissions);
  const [coins, setCoins] = useState<number>(loadCoins);
  const [unlockedItems, setUnlockedItems] = useState<string[]>(loadUnlocked);
  const [justEarnedCoin, setJustEarnedCoin] = useState(false);

  useEffect(() => {
    localStorage.setItem(MISSIONS_KEY, JSON.stringify(missions));
  }, [missions]);

  useEffect(() => {
    localStorage.setItem(COINS_KEY, String(coins));
  }, [coins]);

  useEffect(() => {
    localStorage.setItem(UNLOCKED_KEY, JSON.stringify(unlockedItems));
  }, [unlockedItems]);

  const awardPoints = useCallback((type: "attendance" | "quiz" | "trade", pts: number) => {
    setMissions((prev) => {
      if (prev[type]) return prev;
      const newPoints = prev.points + pts;
      const newState = { ...prev, [type]: true, points: newPoints };

      if (newPoints >= 100 && prev.points < 100) {
        setJustEarnedCoin(true);
        setCoins((c) => c + 1);
        setTimeout(() => setJustEarnedCoin(false), 3000);
      }
      return newState;
    });
  }, []);

  const checkAttendance = useCallback(() => {
    awardPoints("attendance", 30);
  }, [awardPoints]);

  const completeQuiz = useCallback(() => {
    awardPoints("quiz", 40);
  }, [awardPoints]);

  const completeTrade = useCallback(() => {
    awardPoints("trade", 30);
  }, [awardPoints]);

  const spendCoins = useCallback((itemId: string, cost: number): boolean => {
    if (coins < cost) return false;
    setCoins((c) => c - cost);
    setUnlockedItems((prev) => (prev.includes(itemId) ? prev : [...prev, itemId]));
    return true;
  }, [coins]);

  const isItemUnlocked = useCallback((itemId: string, coinCost: number) => {
    if (coinCost === 0) return true;
    return unlockedItems.includes(itemId);
  }, [unlockedItems]);

  return {
    missions,
    coins,
    justEarnedCoin,
    unlockedItems,
    checkAttendance,
    completeQuiz,
    completeTrade,
    spendCoins,
    isItemUnlocked,
  };
}
