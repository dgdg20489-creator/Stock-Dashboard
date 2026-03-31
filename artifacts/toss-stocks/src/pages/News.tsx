import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Newspaper, RefreshCw, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { NewsCard, NewsItem } from "@/components/NewsSection";
import { cn } from "@/lib/utils";
import { useState } from "react";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type Filter = "all" | "bullish" | "bearish";

export default function News() {
  const [filter, setFilter] = useState<Filter>("all");

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

  const all = data ?? [];
  const bullish = all.filter((n) => n.sentiment === "bullish");
  const bearish = all.filter((n) => n.sentiment === "bearish");
  const neutral = all.filter((n) => !n.sentiment || n.sentiment === "neutral");

  const displayed =
    filter === "bullish" ? bullish :
    filter === "bearish" ? bearish :
    all;

  const tabs: { id: Filter; label: string; icon: typeof TrendingUp; count: number; color: string }[] = [
    { id: "all",     label: "전체",    icon: Newspaper,   count: all.length,     color: "text-foreground" },
    { id: "bullish", label: "호재",    icon: TrendingUp,  count: bullish.length,  color: "text-up" },
    { id: "bearish", label: "악재",    icon: TrendingDown, count: bearish.length, color: "text-down" },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">오늘의 뉴스</h1>
          <p className="text-sm text-muted-foreground font-medium mt-1">
            네이버 금융 실시간 뉴스 · AI 감성 분석
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="p-2.5 bg-card border border-border/50 rounded-xl hover:bg-muted transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn("w-4 h-4 text-muted-foreground", isFetching && "animate-spin")} />
        </button>
      </div>

      {/* 감성 필터 탭 */}
      <div className="flex gap-1 bg-muted p-1.5 rounded-2xl overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all duration-200 min-w-[80px]",
              filter === tab.id
                ? "bg-white shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className={cn("w-3.5 h-3.5", filter === tab.id && tab.color)} />
            <span className={filter === tab.id ? tab.color : ""}>{tab.label}</span>
            <span className={cn(
              "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
              filter === tab.id ? "bg-muted text-muted-foreground" : "bg-background/60"
            )}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* AI 분석 통계 */}
      {!isLoading && all.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-3 gap-3"
        >
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
        </motion.div>
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
          <p className="font-bold text-muted-foreground">해당 뉴스가 없습니다</p>
        </div>
      ) : (
        <div className="bg-card rounded-3xl p-6 border border-border/50 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Newspaper className="w-4 h-4 text-primary" />
            <span className="font-extrabold text-foreground">{displayed.length}개 기사</span>
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
    </div>
  );
}
