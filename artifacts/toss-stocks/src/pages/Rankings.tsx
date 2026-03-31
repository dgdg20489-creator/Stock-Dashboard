import { useState, useRef, useEffect } from "react";
import { useGetRankings, GetRankingsDifficulty } from "@workspace/api-client-react";
import { formatCurrency, formatPercent, getColorClass } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { GameAvatar } from "@/components/GameAvatar";

export default function Rankings() {
  const [difficulty, setDifficulty] = useState<GetRankingsDifficulty>(GetRankingsDifficulty.all);
  const prevRanksRef = useRef<Map<number, number>>(new Map()); // userId → prev rank
  const [rankChanges, setRankChanges] = useState<Map<number, number>>(new Map()); // userId → delta

  const { data: rankings, isLoading } = useGetRankings(
    { difficulty },
    { query: { refetchInterval: 5 * 1000 } } // 5초마다 실시간 갱신
  );

  // Compute rank changes when rankings update
  useEffect(() => {
    if (!rankings) return;
    const newChanges = new Map<number, number>();
    rankings.forEach(entry => {
      const prev = prevRanksRef.current.get(entry.userId);
      if (prev !== undefined && prev !== entry.rank) {
        newChanges.set(entry.userId, prev - entry.rank); // positive = moved up
      }
    });
    setRankChanges(newChanges);
    // Update prev map
    const newPrev = new Map<number, number>();
    rankings.forEach(e => newPrev.set(e.userId, e.rank));
    prevRanksRef.current = newPrev;
    // Clear change indicators after 3s
    if (newChanges.size > 0) {
      setTimeout(() => setRankChanges(new Map()), 3000);
    }
  }, [rankings]);

  const tabs = [
    { id: GetRankingsDifficulty.all,          label: "전체" },
    { id: GetRankingsDifficulty.beginner,     label: "초보" },
    { id: GetRankingsDifficulty.intermediate, label: "중수" },
    { id: GetRankingsDifficulty.expert,       label: "고수" },
  ];

  const currentUserId = parseInt(localStorage.getItem("toss_userId") || "0");

  const medalColors = [
    "bg-gradient-to-br from-yellow-300 to-amber-500 text-amber-900 shadow-amber-300/50",
    "bg-gradient-to-br from-slate-300 to-slate-500 text-slate-800 shadow-slate-300/50",
    "bg-gradient-to-br from-amber-600 to-amber-800 text-amber-100 shadow-amber-700/50",
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
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

      {/* Tabs */}
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

      {/* Table */}
      <div className="bg-card rounded-3xl shadow-sm border border-border/50 overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <span className="text-sm text-muted-foreground font-medium">랭킹 불러오는 중...</span>
          </div>
        ) : !rankings || rankings.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-4xl mb-3">🏆</p>
            <p className="text-muted-foreground font-medium">랭킹 데이터가 없습니다.</p>
            <p className="text-xs text-muted-foreground mt-1">투자를 시작하면 랭킹에 표시됩니다.</p>
          </div>
        ) : (
          <div className="w-full">
            {/* Top 3 podium */}
            {rankings.length >= 3 && (
              <div className="grid grid-cols-3 gap-3 p-4 pb-2 border-b border-border/40">
                {[rankings[1], rankings[0], rankings[2]].map((entry, podiumIdx) => {
                  if (!entry) return <div key={podiumIdx} />;
                  const rank = podiumIdx === 1 ? 1 : podiumIdx === 0 ? 2 : 3;
                  const heights = ["h-28", "h-36", "h-24"];
                  const isSelf = entry.userId === currentUserId;
                  return (
                    <motion.div
                      key={entry.userId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: podiumIdx * 0.1 }}
                      className={`flex flex-col items-center gap-1 ${podiumIdx === 1 ? "order-2" : podiumIdx === 0 ? "order-1" : "order-3"}`}
                    >
                      <div className={`relative flex flex-col items-center ${heights[podiumIdx]} justify-end pb-2`}>
                        <GameAvatar avatarId={entry.avatar} size={podiumIdx === 1 ? 56 : 44} rounded="rounded-xl" className="shadow-lg mb-1" />
                        <span className={`text-[10px] font-bold truncate max-w-16 text-center ${isSelf ? "text-primary" : "text-foreground"}`}>
                          {entry.username}{isSelf ? " 👤" : ""}
                        </span>
                        <span className="text-[9px] text-muted-foreground font-semibold">
                          {formatPercent(entry.totalReturnPercent)}
                        </span>
                      </div>
                      <div className={`w-full rounded-t-xl flex items-center justify-center py-1.5 font-black text-lg shadow-lg ${medalColors[rank - 1]}`}
                        style={{ height: `${[40, 56, 32][rank - 1]}px` }}>
                        {rank}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Full list */}
            <div className="divide-y divide-border/40">
              <AnimatePresence>
                {rankings.map((entry, idx) => {
                  const change = rankChanges.get(entry.userId) ?? 0;
                  const isSelf = entry.userId === currentUserId;
                  return (
                    <motion.div
                      layout
                      key={entry.userId}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className={`flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors ${isSelf ? "bg-primary/5" : ""}`}
                    >
                      {/* Rank badge */}
                      <div className="w-10 flex-shrink-0 flex flex-col items-center gap-0.5">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm shadow-sm ${
                          entry.rank === 1 ? medalColors[0] :
                          entry.rank === 2 ? medalColors[1] :
                          entry.rank === 3 ? medalColors[2] :
                          "bg-muted text-muted-foreground"
                        }`}>
                          {entry.rank}
                        </span>
                        {/* Rank change indicator */}
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

                      {/* Avatar + name */}
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

                      {/* Return */}
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
