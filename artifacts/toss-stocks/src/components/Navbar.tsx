import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { BarChart2, Trophy, Newspaper, User, Star, Lightbulb, CalendarDays, PlayCircle } from "lucide-react";

export function Navbar() {
  const [location] = useLocation();

  const navItems = [
    { label: "주식", path: "/", icon: BarChart2 },
    { label: "관심", path: "/watchlist", icon: Star },
    { label: "랭킹", path: "/rankings", icon: Trophy },
    { label: "공모주", path: "/ipo", icon: CalendarDays },
    { label: "뉴스", path: "/news", icon: Newspaper },
    { label: "팁·퀴즈", path: "/tips", icon: Lightbulb },
    { label: "가이드", path: "/guide", icon: PlayCircle },
    { label: "내정보", path: "/my-info", icon: User },
  ];

  const isActive = (path: string) =>
    path === "/" ? location === "/" : location.startsWith(path);

  return (
    <>
      {/* 상단 헤더 — 다크 */}
      <header className="sticky top-0 z-30 w-full bg-[#0f172a] border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* 로고 */}
            <Link href="/" className="flex items-center gap-2.5 group cursor-pointer flex-shrink-0">
              <div className="w-8 h-8 rounded-lg overflow-hidden bg-white/10 flex items-center justify-center group-hover:bg-white/15 transition-colors">
                <img src="/wonkwang-logo.png" alt="원광대학교 로고" className="w-full h-full object-contain p-0.5" />
              </div>
              <div className="hidden sm:flex flex-col leading-none gap-0.5">
                <span className="font-bold text-[15px] tracking-tight text-white">원광증권</span>
                <span className="text-[9px] font-semibold text-white/40 tracking-widest uppercase">Mock Trading</span>
              </div>
            </Link>

            {/* PC 네비 */}
            <nav className="hidden md:flex items-center gap-0.5">
              {navItems.map((item) => {
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-150",
                      active
                        ? "bg-white/10 text-white"
                        : "text-white/50 hover:text-white/80 hover:bg-white/5"
                    )}
                  >
                    <item.icon className="w-3.5 h-3.5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* 모바일 하단 탭바 */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0f172a] border-t border-white/10">
        <div className="flex items-center justify-around h-[52px] px-1">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-[9px] font-semibold transition-colors pt-1",
                  active ? "text-white" : "text-white/35 hover:text-white/60"
                )}
              >
                <item.icon className={cn("w-[18px] h-[18px]", active && "stroke-[2px]")} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
