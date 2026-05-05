import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Newspaper, RefreshCw, TrendingUp, TrendingDown, Minus, Search, Star, X } from "lucide-react";
import { NewsCard, NewsItem } from "@/components/NewsSection";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
import { useWatchlist } from "@/hooks/use-watchlist";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type SentimentFilter = "all" | "bullish" | "bearish";
type MainTab = "market" | "watchlist";

export default function News() {
  const [mainTab, setMainTab] = useState<MainTab>("market");
  const [filter, setFilter] = useState<SentimentFilter>("all");
  const [keyword, setKeyword] = useState("");

  const { groups } = useWatchlist();
  const watchlistTickers = useMemo(
    () => Array.from(new Set(groups.flatMap((g) => g.stocks))),
    [groups]
  );

  const { data, isLoading, refetch, isFetching } = useQuery<NewsItem[]>({
    queryKey: ["news", "market-full"],
    queryFn: async () => {
      const r = await fetch(`${API_BASE}/api/news?limit=100`);
      if (!r.ok) return [];
      return r.json();
    },
    refetchInterval: 3 * 60 * 1000,
    staleTime: 60 * 1000,
  });

  const { data: watchlistNewsRaw, isLoading: wLoading, refetch: wRefetch, isFetching: wFetching } = useQuery<NewsItem[]>({
    queryKey: ["news", "watchlist", watchlistTickers.join(",")],
    queryFn: async () => {
      if (watchlistTickers.length === 0) return [];
      const results = await Promise.all(
        watchlistTickers.slice(0, 8).map((ticker) =>
          fetch(`${API_BASE}/api/stocks/${ticker}/news?limit=10`)
            .then((r) => (r.ok ? r.json() : []))
            .catch(() => [])
        )
      );
      const combined = results.flat() as NewsItem[];
      const seen = new Set<string>();
      return combined.filter((n) => {
        const key = String(n.id ?? n.url ?? n.title);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    },
    enabled: watchlistTickers.length > 0,
    staleTime: 60 * 1000,
  });
  const watchlistNews = watchlistNewsRaw ?? [];

  const all = data ?? [];
  const bullish = all.filter((n) => n.sentiment === "bullish");
  const bearish = all.filter((n) => n.sentiment === "bearish");
  const neutral = all.filter((n) => !n.sentiment || n.sentiment === "neutral");

  const byFilter =
    filter === "bullish" ? bullish :
    filter === "bearish" ? bearish :
    all;

  const kw = keyword.trim();
  const displayed = kw
    ? byFilter.filter((n) => n.title.includes(kw) || (n.summary ?? "").includes(kw))
    : byFilter;

  const sentimentTabs: { id: SentimentFilter; label: string; icon: typeof TrendingUp; count: number; color: string }[] = [
    { id: "all",     label: "전체",  icon: Newspaper,    count: all.length,     color: "text-foreground" },
    { id: "bullish", label: "호재",  icon: TrendingUp,   count: bullish.length, color: "text-up" },
    { id: "bearish", label: "악재",  icon: TrendingDown, count: bearish.length, color: "text-down" },
  ];

  const currentRefetch = mainTab === "market" ? refetch : wRefetch;
  const currentFetching = mainTab === "market" ? isFetching : wFetching;

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-in fade-in duration-500">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">오늘의 뉴스</h1>
          <p className="text-sm text-muted-foreground font-medium mt-1">
            네이버 금융 실시간 뉴스 · AI 감성 분석
          </p>
        </div>
        <button
          onClick={() => currentRefetch()}
          disabled={currentFetching}
          className="p-2.5 bg-card border border-border/50 rounded-xl hover:bg-muted transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn("w-4 h-4 text-muted-foreground", currentFetching && "animate-spin")} />
        </button>
      </div>

      {/* 메인 탭: 전체뉴스 / 관심뉴스 */}
      <div className="flex gap-1 bg-muted p-1.5 rounded-2xl">
        <button
          onClick={() => { setMainTab("market"); setKeyword(""); setFilter("all"); }}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-200",
            mainTab === "market"
              ? "bg-white shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Newspaper className={cn("w-4 h-4", mainTab === "market" && "text-primary")} />
          전체 뉴스
          <span className={cn(
            "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
            mainTab === "market" ? "bg-muted text-muted-foreground" : "bg-background/60"
          )}>
            {all.length}
          </span>
        </button>
        <button
          onClick={() => { setMainTab("watchlist"); setKeyword(""); }}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-200",
            mainTab === "watchlist"
              ? "bg-white shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Star className={cn("w-4 h-4", mainTab === "watchlist" && "text-yellow-400 fill-yellow-400")} />
          관심 뉴스
          <span className={cn(
            "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
            mainTab === "watchlist" ? "bg-muted text-muted-foreground" : "bg-background/60"
          )}>
            {watchlistNews.length}
          </span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {/* ── 전체 뉴스 탭 ── */}
        {mainTab === "market" && (
          <motion.div
            key="market"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            {/* 키워드 검색 */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60 pointer-events-none" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="뉴스 키워드 검색 (예: 삼성전자, 금리, 반도체...)"
                className="w-full pl-11 pr-10 py-3 rounded-2xl bg-card border border-border/60 text-sm font-medium text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
              />
              {keyword && (
                <button
                  onClick={() => setKeyword("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>

            {/* 감성 필터 탭 */}
            <div className="flex gap-1 bg-muted p-1 rounded-xl overflow-x-auto scrollbar-hide">
              {sentimentTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-all duration-200 min-w-[72px]",
                    filter === tab.id
                      ? "bg-white shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <tab.icon className={cn("w-3.5 h-3.5", filter === tab.id && tab.color)} />
                  <span className={filter === tab.id ? tab.color : ""}>{tab.label}</span>
                  <span className="text-[10px] font-bold text-muted-foreground">{tab.count}</span>
                </button>
              ))}
            </div>

            {/* AI 분석 통계 */}
            {!isLoading && all.length > 0 && !kw && (
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-card rounded-2xl p-4 border border-border/50 shadow-sm text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <TrendingUp className="w-3.5 h-3.5 text-up" />
                    <span className="text-xs font-bold text-up">호재</span>
                  </div>
                  <p className="text-2xl font-extrabold text-foreground">{bullish.length}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {all.length > 0 ? Math.round(bullish.length / all.length * 100) : 0}%
                  </p>
                </div>
                <div className="bg-card rounded-2xl p-4 border border-border/50 shadow-sm text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Minus className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs font-bold text-muted-foreground">중립</span>
                  </div>
                  <p className="text-2xl font-extrabold text-foreground">{neutral.length}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {all.length > 0 ? Math.round(neutral.length / all.length * 100) : 0}%
                  </p>
                </div>
                <div className="bg-card rounded-2xl p-4 border border-border/50 shadow-sm text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <TrendingDown className="w-3.5 h-3.5 text-down" />
                    <span className="text-xs font-bold text-down">악재</span>
                  </div>
                  <p className="text-2xl font-extrabold text-foreground">{bearish.length}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {all.length > 0 ? Math.round(bearish.length / all.length * 100) : 0}%
                  </p>
                </div>
              </div>
            )}

            {/* 뉴스 목록 */}
            {isLoading ? (
              <div className="bg-card rounded-3xl p-6 border border-border/50 shadow-sm space-y-4 animate-pulse">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="py-4 border-b border-border/40 last:border-0 space-y-2">
                    <div className="flex gap-2">
                      <div className="h-5 bg-muted rounded w-12" />
                      <div className="h-5 bg-muted rounded flex-1" />
                    </div>
                    <div className="h-3 bg-muted rounded w-28" />
                  </div>
                ))}
              </div>
            ) : displayed.length === 0 ? (
              <div className="bg-card rounded-3xl p-12 border border-border/50 shadow-sm text-center">
                <Newspaper className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="font-bold text-muted-foreground">
                  {kw ? `"${kw}" 관련 뉴스가 없습니다` : "해당 뉴스가 없습니다"}
                </p>
                {kw && (
                  <button onClick={() => setKeyword("")} className="mt-3 text-sm text-primary font-bold hover:underline">
                    검색 초기화
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-card rounded-3xl p-6 border border-border/50 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Newspaper className="w-4 h-4 text-primary" />
                  <span className="font-extrabold text-foreground">
                    {kw ? `"${kw}" 검색 결과` : filter === "bullish" ? "호재 뉴스" : filter === "bearish" ? "악재 뉴스" : "전체 뉴스"} · {displayed.length}건
                  </span>
                  <span className="ml-auto text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    네이버금융 · AI 분석
                  </span>
                </div>
                <div className="divide-y divide-border/40">
                  {displayed.map((item) => (
                    <div key={item.id} className="first:pt-0 last:pb-0">
                      <NewsCard item={item} showSummary={true} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ── 관심 뉴스 탭 ── */}
        {mainTab === "watchlist" && (
          <motion.div
            key="watchlist"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            {watchlistTickers.length === 0 ? (
              <div className="bg-card rounded-3xl p-12 border border-border/50 shadow-sm text-center">
                <Star className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="font-bold text-foreground mb-1">관심종목이 없습니다</p>
                <p className="text-sm text-muted-foreground">
                  종목을 관심 등록하면 해당 종목 관련 뉴스를 모아볼 수 있어요
                </p>
              </div>
            ) : wLoading ? (
              <div className="bg-card rounded-3xl p-6 border border-border/50 shadow-sm space-y-4 animate-pulse">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="py-4 border-b border-border/40 last:border-0 space-y-2">
                    <div className="flex gap-2">
                      <div className="h-5 bg-muted rounded w-24" />
                      <div className="h-5 bg-muted rounded flex-1" />
                    </div>
                    <div className="h-3 bg-muted rounded w-28" />
                  </div>
                ))}
              </div>
            ) : watchlistNews.length === 0 ? (
              <div className="bg-card rounded-3xl p-12 border border-border/50 shadow-sm text-center">
                <Newspaper className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="font-bold text-muted-foreground">관심종목 관련 뉴스가 없습니다</p>
              </div>
            ) : (
              <>
                {/* 관심 종목 태그 */}
                <div className="flex flex-wrap gap-2">
                  {watchlistTickers.slice(0, 8).map((ticker) => (
                    <span key={ticker} className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full border border-primary/20">
                      {ticker}
                    </span>
                  ))}
                  {watchlistTickers.length > 8 && (
                    <span className="px-3 py-1 bg-muted text-muted-foreground text-xs font-bold rounded-full">
                      +{watchlistTickers.length - 8}
                    </span>
                  )}
                </div>

                <div className="bg-card rounded-3xl p-6 border border-primary/20 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-xl bg-yellow-50 flex items-center justify-center">
                      <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                    </div>
                    <span className="font-extrabold text-foreground">관심종목 뉴스</span>
                    <span className="ml-auto text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      {watchlistNews.length}건
                    </span>
                  </div>
                  <div className="divide-y divide-border/40">
                    {watchlistNews.map((item) => (
                      <div key={item.id ?? item.url} className="first:pt-0 last:pb-0">
                        <NewsCard item={item} showSummary={true} />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
