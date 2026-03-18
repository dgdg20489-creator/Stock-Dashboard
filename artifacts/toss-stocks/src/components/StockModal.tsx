import { useGetStockByTicker } from "@workspace/api-client-react";
import { formatCurrency, formatPercent, formatLargeNumber, cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, Share } from "lucide-react";
import { StockChart } from "./StockChart";
import { useEffect } from "react";

interface StockModalProps {
  ticker: string | null;
  onClose: () => void;
}

export function StockModal({ ticker, onClose }: StockModalProps) {
  const { data: stock, isLoading } = useGetStockByTicker(ticker || "", {
    query: { enabled: !!ticker }
  });

  // Lock body scroll when modal is open
  useEffect(() => {
    if (ticker) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [ticker]);

  return (
    <AnimatePresence>
      {ticker && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:bottom-auto w-full md:w-[480px] md:max-h-[85vh] bg-card rounded-t-3xl md:rounded-3xl z-50 overflow-hidden shadow-2xl flex flex-col"
          >
            {/* Draggable handle for mobile */}
            <div className="w-full flex justify-center pt-3 pb-1 md:hidden">
              <div className="w-12 h-1.5 bg-border rounded-full" />
            </div>

            {isLoading || !stock ? (
              <div className="p-6 md:p-8 h-[60vh] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              </div>
            ) : (
              <div className="flex flex-col h-full overflow-y-auto scrollbar-hide max-h-[80vh]">
                <div className="p-6 pb-0 flex items-center justify-between sticky top-0 bg-card z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-900 rounded-full flex items-center justify-center text-white font-bold shadow-inner">
                      {stock.name.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-foreground leading-tight">{stock.name}</h2>
                      <p className="text-sm font-medium text-muted-foreground">{stock.ticker} · {stock.sector}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <button className="p-2 hover:bg-muted rounded-full transition-colors">
                      <Star className="w-5 h-5" />
                    </button>
                    <button className="p-2 hover:bg-muted rounded-full transition-colors">
                      <Share className="w-5 h-5" />
                    </button>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors hidden md:block">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <div className="mt-2">
                    <div className="text-4xl font-bold tracking-tight text-foreground">
                      {formatCurrency(stock.currentPrice)}
                    </div>
                    <div
                      className={cn(
                        "text-lg font-semibold mt-1 flex items-center gap-1.5",
                        stock.change > 0 ? "text-primary" : stock.change < 0 ? "text-destructive" : "text-muted-foreground"
                      )}
                    >
                      <span>{stock.change > 0 ? "▲" : stock.change < 0 ? "▼" : ""} {Math.abs(stock.change)}</span>
                      <span>({formatPercent(stock.changePercent)})</span>
                    </div>
                  </div>

                  <StockChart ticker={stock.ticker} isPositive={stock.change >= 0} />

                  <div className="mt-8 border-t border-border/50 pt-6">
                    <h3 className="text-lg font-bold mb-4">투자 정보</h3>
                    <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                      <Metric label="시가총액" value={formatLargeNumber(stock.marketCap)} />
                      <Metric label="거래량" value={formatLargeNumber(stock.volume)} />
                      <Metric label="52주 최고" value={formatCurrency(stock.high52w)} />
                      <Metric label="52주 최저" value={formatCurrency(stock.low52w)} />
                      <Metric label="PER" value={`${stock.per.toFixed(2)}배`} />
                      <Metric label="PBR" value={`${stock.pbr.toFixed(2)}배`} />
                      <Metric label="EPS" value={formatCurrency(stock.eps)} />
                      <Metric label="배당수익률" value={`${stock.dividendYield.toFixed(2)}%`} />
                    </div>
                  </div>
                  
                  <div className="mt-8 pt-4 pb-2">
                    <button 
                      className={cn(
                        "w-full py-4 rounded-xl font-bold text-lg transition-all active:scale-[0.98] shadow-lg text-white",
                        stock.change >= 0 ? "bg-primary hover:bg-primary/90 shadow-primary/25" : "bg-destructive hover:bg-destructive/90 shadow-destructive/25"
                      )}
                      onClick={() => alert('구매 데모')}
                    >
                      구매하기
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <span className="text-base font-bold text-foreground">{value}</span>
    </div>
  );
}
