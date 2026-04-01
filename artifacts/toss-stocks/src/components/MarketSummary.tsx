import { useGetMarketSummary } from "@workspace/api-client-react";
import { formatPercent, getColorClass } from "@/lib/utils";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export function MarketSummary() {
  const { data: summary, isLoading } = useGetMarketSummary();

  if (isLoading || !summary) {
    return (
      <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="min-w-[148px] h-[84px] bg-card rounded-xl animate-pulse border border-border/50" />
        ))}
      </div>
    );
  }

  const indices = [
    { ...summary.kospi, id: "kospi" },
    { ...summary.kosdaq, id: "kosdaq" },
    { ...summary.usdKrw, id: "usdkrw" },
    { ...summary.sp500, id: "sp500" },
    { ...summary.nasdaq, id: "nasdaq" },
  ];

  return (
    <div className="w-full">
      <h2 className="text-sm font-semibold text-muted-foreground mb-2.5 px-0.5 uppercase tracking-wider">시장 지수</h2>
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
        {indices.map((index, i) => {
          const up = index.change > 0;
          const down = index.change < 0;
          return (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              key={index.id}
              className={cn(
                "min-w-[148px] bg-card px-4 py-3 rounded-xl border transition-all duration-200 cursor-pointer hover:shadow-sm hover:-translate-y-0.5 flex-1",
                up ? "border-border/50 hover:border-primary/20" :
                down ? "border-border/50 hover:border-secondary/20" :
                "border-border/50"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-semibold text-muted-foreground">{index.name}</p>
                <div className={cn(
                  "w-5 h-5 rounded-md flex items-center justify-center",
                  up ? "bg-up-light" : down ? "bg-down-light" : "bg-muted"
                )}>
                  {up ? (
                    <TrendingUp className="w-2.5 h-2.5 text-up" />
                  ) : down ? (
                    <TrendingDown className="w-2.5 h-2.5 text-down" />
                  ) : (
                    <Minus className="w-2.5 h-2.5 text-muted-foreground" />
                  )}
                </div>
              </div>
              <p className="font-bold text-[15px] tracking-tight text-foreground leading-none mb-1.5">
                {new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 2 }).format(index.value)}
              </p>
              <p className={cn("text-[11px] font-semibold", getColorClass(index.change))}>
                {up ? "+" : ""}{index.change > 0 ? index.change : Math.abs(index.change) > 0 ? "-" + index.change.toFixed(2) : "0"}
                <span className="ml-1 opacity-70">({formatPercent(index.changePercent)})</span>
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
