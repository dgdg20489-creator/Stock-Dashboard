import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useGetRankings, GetRankingsDifficulty } from "@workspace/api-client-react";
import { formatCurrency, formatPercent, getColorClass } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { GameAvatar } from "@/components/GameAvatar";
import { cn } from "@/lib/utils";

function TrophyIcon({ rank, size = 48 }: { rank: 1 | 2 | 3; size?: number }) {
  const configs = {
    1: { cup: "#FFD700", shine: "#FFF9C4", shadow: "#B8860B", base: "#DAA520", label: "금" },
    2: { cup: "#C0C0C0", shine: "#FFFFFF", shadow: "#808080", base: "#A9A9A9", label: "은" },
    3: { cup: "#CD7F32", shine: "#E8A958", shadow: "#7B4A1E", base: "#A0522D", label: "동" },
  };
  const c = configs[rank];
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <path d="M14 6h20v18c0 6-4 10-10 10S14 30 14 24V6z" fill={c.cup} />
      <path d="M18 8h4v12c0 2-1 3-2 3s-2-1-2-3V8z" fill={c.shine} opacity="0.6" />
      <path d="M14 10H8a6 6 0 0 0 6 6V10z" fill={c.cup} />
      <path d="M34 10h6a6 6 0 0 1-6 6V10z" fill={c.cup} />
      <path d="M14 13H8" stroke={c.shadow} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M34 13h6" stroke={c.shadow} strokeWidth="1.5" strokeLinecap="round" />
      <rect x="21" y="34" width="6" height="5" fill={c.base} />
      <rect x="15" y="39" width="18" height="4" rx="2" fill={c.base} />
      <rect x="17" y="40" width="14" height="1.5" rx="0.75" fill={c.shine} opacity="0.4" />
      <text x="24" y="22" textAnchor="middle" fontSize="10" fontWeight="900" fill={c.shadow} fontFamily="system-ui">{c.label}</text>
    </svg>
  );
}

const DIFF_CONFIG = {
  beginner:     { label: "초보",  emoji: "🌱", color: "text-emerald-600", bg: "bg-emerald-50",  ring: "ring-emerald-300",  gradient: "from-emerald-400 to-green-500" },
  intermediate: { label: "중수",  emoji: "⚡", color: "text-blue-600",    bg: "bg-blue-50",     ring: "ring-blue-300",     gradient: "from-blue-400 to-indigo-500"  },
  expert:       { label: "고수",  emoji: "🔥", color: "text-red-600",     bg: "bg-red-50",      ring: "ring-red-300",      gradient: "from-red-400 to-rose-500"     },
};

