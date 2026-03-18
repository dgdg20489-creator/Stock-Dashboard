import { useGetStocks } from "@workspace/api-client-react";
import { formatCurrency, formatPercent, cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface StockListProps {
  onSelectStock: (ticker: string) => void;
}

export function StockList({ onSelectStock }: StockListProps) {
  const { data: stocks, isLoading } = useGetStocks();

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl p-2 shadow-sm">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center justify-between p-4 border-b border-border/50 last:border-0 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted" />
              <div>
                <div className="w-24 h-5 bg-muted rounded mb-1" />
                <div className="w-16 h-4 bg-muted rounded" />
              </div>
            </div>
            <div className="text-right">
              <div className="w-20 h-5 bg-muted rounded mb-1 ml-auto" />
              <div className="w-12 h-4 bg-muted rounded ml-auto" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!stocks?.length) {
    return (
      <div className="bg-card rounded-2xl p-12 text-center shadow-sm">
        <p className="text-muted-foreground">주식 정보가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className="text-xl font-bold">인기 주식</h2>
        <button className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          더보기
        </button>
      </div>
      
      <div className="bg-card rounded-2xl shadow-sm border border-border/50 overflow-hidden">
        {stocks.map((stock, i) => {
          const isPositive = stock.change > 0;
          const isNegative = stock.change < 0;
          
          return (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              key={stock.ticker}
              onClick={() => onSelectStock(stock.ticker)}
              className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors cursor-pointer border-b border-border/50 last:border-0"
            >
              <div className="flex items-center gap-3 md:gap-4">
                <div className={cn(
                  "w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-white font-bold shadow-inner",
                  // Generate pseudo-random gradient based on ticker string
                  `bg-gradient-to-br from-gray-700 to-gray-900` 
                )}>
                  {stock.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-base md:text-lg">{stock.name}</h3>
                  <p className="text-xs md:text-sm text-muted-foreground">{stock.ticker}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-base md:text-lg text-foreground">
                  {formatCurrency(stock.currentPrice)}
                </div>
                <div
                  className={cn(
                    "text-sm font-medium mt-0.5",
                    isPositive ? "text-primary" : isNegative ? "text-destructive" : "text-muted-foreground"
                  )}
                >
                  {formatPercent(stock.changePercent)}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
