import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

export const TERM_DEFINITIONS: Record<string, string> = {
  "시가총액":    "이 회사 주식 전체의 총 가치예요. 클수록 규모가 큰 회사예요.",
  "PER":        "회사가 버는 돈에 비해 주가가 얼마나 비싼지 나타내는 지표예요. 낮을수록 저평가일 수 있어요.",
  "PBR":        "회사의 자산 가치 대비 주가가 얼마인지 보여줘요. 1 미만이면 자산보다 싸게 팔리는 것이에요.",
  "EPS":        "주식 1주당 회사가 벌어들인 순이익이에요. 높을수록 주당 이익이 많은 거예요.",
  "배당수익률":  "주가 대비 1년에 받는 배당금의 비율이에요. 예금 이자처럼 매년 받을 수 있는 수익이에요.",
  "거래량":     "오늘 하루 사고팔린 주식의 총 수량이에요. 많을수록 시장의 관심이 높은 거예요.",
  "호가창":     "지금 누군가 사려는 가격(매수)과 팔려는 가격(매도)을 한눈에 보여주는 화면이에요.",
  "예수금":     "내 계좌에서 주식을 살 수 있는 현금 잔액이에요. 주문 가능 금액이라고도 해요.",
  "수익률":     "투자한 금액 대비 얼마나 벌었는지(혹은 잃었는지) 보여주는 비율이에요.",
  "52주 최고":  "지난 1년 중 이 주식이 가장 높았던 가격이에요.",
  "52주 최저":  "지난 1년 중 이 주식이 가장 낮았던 가격이에요.",
  "시드머니":   "처음 투자를 시작할 때 지급된 가상 자산이에요. 실력에 따라 등급별로 달라요.",
  "평균단가":   "내가 이 주식을 여러 번에 걸쳐 샀을 때의 평균 매수 가격이에요.",
  "평가손익":   "현재 주가 기준으로 계산한 예상 수익 또는 손실 금액이에요.",
  "체결내역":   "실제로 거래가 완료된 매수·매도 기록이에요.",
};

interface TermTooltipProps {
  term: string;
  className?: string;
}

export function TermTooltip({ term, className }: TermTooltipProps) {
  const definition = TERM_DEFINITIONS[term];
  if (!definition) return null;

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [open]);

  return (
    <div
      ref={ref}
      className={cn("relative inline-flex items-center", className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <span
        role="button"
        tabIndex={0}
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setOpen((v) => !v); }}
        className="w-4 h-4 rounded-full bg-gray-200 text-gray-500 text-[9px] font-extrabold flex items-center justify-center hover:bg-gray-300 transition-colors flex-shrink-0 leading-none cursor-pointer"
        aria-label={`${term} 설명`}
      >
        ?
      </span>

      {open && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-56 pointer-events-none"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-gray-900 text-white text-[11px] font-medium leading-relaxed rounded-xl px-3 py-2.5 shadow-xl">
            <p className="font-bold text-yellow-300 mb-0.5">{term}</p>
            <p>{definition}</p>
          </div>
          {/* 말풍선 꼬리 */}
          <div className="flex justify-center">
            <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-gray-900" />
          </div>
        </div>
      )}
    </div>
  );
}
