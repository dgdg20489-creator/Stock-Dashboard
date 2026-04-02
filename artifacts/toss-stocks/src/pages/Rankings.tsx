import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useGetRankings, GetRankingsDifficulty } from "@workspace/api-client-react";
import { formatCurrency, formatPercent, getColorClass } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { GameAvatar } from "@/components/GameAvatar";

function TrophyIcon({ rank, size = 48 }: { rank: 1 | 2 | 3; size?: number }) {
  const configs = {
    1: { cup: "#FFD700", shine: "#FFF176", shadow: "#B8860B", base: "#DAA520", label: "금" },
    2: { cup: "#C0C0C0", shine: "#FFFFFF", shadow: "#808080", base: "#A9A9A9", label: "은" },
    3: { cup: "#CD7F32", shine: "#E8A958", shadow: "#7B4A1E", base: "#A0522D", label: "동" },
  };
  const c = configs[rank];
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* cup body */}
      <path d="M14 6h20v18c0 6-4 10-10 10S14 30 14 24V6z" fill={c.cup} />
      {/* shine */}
      <path d="M18 8h4v12c0 2-1 3-2 3s-2-1-2-3V8z" fill={c.shine} opacity="0.5" />
      {/* handles */}
      <path d="M14 10H8a6 6 0 0 0 6 6V10z" fill={c.cup} />
      <path d="M34 10h6a6 6 0 0 1-6 6V10z" fill={c.cup} />
      {/* handle shadow */}
      <path d="M14 13H8" stroke={c.shadow} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M34 13h6" stroke={c.shadow} strokeWidth="1.5" strokeLinecap="round" />
      {/* stem */}
      <rect x="21" y="34" width="6" height="5" fill={c.base} />
      {/* base */}
      <rect x="15" y="39" width="18" height="4" rx="2" fill={c.base} />
      {/* base shine */}
      <rect x="17" y="40" width="14" height="1.5" rx="0.75" fill={c.shine} opacity="0.4" />
      {/* rank text on cup */}
      <text x="24" y="22" textAnchor="middle" fontSize="10" fontWeight="900" fill={c.shadow} fontFamily="system-ui">{c.label}</text>
    </svg>
  );
}

