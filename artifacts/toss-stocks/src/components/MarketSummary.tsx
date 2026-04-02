import { useGetMarketSummary } from "@workspace/api-client-react";
import { formatPercent } from "@/lib/utils";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const INDEX_META: Record<string, { label: string; emoji: string }> = {
  kospi:  { label: "KOSPI",   emoji: "🇰🇷" },
  kosdaq: { label: "KOSDAQ",  emoji: "🇰🇷" },
  usdkrw: { label: "USD/KRW", emoji: "💱" },
  sp500:  { label: "S&P 500", emoji: "🇺🇸" },
  nasdaq: { label: "NASDAQ",  emoji: "🇺🇸" },
};

export function MarketSummary() {
  const { data: summary, isLoading } = useGetMarketSummary();

  if (isLoading || !summary) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="min-w-[160px] h-[100px] bg-card rounded-2xl animate-pulse border border-border/40" />
        ))}
      </div>
    );
  }

  const indices = [
    { ...summary.kospi,  id: "kospi"  },
    { ...summary.kosdaq, id: "kosdaq" },
    { ...summary.usdKrw, id: "usdkrw" },
    { ...summary.sp500,  id: "sp500"  },
    { ...summary.nasdaq, id: "nasdaq" },
  ];

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-3 px-0.5">
        <span className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-widest">시장 지수</span>
        <div className="flex-1 h-px bg-border/40" />
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
        {indices.map((index, i) => {
          const up   = index.changePercent > 0;
          const down = index.changePercent < 0;
          const meta = INDEX_META[index.id] ?? { label: index.name, emoji: "📊" };

          return (
            <motion.div
              key={index.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, type: "spring", stiffness: 260, damping: 24 }}
              className={cn(
                "relative min-w-[155px] flex-1 rounded-2xl px-4 pt-3.5 pb-3 overflow-hidden",
                "border transition-all duration-200 cursor-pointer group",
                up   ? "bg-gradient-to-br from-red-50 to-rose-50/40 border-red-100 hover:border-red-200 hover:shadow-md hover:shadow-red-100/60"
                     : down ? "bg-gradient-to-br from-blue-50 to-sky-50/40 border-blue-100 hover:border-blue-200 hover:shadow-md hover:shadow-blue-100/60"
                     : "bg-gradient-to-br from-card to-muted/20 border-border/50 hover:shadow-sm"
              )}
            >
              {/* 헤더 */}
              <div className="flex items-center gap-1.5 mb-2.5">
                <span className="text-sm leading-none">{meta.emoji}</span>
                <span className="text-[11px] font-bold text-muted-foreground tracking-wide">{meta.label}</span>
              </div>

              {/* 현재값 */}
              <p className="font-extrabold text-[17px] tracking-tight text-foreground leading-none mb-1.5 tabular-nums">
                {new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 2 }).format(index.value)}
              </p>

              {/* 등락 */}
              <div className="flex items-baseline gap-1.5">
                <span className={cn(
                  "text-[12px] font-bold tabular-nums",
                  up ? "text-up" : down ? "text-down" : "text-muted-foreground"
                )}>
                  {up ? "▲" : down ? "▼" : "–"} {formatPercent(Math.abs(index.changePercent))}
                </span>
                <span className={cn(
                  "text-[10px] font-semibold tabular-nums",
                  up ? "text-up/60" : down ? "text-down/60" : "text-muted-foreground/50"
                )}>
                  {up ? "+" : down ? "-" : ""}{Math.abs(index.change).toFixed(2)}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
