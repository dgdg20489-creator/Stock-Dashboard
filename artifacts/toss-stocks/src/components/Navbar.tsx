import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { BarChart2, Trophy, Lightbulb, User, Star, Zap } from "lucide-react";
import { useMissions } from "@/hooks/use-missions";

export function Navbar() {
  const [location] = useLocation();
  const { missions, coins } = useMissions();

  const navItems = [
    { label: "주식", path: "/", icon: BarChart2 },
    { label: "관심", path: "/watchlist", icon: Star },
    { label: "랭킹", path: "/rankings", icon: Trophy },
    { label: "주식 팁", path: "/tips", icon: Lightbulb },
    { label: "내 정보", path: "/my-info", icon: User },
  ];

  const isActive = (path: string) =>
    path === "/" ? location === "/" : location.startsWith(path);

  return (
    <>
      {/* 상단 헤더 */}
      <header className="sticky top-0 z-30 w-full bg-white border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            {/* 로고 */}
            <Link href="/" className="flex items-center gap-2.5 group cursor-pointer flex-shrink-0">
              <div className="w-9 h-9 bg-gradient-to-br from-red-600 to-red-500 rounded-xl flex items-center justify-center text-white font-extrabold text-base shadow-sm shadow-red-500/30 group-hover:scale-105 transition-transform select-none">
                원
              </div>
              <div className="hidden sm:flex flex-col leading-none">
                <span className="font-extrabold text-lg tracking-tight text-foreground">원광증권</span>
                <span className="text-[10px] font-bold text-blue-600 tracking-wider">WONKWANG INVEST</span>
              </div>
            </Link>

            {/* PC 네비 */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={cn(
                      "flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-semibold text-sm transition-all duration-150",
                      active
                        ? "bg-red-50 text-red-600 font-bold"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <item.icon className={cn("w-4 h-4", active && "stroke-[2.5px]")} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* 오른쪽: 미션 / 코인 */}
          <div className="flex items-center gap-2">
            <Link href="/missions">
              <button className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 rounded-xl transition-colors">
                <Zap className="w-3.5 h-3.5 text-red-500" />
                <span className="text-xs font-extrabold text-red-600">{missions.points}P</span>
              </button>
            </Link>
            <Link href="/missions">
              <button className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors">
                <span className="text-sm">🪙</span>
                <span className="text-xs font-extrabold text-blue-600">{coins}코인</span>
              </button>
            </Link>
          </div>
        </div>

        {/* 헤더 하단 빨강-파랑 그라데이션 라인 */}
        <div className="h-0.5 bg-gradient-to-r from-red-500 via-red-300 to-blue-500" />
      </header>

      {/* 모바일 하단 탭바 */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border">
        {/* 탭바 상단 그라데이션 라인 */}
        <div className="h-0.5 bg-gradient-to-r from-red-500 via-red-300 to-blue-500" />
        <div className="flex items-center justify-around h-14 px-1">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-[10px] font-semibold transition-colors pt-1",
                  active ? "text-red-600" : "text-muted-foreground"
                )}
              >
                <item.icon className={cn("w-5 h-5", active && "stroke-[2.5px]")} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
