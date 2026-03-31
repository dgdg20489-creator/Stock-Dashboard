import { useState } from "react";
import { cn } from "@/lib/utils";

const AVATAR_COLORS = [
  { bg: "bg-blue-500",   text: "text-white" },
  { bg: "bg-violet-500", text: "text-white" },
  { bg: "bg-emerald-500",text: "text-white" },
  { bg: "bg-rose-500",   text: "text-white" },
  { bg: "bg-amber-500",  text: "text-white" },
  { bg: "bg-cyan-500",   text: "text-white" },
  { bg: "bg-indigo-500", text: "text-white" },
  { bg: "bg-pink-500",   text: "text-white" },
  { bg: "bg-teal-500",   text: "text-white" },
  { bg: "bg-orange-500", text: "text-white" },
  { bg: "bg-lime-500",   text: "text-white" },
  { bg: "bg-sky-500",    text: "text-white" },
];

function hashColor(seed: string): typeof AVATAR_COLORS[0] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

interface StockLogoProps {
  ticker: string;
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const NAVER_LOGO_BASE = "https://ssl.pstatic.net/imgstock/fn/real/logo/stock/Stock";

export function StockLogo({ ticker, name, size = "md", className }: StockLogoProps) {
  const [failed, setFailed] = useState(false);
  const color = hashColor(ticker + name);
  const logoUrl = `${NAVER_LOGO_BASE}${ticker}.svg`;

  const sizeClass = size === "sm"
    ? "w-8 h-8 text-sm"
    : size === "lg"
    ? "w-14 h-14 text-xl"
    : "w-10 h-10 text-base";

  const initial = name.charAt(0) || ticker.charAt(0) || "?";

  if (failed) {
    return (
      <div
        className={cn(
          "rounded-full flex items-center justify-center font-extrabold flex-shrink-0 shadow-sm select-none",
          sizeClass,
          color.bg,
          color.text,
          className
        )}
      >
        {initial}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 shadow-sm bg-white border border-gray-100",
        sizeClass,
        className
      )}
    >
      <img
        src={logoUrl}
        alt={name}
        className="w-full h-full object-contain p-1"
        onError={() => setFailed(true)}
        loading="lazy"
      />
    </div>
  );
}
