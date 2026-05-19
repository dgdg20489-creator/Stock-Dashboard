import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useGetRankings, GetRankingsDifficulty } from "@workspace/api-client-react";
import { formatCurrency, formatPercent, getColorClass } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { GameAvatar } from "@/components/GameAvatar";
import { cn } from "@/lib/utils";
import { Crown, TrendingUp, TrendingDown, Medal } from "lucide-react";

const DIFF_CONFIG = {
  beginner:     { label: "초보",  emoji: "🌱", accent: "#10b981", light: "#d1fae5", dark: "#065f46", tab: "from-emerald-500 to-green-600" },
  intermediate: { label: "중수",  emoji: "⚡", accent: "#3b82f6", light: "#dbeafe", dark: "#1e3a8a", tab: "from-blue-500 to-indigo-600"  },
  expert:       { label: "고수",  emoji: "🔥", accent: "#ef4444", light: "#fee2e2", dark: "#7f1d1d", tab: "from-red-500 to-rose-600"     },
};

const RANK_MEDAL: Record<number, { icon: React.ReactNode; color: string; bg: string }> = {
  1: { icon: <Crown className="w-4 h-4" />, color: "#D4A017", bg: "#FEF9C3" },
  2: { icon: <Medal className="w-4 h-4" />, color: "#9CA3AF", bg: "#F3F4F6" },
  3: { icon: <Medal className="w-4 h-4" />, color: "#C2855A", bg: "#FEF3E2" },
};

