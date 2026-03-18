import { useState } from "react";
import { useGetRankings, GetRankingsDifficulty } from "@workspace/api-client-react";
import { formatCurrency, formatPercent, getColorClass } from "@/lib/utils";
import { motion } from "framer-motion";

export default function Rankings() {
  const [difficulty, setDifficulty] = useState<GetRankingsDifficulty>(GetRankingsDifficulty.all);
  
  const { data: rankings, isLoading } = useGetRankings(
    { difficulty },
    { query: { refetchInterval: 5 * 60 * 1000 } } // Auto refresh every 5 mins
  );

  const tabs = [
    { id: GetRankingsDifficulty.all, label: "전체" },
    { id: GetRankingsDifficulty.beginner, label: "초보" },
    { id: GetRankingsDifficulty.intermediate, label: "중수" },
    { id: GetRankingsDifficulty.expert, label: "고수" },
  ];

  const currentUserId = parseInt(localStorage.getItem("toss_userId") || "0");

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-end justify-between px-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">실시간 랭킹</h1>
      </div>

      <div className="flex gap-2 bg-muted p-1.5 rounded-2xl w-full sm:w-auto overflow-x-auto scrollbar-hide">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setDifficulty(tab.id)}
            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all duration-200 ${
              difficulty === tab.id 
                ? 'bg-card text-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-card rounded-3xl shadow-sm border border-border/50 overflow-hidden">
        {isLoading ? (
          <div className="p-8 flex justify-center"><div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
        ) : !rankings || rankings.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground font-medium">랭킹 데이터가 없습니다.</div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-border/50 text-sm font-semibold text-muted-foreground">
                  <th className="py-4 px-6 w-20 text-center">순위</th>
                  <th className="py-4 px-6">프로필</th>
                  <th className="py-4 px-6 text-right">총 자산</th>
                  <th className="py-4 px-6 text-right w-32">수익률</th>
                </tr>
              </thead>
              <tbody>
                {rankings.map((entry, idx) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={entry.userId} 
                    className={`border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors ${entry.userId === currentUserId ? 'bg-primary/5' : ''}`}
                  >
                    <td className="py-5 px-6 text-center">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                        entry.rank === 1 ? 'bg-[#FFD700] text-amber-900' :
                        entry.rank === 2 ? 'bg-[#C0C0C0] text-gray-800' :
                        entry.rank === 3 ? 'bg-[#CD7F32] text-amber-950' :
                        'text-muted-foreground'
                      }`}>
                        {entry.rank}
                      </span>
                    </td>
                    <td className="py-5 px-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-muted rounded-2xl flex items-center justify-center text-2xl shadow-inner">
                          {entry.avatar === 'male' ? '👨' : '👩'}
                        </div>
                        <div>
                          <div className="font-bold text-lg text-foreground flex items-center gap-2">
                            {entry.username}
                            {entry.userId === currentUserId && <span className="text-[10px] bg-primary text-white px-1.5 py-0.5 rounded-full">나</span>}
                          </div>
                          <div className="text-xs font-semibold text-muted-foreground mt-0.5">
                            {entry.difficulty === 'beginner' ? '초보' : entry.difficulty === 'intermediate' ? '중수' : '고수'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 px-6 text-right font-bold text-lg">
                      {formatCurrency(entry.totalAssets)}
                    </td>
                    <td className={`py-5 px-6 text-right font-bold text-lg ${getColorClass(entry.totalReturn)}`}>
                      {formatPercent(entry.totalReturnPercent)}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
