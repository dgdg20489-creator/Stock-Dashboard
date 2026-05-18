import { useState, useEffect, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { 
  useGetStockByTicker, 
  useGetUserPortfolio, 
  useExecuteTrade,
  ExecuteTradeRequestType
} from "@workspace/api-client-react";
import { formatCurrency, formatPercent, formatLargeNumber, getColorClass, cn } from "@/lib/utils";
import { StockChart } from "@/components/StockChart";
import { StockLogo } from "@/components/StockLogo";
import { OrderBook } from "@/components/OrderBook";
import { TermTooltip } from "@/components/TermTooltip";
import { CommunitySection } from "@/components/CommunitySection";
import { NewsSection } from "@/components/NewsSection";
import { ArrowLeft, Star, BarChart2, Users, Newspaper } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useWatchlist } from "@/hooks/use-watchlist";
import { useMissions } from "@/hooks/use-missions";
import { useMarketStatus } from "@/components/MarketStatus";

interface LivePriceData {
  price:     number;
  change:    number;
  changePct: number;
  open:      number;
  high:      number;
  low:       number;
  volume:    number;
  source:    string;
}

/** KIS REST /live 엔드포인트 폴링 훅 — 현재 보는 종목만 직접 조회 */
function useLivePrice(ticker: string, basePrice: number) {
  const [live, setLive] = useState<LivePriceData | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!ticker) return;
    let active = true;

    const poll = async () => {
      try {
        const res = await fetch(`/api/stocks/${ticker}/live`);
        if (!res.ok || !active) return;
        const d = await res.json() as LivePriceData;
        if (d.price > 0) setLive(d);
      } catch { /* ignore */ }
    };

    poll(); // 즉시 1회 조회
    intervalRef.current = setInterval(poll, 2000); // 2초 간격

    return () => {
      active = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [ticker]);

  return live;
}

interface StockDetailProps {
  userId: number;
}

const BUY_PCTS  = [{ label: "25%", pct: 0.25 }, { label: "50%", pct: 0.5 }, { label: "75%", pct: 0.75 }, { label: "최대", pct: 1.0 }];
const SELL_PCTS = [{ label: "25%", pct: 0.25 }, { label: "50%", pct: 0.5 }, { label: "75%", pct: 0.75 }, { label: "전량", pct: 1.0 }];

type OrderType = "market" | "limit" | "scheduled_sell";

type DetailTab = "trade" | "community" | "news";

const TABS: { id: DetailTab; label: string; icon: React.ReactNode }[] = [
  { id: "trade",     label: "차트·거래",  icon: <BarChart2 className="w-4 h-4" /> },
  { id: "community", label: "커뮤니티",   icon: <Users className="w-4 h-4" /> },
  { id: "news",      label: "뉴스",       icon: <Newspaper className="w-4 h-4" /> },
];