export default function Rankings() {
  const [, setLocation] = useLocation();
  const [difficulty, setDifficulty] = useState<GetRankingsDifficulty>(GetRankingsDifficulty.beginner);
  const prevRanksRef = useRef<Map<number, number>>(new Map());
  const [rankChanges, setRankChanges] = useState<Map<number, number>>(new Map());
  const currentUserId = parseInt(localStorage.getItem("toss_userId") || "0");
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
  const top3 = rankings?.slice(0, 3) ?? [];
  const rest = rankings?.slice(3) ?? [];

  const tabs = [
    { id: GetRankingsDifficulty.beginner,     ...DIFF_CONFIG.beginner },
    { id: GetRankingsDifficulty.intermediate, ...DIFF_CONFIG.intermediate },
    { id: GetRankingsDifficulty.expert,       ...DIFF_CONFIG.expert },
  ];

  return (
    <div className="max-w-lg mx-auto pb-10 space-y-4">

      {/* ── 헤더 ── */}
      <div
        className="rounded-3xl overflow-hidden shadow-lg"
        style={{ background: `linear-gradient(135deg, ${conf.accent}, ${conf.dark})` }}
      >
        <div className="px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-white/60 uppercase tracking-widest mb-1">LEADERBOARD</p>
              <h1 className="text-2xl font-black text-white leading-none">
                {conf.emoji} {conf.label} 랭킹
              </h1>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="w-1.5 h-1.5 bg-white/70 rounded-full animate-pulse" />
                <span className="text-xs text-white/60 font-medium">5초마다 업데이트</span>
              </div>
            </div>
            {myEntry && (
              <div
                className="rounded-2xl px-4 py-3 text-center"
                style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(4px)" }}
              >
                <p className="text-[10px] text-white/60 font-bold uppercase tracking-wider">내 순위</p>
                <p className="text-3xl font-black text-white leading-none mt-0.5">
                  {myEntry.rank}<span className="text-base font-bold text-white/70">위</span>
                </p>
                <p className={cn(
                  "text-xs font-bold mt-0.5",
                  myEntry.totalReturn >= 0 ? "text-yellow-200" : "text-white/60"
                )}>
                  {formatPercent(myEntry.totalReturnPercent)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 난이도 탭 — 헤더 하단에 붙음 */}
        <div className="flex" style={{ background: "rgba(0,0,0,0.2)" }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setDifficulty(tab.id)}
              className={cn(
                "flex-1 py-2.5 text-sm font-bold transition-colors",
                difficulty === tab.id
                  ? "text-white border-b-2 border-white"
                  : "text-white/50 hover:text-white/80"
              )}
            >
              {tab.emoji} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── 본문 ── */}
      {isLoading ? (
        <div className="bg-card rounded-3xl p-14 flex flex-col items-center gap-3 border border-border/50">
          <div className="w-9 h-9 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground font-medium">랭킹 불러오는 중...</span>
        </div>
      ) : !rankings || rankings.length === 0 ? (
        <div className="bg-card rounded-3xl p-14 text-center border border-border/50">
          <div className="text-5xl mb-4">🏆</div>
          <p className="font-bold text-foreground">아직 순위 데이터가 없습니다</p>
          <p className="text-xs text-muted-foreground mt-1">투자를 시작하면 랭킹에 등록됩니다!</p>
        </div>
      ) : (
        <div className="space-y-3">

          {/* ── TOP 3 포디엄 ── */}
          {top3.length > 0 && (
            <div className="bg-card border border-border/50 rounded-3xl overflow-hidden shadow-sm">
              <div className="px-5 pt-5 pb-2 text-center">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">TOP 3</span>
              </div>

              {/* 포디엄: 2위 왼쪽, 1위 가운데, 3위 오른쪽 */}
              <div className="flex items-end justify-center gap-2 px-4 pb-0 pt-2">
                {[top3[1], top3[0], top3[2]].map((entry, podIdx) => {
                  const ranks = [2, 1, 3] as const;
                  const rank = ranks[podIdx];
                  const isFirst = rank === 1;
                  const isSelf = entry?.userId === currentUserId;
                  const heights = ["h-16", "h-24", "h-12"];
                  const medalColors = ["#9CA3AF", "#D4A017", "#C2855A"];
                  const podBg = ["bg-slate-100 dark:bg-slate-800", "bg-amber-50 dark:bg-amber-900/30", "bg-orange-50 dark:bg-orange-900/20"];

                  if (!entry) return <div key={podIdx} className="flex-1" />;

                  return (
                    <motion.div
                      key={entry.userId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: podIdx * 0.1, type: "spring", stiffness: 300, damping: 28 }}
                      className="flex-1 flex flex-col items-center cursor-pointer group"
                      onClick={() => setLocation(`/profile/${entry.userId}`)}
                    >
                      {isFirst && (
                        <motion.span
                          animate={{ y: [0, -5, 0] }}
                          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                          className="text-xl mb-1"
                        >👑</motion.span>
                      )}

                      <GameAvatar
                        avatarId={entry.avatar}
                        size={isFirst ? 56 : 44}
                        rounded="rounded-xl"
                        className={cn(
                          "shadow-md group-hover:scale-105 transition-transform",
                          isSelf ? "ring-2 ring-primary ring-offset-1" : ""
                        )}
                      />

                      <p className={cn(
                        "font-black mt-1.5 truncate max-w-[76px] text-center",
                        isFirst ? "text-sm" : "text-xs",
                        isSelf ? "text-primary" : "text-foreground"
                      )}>
                        {entry.username}
                      </p>
                      <p className={cn(
                        "text-xs font-black",
                        getColorClass(entry.totalReturn)
                      )}>
                        {formatPercent(entry.totalReturnPercent)}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-semibold mb-2">
                        {formatCurrency(entry.totalAssets)}
                      </p>

                      {/* 포디엄 받침 */}
                      <div className={cn(
                        "w-full flex items-center justify-center rounded-t-xl",
                        heights[podIdx], podBg[podIdx]
                      )}>
                        <span className="font-black text-lg" style={{ color: medalColors[podIdx] }}>
                          {rank}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── 4위 이하 ── */}
          {rest.length > 0 && (
            <div className="bg-card border border-border/50 rounded-3xl overflow-hidden shadow-sm">
              <AnimatePresence>
                {rest.map((entry, i) => {
                  const change = rankChanges.get(entry.userId) ?? 0;
                  const isSelf = entry.userId === currentUserId;
                  const medal = RANK_MEDAL[entry.rank];
                  const isPositive = entry.totalReturn >= 0;

                  return (
                    <motion.div
                      layout
                      key={entry.userId}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03, duration: 0.2 }}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3.5 border-b border-border/30 last:border-0 cursor-pointer transition-colors",
                        isSelf
                          ? "bg-primary/[0.04] hover:bg-primary/[0.07]"
                          : "hover:bg-muted/40"
                      )}
                      onClick={() => setLocation(`/profile/${entry.userId}`)}
                    >
                      {/* 순위 번호 */}
                      <div className="w-8 flex-shrink-0 text-center">
                        {medal ? (
                          <span style={{ color: medal.color }}>{medal.icon}</span>
                        ) : (
                          <span className={cn(
                            "text-sm font-black",
                            isSelf ? "text-primary" : "text-muted-foreground"
                          )}>{entry.rank}</span>
                        )}
                        {change !== 0 && (
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className={cn(
                              "text-[9px] font-black leading-none mt-0.5",
                              change > 0 ? "text-red-500" : "text-blue-500"
                            )}
                          >
                            {change > 0 ? `▲${change}` : `▼${Math.abs(change)}`}
                          </motion.p>
                        )}
                      </div>

                      <GameAvatar avatarId={entry.avatar} size={40} rounded="rounded-xl" className="shadow-sm flex-shrink-0" />

                      {/* 이름 + 난이도 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={cn(
                            "font-bold text-sm truncate",
                            isSelf ? "text-primary" : "text-foreground"
                          )}>
                            {entry.username}
                          </span>
                          {isSelf && (
                            <span className="text-[9px] bg-primary text-white px-1.5 py-0.5 rounded-full font-black flex-shrink-0">나</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                          {formatCurrency(entry.totalAssets)}
                        </p>
                      </div>

                      {/* 수익률 */}
                      <div className="text-right flex-shrink-0">
                        <div className={cn(
                          "flex items-center gap-0.5 justify-end font-black text-sm",
                          getColorClass(entry.totalReturn)
                        )}>
                          {isPositive
                            ? <TrendingUp className="w-3.5 h-3.5" />
                            : <TrendingDown className="w-3.5 h-3.5" />}
                          {formatPercent(entry.totalReturnPercent)}
                        </div>
                        <p className={cn(
                          "text-[10px] font-semibold mt-0.5",
                          isPositive ? "text-red-400" : "text-blue-400"
                        )}>
                          {isPositive ? "+" : ""}{formatCurrency(entry.totalReturn)}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}

          {/* ── 내 순위 고정 카드 (TOP3 밖인 경우) ── */}
          {myEntry && myEntry.rank > 3 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border-2 p-4 flex items-center gap-3"
              style={{ borderColor: conf.accent, background: conf.light }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center font-black text-sm text-white flex-shrink-0"
                style={{ background: conf.accent }}
              >
                {myEntry.rank}
              </div>
              <GameAvatar avatarId={myEntry.avatar} size={38} rounded="rounded-xl" className="flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-black text-sm text-foreground truncate">{myEntry.username} <span className="text-[10px] text-muted-foreground font-medium">· 내 순위</span></p>
                <p className="text-xs text-muted-foreground font-semibold">{formatCurrency(myEntry.totalAssets)}</p>
              </div>
              <div className={cn("font-black text-base flex-shrink-0", getColorClass(myEntry.totalReturn))}>
                {formatPercent(myEntry.totalReturnPercent)}
              </div>
            </motion.div>
          )}

        </div>
      )}
    </div>
  );
}
