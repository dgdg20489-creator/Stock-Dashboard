import { useGetStocks } from "@workspace/api-client-react";
import { MarketSummary } from "@/components/MarketSummary";
import { NewsSection } from "@/components/NewsSection";
import { formatCurrency, formatPercent, getColorClass } from "@/lib/utils";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Flame, TrendingUp, DollarSign, Calendar, Star, Search, X, Rocket } from "lucide-react";
import { useWatchlist } from "@/hooks/use-watchlist";
import { StockLogo } from "@/components/StockLogo";

type TabType = "volume_amount" | "volume_count" | "top_gainers" | "ipo";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface IpoStock {
  ticker: string;
  name: string;
  market: string;
  ipoPrice: number | null;
  listingDate: string;
  subscriptionStart: string | null;
  subscriptionEnd: string | null;
  status: "upcoming" | "listed";
}

interface RankItem {
  rank: number;
  ticker: string;
  name: string;
  price: number;
  changePercent: number;
  volume: number;
  tradeAmount: number;
  market: string | null;
  updatedAt: string;
}

function StarButton({ ticker }: { ticker: string }) {
  const { isWatched, toggleWatch } = useWatchlist();
  const watched = isWatched(ticker);
  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWatch(ticker); }}
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

function RankRow({ item, index }: { item: RankItem; index: number }) {
  const isPositive = item.changePercent >= 0;
  return (
    <div className="flex items-center border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors group">
      <StarButton ticker={item.ticker} />
      <Link href={`/stock/${item.ticker}`} className="flex items-center justify-between flex-1 px-3 py-4">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.02 }}
          className="flex items-center justify-between w-full"
        >
          <div className="flex items-center gap-3">
            <span className="w-6 text-center text-sm font-bold text-muted-foreground">{item.rank}</span>
            <div className="group-hover:scale-105 transition-transform">
              <StockLogo ticker={item.ticker} name={item.name} size="md" />
            </div>
            <div>
              <p className="font-bold text-foreground group-hover:text-primary transition-colors">{item.name}</p>
              <p className="text-xs text-muted-foreground font-semibold">
                {item.ticker}
                {item.market && (
                  <span className={cn(
                    "ml-1.5 px-1 py-0.5 rounded text-[9px] font-bold",
                    item.market === "KOSPI" ? "bg-blue-50 text-blue-600" : "bg-green-50 text-green-600"
                  )}>
                    {item.market}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-extrabold text-foreground">{formatCurrency(item.price)}</p>
            <p className={cn("text-xs font-bold", getColorClass(item.changePercent))}>
              {isPositive ? "▲" : "▼"} {formatPercent(item.changePercent)}
            </p>
          </div>
        </motion.div>
      </Link>
    </div>
  );
}

function StockRow({ stock, index }: { stock: any; index: number }) {
  const isPositive = stock.changePercent >= 0;
  return (
    <div className="flex items-center border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors group">
      <StarButton ticker={stock.ticker} />
      <Link href={`/stock/${stock.ticker}`} className="flex items-center justify-between flex-1 px-3 py-4">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.02 }}
          className="flex items-center justify-between w-full"
        >
          <div className="flex items-center gap-3">
            <span className="w-6 text-center text-sm font-bold text-muted-foreground">{index + 1}</span>
            <div className="group-hover:scale-105 transition-transform">
              <StockLogo ticker={stock.ticker} name={stock.name} size="md" />
            </div>
            <div>
              <p className="font-bold text-foreground group-hover:text-primary transition-colors">{stock.name}</p>
              <p className="text-xs text-muted-foreground font-semibold">
                {stock.ticker}
                {stock.market && (
                  <span className={cn(
                    "ml-1.5 px-1 py-0.5 rounded text-[9px] font-bold",
                    stock.market === "KOSPI" ? "bg-blue-50 text-blue-600" : "bg-green-50 text-green-600"
                  )}>
                    {stock.market}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-extrabold text-foreground">{formatCurrency(stock.currentPrice)}</p>
            <p className={cn("text-xs font-bold", getColorClass(stock.changePercent))}>
              {isPositive ? "▲" : "▼"} {formatPercent(stock.changePercent)}
            </p>
          </div>
        </motion.div>
      </Link>
    </div>
  );
}

