import { useGetUser, useGetUserPortfolio } from "@workspace/api-client-react";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import { GameAvatar, getAvatarDef, INVEST_TYPES } from "@/components/GameAvatar";
import { loadProfileCard, getCollectedCards, ALL_CARDS } from "@/pages/Compendium";

interface SidebarProps {
  userId: number;
}

const DIFFICULTY_LABEL: Record<string, string> = {
  beginner: "입문",
  intermediate: "중급",
  expert: "고수",
};

export function Sidebar({ userId }: SidebarProps) {
  const { data: user } = useGetUser(userId);
  const { data: portfolio } = useGetUserPortfolio(userId, {
    query: { refetchInterval: 3000, staleTime: 0 },
  });

  const avatarId = user?.avatar ?? "balanced_m";
  const avatarDef = getAvatarDef(avatarId);
  const investType = INVEST_TYPES.find((t) => t.type === avatarDef.type);

  const uid = String(userId);
  const profileCardId = loadProfileCard(uid);
  const collectedCards = getCollectedCards(uid, avatarId);
  const activeCardId = profileCardId && collectedCards.includes(profileCardId)
    ? profileCardId
    : collectedCards[0] ?? null;
  const activeCard = activeCardId ? ALL_CARDS.find(c => c.id === activeCardId) ?? null : null;

  const returnPositive = portfolio && portfolio.totalReturnPercent > 0;
  const returnNegative = portfolio && portfolio.totalReturnPercent < 0;

  return (
    <aside className="w-56 flex-shrink-0 hidden lg:flex flex-col gap-3">
      {user && portfolio && (
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-card rounded-2xl shadow-sm border border-border/60 overflow-hidden"
        >
          {/* 카드 일러스트 상단 영역 */}
          <Link href="/my-info" className="block cursor-pointer group relative">
            <div className="relative w-full overflow-hidden" style={{ height: 220 }}>
              {activeCard?.image ? (
                <>
                  <img
                    src={activeCard.image}
                    alt={activeCard.sublabel}
                    className="w-full h-full object-cover object-top group-hover:scale-[1.03] transition-transform duration-300"
                  />
                  {/* 하단 그라데이션 */}
                  <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-card/90 to-transparent" />
                  {/* 레어리티 뱃지 */}
                  {activeCard.rarity !== "기본" && (
                    <div className="absolute top-2.5 right-2.5 z-20 bg-yellow-400 text-yellow-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow">
                      {activeCard.rarity}
                    </div>
                  )}
                </>
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ background: `linear-gradient(160deg, ${investType?.themeColor ?? "#4f46e5"}22, ${investType?.themeColor ?? "#4f46e5"}08)` }}
                >
                  <GameAvatar avatarId={avatarId} size={80} rounded="rounded-2xl" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
            </div>
          </Link>

          {/* 사용자 정보 */}
          <div className="px-4 pt-3 pb-4 space-y-3">
            <Link href="/my-info" className="block group cursor-pointer">
              <p className="font-bold text-foreground text-sm group-hover:text-primary transition-colors leading-tight">
                {user.username}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: investType?.themeColor ?? "#888" }}
                />
                <span className="text-[11px] text-muted-foreground font-medium">
                  {investType?.label ?? "균형형"} · {DIFFICULTY_LABEL[user.difficulty ?? "beginner"]}
                </span>
              </div>
            </Link>

            {/* 자산 요약 */}
            <div className="bg-muted/60 rounded-xl p-3 space-y-2">
              <div>
                <p className="text-[10px] text-muted-foreground font-medium mb-0.5">총 자산</p>
                <p className="text-base font-bold text-foreground tracking-tight">
                  {formatCurrency(portfolio.totalAssets)}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                {returnPositive && <TrendingUp className="w-3 h-3 text-up flex-shrink-0" />}
                {returnNegative && <TrendingDown className="w-3 h-3 text-down flex-shrink-0" />}
                <span className={cn(
                  "text-[11px] font-semibold",
                  returnPositive ? "text-up" : returnNegative ? "text-down" : "text-muted-foreground"
                )}>
                  {portfolio.totalReturn > 0 ? "+" : ""}{formatCurrency(portfolio.totalReturn)}
                  <span className="ml-1 opacity-75">({formatPercent(portfolio.totalReturnPercent)})</span>
                </span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-border/40">
                <span className="text-[10px] text-muted-foreground">예수금</span>
                <span className="text-[11px] font-semibold text-foreground">{formatCurrency(portfolio.cashBalance)}</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </aside>
  );
}
