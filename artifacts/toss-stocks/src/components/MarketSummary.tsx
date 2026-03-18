import { useGetMarketSummary } from "@workspace/api-client-react";
import { formatPercent, cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function MarketSummary() {
  const { data: summary, isLoading } = useGetMarketSummary();

  if (isLoading || !summary) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="min-w-[140px] h-24 bg-card rounded-2xl animate-pulse shadow-sm" />
        ))}
      </div>
    );
  }

  const indices = [
    summary.kospi,
    summary.kosdaq,
    summary.usdKrw,
    summary.sp500,
    summary.nasdaq,
  ];

  return (
    <div className="w-full">
      <h2 className="text-xl font-bold mb-4 px-1">시장 지수</h2>
      <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide snap-x">
        {indices.map((index, i) => {
          const isPositive = index.change > 0;
          const isNegative = index.change < 0;
          
          return (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              key={index.name}
              className="min-w-[140px] md:min-w-[160px] bg-card p-4 rounded-2xl shadow-sm border border-border/50 snap-start flex-1 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <h3 className="text-sm font-medium text-muted-foreground">{index.name}</h3>
              <div className="mt-2 font-bold text-lg">
                {new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 2 }).format(index.value)}
              </div>
              <div
                className={cn(
                  "text-sm font-medium mt-1 flex items-center gap-1",
                  isPositive ? "text-primary" : isNegative ? "text-destructive" : "text-muted-foreground"
                )}
              >
                <span>{isPositive ? "▲" : isNegative ? "▼" : "-"}</span>
                <span>{Math.abs(index.change)}</span>
                <span className="opacity-80 ml-0.5">({formatPercent(index.changePercent)})</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
