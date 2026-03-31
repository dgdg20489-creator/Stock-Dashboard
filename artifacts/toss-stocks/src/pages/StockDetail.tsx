import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { 
  useGetStockByTicker, 
  useGetUserPortfolio, 
  useExecuteTrade,
  ExecuteTradeRequestType
} from "@workspace/api-client-react";
import { formatCurrency, formatPercent, formatLargeNumber, getColorClass, cn } from "@/lib/utils";
import { StockChart } from "@/components/StockChart";
import { OrderBook } from "@/components/OrderBook";
import { TermTooltip } from "@/components/TermTooltip";
import { NewsSection } from "@/components/NewsSection";
import { ArrowLeft, Star, ChevronDown, ChevronUp } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useWatchlist } from "@/hooks/use-watchlist";
import { useMissions } from "@/hooks/use-missions";

interface StockDetailProps {
  userId: number;
}

// 매수 기준 % 버튼
const BUY_PCTS  = [{ label: "25%", pct: 0.25 }, { label: "50%", pct: 0.5 }, { label: "75%", pct: 0.75 }, { label: "최대", pct: 1.0 }];
// 매도 기준 % 버튼
const SELL_PCTS = [{ label: "25%", pct: 0.25 }, { label: "50%", pct: 0.5 }, { label: "75%", pct: 0.75 }, { label: "전량", pct: 1.0 }];