function IpoRow({ ipo, index }: { ipo: IpoStock; index: number }) {
  const isUpcoming = ipo.status === "upcoming";
  const daysLeft = Math.ceil((new Date(ipo.listingDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="flex items-center justify-between px-4 py-4 border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors"
    >
      <div className="flex items-center gap-3">
        <span className="w-6 text-center text-sm font-bold text-muted-foreground">{index + 1}</span>
        <StockLogo ticker={ipo.ticker} name={ipo.name} size="md" />
        <div>
          <p className="font-bold text-foreground">{ipo.name}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={cn(
              "text-[9px] font-bold px-1 py-0.5 rounded",
              ipo.market === "KOSPI" ? "bg-blue-50 text-blue-600" : "bg-green-50 text-green-600"
            )}>
              {ipo.market}
            </span>
            {isUpcoming ? (
              <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-orange-50 text-orange-600">
                상장예정
              </span>
            ) : (
              <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-gray-100 text-gray-600">
                상장완료
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="text-right">
        {ipo.ipoPrice ? (
          <p className="font-extrabold text-foreground">{formatCurrency(ipo.ipoPrice)}</p>
        ) : (
          <p className="text-sm text-muted-foreground">미정</p>
        )}
        <div className="flex items-center gap-1 justify-end mt-0.5">
          <Calendar className="w-3 h-3 text-orange-500" />
          <p className="text-xs font-bold text-orange-500">{ipo.listingDate}</p>
        </div>
        {isUpcoming && daysLeft > 0 && (
          <p className="text-[10px] text-muted-foreground">D-{daysLeft}</p>
        )}
      </div>
    </motion.div>
  );
}

function LoadingSpinner() {
  return (
    <div className="p-8 flex justify-center">
      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );
}

export default function Home() {
  const { data: stocks, isLoading: stocksLoading } = useGetStocks({
    query: { refetchInterval: 1000, staleTime: 0 },
  });
  const [activeTab, setActiveTab] = useState<TabType>("volume_amount");
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const { data: ipoData, isLoading: ipoLoading } = useQuery<IpoStock[]>({
    queryKey: ["ipo-stocks"],
    queryFn: async () => {
      const r = await fetch(`${API_BASE}/api/ipo`);
      if (!r.ok) return [];
      return r.json();
    },
    refetchInterval: 10 * 60 * 1000,
    staleTime: 5 * 60 * 1000,
  });

  // 거래대금 상위 — 네이버 금융 실시간, 10초마다
  const { data: tradeAmountRank, isLoading: taLoading } = useQuery<RankItem[]>({
    queryKey: ["market-rankings", "trade_amount"],
    queryFn: async () => {
      const r = await fetch(`${API_BASE}/api/market/rankings?type=trade_amount&limit=50`);
      if (!r.ok) return [];
      return r.json();
    },
    refetchInterval: 10_000,
    staleTime: 0,
    enabled: activeTab === "volume_amount",
  });

  // 거래량 상위 — 네이버 금융 실시간, 5초마다
  const { data: volumeRank, isLoading: volLoading } = useQuery<RankItem[]>({
    queryKey: ["market-rankings", "volume"],
    queryFn: async () => {
      const r = await fetch(`${API_BASE}/api/market/rankings?type=volume&limit=50`);
      if (!r.ok) return [];
      return r.json();
    },
    refetchInterval: 5_000,
    staleTime: 0,
    enabled: activeTab === "volume_count",
  });

  // 급상승 — stocks_realtime DB 정렬 (change_pct 매 5초 시뮬레이션 반영), 5초마다
  const { data: gainersRank, isLoading: gainersLoading } = useQuery<RankItem[]>({
    queryKey: ["market-rankings", "top_gainers"],
    queryFn: async () => {
      const r = await fetch(`${API_BASE}/api/market/rankings?type=top_gainers&limit=100`);
      if (!r.ok) return [];
      return r.json();
    },
    refetchInterval: 5_000,
    staleTime: 0,
    enabled: activeTab === "top_gainers",
  });

  const tabs = [
    { id: "volume_amount" as TabType, label: "거래대금", icon: DollarSign },
    { id: "volume_count" as TabType,  label: "거래량",   icon: TrendingUp },
    { id: "top_gainers"  as TabType,  label: "급상승",   icon: Flame },
    { id: "ipo"          as TabType,  label: "상장예정", icon: Rocket },
  ];

  const q = searchQuery.trim().toLowerCase();

  const sorted = stocks ? [...stocks] : [];
  // displayStocks: 검색 결과 전용 (탭별 순위는 각 API 엔드포인트 사용)
  const displayStocks = q
    ? sorted.filter((s) => s.name.toLowerCase().includes(q) || s.ticker.includes(q) || (s.sector ?? "").toLowerCase().includes(q))
    : sorted;

  const isRankingTab = activeTab === "volume_amount" || activeTab === "volume_count" || activeTab === "top_gainers";
  const rankData =
    activeTab === "volume_amount" ? (tradeAmountRank ?? []) :
    activeTab === "volume_count"  ? (volumeRank ?? []) :
    (gainersRank ?? []);
  const rankLoading =
    activeTab === "volume_amount" ? taLoading :
    activeTab === "volume_count"  ? volLoading :
    gainersLoading;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* 시장 지수 */}
      <section>
        <MarketSummary />
      </section>

      {/* 검색창 */}
      <section className="px-1">
        <div className={cn(
          "flex items-center gap-2 bg-card border rounded-2xl px-4 py-3 transition-all duration-200",
          false ? "border-red-500 shadow-sm shadow-red-500/20" : "border-border/50"
        )}>
          <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <input
            ref={searchRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="종목명, 종목코드, 섹터 검색..."
            className="flex-1 bg-transparent text-sm font-medium text-foreground placeholder:text-muted-foreground/60 outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(""); searchRef.current?.focus(); }}
              className="p-0.5 rounded-full text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="text-xs text-muted-foreground mt-2 px-1">
            검색 결과 <span className="font-bold text-foreground">{displayStocks.length}개</span>
          </p>
        )}
      </section>

      {/* 주식 목록 탭 */}
      <section>
        {!searchQuery && (
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-xl font-extrabold text-foreground">실시간 시장</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">
                총 {stocks?.length ?? 0}종목
              </span>
              <Link href="/watchlist" className="flex items-center gap-1 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors">
                <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                관심
              </Link>
            </div>
          </div>
        )}

        {!searchQuery && (
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
        )}

        <div className="bg-card rounded-3xl border border-border/50 shadow-sm overflow-hidden">
          {/* 검색 결과 */}
          {searchQuery ? (
            stocksLoading ? <LoadingSpinner /> :
            displayStocks.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground">
                <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-bold">검색 결과가 없습니다</p>
                <p className="text-xs mt-1">다른 검색어를 입력해 보세요</p>
              </div>
            ) : (
              displayStocks.map((stock, i) => <StockRow key={stock.ticker} stock={stock} index={i} />)
            )

          ) : activeTab === "ipo" ? (
            ipoLoading ? <LoadingSpinner /> :
            !ipoData || ipoData.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground">
                <Rocket className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-bold">상장 예정 종목이 없습니다</p>
                <p className="text-xs mt-1">데이터를 불러오는 중입니다</p>
              </div>
            ) : (
              <div>
                <div className="px-4 py-3 border-b border-border/40 bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Rocket className="w-4 h-4 text-orange-500" />
                    <span className="text-sm font-bold text-foreground">신규 상장 예정</span>
                    <span className="text-xs text-muted-foreground">상장일 기준 자동 반영</span>
                  </div>
                </div>
                {ipoData.map((ipo, i) => <IpoRow key={ipo.ticker} ipo={ipo} index={i} />)}
              </div>
            )

          ) : isRankingTab ? (
            rankLoading && rankData.length === 0 ? <LoadingSpinner /> :
            rankData.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground">
                <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-bold">데이터 로딩 중...</p>
              </div>
            ) : (
              <>
                <div className="px-4 py-2.5 border-b border-border/40 bg-muted/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground">
                      {activeTab === "volume_amount" ? "거래대금 상위" : activeTab === "volume_count" ? "거래량 상위" : "급상승 순위"} · 실시간
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  </div>
                  <span className="text-xs text-muted-foreground">{rankData.length}종목</span>
                </div>
                {rankData.map((item) => (
                  <RankRow key={item.ticker} item={item} index={item.rank - 1} />
                ))}
              </>
            )
          ) : null}

        </div>
      </section>

      {/* 오늘의 주요 뉴스 */}
      <section>
        <NewsSection title="오늘의 주요 뉴스" limit={5} showSummary={false} />
      </section>
    </div>
  );
}
