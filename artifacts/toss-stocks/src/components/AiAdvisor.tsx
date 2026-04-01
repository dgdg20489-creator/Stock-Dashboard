import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Bot, Sparkles, ChevronDown, ChevronUp, RefreshCw, TrendingUp, ShieldAlert, Lightbulb, ArrowRight } from "lucide-react";

interface RiskProfile {
  profile: "aggressive" | "balanced" | "defensive";
  label: string;
  reason: string;
}

interface SectorItem {
  sector: string;
  percent: number;
  value: number;
}

interface Recommendation {
  ticker: string;
  name: string;
  reason: string;
}

interface AnalysisResult {
  riskProfile: RiskProfile;
  stats: {
    totalAssets: number;
    cashBalance: number;
    stockValue: number;
    cashPercent: number;
    totalReturnPct: number;
    avgVolatility: number;
    etfPercent: number;
    holdingCount: number;
  };
  sectorBreakdown: SectorItem[];
  ai: {
    summary: string;
    keyRisks: string[];
    adviceList: string[];
    recommendations: Recommendation[];
    rebalanceNote: string;
  };
}

interface AiAdvisorProps {
  userId: number;
}

const RISK_COLORS = {
  aggressive: { bg: "bg-red-50 border-red-200", text: "text-red-600", bar: "bg-red-500" },
  balanced:   { bg: "bg-blue-50 border-blue-200", text: "text-blue-600", bar: "bg-blue-500" },
  defensive:  { bg: "bg-green-50 border-green-200", text: "text-green-600", bar: "bg-green-500" },
};

const SECTOR_COLORS = [
  "bg-red-400", "bg-blue-400", "bg-amber-400", "bg-emerald-400",
  "bg-purple-400", "bg-pink-400", "bg-cyan-400", "bg-orange-400",
];