export default function Rankings() {
  const [, setLocation] = useLocation();
  const [difficulty, setDifficulty] = useState<GetRankingsDifficulty>(GetRankingsDifficulty.beginner);
  const prevRanksRef = useRef<Map<number, number>>(new Map());
  const [rankChanges, setRankChanges] = useState<Map<number, number>>(new Map());
  const currentUserId = parseInt(localStorage.getItem("toss_userId") || "0");

  const goToProfile = (userId: number) => setLocation(`/profile/${userId}`);
  const conf = DIFF_CONFIG[difficulty as keyof typeof DIFF_CONFIG] ?? DIFF_CONFIG.beginner;

  const { data: rankings, isLoading } = useGetRankings(
    { difficulty },
    { query: { refetchInterval: 5_000 } }
  );

  useEffect(() => {
    if (!rankings) return;
    const newChanges = new Map<number, number>();
    rankings.forEach(entry => {
      const prev = prevRanksRef.current.get(entry.userId);
      if (prev !== undefined && prev !== entry.rank) newChanges.set(entry.userId, prev - entry.rank);
    });
    setRankChanges(newChanges);
    const newPrev = new Map<number, number>();
    rankings.forEach(e => newPrev.set(e.userId, e.rank));
    prevRanksRef.current = newPrev;
    if (newChanges.size > 0) setTimeout(() => setRankChanges(new Map()), 3000);
  }, [rankings]);

  const myEntry = rankings?.find(e => e.userId === currentUserId);

  const tabs = [
    { id: GetRankingsDifficulty.beginner,     ...DIFF_CONFIG.beginner },
    { id: GetRankingsDifficulty.intermediate, ...DIFF_CONFIG.intermediate },
    { id: GetRankingsDifficulty.expert,       ...DIFF_CONFIG.expert },
  ];

  const podiumOrder = rankings ? [rankings[1], rankings[0], rankings[2]] : [];
  const podiumHeights = ["h-24", "h-32", "h-20"];
  const podiumRanks: (1 | 2 | 3)[] = [2, 1, 3];

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-in fade-in duration-500 pb-8">

      {/* ── 헤더 ── */}
      <div className={cn(
        "rounded-3xl px-6 py-5 bg-gradient-to-br text-white shadow-lg",
        `from-${conf.gradient.split(" ")[0].replace("from-", "")} to-${conf.gradient.split(" ")[1].replace("to-", "")}`,
        "bg-gradient-to-br",
      )}
        style={{ background: `linear-gradient(135deg, var(--tw-gradient-stops))` }}
      >
        <div className={cn(
          "rounded-3xl px-6 py-5 -mx-6 -my-5 bg-gradient-to-br",
          difficulty === "beginner" ? "from-emerald-500 to-green-600"
          : difficulty === "intermediate" ? "from-blue-500 to-indigo-600"
          : "from-red-500 to-rose-600"
        )}>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{conf.emoji}</span>
                <h1 className="text-2xl font-black text-white tracking-tight">랭킹 {conf.label}</h1>
              </div>
              <p className="text-sm text-white/70 flex items-center gap-1.5 font-medium">
                <span className="w-1.5 h-1.5 bg-white/80 rounded-full animate-pulse inline-block" />
                5초마다 실시간 업데이트
              </p>
            </div>
            {myEntry && (
              <div className="text-right">
                <p className="text-[10px] text-white/60 font-bold uppercase tracking-wider mb-0.5">내 순위</p>
                <p className="text-4xl font-black text-white leading-none">{myEntry.rank}<span className="text-lg font-bold text-white/70">위</span></p>
                <p className={cn("text-sm font-bold", myEntry.totalReturn >= 0 ? "text-yellow-200" : "text-white/70")}>
                  {formatPercent(myEntry.totalReturnPercent)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 난이도 탭 ── */}
      <div className="flex gap-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setDifficulty(tab.id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl font-bold text-sm whitespace-nowrap transition-all duration-200 border-2",
              difficulty === tab.id
                ? cn("text-white border-transparent shadow-lg", `bg-gradient-to-r`, tab.id === "beginner" ? "from-emerald-500 to-green-600" : tab.id === "intermediate" ? "from-blue-500 to-indigo-600" : "from-red-500 to-rose-600")
                : cn("bg-card text-muted-foreground border-border hover:border-border/80 hover:text-foreground")
            )}
          >
            <span>{tab.emoji}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── 본문 ── */}
      {isLoading ? (
        <div className="bg-card rounded-3xl p-12 flex flex-col items-center gap-3 border border-border/50 shadow-sm">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground font-medium">랭킹 불러오는 중...</span>
        </div>
      ) : !rankings || rankings.length === 0 ? (
        <div className="bg-card rounded-3xl p-12 text-center border border-border/50 shadow-sm">
          <TrophyIcon rank={1} size={64} />
          <p className="text-muted-foreground font-bold mt-4 text-base">아직 순위 데이터가 없습니다</p>
          <p className="text-xs text-muted-foreground mt-1">투자를 시작하면 랭킹에 등록됩니다!</p>
        </div>
      ) : (
        <div className="space-y-4">

          {/* ── 포디엄 TOP 3 ── */}
          {rankings.length >= 1 && (
            <div className="bg-card rounded-3xl border border-border/50 shadow-sm overflow-hidden">
              <div className={cn(
                "px-4 pt-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-center",
                difficulty === "beginner" ? "text-emerald-600 bg-emerald-50/60"
                : difficulty === "intermediate" ? "text-blue-600 bg-blue-50/60"
                : "text-red-600 bg-red-50/60"
              )}>
                🏆 TOP 3
              </div>

              {/* 포디엄 시각화 */}
              <div className="flex items-end justify-center gap-3 px-4 pt-6 pb-4">
                {podiumOrder.map((entry, idx) => {
                  if (!entry) return <div key={idx} className="flex-1" />;
                  const rank = podiumRanks[idx];
                  const isSelf = entry.userId === currentUserId;
                  const podiumColor = rank === 1
                    ? "from-amber-400 to-yellow-500"
                    : rank === 2 ? "from-slate-400 to-slate-500"
                    : "from-amber-600 to-amber-700";
                  const platformH = podiumHeights[idx];

                  return (
                    <motion.div
                      key={entry.userId}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.12, type: "spring", stiffness: 280, damping: 26 }}
                      className="flex-1 flex flex-col items-center cursor-pointer"
                      onClick={() => goToProfile(entry.userId)}
                    >
                      {/* 왕관 for 1위 */}
                      {rank === 1 && (
                        <motion.div
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                          className="text-2xl mb-0.5"
                        >👑</motion.div>
                      )}
                      <TrophyIcon rank={rank} size={rank === 1 ? 52 : 36} />
                      <div className="mt-2 mb-3 text-center">
                        <GameAvatar
                          avatarId={entry.avatar}
                          size={rank === 1 ? 52 : 44}
                          rounded="rounded-xl"
                          className={cn("shadow-md mx-auto", isSelf && "ring-2 ring-primary")}
                        />
                        <p className={cn(
                          "font-black text-sm mt-1.5 truncate max-w-[80px]",
                          isSelf ? "text-primary" : "text-foreground"
                        )}>
                          {entry.username}{isSelf ? " 👤" : ""}
                        </p>
                        <p className={cn("text-xs font-bold", getColorClass(entry.totalReturn))}>
                          {formatPercent(entry.totalReturnPercent)}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                          {formatCurrency(entry.totalAssets)}
                        </p>
                      </div>
                      {/* 포디엄 받침 */}
                      <div className={cn(
                        `w-full ${platformH} rounded-t-xl bg-gradient-to-b flex items-start justify-center pt-2`,
                        podiumColor
                      )}>
                        <span className="text-white font-black text-lg">{rank}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── 4위 이하 ── */}
          {rankings.length > 3 && (
            <div className="bg-card rounded-3xl border border-border/50 shadow-sm overflow-hidden">
              <div className="px-4 py-2.5 border-b border-border/40 bg-muted/30">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  4위 이하 전체 순위
                </span>
              </div>
              <div className="divide-y divide-border/40">
                <AnimatePresence>
                  {rankings.slice(3).map((entry) => {
                    const change = rankChanges.get(entry.userId) ?? 0;
                    const isSelf = entry.userId === currentUserId;
                    return (
                      <motion.div
                        layout
                        key={entry.userId}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.25 }}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3.5 hover:bg-muted/30 transition-colors cursor-pointer",
                          isSelf && "bg-primary/5 hover:bg-primary/8"
                        )}
                        onClick={() => goToProfile(entry.userId)}
                      >
                        {/* 순위 */}
                        <div className="w-10 flex-shrink-0 flex flex-col items-center gap-0.5">
                          <span className={cn(
                            "inline-flex items-center justify-center w-8 h-8 rounded-full font-black text-sm",
                            isSelf ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                          )}>
                            {entry.rank}
                          </span>
                          {change !== 0 && (
                            <motion.span
                              initial={{ opacity: 0, scale: 0.6 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0 }}
                              className={cn("text-[9px] font-black", change > 0 ? "text-up" : "text-down")}
                            >
                              {change > 0 ? `▲${change}` : `▼${Math.abs(change)}`}
                            </motion.span>
                          )}
                        </div>

                        <GameAvatar avatarId={entry.avatar} size={44} rounded="rounded-xl" className="shadow-sm flex-shrink-0" />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={cn("font-bold text-sm truncate", isSelf ? "text-primary" : "text-foreground")}>
                              {entry.username}
                            </span>
                            {isSelf && (
                              <span className="text-[9px] bg-primary text-white px-1.5 py-0.5 rounded-full font-black flex-shrink-0">나</span>
                            )}
                            <span className={cn(
                              "text-[9px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0",
                              entry.difficulty === "beginner" ? "bg-emerald-100 text-emerald-700"
                              : entry.difficulty === "intermediate" ? "bg-blue-100 text-blue-700"
                              : "bg-red-100 text-red-700"
                            )}>
                              {entry.difficulty === "beginner" ? "초보" : entry.difficulty === "intermediate" ? "중수" : "고수"}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                            {formatCurrency(entry.totalAssets)}
                          </p>
                        </div>

                        <div className={cn("text-right font-black text-base flex-shrink-0", getColorClass(entry.totalReturn))}>
                          {formatPercent(entry.totalReturnPercent)}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* ── 내 순위 고정 카드 (4위 이하인 경우) ── */}
          {myEntry && myEntry.rank > 3 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "rounded-2xl border-2 p-4 flex items-center gap-3",
                difficulty === "beginner" ? "border-emerald-300 bg-emerald-50"
                : difficulty === "intermediate" ? "border-blue-300 bg-blue-50"
                : "border-red-300 bg-red-50"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center font-black text-sm text-white flex-shrink-0",
                difficulty === "beginner" ? "bg-emerald-500"
                : difficulty === "intermediate" ? "bg-blue-500"
                : "bg-red-500"
              )}>
                {myEntry.rank}
              </div>
              <GameAvatar avatarId={myEntry.avatar} size={40} rounded="rounded-xl" className="flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-black text-sm text-foreground">나의 순위</p>
                <p className="text-xs text-muted-foreground font-semibold">{formatCurrency(myEntry.totalAssets)}</p>
              </div>
              <div className={cn("font-black text-lg", getColorClass(myEntry.totalReturn))}>
                {formatPercent(myEntry.totalReturnPercent)}
              </div>
            </motion.div>
          )}

        </div>
      )}
    </div>
  );
}
