import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits: 0,
  }).format(value) + "원";
}

export function formatPercent(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function formatLargeNumber(num: number): string {
  if (num >= 1_0000_0000_0000) {
    const jo = Math.floor(num / 1_0000_0000_0000);
    const uk = Math.floor((num % 1_0000_0000_0000) / 1_0000_0000);
    return uk > 0 ? `${jo}조 ${uk}억` : `${jo}조`;
  }
  if (num >= 1_0000_0000) {
    const uk = Math.floor(num / 1_0000_0000);
    const man = Math.floor((num % 1_0000_0000) / 1_0000);
    return man > 0 ? `${uk}억 ${man}만` : `${uk}억`;
  }
  return new Intl.NumberFormat("ko-KR").format(num);
}

/** 시가총액 포맷 — DB는 억원 단위로 저장됨 (예: 15989572 → "1,598조 9,572억원") */
export function formatMarketCap(ukNum: number): string {
  if (!ukNum || ukNum <= 0) return "-";
  if (ukNum >= 10_000) {
    const jo = Math.floor(ukNum / 10_000);
    const uk = ukNum % 10_000;
    const joStr = jo.toLocaleString("ko-KR");
    return uk > 0 ? `${joStr}조 ${uk.toLocaleString("ko-KR")}억원` : `${joStr}조원`;
  }
  return `${ukNum.toLocaleString("ko-KR")}억원`;
}

export function getColorClass(value: number, type: 'text' | 'bg' | 'bg-light' = 'text'): string {
  if (value > 0) return `${type}-up`;
  if (value < 0) return `${type}-down`;
  return type === 'text' ? 'text-muted-foreground' : 'bg-muted';
}
