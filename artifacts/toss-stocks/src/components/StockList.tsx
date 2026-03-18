import { useGetStocks } from "@workspace/api-client-react";
import { formatCurrency, formatPercent, getColorClass } from "@/lib/utils";
import { motion } from "framer-motion";
import { Link } from "wouter";

export function StockList() {
  const { data: stocks, isLoading } = useGetStocks();

  if (isLoading) {
    return (
      <div className="bg-card rounded-3xl p-4 shadow-sm">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center justify-between p-4 border-b border-border/50 last:border-0 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-muted" />
              <div>
                <div className="w-24 h-5 bg-muted rounded mb-2" />
                <div className="w-16 h-4 bg-muted rounded" />
              </div>
            </div>
            <div className="text-right">
              <div className="w-20 h-5 bg-muted rounded mb-2 ml-auto" />
              <div className="w-12 h-4 bg-muted rounded ml-auto" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!stocks?.length) return null;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className="text-xl font-bold text-foreground">인기 주식</h2>
      </div>
      
      <div className="bg-card rounded-3xl shadow-sm border border-border/50 overflow-hidden">
        {stocks.map((stock, i) => (
          <Link key={stock.ticker} href={`/stock/${stock.ticker}`}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center justify-between p-5 hover:bg-muted/40 transition-colors cursor-pointer border-b border-border/50 last:border-0 group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white font-bold text-lg shadow-inner group-hover:scale-105 transition-transform">
                  {stock.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-lg group-hover:text-primary transition-colors">{stock.name}</h3>
                  <p className="text-sm font-medium text-muted-foreground">{stock.ticker}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-lg text-foreground">
                  {formatCurrency(stock.currentPrice)}
                </div>
                <div className={`text-sm font-bold mt-0.5 ${getColorClass(stock.change)}`}>
                  {formatPercent(stock.changePercent)}
                </div>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}
