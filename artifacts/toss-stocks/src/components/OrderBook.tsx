import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface OrderBookProps {
  ticker: string;
  currentPrice: number;
}

interface Level {
  price: number;
  qty: number;
}

interface Tick {
  id: number;
  time: string;
  price: number;
  qty: number;
  isBuy: boolean;
  isNew?: boolean;
}

function generateOrderBook(currentPrice: number, ticker: string, seed: number) {
  const tickSize =
    currentPrice < 10000 ? 50 : currentPrice < 50000 ? 100 : currentPrice < 100000 ? 500 : 1000;
  const asks: Level[] = [];
  const bids: Level[] = [];
  const hash = (ticker + seed).split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  for (let i = 1; i <= 5; i++) {
    const askPrice = currentPrice + tickSize * i;
    const bidPrice = currentPrice - tickSize * i;
    const baseQty = ((hash * i * 37) % 8000) + 500;
    asks.push({ price: askPrice, qty: Math.round(baseQty + ((hash * i * 7 + seed * 3) % 3000)) });
    bids.push({ price: bidPrice, qty: Math.round(baseQty + ((hash * i * 11 + seed * 7) % 3000)) });
  }
  return { asks: asks.reverse(), bids };
}

function makeNewTick(currentPrice: number, ticker: string, id: number): Tick {
  const tickSize =
    currentPrice < 10000 ? 50 : currentPrice < 50000 ? 100 : currentPrice < 100000 ? 500 : 1000;
  const hash = (ticker + id * 17 + id).split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const isBuy = hash % 3 !== 0;
  const offset = ((hash % 3) - 1) * tickSize;
  const price = currentPrice + offset;
  const qty = (hash % 800) + 5;
  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
  return { id, time, price, qty, isBuy, isNew: true };
}

export function OrderBook({ ticker, currentPrice }: OrderBookProps) {
  const [seed, setSeed] = useState(0);
  const [book, setBook] = useState(() => generateOrderBook(currentPrice, ticker, 0));
  const [ticks, setTicks] = useState<Tick[]>(() =>
    Array.from({ length: 8 }, (_, i) => makeNewTick(currentPrice, ticker, i))
  );
  const tickIdRef = useRef(100);

  useEffect(() => {
    const id = setInterval(() => {
      setSeed((s) => {
        const next = s + 1;
        setBook(generateOrderBook(currentPrice, ticker, next));
        return next;
      });

      tickIdRef.current += 1;
      const newTick = makeNewTick(currentPrice, ticker, tickIdRef.current);
      setTicks((prev) => [newTick, ...prev.slice(0, 11)]);
    }, 1200);
    return () => clearInterval(id);
  }, [currentPrice, ticker]);

  const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(n);
  const maxQty = Math.max(...book.asks.map((a) => a.qty), ...book.bids.map((b) => b.qty));
  const totalAskQty = book.asks.reduce((s, a) => s + a.qty, 0);
  const totalBidQty = book.bids.reduce((s, b) => s + b.qty, 0);
  const totalQty = totalAskQty + totalBidQty;
  const bidRatio = Math.round((totalBidQty / totalQty) * 100);

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4">
      {/* ── 호가창 + 에너지 바 ── */}
      <div className="bg-card rounded-3xl border border-border/50 shadow-sm overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <h3 className="text-base font-extrabold text-foreground">호가창</h3>
          <div className="flex items-center gap-1 text-[11px] font-bold">
            <span className="text-down">{100 - bidRatio}%</span>
            <span className="text-muted-foreground">매도</span>
            <span className="text-muted-foreground mx-1">vs</span>
            <span className="text-muted-foreground">매수</span>
            <span className="text-up">{bidRatio}%</span>
          </div>
        </div>

        {/* 컬럼 헤더 */}
        <div className="grid grid-cols-3 px-5 pb-1 text-[10px] font-bold text-muted-foreground">
          <span>잔량</span>
          <span className="text-center">호가</span>
          <span className="text-right">잔량</span>
        </div>

        {/* 매도 호가 (파랑) */}
        {book.asks.map((ask, i) => (
          <div key={`ask-${i}`} className="grid grid-cols-3 items-center px-5 py-[5px] relative">
            <div
              className="absolute left-0 top-0 bottom-0 bg-blue-50 transition-all duration-700"
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
          <div className="px-3 py-0.5 rounded-full text-[11px] font-extrabold bg-up-light text-up">
            {fmt(currentPrice)}원
          </div>
          <div className="flex-1 h-px bg-border/40" />
        </div>

        {/* 매수 호가 (빨강) */}
        {book.bids.map((bid, i) => (
          <div key={`bid-${i}`} className="grid grid-cols-3 items-center px-5 py-[5px] relative">
            <span className="relative z-10 text-xs text-muted-foreground" />
            <span className="relative z-10 text-center text-xs font-extrabold text-up">{fmt(bid.price)}</span>
            <div className="relative z-10 flex justify-end">
              <div
                className="absolute right-0 top-0 bottom-0 bg-red-50 transition-all duration-700"
                style={{ width: `${(bid.qty / maxQty) * 50}%` }}
              />
              <span className="relative text-xs text-muted-foreground">{fmt(bid.qty)}</span>
            </div>
          </div>
        ))}

        {/* ── 매수/매도 에너지 바 ── */}
        <div className="px-5 py-4 border-t border-border/30 bg-muted/20 mt-1">
          <div className="flex items-center justify-between text-[11px] font-bold mb-2">
            <span className="text-down">매도 압력</span>
            <span className="text-muted-foreground text-[10px]">실시간 에너지</span>
            <span className="text-up">매수 압력</span>
          </div>

          <div className="relative h-7 flex rounded-xl overflow-hidden bg-muted">
            {/* 매도 (파랑) — 왼쪽 */}
            <motion.div
              className="h-full bg-down flex items-center justify-start pl-2"
              animate={{ width: `${100 - bidRatio}%` }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
            >
              {(100 - bidRatio) > 18 && (
                <span className="text-white text-[10px] font-extrabold whitespace-nowrap">
                  {100 - bidRatio}%
                </span>
              )}
            </motion.div>

            {/* 매수 (빨강) — 오른쪽 */}
            <motion.div
              className="h-full bg-up flex items-center justify-end pr-2 ml-auto"
              animate={{ width: `${bidRatio}%` }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
            >
              {bidRatio > 18 && (
                <span className="text-white text-[10px] font-extrabold whitespace-nowrap">
                  {bidRatio}%
                </span>
              )}
            </motion.div>
          </div>

          {/* 총 잔량 수치 */}
          <div className="flex justify-between mt-2 text-[10px] font-semibold text-muted-foreground">
            <span>총 매도 <span className="text-down font-bold">{fmt(totalAskQty)}주</span></span>
            <span>총 매수 <span className="text-up font-bold">{fmt(totalBidQty)}주</span></span>
          </div>
        </div>
      </div>

      {/* ── 실시간 체결 내역 TICK ── */}
      <div className="bg-card rounded-3xl border border-border/50 shadow-sm overflow-hidden w-full md:w-[180px]">
        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-foreground">체결내역</h3>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[9px] font-extrabold text-red-500">LIVE</span>
          </div>
        </div>

        {/* 컬럼 헤더 */}
        <div className="grid grid-cols-3 px-4 pb-1 text-[9px] font-bold text-muted-foreground">
          <span>시간</span>
          <span className="text-right">가격</span>
          <span className="text-right">수량</span>
        </div>

        <div className="overflow-hidden px-4 pb-4 space-y-0.5" style={{ maxHeight: 300 }}>
          <AnimatePresence initial={false}>
            {ticks.map((tick) => (
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
