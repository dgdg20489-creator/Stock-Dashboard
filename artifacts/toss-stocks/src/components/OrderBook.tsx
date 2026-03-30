import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface OrderBookProps {
  ticker: string;
  currentPrice: number;
}

interface Level {
  price: number;
  qty: number;
}

function generateOrderBook(currentPrice: number, ticker: string, seed: number) {
  const tickSize = currentPrice < 10000 ? 50 : currentPrice < 50000 ? 100 : currentPrice < 100000 ? 500 : 1000;
  const asks: Level[] = [];
  const bids: Level[] = [];

  const hash = (ticker + seed).split("").reduce((a, c) => a + c.charCodeAt(0), 0);

  for (let i = 1; i <= 5; i++) {
    const askPrice = currentPrice + tickSize * i;
    const bidPrice = currentPrice - tickSize * i;
    const baseQty = ((hash * i * 37) % 8000) + 500;
    const noise1 = ((hash * i * 7 + seed * 3) % 3000);
    const noise2 = ((hash * i * 11 + seed * 7) % 3000);
    asks.push({ price: askPrice, qty: Math.round(baseQty + noise1) });
    bids.push({ price: bidPrice, qty: Math.round(baseQty + noise2) });
  }

  return { asks: asks.reverse(), bids };
}

export function OrderBook({ ticker, currentPrice }: OrderBookProps) {
  const [seed, setSeed] = useState(0);
  const [book, setBook] = useState(() => generateOrderBook(currentPrice, ticker, 0));

  useEffect(() => {
    const id = setInterval(() => {
      setSeed((s) => {
        const next = s + 1;
        setBook(generateOrderBook(currentPrice, ticker, next));
        return next;
      });
    }, 1800);
    return () => clearInterval(id);
  }, [currentPrice, ticker]);

  useEffect(() => {
    setBook(generateOrderBook(currentPrice, ticker, seed));
  }, [currentPrice]);

  const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(n);
  const allQtys = [...book.asks.map((a) => a.qty), ...book.bids.map((b) => b.qty)];
  const maxQty = Math.max(...allQtys);

  const totalAskQty = book.asks.reduce((s, a) => s + a.qty, 0);
  const totalBidQty = book.bids.reduce((s, b) => s + b.qty, 0);
  const totalQty = totalAskQty + totalBidQty;
  const bidRatio = Math.round((totalBidQty / totalQty) * 100);

  return (
    <div className="bg-card rounded-3xl border border-border/50 shadow-sm overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <h3 className="text-base font-extrabold text-foreground">호가창</h3>
        <div className="flex items-center gap-2 text-xs font-bold">
          <span className="text-down">{100 - bidRatio}%</span>
          <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden flex">
            <div className="h-full bg-down" style={{ width: `${100 - bidRatio}%` }} />
            <div className="h-full bg-up flex-1" />
          </div>
          <span className="text-up">{bidRatio}%</span>
        </div>
      </div>

      {/* 컬럼 헤더 */}
      <div className="grid grid-cols-3 px-5 pb-1.5 text-[10px] font-bold text-muted-foreground">
        <span>잔량</span>
        <span className="text-center">호가</span>
        <span className="text-right">잔량</span>
      </div>

      {/* 매도 호가 (파랑) */}
      {book.asks.map((ask, i) => (
        <div
          key={`ask-${i}`}
          className="grid grid-cols-3 items-center px-5 py-1.5 relative hover:bg-blue-50/50 transition-colors"
        >
          {/* 매도 잔량 바 (왼쪽) */}
          <div className="flex justify-start">
            <div
              className="absolute left-0 top-0 bottom-0 bg-blue-50"
              style={{ width: `${(ask.qty / maxQty) * 48}%` }}
            />
          </div>
          <span className="relative z-10 text-xs text-muted-foreground">{fmt(ask.qty)}</span>
          <span className="relative z-10 text-center text-xs font-extrabold text-down">{fmt(ask.price)}</span>
          <span className="relative z-10 text-right" />
        </div>
      ))}

      {/* 현재가 구분선 */}
      <div className="mx-5 my-1 flex items-center gap-2">
        <div className="flex-1 h-px bg-border/50" />
        <div className={cn(
          "px-3 py-1 rounded-full text-xs font-extrabold",
          currentPrice > 0 ? "bg-up-light text-up" : "bg-down-light text-down"
        )}>
          {fmt(currentPrice)}원 현재가
        </div>
        <div className="flex-1 h-px bg-border/50" />
      </div>

      {/* 매수 호가 (빨강) */}
      {book.bids.map((bid, i) => (
        <div
          key={`bid-${i}`}
          className="grid grid-cols-3 items-center px-5 py-1.5 relative hover:bg-red-50/50 transition-colors"
        >
          <span className="relative z-10 text-xs text-muted-foreground" />
          <span className="relative z-10 text-center text-xs font-extrabold text-up">{fmt(bid.price)}</span>
          <div className="relative z-10 flex justify-end">
            <div
              className="absolute right-0 top-0 bottom-0 bg-red-50"
              style={{ width: `${(bid.qty / maxQty) * 48}%` }}
            />
            <span className="relative text-xs text-muted-foreground">{fmt(bid.qty)}</span>
          </div>
        </div>
      ))}

      {/* 하단 총 잔량 */}
      <div className="flex items-center justify-between px-5 py-3 mt-1 border-t border-border/30 bg-muted/30">
        <div className="text-center flex-1">
          <p className="text-[10px] text-muted-foreground font-semibold">총 매도잔량</p>
          <p className="text-xs font-extrabold text-down">{fmt(totalAskQty)}주</p>
        </div>
        <div className="w-px h-8 bg-border" />
        <div className="text-center flex-1">
          <p className="text-[10px] text-muted-foreground font-semibold">총 매수잔량</p>
          <p className="text-xs font-extrabold text-up">{fmt(totalBidQty)}주</p>
        </div>
      </div>
    </div>
  );
}
