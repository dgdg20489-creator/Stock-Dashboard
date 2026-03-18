import { Search, Bell, Menu, TrendingUp } from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [location] = useLocation();

  const navItems = [
    { label: "내 주식", path: "/" },
    { label: "랭킹", path: "/rankings" },
  ];

  return (
    <header className="sticky top-0 z-30 w-full bg-background/80 backdrop-blur-xl border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 group cursor-pointer">
            <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm group-hover:scale-105 transition-transform">
              t
            </div>
            <span className="font-bold text-xl tracking-tight text-foreground hidden sm:block">토스증권</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 font-medium text-muted-foreground">
            {navItems.map((item) => (
              <Link 
                key={item.path} 
                href={item.path} 
                className={cn(
                  "transition-colors cursor-pointer py-2 border-b-2",
                  location === item.path 
                    ? "text-foreground border-primary font-bold" 
                    : "border-transparent hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 text-muted-foreground">
          <button className="p-2.5 hover:bg-muted rounded-full transition-colors">
            <Search className="w-5 h-5" />
          </button>
          <button className="p-2.5 hover:bg-muted rounded-full transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-up rounded-full border-2 border-background" />
          </button>
          <button className="md:hidden p-2.5 hover:bg-muted rounded-full transition-colors">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
