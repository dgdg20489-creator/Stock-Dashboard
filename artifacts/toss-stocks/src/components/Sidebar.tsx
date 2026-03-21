import { useGetUser, useGetUserPortfolio } from "@workspace/api-client-react";
import { formatCurrency, formatPercent, getColorClass } from "@/lib/utils";
import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { BarChart2, Trophy, Lightbulb, User } from "lucide-react";

interface SidebarProps {
  userId: number;
}

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

  return (
    <aside className="w-64 flex-shrink-0 hidden lg:flex flex-col gap-4">
      {/* 프로필 카드 */}
      {user && portfolio && (
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-card rounded-3xl p-5 shadow-sm border border-border/50"
        >
          <Link href="/my-info" className="flex items-center gap-3 mb-4 cursor-pointer group">
            <div className="w-12 h-12 bg-muted rounded-2xl flex items-center justify-center text-2xl shadow-inner group-hover:scale-105 transition-transform">
              {user.avatar === "male" ? "👨" : "👩"}
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-foreground truncate group-hover:text-primary transition-colors">
                {user.username}
              </h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary mt-0.5">
                {user.difficulty === "beginner" ? "🌱 초보" : user.difficulty === "intermediate" ? "🌿 중수" : "🔥 고수"}
              </span>
            </div>
          </Link>

          <div className="space-y-1 bg-muted/50 rounded-2xl p-3">
            <p className="text-xs font-medium text-muted-foreground">총 자산</p>
            <div className="text-lg font-extrabold text-foreground">
              {formatCurrency(portfolio.totalAssets)}
            </div>
            <div className={cn("text-xs font-bold flex items-center gap-1", getColorClass(portfolio.totalReturn))}>
              <span>{portfolio.totalReturn > 0 ? "▲" : portfolio.totalReturn < 0 ? "▼" : ""}</span>
              <span>{formatCurrency(Math.abs(portfolio.totalReturn))}</span>
              <span className="opacity-80">({formatPercent(portfolio.totalReturnPercent)})</span>
            </div>
          </div>

          <div className="mt-3 flex justify-between items-center text-xs">
            <span className="text-muted-foreground font-medium">예수금</span>
            <span className="font-bold text-foreground">{formatCurrency(portfolio.cashBalance)}</span>
          </div>
        </motion.div>
      )}

      {/* 네비게이션 */}
      <motion.nav
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-card rounded-3xl p-3 shadow-sm border border-border/50 flex flex-col gap-1"
      >
        {navItems.map((item) => {
          const isActive = location === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold text-sm transition-all duration-150",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <item.icon className={cn("w-4 h-4", isActive && "stroke-[2.5px]")} />
              {item.label}
            </Link>
          );
        })}
      </motion.nav>
    </aside>
  );
}
