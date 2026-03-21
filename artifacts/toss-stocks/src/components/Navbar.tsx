import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { BarChart2, Trophy, Lightbulb, User } from "lucide-react";

export function Navbar() {
  const [location] = useLocation();

  const navItems = [
    { label: "주식", path: "/", icon: BarChart2 },
    { label: "랭킹", path: "/rankings", icon: Trophy },
    { label: "주식 팁", path: "/tips", icon: Lightbulb },
    { label: "내 정보", path: "/my-info", icon: User },
  ];

  return (
    <>
      <header className="sticky top-0 z-30 w-full bg-background/90 backdrop-blur-xl border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 group cursor-pointer flex-shrink-0">
              <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-white font-extrabold text-base shadow-sm group-hover:scale-105 transition-transform select-none">
                원
              </div>
              <span className="font-extrabold text-xl tracking-tight text-foreground hidden sm:block">
                원광증권
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = location === item.path;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={cn(
                      "flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-150",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* 모바일 하단 탭바 */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-xl border-t border-border">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const isActive = location === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-xs font-semibold transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive && "stroke-[2.5px]")} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
