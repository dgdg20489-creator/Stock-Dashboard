import { useGetUser, useGetUserPortfolio } from "@workspace/api-client-react";
import { formatCurrency, formatPercent, getColorClass } from "@/lib/utils";
import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { BarChart2, Trophy, Lightbulb, User, TrendingUp, TrendingDown } from "lucide-react";
import { GameAvatar, getAvatarDef, INVEST_TYPES } from "@/components/GameAvatar";

interface SidebarProps {
  userId: number;
}

const DIFFICULTY_LABEL: Record<string, string> = {
  beginner: "입문",
  intermediate: "중급",
  expert: "고수",
};

export function Sidebar({ userId }: SidebarProps) {
  const [location] = useLocation();
  const { data: user } = useGetUser(userId);
  const { data: portfolio } = useGetUserPortfolio(userId);

  const navItems = [
    { label: "주식", path: "/", icon: BarChart2 },
    { label: "랭킹", path: "/rankings", icon: Trophy },
    { label: "주식 팁", path: "/tips", icon: Lightbulb },
    { label: "내 정보", path: "/my-info", icon: User },
  ];

  const avatarId = user?.avatar ?? "balanced_m";
  const avatarDef = getAvatarDef(avatarId);
  const investType = INVEST_TYPES.find((t) => t.type === avatarDef.type);

  const returnPositive = portfolio && portfolio.totalReturnPercent > 0;
  const returnNegative = portfolio && portfolio.totalReturnPercent < 0;

  return (
    <aside className="w-56 flex-shrink-0 hidden lg:flex flex-col gap-3">
      {/* 프로필 카드 */}
      {user && portfolio && (
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-card rounded-xl shadow-sm border border-border/60 overflow-hidden"
        >
          {/* 컬러 상단 띠 */}
          <div
            className="h-1 w-full"
            style={{ background: `linear-gradient(90deg, ${investType?.themeColor ?? "#666"}, ${investType?.themeColor ?? "#666"}55)` }}
          />
          <div className="p-4">
            <Link href="/my-info" className="flex items-center gap-3 mb-4 cursor-pointer group">
              <div className="flex-shrink-0 rounded-xl overflow-hidden ring-1 ring-border group-hover:ring-primary/40 transition-all">
                <GameAvatar avatarId={avatarId} size={44} rounded="rounded-xl" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground text-sm truncate group-hover:text-primary transition-colors leading-tight">
                  {user.username}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: investType?.themeColor ?? "#888" }}
                  />
                  <span className="text-[11px] text-muted-foreground font-medium truncate">
                    {investType?.label ?? "균형형"} · {DIFFICULTY_LABEL[user.difficulty ?? "beginner"]}
                  </span>
                </div>
              </div>
            </Link>

            {/* 자산 요약 */}
            <div className="bg-muted/60 rounded-lg p-3 space-y-2">
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

      {/* 네비게이션 */}
      <motion.nav
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.04 }}
        className="bg-card rounded-xl shadow-sm border border-border/60 p-2 flex flex-col gap-0.5"
      >
        {navItems.map((item) => {
          const active = location === item.path || (item.path !== "/" && location.startsWith(item.path));
          return (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150",
                active
                  ? "bg-foreground/5 text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}
            >
              <item.icon className={cn("w-3.5 h-3.5 flex-shrink-0", active ? "text-primary" : "")} />
              {item.label}
            </Link>
          );
        })}
      </motion.nav>
    </aside>
  );
}
