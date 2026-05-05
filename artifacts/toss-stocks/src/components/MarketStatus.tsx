import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface MarketStatusData {
  isOpen: boolean;
  isPreMarket: boolean;
  isWeekday: boolean;
  kstTime: string;
  dayOfWeek: number;
  message: string;
  nextEventLabel: string;
  nextEventTime: string;
  openTime: string;
  closeTime: string;
}

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function fetchMarketStatus(): Promise<MarketStatusData | null> {
  try {
    const res = await fetch(`${API_BASE}/api/market/status`);
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export function MarketStatusBanner() {
  const [status, setStatus] = useState<MarketStatusData | null>(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    fetchMarketStatus().then(setStatus);
    const dataTimer = setInterval(() => fetchMarketStatus().then(setStatus), 30_000);
    const clockTimer = setInterval(() => setNow(new Date()), 1000);
    return () => { clearInterval(dataTimer); clearInterval(clockTimer); };
  }, []);

  if (!status) return null;

  const { isOpen, isPreMarket, message, nextEventLabel, nextEventTime, kstTime } = status;

  const kstNow = new Date(now.getTime() + 9 * 3_600_000);
  const liveTime = `${String(kstNow.getUTCHours()).padStart(2,"0")}:${String(kstNow.getUTCMinutes()).padStart(2,"0")}:${String(kstNow.getUTCSeconds()).padStart(2,"0")}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex items-center justify-between px-4 py-2.5 rounded-2xl text-xs font-bold border",
        isOpen
          ? "bg-green-50 border-green-200 text-green-800"
          : isPreMarket
          ? "bg-amber-50 border-amber-200 text-amber-800"
          : "bg-muted border-border/50 text-muted-foreground"
      )}
    >
      <div className="flex items-center gap-2">
        <div className={cn(
          "w-2 h-2 rounded-full flex-shrink-0",
          isOpen ? "bg-green-500 animate-pulse" : isPreMarket ? "bg-amber-400 animate-pulse" : "bg-muted-foreground/40"
        )} />
        <span className="font-extrabold">한국증시</span>
        <span className="font-semibold opacity-80">{message}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[10px] opacity-60">{nextEventLabel}: {nextEventTime.split(" ").slice(-2).join(" ")}</span>
        <span className={cn(
          "tabular-nums font-extrabold text-[11px] px-2 py-0.5 rounded-lg",
          isOpen ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
        )}>
          KST {liveTime}
        </span>
      </div>
    </motion.div>
  );
}

export function useMarketStatus() {
  const [status, setStatus] = useState<MarketStatusData | null>(null);

  useEffect(() => {
    fetchMarketStatus().then(setStatus);
    const timer = setInterval(() => fetchMarketStatus().then(setStatus), 30_000);
    return () => clearInterval(timer);
  }, []);

  return status;
}