export function AiAdvisor({ userId }: AiAdvisorProps) {
  const [, setLocation] = useLocation();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [open, setOpen] = useState(false);

  const analyze = useCallback(async () => {
    setLoading(true);
    setError(null);
    setOpen(true);
    setExpanded(false);
    try {
      const r = await fetch("/api/ai-advisor/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!r.ok) throw new Error("분석 실패");
      const data: AnalysisResult = await r.json();
      setResult(data);
      setExpanded(true);
    } catch {
      setError("AI 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const riskColors = result ? RISK_COLORS[result.riskProfile.profile] : RISK_COLORS.balanced;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-card rounded-3xl border border-border/50 shadow-sm overflow-hidden"
    >
      {/* 헤더 */}
      <div
        className="flex items-center justify-between p-6 cursor-pointer select-none"
        onClick={() => result ? setExpanded((v) => !v) : analyze()}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-inner flex-shrink-0">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-foreground">AI 투자 비서</h3>
              <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full border border-primary/20">
                Gemini
              </span>
            </div>
            <p className="text-xs text-muted-foreground font-medium">
              {result ? result.riskProfile.label : "내 포트폴리오를 AI가 분석해드립니다"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {result && (
            <button
              onClick={(e) => { e.stopPropagation(); analyze(); }}
              className="p-1.5 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              title="재분석"
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </button>
          )}
          {result ? (
            expanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />
          ) : null}
        </div>
      </div>

      {/* 분석 시작 버튼 (결과 없을 때) */}
      {!result && !loading && (
        <div className="px-6 pb-6">
          <button
            onClick={analyze}
            className="w-full py-4 rounded-2xl font-extrabold text-sm bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            내 포트폴리오 AI 분석하기
          </button>
          <p className="text-center text-[11px] text-muted-foreground mt-2 font-medium">
            Replit AI Integrations (Gemini) · 크레딧 사용
          </p>
        </div>
      )}

      {/* 로딩 */}
      {loading && (
        <div className="px-6 pb-8 flex flex-col items-center gap-3">
          <div className="flex gap-1.5 items-end">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-primary rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
          <p className="text-sm font-semibold text-muted-foreground text-center">
            포트폴리오를 분석하고 있어요…
            <br />
            <span className="text-xs">변동성·섹터 분석 → AI 조언 생성 중</span>
          </p>
        </div>
      )}

      {/* 에러 */}
      {error && (
        <div className="px-6 pb-6">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-600 font-medium">
            {error}
          </div>
        </div>
      )}

      {/* 분석 결과 */}
      <AnimatePresence>
        {result && expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 space-y-5">

              {/* 투자 성향 배지 */}
              <div className={cn("flex items-center gap-3 p-4 rounded-2xl border", riskColors.bg)}>
                <div className="flex-1">
                  <p className={cn("text-sm font-extrabold", riskColors.text)}>{result.riskProfile.label}</p>
                  <p className="text-xs text-muted-foreground font-medium mt-0.5">{result.riskProfile.reason}</p>
                </div>
                <div className="text-right text-xs font-bold text-muted-foreground space-y-1 flex-shrink-0">
                  <p>현금 {result.stats.cashPercent.toFixed(0)}%</p>
                  <p>변동성 {result.stats.avgVolatility.toFixed(1)}%</p>
                </div>
              </div>

              {/* 섹터 분포 바 */}
              {result.sectorBreakdown.length > 0 && (
                <div>
                  <p className="text-xs font-extrabold text-muted-foreground mb-2">섹터 분포</p>
                  <div className="flex h-3 rounded-full overflow-hidden gap-px">
                    {/* 현금 비중 */}
                    {result.stats.cashPercent > 0 && (
                      <div
                        className="bg-gray-300 h-full transition-all"
                        style={{ width: `${result.stats.cashPercent}%` }}
                        title={`현금 ${result.stats.cashPercent.toFixed(0)}%`}
                      />
                    )}
                    {result.sectorBreakdown.map((s, i) => (
                      <div
                        key={s.sector}
                        className={cn("h-full transition-all", SECTOR_COLORS[i % SECTOR_COLORS.length])}
                        style={{ width: `${s.percent}%` }}
                        title={`${s.sector} ${s.percent.toFixed(0)}%`}
                      />
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                    <div className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
                      <div className="w-2 h-2 rounded-full bg-gray-300" />
                      현금 {result.stats.cashPercent.toFixed(0)}%
                    </div>
                    {result.sectorBreakdown.map((s, i) => (
                      <div key={s.sector} className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
                        <div className={cn("w-2 h-2 rounded-full", SECTOR_COLORS[i % SECTOR_COLORS.length])} />
                        {s.sector} {s.percent.toFixed(0)}%
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI 요약 */}
              <div className="bg-muted/50 rounded-2xl p-4 border border-border/30">
                <div className="flex items-start gap-2">
                  <Bot className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-foreground leading-relaxed">{result.ai.summary}</p>
                </div>
              </div>

              {/* 리스크 */}
              {result.ai.keyRisks.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <ShieldAlert className="w-3.5 h-3.5 text-orange-500" />
                    <p className="text-xs font-extrabold text-orange-600">주요 리스크</p>
                  </div>
                  <div className="space-y-1.5">
                    {result.ai.keyRisks.map((risk, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs font-medium text-muted-foreground bg-orange-50 border border-orange-100 rounded-xl px-3 py-2">
                        <span className="text-orange-400 font-bold flex-shrink-0">⚠</span>
                        {risk}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI 조언 */}
              {result.ai.adviceList.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Lightbulb className="w-3.5 h-3.5 text-primary" />
                    <p className="text-xs font-extrabold text-primary">AI 조언</p>
                  </div>
                  <div className="space-y-2">
                    {result.ai.adviceList.map((advice, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs font-medium text-foreground bg-primary/5 border border-primary/10 rounded-xl px-3 py-2.5">
                        <span className="w-4 h-4 rounded-full bg-primary/20 text-primary font-extrabold text-[10px] flex items-center justify-center flex-shrink-0">
                          {i + 1}
                        </span>
                        {advice}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 추천 종목 */}
              {result.ai.recommendations.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-3">
                    <TrendingUp className="w-3.5 h-3.5 text-foreground" />
                    <p className="text-xs font-extrabold text-foreground">AI 추천 종목</p>
                  </div>
                  <div className="space-y-2">
                    {result.ai.recommendations.map((rec) => (
                      <button
                        key={rec.ticker}
                        onClick={() => setLocation(`/stock/${rec.ticker}`)}
                        className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-card border border-border hover:border-primary/40 hover:bg-primary/5 transition-all group"
                      >
                        <div className="text-left">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-extrabold text-foreground group-hover:text-primary transition-colors">
                              {rec.name}
                            </p>
                            <span className="text-[10px] text-muted-foreground font-semibold">{rec.ticker}</span>
                          </div>
                          <p className="text-xs text-muted-foreground font-medium mt-0.5">{rec.reason}</p>
                        </div>
                        <div className="flex items-center gap-1 text-primary ml-3 flex-shrink-0">
                          <span className="text-xs font-bold hidden sm:block">매수하기</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 리밸런싱 노트 + 버튼 */}
              {result.ai.rebalanceNote && (
                <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-2xl p-4 border border-primary/15">
                  <p className="text-xs font-bold text-primary mb-1">리밸런싱 방향</p>
                  <p className="text-sm font-medium text-foreground">{result.ai.rebalanceNote}</p>
                </div>
              )}

              {/* 포트폴리오 리밸런싱 버튼 */}
              <button
                onClick={() => setLocation(`/stock/${result.ai.recommendations[0]?.ticker || "069500"}`)}
                className="w-full py-4 rounded-2xl font-extrabold text-sm bg-foreground text-background shadow hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                포트폴리오 리밸런싱 하기
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
