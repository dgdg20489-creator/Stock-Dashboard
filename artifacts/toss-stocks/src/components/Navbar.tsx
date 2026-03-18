import { Search, Bell, Menu } from "lucide-react";
import { Link } from "wouter";

export function Navbar() {
  return (
    <header className="sticky top-0 z-30 w-full bg-white/80 backdrop-blur-md border-b border-border shadow-sm">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 group cursor-pointer">
            <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm group-hover:scale-105 transition-transform">
              t
            </div>
            <span className="font-bold text-xl tracking-tight text-foreground">토스증권</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 font-medium text-muted-foreground">
            <Link href="/" className="text-foreground transition-colors cursor-pointer">내 주식</Link>
            <span className="hover:text-foreground transition-colors cursor-pointer">오늘의 발견</span>
            <span className="hover:text-foreground transition-colors cursor-pointer">관심</span>
          </nav>
        </div>

        <div className="flex items-center gap-4 text-muted-foreground">
          <button className="p-2 hover:bg-muted rounded-full transition-colors">
            <Search className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-muted rounded-full transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-destructive rounded-full" />
          </button>
          <button className="md:hidden p-2 hover:bg-muted rounded-full transition-colors">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