export default function StockDetail({ userId }: StockDetailProps) {
  const [match, params] = useRoute("/stock/:ticker");
  const [, setLocation] = useLocation();
  const ticker = params?.ticker || "";
  const queryClient = useQueryClient();

  const { data: stock, isLoading } = useGetStockByTicker(ticker, { query: { enabled: !!ticker } });
  const { data: portfolio } = useGetUserPortfolio(userId);

  const { isWatched, toggleWatch } = useWatchlist();
  const { completeTrade } = useMissions();
  const watched = ticker ? isWatched(ticker) : false;

  const [sharesStr, setSharesStr] = useState("");
  const [showOrderBook, setShowOrderBook] = useState(true);
  const shares = parseInt(sharesStr) || 0;

  useEffect(() => {
    if (!ticker) return;
    const id = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: [`/api/stocks/${ticker}`] });
    }, 3000);
    return () => clearInterval(id);
  }, [ticker, queryClient]);

  const tradeMutation = useExecuteTrade({
    mutation: {
      onSuccess: () => {
        setSharesStr("");
        completeTrade();
        alert("주문이 체결되었습니다. (+30P 미션 달성!)");
        queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      },
      onError: (err: any) => {
        alert(err.response?.data?.message || "거래 실패");
      }
    }
  });

  if (isLoading || !stock) {
    return (
      <div className="p-8 flex justify-center">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const isPositive = stock.change >= 0;
  const colorClass = getColorClass(stock.change);
  const estimatedAmount = shares * stock.currentPrice;
  const holding = portfolio?.holdings.find((h) => h.ticker === ticker);
  const ownedShares = holding ? holding.shares : 0;
  const cashBalance = portfolio?.cashBalance || 0;

  const handleTrade = (type: ExecuteTradeRequestType) => {
    if (shares <= 0) return;
    tradeMutation.mutate({ data: { userId, ticker: stock.ticker, type, shares } });
  };

  // % 버튼 — 매수: 현금 기준, 매도: 보유주 기준
  const setBuyPct = (pct: number) => {
    const calc = Math.floor(cashBalance * pct / stock.currentPrice);
    setSharesStr(calc > 0 ? String(calc) : "0");
  };
  const setSellPct = (pct: number) => {
    const calc = Math.floor(ownedShares * pct);
    setSharesStr(calc > 0 ? String(calc) : "0");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-12 animate-in slide-in-from-bottom-4 duration-500">
      {/* 뒤로 + 관심 */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setLocation("/")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground font-semibold transition-colors"
        >
          <ArrowLeft className="w-5 h-5" /> 뒤로가기
        </button>
        <button
          onClick={() => toggleWatch(ticker)}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2 rounded-2xl font-bold text-sm border-2 transition-all hover:scale-105 active:scale-95",
            watched
              ? "bg-yellow-50 border-yellow-300 text-yellow-600"
              : "bg-card border-border text-muted-foreground hover:border-yellow-300 hover:text-yellow-500"
          )}
        >
          <Star className={cn("w-4 h-4", watched && "fill-yellow-400 text-yellow-400")} />
          {watched ? "관심 등록됨" : "관심 등록"}
        </button>
      </div>

      {/* 가격 헤더 */}
      <div className="bg-card rounded-3xl px-6 pt-6 pb-2 shadow-sm border border-border/50">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 bg-gradient-to-br from-gray-700 to-gray-900 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-inner flex-shrink-0">
            {stock.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-foreground">{stock.name}</h1>
            <p className="text-sm font-semibold text-muted-foreground">{stock.ticker} · {stock.sector}</p>
          </div>
        </div>

        <div className="flex items-end justify-between mb-1">
          <div>
            <div className="text-4xl font-extrabold tracking-tight text-foreground">
              {new Intl.NumberFormat("ko-KR").format(stock.currentPrice)}
              <span className="text-2xl ml-1 text-muted-foreground font-bold">원</span>
            </div>
            <div className={cn("text-base font-bold mt-1 flex items-center gap-1.5", colorClass)}>
              <span>{isPositive ? "▲" : "▼"} {formatCurrency(Math.abs(stock.change)).replace("₩", "")}</span>
              <span className="text-sm">({formatPercent(stock.changePercent)})</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-extrabold text-red-500">3초 갱신</span>
          </div>
        </div>

        <StockChart
          ticker={stock.ticker}
          isPositive={isPositive}
          currentPrice={stock.currentPrice}
          openPrice={stock.openPrice ?? Math.round(stock.currentPrice * 0.999)}
          highPrice={stock.highPrice ?? Math.round(stock.currentPrice * 1.015)}
          lowPrice={stock.lowPrice ?? Math.round(stock.currentPrice * 0.985)}
          volume={stock.volume}
          avgCost={holding?.avgPrice}
        />
      </div>

      {/* 호가창 */}
      <div>
        <button
          onClick={() => setShowOrderBook((v) => !v)}
          className="flex items-center gap-2 mb-3 text-sm font-extrabold text-foreground hover:text-primary transition-colors"
        >
          {showOrderBook ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          호가창
          <TermTooltip term="호가창" />
          <span className="text-xs font-semibold text-muted-foreground ml-1">실시간 매수/매도 잔량</span>
        </button>
        {showOrderBook && (
          <OrderBook ticker={stock.ticker} currentPrice={stock.currentPrice} />
        )}
      </div>

      {/* 기업 정보 */}
      <div className="bg-card rounded-3xl p-6 shadow-sm border border-border/50">
        <h3 className="text-base font-extrabold mb-5 text-foreground">기업 정보</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-6 gap-x-4">
          <Metric label="시가총액" value={formatLargeNumber(stock.marketCap)} tooltip />
          <Metric label="52주 최고" value={formatCurrency(stock.high52w)} tooltip />
          <Metric label="52주 최저" value={formatCurrency(stock.low52w)} tooltip />
          <Metric label="배당수익률" value={stock.dividendYield > 0 ? `${stock.dividendYield.toFixed(2)}%` : "-"} tooltip />
          <Metric label="PER" value={stock.per > 0 ? `${stock.per.toFixed(2)}배` : "적자"} tooltip />
          <Metric label="PBR" value={`${stock.pbr.toFixed(2)}배`} tooltip />
          <Metric label="EPS" value={stock.eps >= 0 ? formatCurrency(stock.eps) : `▼${formatCurrency(Math.abs(stock.eps))}`} tooltip />
          <Metric label="거래량" value={formatLargeNumber(stock.volume)} tooltip />
        </div>
      </div>

      {/* 주문하기 */}
      <div className="bg-card rounded-3xl p-6 shadow-sm border border-border/50">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-extrabold text-foreground">주문하기</h3>
          <span className="text-xs font-bold text-red-500 bg-red-50 px-2.5 py-1 rounded-full border border-red-100">
            거래 완료 시 +30P 미션
          </span>
        </div>

        <div className="flex justify-between text-sm font-medium text-muted-foreground mb-3 px-1">
          <span className="flex items-center gap-1">
            주문가능 현금
            <TermTooltip term="예수금" />
            : <span className="text-foreground font-bold ml-1">{formatCurrency(cashBalance)}</span>
          </span>
          <span>보유: <span className="text-foreground font-bold">{ownedShares}주</span></span>
        </div>

        <div className="relative">
          <input
            type="number"
            value={sharesStr}
            onChange={(e) => setSharesStr(e.target.value)}
            placeholder="0"
            className="w-full px-6 py-5 text-2xl font-bold rounded-2xl bg-muted border-none text-foreground placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all text-right"
          />
          <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl font-bold text-muted-foreground">주</span>
        </div>

        {/* 간편 주문 버튼 — 매수 기준 (현금%) */}
        <div className="mt-3 space-y-2">
          <p className="text-[11px] font-bold text-muted-foreground px-1">매수 기준 (현금)</p>
          <div className="flex gap-2">
            {BUY_PCTS.map(({ label, pct }) => (
              <button
                key={label}
                onClick={() => setBuyPct(pct)}
                className="flex-1 py-2 bg-red-50 text-xs font-extrabold text-up rounded-xl hover:bg-red-100 active:scale-95 transition-all border border-red-100"
              >
                {label}
              </button>
            ))}
          </div>

          {/* 매도 기준 (보유%) — 보유 주식 있을 때만 */}
          {ownedShares > 0 && (
            <>
              <p className="text-[11px] font-bold text-muted-foreground px-1 pt-1">매도 기준 (보유주)</p>
              <div className="flex gap-2">
                {SELL_PCTS.map(({ label, pct }) => (
                  <button
                    key={label}
                    onClick={() => setSellPct(pct)}
                    className="flex-1 py-2 bg-blue-50 text-xs font-extrabold text-down rounded-xl hover:bg-blue-100 active:scale-95 transition-all border border-blue-100"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex justify-between items-center mt-4 px-1">
          <span className="font-bold text-muted-foreground">예상 금액</span>
          <span className="text-2xl font-extrabold text-foreground">{formatCurrency(estimatedAmount)}</span>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6">
          <button
            onClick={() => handleTrade(ExecuteTradeRequestType.sell)}
            disabled={shares <= 0 || ownedShares < shares || tradeMutation.isPending}
            className="py-5 rounded-2xl font-extrabold text-xl bg-down text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            매도
          </button>
          <button
            onClick={() => handleTrade(ExecuteTradeRequestType.buy)}
            disabled={shares <= 0 || cashBalance < estimatedAmount || tradeMutation.isPending}
            className="py-5 rounded-2xl font-extrabold text-xl bg-up text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            매수
          </button>
        </div>
      </div>

      {/* 관련 뉴스 */}
      <NewsSection
        ticker={ticker}
        title={`${stock.name} 관련 뉴스`}
        limit={3}
        showSummary={true}
      />
    </div>
  );
}

function Metric({ label, value, tooltip }: { label: string; value: string | number; tooltip?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
        {label}
        {tooltip && <TermTooltip term={label} />}
      </span>
      <span className="text-sm font-extrabold text-foreground">{value}</span>
    </div>
  );
}