export default function Rankings() {
  const [, setLocation] = useLocation();
  const [difficulty, setDifficulty] = useState<GetRankingsDifficulty>(GetRankingsDifficulty.beginner);
  const prevRanksRef = useRef<Map<number, number>>(new Map());
  const [rankChanges, setRankChanges] = useState<Map<number, number>>(new Map());

  const goToProfile = (userId: number) => setLocation(`/profile/${userId}`);

  const { data: rankings, isLoading } = useGetRankings(
    { difficulty },
    { query: { refetchInterval: 5 * 1000 } }
  );

  useEffect(() => {
    if (!rankings) return;
    const newChanges = new Map<number, number>();
    rankings.forEach(entry => {
      const prev = prevRanksRef.current.get(entry.userId);
      if (prev !== undefined && prev !== entry.rank) {
        newChanges.set(entry.userId, prev - entry.rank);
      }
    });
    setRankChanges(newChanges);
    const newPrev = new Map<number, number>();
    rankings.forEach(e => newPrev.set(e.userId, e.rank));
    prevRanksRef.current = newPrev;
    if (newChanges.size > 0) {
      setTimeout(() => setRankChanges(new Map()), 3000);
    }
  }, [rankings]);

  const tabs = [
    { id: GetRankingsDifficulty.beginner,     label: "초보" },
    { id: GetRankingsDifficulty.intermediate, label: "중수" },
    { id: GetRankingsDifficulty.expert,       label: "고수" },
  ];

  const currentUserId = parseInt(localStorage.getItem("toss_userId") || "0");

  const top3BgColors = [
    "bg-gradient-to-b from-yellow-50 to-amber-100 border-amber-300",
    "bg-gradient-to-b from-slate-50 to-slate-100 border-slate-300",
    "bg-gradient-to-b from-orange-50 to-amber-50 border-amber-700/40",
  ];

  const rankBadgeColors = [
    "bg-gradient-to-br from-yellow-300 to-amber-500 text-amber-900",
    "bg-gradient-to-br from-slate-300 to-slate-500 text-slate-800",
    "bg-gradient-to-br from-amber-600 to-amber-800 text-amber-100",
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">실시간 랭킹</h1>
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse inline-block" />
            5초마다 자동 갱신
          </p>
        </div>
      </div>

      {/* Tabs (초보 / 중수 / 고수 only) */}
      <div className="flex gap-2 bg-muted p-1.5 rounded-2xl">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setDifficulty(tab.id)}
            className={`flex-1 px-4 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all duration-200 ${
              difficulty === tab.id
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="bg-card rounded-3xl shadow-sm border border-border/50 overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <span className="text-sm text-muted-foreground font-medium">랭킹 불러오는 중...</span>
          </div>
        ) : !rankings || rankings.length === 0 ? (
          <div className="p-12 text-center">
            <TrophyIcon rank={1} size={56} />
            <p className="text-muted-foreground font-medium mt-3">랭킹 데이터가 없습니다.</p>
            <p className="text-xs text-muted-foreground mt-1">투자를 시작하면 랭킹에 표시됩니다.</p>
          </div>
        ) : (
          <div className="w-full">

            {/* ── TOP 3 PODIUM ── */}
            {rankings.length >= 1 && (
              <div className="px-4 pt-6 pb-4 border-b border-border/40 bg-gradient-to-b from-muted/30 to-transparent">

                {/* 1등: 금 트로피 — 맨 위 중앙 */}
                {rankings[0] && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col items-center mb-4"
                  >
                    <div className={`relative flex flex-col items-center gap-2 px-8 py-4 rounded-2xl border-2 ${top3BgColors[0]} shadow-lg shadow-amber-200/60`}>
                      {/* 금 트로피 + 왕관 효과 */}
                      <div className="relative">
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-2xl">👑</div>
                        <TrophyIcon rank={1} size={56} />
                      </div>
                      <GameAvatar avatarId={rankings[0].avatar} size={52} rounded="rounded-xl" className="shadow-md ring-2 ring-amber-400" />
                      <div className="text-center">
                        <p
                          className={`font-black text-base cursor-pointer hover:underline hover:text-primary transition-colors ${rankings[0].userId === currentUserId ? "text-primary" : "text-foreground"}`}
                          onClick={() => goToProfile(rankings[0].userId)}
                        >
                          {rankings[0].username}{rankings[0].userId === currentUserId ? " 👤" : ""}
                        </p>
                        <p className={`text-sm font-bold ${getColorClass(rankings[0].totalReturn)}`}>
                          {formatPercent(rankings[0].totalReturnPercent)}
                        </p>
                        <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                          {formatCurrency(rankings[0].totalAssets)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 2등 (왼쪽) + 3등 (오른쪽) */}
                <div className="grid grid-cols-2 gap-3">
                  {[rankings[1], rankings[2]].map((entry, idx) => {
                    if (!entry) return <div key={idx} />;
                    const rank = (idx + 2) as 2 | 3;
                    const isSelf = entry.userId === currentUserId;
                    return (
                      <motion.div
                        key={entry.userId}
                        initial={{ opacity: 0, x: idx === 0 ? -20 : 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15, duration: 0.4 }}
                        className={`flex flex-col items-center gap-2 px-4 py-3 rounded-2xl border ${top3BgColors[rank - 1]} shadow-md`}
                      >
                        <TrophyIcon rank={rank} size={40} />
                        <GameAvatar avatarId={entry.avatar} size={44} rounded="rounded-xl" className="shadow-sm" />
                        <div className="text-center">
                          <p
                            className={`font-bold text-sm cursor-pointer hover:underline hover:text-primary transition-colors ${isSelf ? "text-primary" : "text-foreground"} truncate max-w-24`}
                            onClick={() => goToProfile(entry.userId)}
                          >
                            {entry.username}{isSelf ? " 👤" : ""}
                          </p>
                          <p className={`text-xs font-bold ${getColorClass(entry.totalReturn)}`}>
                            {formatPercent(entry.totalReturnPercent)}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-semibold">
                            {formatCurrency(entry.totalAssets)}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── 4위 이하 리스트 ── */}
            <div className="divide-y divide-border/40">
              <AnimatePresence>
                {(rankings.length > 3 ? rankings.slice(3) : []).map((entry) => {
                  const change = rankChanges.get(entry.userId) ?? 0;
                  const isSelf = entry.userId === currentUserId;
                  return (
                    <motion.div
                      layout
                      key={entry.userId}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className={`flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer ${isSelf ? "bg-primary/5" : ""}`}
                      onClick={() => goToProfile(entry.userId)}
                    >
                      {/* 순위 뱃지 */}
                      <div className="w-10 flex-shrink-0 flex flex-col items-center gap-0.5">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm bg-muted text-muted-foreground">
                          {entry.rank}
                        </span>
                        {change !== 0 && (
                          <motion.span
                            initial={{ opacity: 0, scale: 0.6 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className={`text-[9px] font-bold ${change > 0 ? "text-up" : "text-down"}`}
                          >
                            {change > 0 ? `▲${change}` : `▼${Math.abs(change)}`}
                          </motion.span>
                        )}
                      </div>

                      <GameAvatar avatarId={entry.avatar} size={44} rounded="rounded-xl" className="shadow-sm flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-sm text-foreground truncate">{entry.username}</span>
                          {isSelf && <span className="text-[9px] bg-primary text-white px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">나</span>}
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0 ${
                            entry.difficulty === "beginner" ? "bg-emerald-100 text-emerald-700" :
                            entry.difficulty === "intermediate" ? "bg-blue-100 text-blue-700" :
                            "bg-red-100 text-red-700"
                          }`}>
                            {entry.difficulty === "beginner" ? "초보" : entry.difficulty === "intermediate" ? "중수" : "고수"}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground font-semibold mt-0.5">
                          {formatCurrency(entry.totalAssets)}
                        </div>
                      </div>

                      <div className={`text-right font-bold text-base flex-shrink-0 ${getColorClass(entry.totalReturn)}`}>
                        {formatPercent(entry.totalReturnPercent)}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
