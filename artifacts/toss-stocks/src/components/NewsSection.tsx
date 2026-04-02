import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Newspaper } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  publishedAt: string;
  url: string;
  sentiment?: "bullish" | "bearish" | "neutral" | null;
}

const POSITIVE_WORDS = [
  "상승", "돌파", "흑자", "급등", "신고가", "매수", "성장", "이익", "호실적",
  "상향", "증가", "반등", "강세", "훈풍", "낙관", "호재", "기대", "긍정",
  "회복", "개선", "수익", "최고", "급증", "견조", "순항", "성과",
];
const NEGATIVE_WORDS = [
  "하락", "적자", "조사", "급락", "신저가", "매도", "손실", "부진", "하향",
  "감소", "둔화", "악재", "비관", "부담", "우려", "압박", "리스크", "손해",
  "침체", "위기", "폭락", "최저", "급감", "약세", "불안", "악화",
];

export function getSentiment(title: string): "positive" | "negative" | null {
  const t = title;
  const pos = POSITIVE_WORDS.some((w) => t.includes(w));
  const neg = NEGATIVE_WORDS.some((w) => t.includes(w));
  if (pos && !neg) return "positive";
  if (neg && !pos) return "negative";
  return null;
}

export function timeAgo(iso: string): string {
  try {
    const KST_OFFSET = 9 * 60 * 60 * 1000;
    const pub = new Date(iso);
    const now = new Date();

    const pubKST = pub.getTime() + KST_OFFSET;
    const nowKST = now.getTime() + KST_OFFSET;

    const diffMs = nowKST - pubKST;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffMs < 0) {
      const absSec = Math.abs(diffSec);
      if (absSec < 60) return "방금 전";
      return "방금 전";
    }
    if (diffSec < 60) return "방금 전";
    if (diffMin < 60) return `${diffMin}분 전`;
    if (diffHour < 24) return `${diffHour}시간 전`;
    if (diffDay < 7) return `${diffDay}일 전`;

    const d = new Date(pub.getTime() + KST_OFFSET);
    const month = d.getUTCMonth() + 1;
    const day = d.getUTCDate();
    return `${month}월 ${day}일`;
  } catch {
    return "";
  }
}

function SentimentBadge({ sentiment }: { sentiment: "positive" | "negative" | null }) {
  if (!sentiment) return null;
  return sentiment === "positive" ? (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-extrabold bg-red-50 text-up border border-red-100 flex-shrink-0">
      😊 호재
    </span>
  ) : (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-50 text-down border border-blue-100 flex-shrink-0">
      😢 악재
    </span>
  );
}

interface NewsCardProps {
  item: NewsItem;
  showSummary?: boolean;
}

export function NewsCard({ item, showSummary = false }: NewsCardProps) {
  const apiSentiment = item.sentiment === "bullish" ? "positive" : item.sentiment === "bearish" ? "negative" : null;
  const sentiment = apiSentiment ?? getSentiment(item.title);
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noreferrer noopener"
      className="block group hover:bg-muted/30 transition-colors rounded-2xl p-4 -mx-4"
    >
      <div className="flex items-start gap-2 mb-1.5">
        <SentimentBadge sentiment={sentiment} />
        <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors leading-snug flex-1 line-clamp-2">
          {item.title}
        </h4>
        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary/60 flex-shrink-0 mt-0.5 transition-colors" />
      </div>
      {showSummary && item.summary && (
        <p className="text-xs text-muted-foreground font-medium line-clamp-2 leading-relaxed mb-1.5">
          {item.summary}
        </p>
      )}
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        <Newspaper className="w-3 h-3 flex-shrink-0" />
        <span className="font-bold text-foreground/70">{item.source}</span>
        <span>·</span>
        <span>{timeAgo(item.publishedAt)}</span>
      </div>
    </a>
  );
}

interface NewsSectionProps {
  ticker?: string;
  title?: string;
  limit?: number;
  showSummary?: boolean;
}

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export function NewsSection({
  ticker,
  title = "오늘의 주요 뉴스",
  limit = 5,
  showSummary = false,
}: NewsSectionProps) {
  const url = ticker ? `${API_BASE}/api/stocks/${ticker}/news` : `${API_BASE}/api/news`;

  const { data, isLoading } = useQuery<NewsItem[]>({
    queryKey: ["news", ticker ?? "market"],
    queryFn: async () => {
      const r = await fetch(url);
      if (!r.ok) return [];
      return r.json();
    },
    refetchInterval: 5 * 60 * 1000,
    staleTime: 2 * 60 * 1000,
  });

  const items = (data ?? []).slice(0, limit);

  if (isLoading) {
    return (
      <div className="bg-card rounded-3xl p-6 shadow-sm border border-border/50 animate-pulse">
        <div className="h-5 bg-muted rounded-xl w-40 mb-5" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="py-4 border-b border-border/40 last:border-0 space-y-2">
            <div className="h-4 bg-muted rounded-xl w-full" />
            <div className="h-3 bg-muted rounded-xl w-24" />
          </div>
        ))}
      </div>
    );
  }

  if (!items.length) return null;

  return (
    <div className="bg-card rounded-3xl p-6 shadow-sm border border-border/50">
      <div className="flex items-center gap-2 mb-4">
        <Newspaper className="w-4 h-4 text-primary" />
        <h3 className="text-base font-extrabold text-foreground">{title}</h3>
        <span className="ml-auto text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          네이버금융
        </span>
      </div>
      <div className="divide-y divide-border/40">
        {items.map((item) => (
          <div key={item.id} className="first:pt-0 last:pb-0">
            <NewsCard item={item} showSummary={showSummary} />
          </div>
        ))}
      </div>
    </div>
  );
}