export default function StockDetail({ userId }: StockDetailProps) {
  const [match, params] = useRoute("/stock/:ticker");
  const [, setLocation] = useLocation();
  const ticker = params?.ticker || "";
  const queryClient = useQueryClient();

  const { data: stock, isLoading } = useGetStockByTicker(ticker, {
    query: { enabled: !!ticker, refetchInterval: 1000, staleTime: 0 }
  });
  const { data: portfolio } = useGetUserPortfolio(userId, {
    query: { enabled: !!userId, refetchInterval: 2000, staleTime: 0 }
  });

  const { isWatched, toggleWatch } = useWatchlist();
  const { completeTrade } = useMissions();
  const watched = ticker ? isWatched(ticker) : false;
  const marketStatus = useMarketStatus();

  // KIS REST 실시간 가격 폴링 (2초 간격, 현재 보는 종목만)
  const liveData = useLivePrice(ticker, stock?.currentPrice ?? 0);

  const [activeTab, setActiveTab] = useState<DetailTab>("trade");
  const [sharesStr, setSharesStr] = useState("");
  const shares = parseInt(sharesStr) || 0;
  const [orderType, setOrderType] = useState<OrderType>("market");
  const [limitPriceStr, setLimitPriceStr] = useState("");
  const [limitOrderStatus, setLimitOrderStatus] = useState<string | null>(null);
  const limitPrice = parseInt(limitPriceStr.replace(/,/g, "")) || 0;

  const tradeMutation = useExecuteTrade({
    mutation: {
      onSuccess: () => {
        setSharesStr("");
        const missionAwarded = completeTrade();
        alert(missionAwarded ? "주문이 체결되었습니다. (+30P 미션 달성!)" : "주문이 체결되었습니다.");
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

  // live 데이터 우선, 없으면 DB 값 사용
  const currentPrice  = liveData?.price     ?? stock.currentPrice;
  const currentChange = liveData?.change     ?? stock.change;
  const currentChangePct = liveData?.changePct ?? stock.changePercent;
  const todayOpen  = liveData?.open  || stock.openPrice  || Math.round(currentPrice * 0.999);
  const todayHigh  = liveData?.high  || stock.highPrice  || Math.round(currentPrice * 1.015);
  const todayLow   = liveData?.low   || stock.lowPrice   || Math.round(currentPrice * 0.985);
  const liveSource = liveData?.source ?? "db";

  const isPositive = currentChange >= 0;
  const colorClass = getColorClass(currentChange);
  const estimatedAmount = shares * currentPrice;
  const holding = portfolio?.holdings.find((h) => h.ticker === ticker);
  const ownedShares = holding ? holding.shares : 0;
  const cashBalance = portfolio?.cashBalance || 0;

  const handleTrade = (type: ExecuteTradeRequestType) => {
    if (shares <= 0) return;
    tradeMutation.mutate({ data: { userId, ticker: stock.ticker, type, shares } });
  };

  const handleLimitOrder = async (side: "buy" | "sell") => {
    if (shares <= 0 || limitPrice <= 0) return;
    try {
      const res = await fetch(`/api/limit-orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          ticker: stock.ticker,
          stockName: stock.name,
          orderType: side,
          priceType: orderType,
          limitPrice,
          shares,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setLimitOrderStatus("✓ 예약주문이 등록되었습니다.");
        setSharesStr("");
        setLimitPriceStr("");
      } else {
        setLimitOrderStatus(`오류: ${data.message}`);
      }
    } catch {
      setLimitOrderStatus("오류가 발생했습니다.");
    }
  };

  const setBuyPct = (pct: number) => {
    const calc = Math.floor(cashBalance * pct / (orderType === "limit" && limitPrice > 0 ? limitPrice : currentPrice));
    setSharesStr(calc > 0 ? String(calc) : "0");
  };
  const setSellPct = (pct: number) => {
    const calc = Math.floor(ownedShares * pct);
    setSharesStr(calc > 0 ? String(calc) : "0");
  };

  return (
    <div className="max-w-3xl mx-auto pb-12 animate-in slide-in-from-bottom-4 duration-500">

      {/* ── 상단: 뒤로 + 관심 ── */}
      <div className="flex items-center justify-between mb-4">
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

      {/* ── 가격 헤더 (항상 표시) ── */}
      <div className="bg-card rounded-3xl px-6 pt-6 pb-5 shadow-sm border border-border/50 mb-4">
        <div className="flex items-center gap-4 mb-4">
          <StockLogo ticker={stock.ticker} name={stock.name} size="lg" />
          <div>
            <h1 className="text-2xl font-extrabold text-foreground">{stock.name}</h1>
            <p className="text-base font-semibold text-muted-foreground">{stock.ticker} · {stock.sector}</p>
          </div>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <div className="text-5xl font-extrabold tracking-tight text-foreground">
              {new Intl.NumberFormat("ko-KR").format(currentPrice)}
              <span className="text-3xl ml-1 text-muted-foreground font-bold">원</span>
            </div>
            <div className={cn("text-lg font-bold mt-1 flex items-center gap-1.5", colorClass)}>
              <span>{isPositive ? "▲" : "▼"} {formatCurrency(Math.abs(currentChange)).replace("₩", "")}</span>
              <span className="text-base">({formatPercent(currentChangePct)})</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-extrabold text-red-500">
                {liveSource === "kis-rest" ? "KIS 실시간" : "실시간"}
              </span>
            </div>
            <div className="text-[9px] text-muted-foreground/70 font-medium">
              고 {new Intl.NumberFormat("ko-KR").format(todayHigh)} · 저 {new Intl.NumberFormat("ko-KR").format(todayLow)}
            </div>
          </div>
        </div>
      </div>

      {/* ── 탭 네비게이션 ── */}
      <div className="flex bg-muted rounded-2xl p-1 mb-5 gap-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200",
              activeTab === tab.id
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── 탭 1: 차트 · 거래 ── */}
      {activeTab === "trade" && (
        <div className="space-y-5">
          {/* 차트 */}
          <div className="bg-card rounded-3xl px-6 pt-5 pb-4 shadow-sm border border-border/50">
            <h3 className="text-sm font-extrabold text-muted-foreground mb-3">주가 차트</h3>
            <StockChart
              ticker={stock.ticker}
              isPositive={isPositive}
              currentPrice={currentPrice}
              openPrice={todayOpen}
              highPrice={todayHigh}
              lowPrice={todayLow}
              volume={liveData?.volume || stock.volume}
              avgCost={holding?.avgPrice}
            />
          </div>

          {/* 호가창 */}
          <div className="bg-card rounded-3xl p-5 shadow-sm border border-border/50">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-extrabold text-foreground">호가창</h3>
              <TermTooltip term="호가창" />
              <span className="text-xs font-semibold text-muted-foreground">실시간 매수/매도 잔량</span>
              {marketStatus && (
                <span className={cn(
                  "ml-auto text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1",
                  marketStatus.isOpen
                    ? "bg-green-50 text-green-700"
                    : marketStatus.isPreMarket
                    ? "bg-amber-50 text-amber-700"
                    : "bg-muted text-muted-foreground"
                )}>
                  <span className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    marketStatus.isOpen ? "bg-green-500 animate-pulse" : marketStatus.isPreMarket ? "bg-amber-400 animate-pulse" : "bg-muted-foreground/40"
                  )} />
                  {marketStatus.isOpen ? "장중" : marketStatus.isPreMarket ? "동시호가" : "장마감"}
                </span>
              )}
            </div>
            {marketStatus && !marketStatus.isOpen && !marketStatus.isPreMarket && (
              <div className="mb-3 px-3 py-2 bg-muted/60 rounded-xl text-[11px] text-muted-foreground font-semibold flex items-center gap-1.5">
                <span>📴</span>
                <span>
                  {marketStatus.isWeekday ? "장 마감 후 데이터입니다." : "주말에는 장이 쉽니다."}
                  &nbsp;{marketStatus.nextEventLabel}: <span className="font-bold text-foreground">{marketStatus.nextEventTime}</span>
                </span>
              </div>
            )}
            <OrderBook ticker={stock.ticker} currentPrice={stock.currentPrice} />
          </div>

          {/* 기업 정보 */}
          <div className="bg-card rounded-3xl p-6 shadow-sm border border-border/50">
            <h3 className="text-base font-extrabold mb-5 text-foreground">기업 정보</h3>
            <div className="grid grid-cols-3 gap-y-6 gap-x-4">
              <Metric label="시가총액" value={formatLargeNumber(stock.marketCap)} tooltip />
              <Metric label="배당수익률" value={stock.dividendYield > 0 ? `${stock.dividendYield.toFixed(2)}%` : "-"} tooltip />
              <Metric label="PBR" value={stock.pbr > 0 ? `${stock.pbr.toFixed(2)}배` : "-"} tooltip />
              <Metric label="PER" value={stock.per > 0 ? `${stock.per.toFixed(2)}배` : "적자"} tooltip />
              <Metric
                label="ROE"
                value={(() => {
                  const eps = stock.eps ?? 0;
                  const pbr = stock.pbr ?? 0;
                  const price = currentPrice;
                  if (eps > 0 && pbr > 0 && price > 0) {
                    return `${((eps * pbr / price) * 100).toFixed(1)}%`;
                  }
                  return "-";
                })()}
                tooltip
              />
              <Metric label="PSR" value="-" tooltip />
            </div>
          </div>

          {/* 매수/매도 */}
          <div className="bg-card rounded-3xl p-6 shadow-sm border border-border/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-extrabold text-foreground">주문하기</h3>
              <span className="text-xs font-bold text-red-500 bg-red-50 px-2.5 py-1 rounded-full border border-red-100">
                거래 완료 시 +30P 미션
              </span>
            </div>

            {/* 주문 방식 탭 */}
            <div className="flex gap-1 bg-muted p-1 rounded-xl mb-4">
              {([
                { id: "market"        as OrderType, label: "시장가" },
                { id: "limit"         as OrderType, label: "지정가" },
                { id: "scheduled_sell" as OrderType, label: "예약매도" },
              ] as const).map((t) => (
                <button
                  key={t.id}
                  onClick={() => { setOrderType(t.id); setLimitOrderStatus(null); }}
                  className={cn(
                    "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
                    orderType === t.id
                      ? "bg-white text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex justify-between text-sm font-medium text-muted-foreground mb-3 px-1">
              <span className="flex items-center gap-1">
                주문가능 현금
                <TermTooltip term="예수금" />
                : <span className="text-foreground font-bold ml-1">{formatCurrency(cashBalance)}</span>
              </span>
              <span>보유: <span className="text-foreground font-bold">{ownedShares}주</span></span>
            </div>

            {/* 지정가 / 예약매도: 목표가 입력 */}
            {(orderType === "limit" || orderType === "scheduled_sell") && (
              <div className="mb-3">
                <p className="text-[11px] font-bold text-muted-foreground mb-1.5 px-1">
                  {orderType === "scheduled_sell" ? "목표 매도가 (원)" : "지정가 (원)"}
                </p>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={limitPriceStr}
                    onChange={(e) => setLimitPriceStr(e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder={new Intl.NumberFormat("ko-KR").format(currentPrice)}
                    className="w-full px-6 py-4 text-xl font-bold rounded-2xl bg-muted border-none text-foreground placeholder:text-muted-foreground/40 focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all text-right"
                  />
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">가격</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 px-1 text-right">
                  현재가 {new Intl.NumberFormat("ko-KR").format(currentPrice)}원
                  {limitPrice > 0 && currentPrice > 0 && (
                    <span className={cn("ml-1 font-bold", limitPrice > currentPrice ? "text-up" : "text-down")}>
                      ({limitPrice > currentPrice ? "+" : ""}{(((limitPrice - currentPrice) / currentPrice) * 100).toFixed(2)}%)
                    </span>
                  )}
                </p>
              </div>
            )}

            {/* 수량 입력 */}
            {orderType !== "scheduled_sell" && (
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
            )}
            {orderType === "scheduled_sell" && (
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
            )}

            {orderType === "market" && (
              <div className="mt-3 space-y-2">
                <p className="text-[11px] font-bold text-muted-foreground px-1">매수 기준 (현금)</p>
                <div className="flex gap-2">
                  {BUY_PCTS.map(({ label, pct }) => (
                    <button key={label} onClick={() => setBuyPct(pct)}
                      className="flex-1 py-2 bg-red-50 text-xs font-extrabold text-up rounded-xl hover:bg-red-100 active:scale-95 transition-all border border-red-100">
                      {label}
                    </button>
                  ))}
                </div>
                {ownedShares > 0 && (
                  <>
                    <p className="text-[11px] font-bold text-muted-foreground px-1 pt-1">매도 기준 (보유주)</p>
                    <div className="flex gap-2">
                      {SELL_PCTS.map(({ label, pct }) => (
                        <button key={label} onClick={() => setSellPct(pct)}
                          className="flex-1 py-2 bg-blue-50 text-xs font-extrabold text-down rounded-xl hover:bg-blue-100 active:scale-95 transition-all border border-blue-100">
                          {label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {orderType === "market" && (
              <div className="flex justify-between items-center mt-4 px-1">
                <span className="font-bold text-muted-foreground">예상 금액</span>
                <span className="text-2xl font-extrabold text-foreground">{formatCurrency(estimatedAmount)}</span>
              </div>
            )}

            {limitOrderStatus && (
              <div className={cn(
                "mt-3 px-4 py-2.5 rounded-xl text-sm font-bold text-center",
                limitOrderStatus.startsWith("✓") ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"
              )}>
                {limitOrderStatus}
              </div>
            )}

            {/* 주문 버튼 */}
            {orderType === "market" && (
              <div className="grid grid-cols-2 gap-4 mt-6">
                <button onClick={() => handleTrade(ExecuteTradeRequestType.sell)}
                  disabled={shares <= 0 || ownedShares < shares || tradeMutation.isPending}
                  className="py-5 rounded-2xl font-extrabold text-xl bg-down text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                  매도
                </button>
                <button onClick={() => handleTrade(ExecuteTradeRequestType.buy)}
                  disabled={shares <= 0 || cashBalance < estimatedAmount || tradeMutation.isPending}
                  className="py-5 rounded-2xl font-extrabold text-xl bg-up text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                  매수
                </button>
              </div>
            )}

            {orderType === "limit" && (
              <div className="grid grid-cols-2 gap-4 mt-6">
                <button onClick={() => handleLimitOrder("sell")}
                  disabled={shares <= 0 || limitPrice <= 0 || ownedShares < shares}
                  className="py-5 rounded-2xl font-extrabold text-xl bg-down text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                  지정가 매도
                </button>
                <button onClick={() => handleLimitOrder("buy")}
                  disabled={shares <= 0 || limitPrice <= 0 || cashBalance < limitPrice * shares}
                  className="py-5 rounded-2xl font-extrabold text-xl bg-up text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                  지정가 매수
                </button>
              </div>
            )}

            {orderType === "scheduled_sell" && (
              <div className="mt-6">
                <button onClick={() => handleLimitOrder("sell")}
                  disabled={shares <= 0 || limitPrice <= 0 || ownedShares < shares}
                  className="w-full py-5 rounded-2xl font-extrabold text-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                  예약매도 등록
                </button>
                <p className="text-[10px] text-muted-foreground text-center mt-2 font-medium">
                  목표가 도달 시 자동으로 매도됩니다
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 탭 2: 커뮤니티 ── */}
      {activeTab === "community" && (
        <CommunitySection ticker={ticker} userId={userId} />
      )}

      {/* ── 탭 3: 뉴스 ── */}
      {activeTab === "news" && (
        <div className="px-4 py-3">
          <NewsSection title={`${ticker} 관련 뉴스`} ticker={ticker} limit={20} showSummary={true} />
        </div>
      )}

    </div>
  );
}

function Metric({ label, value, tooltip }: { label: string; value: string | number; tooltip?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="flex items-center gap-1 text-sm font-semibold text-muted-foreground">
        {label}
        {tooltip && <TermTooltip term={label} />}
      </span>
      <span className="text-base font-extrabold text-foreground">{value}</span>
    </div>
  );
}
