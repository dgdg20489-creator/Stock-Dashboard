import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface OrderBookProps {
  ticker: string;
  currentPrice: number;
}

interface Level {
  price: number;
  qty:   number;
}

interface OrderBookData {
  asks:        Level[];
  bids:        Level[];
  totalAskQty: number;
  totalBidQty: number;
}

interface Tick {
  id:    number;
  time:  string;
  price: number;
  qty:   number;
  isBuy: boolean;
}

function getBaseUrl() {
  const base = (import.meta as any).env?.BASE_URL ?? "/";
  return base.endsWith("/") ? base.slice(0, -1) : base;
}

async function loadOrderbook(ticker: string): Promise<OrderBookData | null> {
  try {
    const res = await fetch(`${getBaseUrl()}/api/stocks/${ticker}/orderbook`);
    if (!res.ok) return null;
    return await res.json() as OrderBookData;
  } catch {
    return null;
  }
}

/** 호가 데이터로부터 체결내역 시뮬레이션 (실제 체결틱은 WebSocket 필요) */
function makeTick(book: OrderBookData, id: number): Tick {
  const allLevels = [...book.asks, ...book.bids];
  if (!allLevels.length) return { id, time: "--:--:--", price: 0, qty: 1, isBuy: true };
  const idx    = id % allLevels.length;
  const level  = allLevels[idx];
  const isBuy  = idx >= book.asks.length;
  const now    = new Date();
  const time   = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}:${String(now.getSeconds()).padStart(2,"0")}`;
  const qty    = Math.max(1, Math.round(level.qty * 0.01 * (0.1 + Math.random() * 0.9)));
  return { id, time, price: level.price, qty, isBuy };
}

export function OrderBook({ ticker, currentPrice }: OrderBookProps) {
  const [book,  setBook]  = useState<OrderBookData | null>(null);
  const [ticks, setTicks] = useState<Tick[]>([]);
  const tickIdRef = useRef(0);
  const prevPriceRef = useRef(currentPrice);

  useEffect(() => {
    let alive = true;

    async function refresh() {
      const data = await loadOrderbook(ticker);
      if (alive && data) setBook(data);
    }

    refresh();
    const interval = setInterval(refresh, 3000);
    return () => { alive = false; clearInterval(interval); };
  }, [ticker]);

  useEffect(() => {
    if (!book) return;
    const interval = setInterval(() => {
      tickIdRef.current += 1;
      setTicks(prev => [makeTick(book, tickIdRef.current), ...prev.slice(0, 11)]);
    }, 1000);
    return () => clearInterval(interval);
  }, [book]);

  useEffect(() => {
    if (currentPrice !== prevPriceRef.current && book) {
      prevPriceRef.current = currentPrice;
    }
  }, [currentPrice, book]);

  const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(n);

  if (!book) {
    return (
      <div className="bg-card rounded-3xl border border-border/50 shadow-sm p-6 flex items-center justify-center gap-3">
        <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        <span className="text-sm text-muted-foreground font-medium">호가 데이터 불러오는 중...</span>
      </div>
    );
  }

  const { asks, bids, totalAskQty, totalBidQty } = book;
  const display = { asks: asks.slice(0, 5), bids: bids.slice(0, 5) };
  const maxQty  = Math.max(
    ...display.asks.map(a => a.qty),
    ...display.bids.map(b => b.qty),
    1
  );
  const totalQty  = totalAskQty + totalBidQty || 1;
  const bidRatio  = Math.round((totalBidQty / totalQty) * 100);

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4">
      {/* ── 호가창 ── */}
      <div className="bg-card rounded-3xl border border-border/50 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-extrabold text-foreground">호가창</h3>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[9px] font-extrabold text-green-600">KIS LIVE</span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-bold">
            <span className="text-down">{100 - bidRatio}%</span>
            <span className="text-muted-foreground">매도</span>
            <span className="text-muted-foreground mx-1">vs</span>
            <span className="text-muted-foreground">매수</span>
            <span className="text-up">{bidRatio}%</span>
          </div>
        </div>

        <div className="grid grid-cols-3 px-5 pb-1 text-[10px] font-bold text-muted-foreground">
          <span>잔량</span>
          <span className="text-center">호가</span>
          <span className="text-right">잔량</span>
        </div>

        {/* 매도 호가 (파랑) */}
        {display.asks.map((ask, i) => (
          <div key={`ask-${i}`} className="grid grid-cols-3 items-center px-5 py-[5px] relative">
            <div
              className="absolute left-0 top-0 bottom-0 bg-blue-50 dark:bg-blue-950/30 transition-all duration-500"
              style={{ width: `${(ask.qty / maxQty) * 50}%` }}
            />
            <span className="relative z-10 text-xs text-muted-foreground">{fmt(ask.qty)}</span>
            <span className="relative z-10 text-center text-xs font-extrabold text-down">{fmt(ask.price)}</span>
            <span className="relative z-10 text-right" />
          </div>
        ))}

        {/* 현재가 구분선 */}
        <div className="mx-4 my-1 flex items-center gap-2">
          <div className="flex-1 h-px bg-border/40" />
          <div className={cn(
            "px-3 py-0.5 rounded-full text-[11px] font-extrabold",
            currentPrice > (bids[0]?.price ?? 0) ? "bg-up-light text-up" : "bg-down-light text-down"
          )}>
            {fmt(currentPrice)}원
          </div>
          <div className="flex-1 h-px bg-border/40" />
        </div>

        {/* 매수 호가 (빨강) */}
        {display.bids.map((bid, i) => (
          <div key={`bid-${i}`} className="grid grid-cols-3 items-center px-5 py-[5px] relative">
            <span className="relative z-10 text-xs text-muted-foreground" />
            <span className="relative z-10 text-center text-xs font-extrabold text-up">{fmt(bid.price)}</span>
            <div className="relative z-10 flex justify-end">
              <div
                className="absolute right-0 top-0 bottom-0 bg-red-50 dark:bg-red-950/30 transition-all duration-500"
                style={{ width: `${(bid.qty / maxQty) * 50}%` }}
              />
              <span className="relative text-xs text-muted-foreground">{fmt(bid.qty)}</span>
            </div>
          </div>
        ))}

        {/* 매수/매도 에너지 바 */}
        <div className="px-5 py-4 border-t border-border/30 bg-muted/20 mt-1">
          <div className="flex items-center justify-between text-[11px] font-bold mb-2">
            <span className="text-down">매도 압력</span>
            <span className="text-muted-foreground text-[10px]">실시간 에너지</span>
            <span className="text-up">매수 압력</span>
          </div>
          <div className="relative h-7 flex rounded-xl overflow-hidden bg-muted">
            <motion.div
              className="h-full bg-down flex items-center justify-start pl-2"
              animate={{ width: `${100 - bidRatio}%` }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            >
              {(100 - bidRatio) > 18 && (
                <span className="text-white text-[10px] font-extrabold whitespace-nowrap">{100 - bidRatio}%</span>
              )}
            </motion.div>
            <motion.div
              className="h-full bg-up flex items-center justify-end pr-2 ml-auto"
              animate={{ width: `${bidRatio}%` }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            >
              {bidRatio > 18 && (
                <span className="text-white text-[10px] font-extrabold whitespace-nowrap">{bidRatio}%</span>
              )}
            </motion.div>
          </div>
          <div className="flex justify-between mt-2 text-[10px] font-semibold text-muted-foreground">
            <span>총 매도 <span className="text-down font-bold">{fmt(totalAskQty)}주</span></span>
            <span>총 매수 <span className="text-up font-bold">{fmt(totalBidQty)}주</span></span>
          </div>
        </div>
      </div>

      {/* ── 실시간 체결내역 ── */}
      <div className="bg-card rounded-3xl border border-border/50 shadow-sm overflow-hidden w-full md:w-[180px]">
        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-foreground">체결내역</h3>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[9px] font-extrabold text-red-500">LIVE</span>
          </div>
        </div>
        <div className="grid grid-cols-3 px-4 pb-1 text-[9px] font-bold text-muted-foreground">
          <span>시간</span>
          <span className="text-right">가격</span>
          <span className="text-right">수량</span>
        </div>
        <div className="overflow-hidden px-4 pb-4 space-y-0.5" style={{ maxHeight: 300 }}>
          <AnimatePresence initial={false}>
            {ticks.map(tick => (
              <motion.div
                key={tick.id}
                initial={{ opacity: 0, y: -14, backgroundColor: tick.isBuy ? "#FEE2E2" : "#DBEAFE" }}
                animate={{ opacity: 1, y: 0, backgroundColor: "rgba(0,0,0,0)" }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-3 text-[10px] py-[3px]"
              >
                <span className="text-muted-foreground font-medium">{tick.time.slice(-5)}</span>
                <span className={cn("text-right font-extrabold", tick.isBuy ? "text-up" : "text-down")}>
                  {fmt(tick.price)}
                </span>
                <span className={cn("text-right font-bold", tick.isBuy ? "text-up/70" : "text-down/70")}>
                  {tick.qty}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
