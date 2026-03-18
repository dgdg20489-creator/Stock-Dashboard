import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { 
  useGetStockByTicker, 
  useGetStockNews, 
  useGetUserPortfolio, 
  useExecuteTrade,
  ExecuteTradeRequestType
} from "@workspace/api-client-react";
import { formatCurrency, formatPercent, formatLargeNumber, getColorClass } from "@/lib/utils";
import { StockChart } from "@/components/StockChart";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";

interface StockDetailProps {
  userId: number;
}

export default function StockDetail({ userId }: StockDetailProps) {
  const [match, params] = useRoute("/stock/:ticker");
  const [, setLocation] = useLocation();
  const ticker = params?.ticker || "";
  const queryClient = useQueryClient();

  const { data: stock, isLoading } = useGetStockByTicker(ticker, { query: { enabled: !!ticker }});
  const { data: news } = useGetStockNews(ticker, { query: { enabled: !!ticker }});
  const { data: portfolio } = useGetUserPortfolio(userId);

  const [sharesStr, setSharesStr] = useState("");
  const shares = parseInt(sharesStr) || 0;

  const tradeMutation = useExecuteTrade({
    mutation: {
      onSuccess: () => {
        setSharesStr("");
        alert("주문이 체결되었습니다.");
        queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      },
      onError: (err: any) => {
        alert(err.response?.data?.message || "거래 실패");
      }
    }
  });

  if (isLoading || !stock) {
    return <div className="p-8 flex justify-center"><div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;
  }

  const isPositive = stock.change >= 0;
  const colorClass = getColorClass(stock.change);
  const estimatedAmount = shares * stock.currentPrice;
  const holding = portfolio?.holdings.find(h => h.ticker === ticker);
  const ownedShares = holding ? holding.shares : 0;

  const handleTrade = (type: ExecuteTradeRequestType) => {
    if (shares <= 0) return;
    tradeMutation.mutate({
      data: {
        userId,
        ticker: stock.ticker,
        type,
        shares
      }
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-10 animate-in slide-in-from-bottom-4 duration-500">
      <button onClick={() => setLocation("/")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground font-semibold transition-colors">
        <ArrowLeft className="w-5 h-5" /> 뒤로가기
      </button>

      <div className="bg-card rounded-3xl p-6 sm:p-8 shadow-sm border border-border/50">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 bg-gradient-to-br from-gray-700 to-gray-900 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-inner">
            {stock.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{stock.name}</h1>
            <p className="font-semibold text-muted-foreground">{stock.ticker} · {stock.sector}</p>
          </div>
        </div>

        <div className="mt-2">
          <div className="text-4xl font-bold tracking-tight text-foreground">
            {formatCurrency(stock.currentPrice)}
          </div>
          <div className={`text-lg font-bold mt-1.5 flex items-center gap-1.5 ${colorClass}`}>
            <span>{isPositive ? "▲" : "▼"} {formatCurrency(Math.abs(stock.change)).replace("₩","")}</span>
            <span>({formatPercent(stock.changePercent)})</span>
          </div>
        </div>

        <StockChart ticker={stock.ticker} isPositive={isPositive} />

        <div className="mt-10 border-t border-border pt-8">
          <h3 className="text-xl font-bold mb-6 text-foreground">투자 정보</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-8 gap-x-4">
            <Metric label="시가총액" value={formatLargeNumber(stock.marketCap)} />
            <Metric label="거래량" value={formatLargeNumber(stock.volume)} />
            <Metric label="52주 최고" value={formatCurrency(stock.high52w)} />
            <Metric label="52주 최저" value={formatCurrency(stock.low52w)} />
            <Metric label="PER" value={`${stock.per.toFixed(2)}배`} />
            <Metric label="PBR" value={`${stock.pbr.toFixed(2)}배`} />
            <Metric label="EPS" value={formatCurrency(stock.eps)} />
            <Metric label="배당수익률" value={`${stock.dividendYield.toFixed(2)}%`} />
          </div>
        </div>
      </div>

      {/* Trade Section */}
      <div className="bg-card rounded-3xl p-6 sm:p-8 shadow-sm border border-border/50">
        <h3 className="text-xl font-bold mb-6 text-foreground">주문하기</h3>
        
        <div className="flex justify-between text-sm font-medium text-muted-foreground mb-2 px-1">
          <span>주문가능 현금: <span className="text-foreground">{formatCurrency(portfolio?.cashBalance || 0)}</span></span>
          <span>보유 주식: <span className="text-foreground">{ownedShares}주</span></span>
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

        <div className="flex justify-between items-center mt-4 px-1">
          <span className="font-bold text-muted-foreground">예상 금액</span>
          <span className="text-2xl font-bold text-foreground">{formatCurrency(estimatedAmount)}</span>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-8">
          <button 
            onClick={() => handleTrade(ExecuteTradeRequestType.sell)}
            disabled={shares <= 0 || ownedShares < shares || tradeMutation.isPending}
            className="py-5 rounded-2xl font-bold text-xl bg-down text-white shadow-lg shadow-down/20 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            매도
          </button>
          <button 
            onClick={() => handleTrade(ExecuteTradeRequestType.buy)}
            disabled={shares <= 0 || (portfolio?.cashBalance || 0) < estimatedAmount || tradeMutation.isPending}
            className="py-5 rounded-2xl font-bold text-xl bg-up text-white shadow-lg shadow-up/20 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            매수
          </button>
        </div>
      </div>

      {/* News Section */}
      {news && news.length > 0 && (
        <div className="bg-card rounded-3xl p-6 sm:p-8 shadow-sm border border-border/50">
          <h3 className="text-xl font-bold mb-6 text-foreground">관련 뉴스</h3>
          <div className="space-y-6">
            {news.map((item) => (
              <a key={item.id} href={item.url} target="_blank" rel="noreferrer" className="block group">
                <h4 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors leading-snug mb-2">{item.title}</h4>
                <p className="text-muted-foreground text-sm font-medium line-clamp-2 leading-relaxed">{item.summary}</p>
                <div className="flex items-center gap-2 mt-3 text-xs font-semibold text-muted-foreground">
                  <span>{item.source}</span>
                  <span>·</span>
                  <span>{format(new Date(item.publishedAt), 'yyyy.MM.dd')}</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-muted-foreground">{label}</span>
      <span className="text-base font-bold text-foreground">{value}</span>
    </div>
  );
}
