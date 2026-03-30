import { useGetStocks } from "@workspace/api-client-react";
import { MarketSummary } from "@/components/MarketSummary";
import { formatCurrency, formatPercent, getColorClass } from "@/lib/utils";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Flame, TrendingUp, DollarSign, Calendar, Star } from "lucide-react";
import { useWatchlist } from "@/hooks/use-watchlist";

type TabType = "volume_amount" | "volume_count" | "top_gainers" | "earnings";

const EARNINGS_STOCKS = [
  { ticker: "005930", name: "삼성전자", date: "2026-04-30", expectedEps: "1,850", sector: "반도체" },
  { ticker: "000660", name: "SK하이닉스", date: "2026-04-24", expectedEps: "12,400", sector: "반도체" },
  { ticker: "035420", name: "NAVER", date: "2026-05-08", expectedEps: "3,200", sector: "IT서비스" },
  { ticker: "051910", name: "LG화학", date: "2026-04-29", expectedEps: "8,900", sector: "화학" },
];

function StarButton({ ticker }: { ticker: string }) {
  const { isWatched, toggleWatch } = useWatchlist();
  const watched = isWatched(ticker);

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleWatch(ticker);
      }}
      className={cn(
        "p-1.5 rounded-xl transition-all hover:scale-110 active:scale-95 flex-shrink-0",
        watched ? "text-yellow-400" : "text-muted-foreground/30 hover:text-yellow-300"
      )}
      aria-label={watched ? "관심 해제" : "관심 등록"}
    >
      <Star className={cn("w-4.5 h-4.5", watched && "fill-yellow-400")} style={{ width: 18, height: 18 }} />
    </button>
  );
}

function StockRow({ stock, index, showVolume }: { stock: any; index: number; showVolume?: string }) {
  const isPositive = stock.changePercent >= 0;
  return (
    <div className="flex items-center border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors group">
      <StarButton ticker={stock.ticker} />
      <Link href={`/stock/${stock.ticker}`} className="flex items-center justify-between flex-1 px-3 py-4">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.04 }}
          className="flex items-center justify-between w-full"
        >
          <div className="flex items-center gap-3">
            <span className="w-6 text-center text-sm font-bold text-muted-foreground">{index + 1}</span>
            <div className="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-900 rounded-full flex items-center justify-center text-white font-extrabold text-base shadow-inner group-hover:scale-105 transition-transform flex-shrink-0">
              {stock.name.charAt(0)}
            </div>
            <div>
              <p className="font-bold text-foreground group-hover:text-primary transition-colors">{stock.name}</p>
              <p className="text-xs text-muted-foreground font-semibold">{stock.ticker}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-extrabold text-foreground">{formatCurrency(stock.currentPrice)}</p>
            <p className={cn("text-xs font-bold", getColorClass(stock.changePercent))}>
              {isPositive ? "▲" : "▼"} {formatPercent(stock.changePercent)}
            </p>
            {showVolume && (
              <p className="text-xs text-muted-foreground font-medium mt-0.5">{showVolume}</p>
            )}
          </div>
        </motion.div>
      </Link>
    </div>
  );
}

export default function Home() {
  const { data: stocks, isLoading } = useGetStocks();
  const [activeTab, setActiveTab] = useState<TabType>("volume_amount");

  const tabs = [
    { id: "volume_amount" as TabType, label: "거래대금", icon: DollarSign },
    { id: "volume_count" as TabType, label: "거래량", icon: TrendingUp },
    { id: "top_gainers" as TabType, label: "급상승", icon: Flame },
    { id: "earnings" as TabType, label: "실적 예정", icon: Calendar },
  ];

  const sorted = stocks ? [...stocks] : [];
  let displayStocks = sorted;
  if (activeTab === "volume_amount") {
    displayStocks = sorted.sort((a, b) => b.currentPrice * b.volume - a.currentPrice * a.volume);
  } else if (activeTab === "volume_count") {
    displayStocks = sorted.sort((a, b) => b.volume - a.volume);
  } else if (activeTab === "top_gainers") {
    displayStocks = sorted.sort((a, b) => b.changePercent - a.changePercent);
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* 시장 지수 */}
      <section>
        <MarketSummary />
      </section>

      {/* 주식 목록 탭 */}
      <section>
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-xl font-extrabold text-foreground">실시간 시장</h2>
          <Link href="/watchlist" className="flex items-center gap-1 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors">
            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
            관심 종목
          </Link>
        </div>

        {/* 탭 선택 */}
        <div className="flex gap-1 bg-muted p-1.5 rounded-2xl mb-4 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all duration-200 min-w-[80px]",
                activeTab === tab.id
                  ? "bg-white text-red-600 shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-card rounded-3xl border border-border/50 shadow-sm overflow-hidden">
          {activeTab === "earnings" ? (
            isLoading ? (
              <div className="p-8 flex justify-center">
                <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              </div>
            ) : (
              <div>
                {EARNINGS_STOCKS.map((item, i) => {
                  const stock = stocks?.find(s => s.ticker === item.ticker);
                  return (
                    <div key={item.ticker} className="flex items-center border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors group">
                      <StarButton ticker={item.ticker} />
                      <Link href={`/stock/${item.ticker}`} className="flex items-center justify-between flex-1 px-3 py-4">
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-center justify-between w-full"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 text-center text-sm font-bold text-muted-foreground">{i + 1}</span>
                            <div className="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-900 rounded-full flex items-center justify-center text-white font-extrabold text-base shadow-inner group-hover:scale-105 transition-transform flex-shrink-0">
                              {item.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-foreground group-hover:text-primary transition-colors">{item.name}</p>
                              <p className="text-xs text-muted-foreground font-semibold">{item.sector}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            {stock && (
                              <p className="font-extrabold text-foreground">{formatCurrency(stock.currentPrice)}</p>
                            )}
                            <div className="flex items-center gap-1.5 justify-end mt-0.5">
                              <Calendar className="w-3 h-3 text-orange-500" />
                              <p className="text-xs font-bold text-orange-500">{item.date} 예정</p>
                            </div>
                            <p className="text-xs text-muted-foreground font-medium">예상 EPS {item.expectedEps}원</p>
                          </div>
                        </motion.div>
                      </Link>
                    </div>
                  );
                })}
              </div>
            )
          ) : isLoading ? (
            <div className="p-8 flex justify-center">
              <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
          ) : (
            displayStocks.map((stock, i) => {
              const volumeLabel =
                activeTab === "volume_amount"
                  ? `거래대금 ${(stock.currentPrice * stock.volume / 100000000).toFixed(0)}억`
                  : activeTab === "volume_count"
                  ? `거래량 ${stock.volume.toLocaleString("ko-KR")}주`
                  : undefined;
              return (
                <StockRow key={stock.ticker} stock={stock} index={i} showVolume={volumeLabel} />
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
