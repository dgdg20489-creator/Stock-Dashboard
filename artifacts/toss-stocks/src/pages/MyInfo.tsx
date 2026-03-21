import { useGetUser, useGetUserPortfolio, useGetUserTrades } from "@workspace/api-client-react";
import { formatCurrency, formatPercent, getColorClass, cn } from "@/lib/utils";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Wallet, PieChart, ClipboardList, ChevronRight } from "lucide-react";

interface MyInfoProps {
  userId: number;
}

function StatCard({ label, value, sub, subColor }: { label: string; value: string; sub?: string; subColor?: string }) {
  return (
    <div className="bg-muted/60 rounded-2xl p-4">
      <p className="text-xs font-semibold text-muted-foreground mb-1">{label}</p>
      <p className="text-lg font-extrabold text-foreground">{value}</p>
      {sub && <p className={cn("text-xs font-bold mt-0.5", subColor ?? "text-muted-foreground")}>{sub}</p>}
    </div>
  );
}

export default function MyInfo({ userId }: MyInfoProps) {
  const { data: user, isLoading: userLoading } = useGetUser(userId);
  const { data: portfolio, isLoading: portLoading } = useGetUserPortfolio(userId);
  const { data: trades, isLoading: tradesLoading } = useGetUserTrades(userId);

  if (userLoading || portLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !portfolio) return null;

  const stockValue = portfolio.totalAssets - portfolio.cashBalance;
  const isProfit = portfolio.totalReturn >= 0;

  const difficultyLabel =
    user.difficulty === "beginner" ? "🌱 초보" :
    user.difficulty === "intermediate" ? "🌿 중수" : "🔥 고수";

  const nextThreshold =
    user.difficulty === "beginner" ? 20 :
    user.difficulty === "intermediate" ? 50 : null;

  const progressPct = nextThreshold
    ? Math.min(100, Math.max(0, (portfolio.totalReturnPercent / nextThreshold) * 100))
    : 100;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="px-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">내 정보</h1>
        <p className="text-muted-foreground font-medium mt-1">자산 현황과 투자 기록을 확인하세요.</p>
      </div>

      {/* 프로필 카드 */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-3xl p-6 border border-border/50 shadow-sm"
      >
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 bg-muted rounded-3xl flex items-center justify-center text-5xl shadow-inner flex-shrink-0">
            {user.avatar === "male" ? "👨" : "👩"}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-extrabold text-foreground">{user.username}</h2>
            <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-bold bg-primary/10 text-primary mt-1">
              {difficultyLabel}
            </span>

            {nextThreshold && (
              <div className="mt-3">
                <div className="flex justify-between text-xs font-semibold text-muted-foreground mb-1">
                  <span>다음 단계까지</span>
                  <span>{portfolio.totalReturnPercent.toFixed(1)}% / {nextThreshold}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-700"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            )}
            {!nextThreshold && (
              <p className="text-xs font-semibold text-primary mt-2">최고 등급 달성! 🎉</p>
            )}
          </div>
        </div>
      </motion.div>

      {/* 자산 현황 */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="bg-card rounded-3xl p-6 border border-border/50 shadow-sm"
      >
        <div className="flex items-center gap-2 mb-4">
          <Wallet className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-extrabold text-foreground">자산 현황</h3>
        </div>

        {/* 총 자산 강조 */}
        <div className="bg-primary/5 rounded-2xl p-5 mb-4">
          <p className="text-sm font-semibold text-muted-foreground mb-1">전체 평가 금액</p>
          <p className="text-3xl font-extrabold text-foreground">{formatCurrency(portfolio.totalAssets)}</p>
          <div className={cn("flex items-center gap-1.5 mt-1.5 font-bold", getColorClass(portfolio.totalReturn))}>
            <span>{isProfit ? "▲" : "▼"}</span>
            <span>{formatCurrency(Math.abs(portfolio.totalReturn))}</span>
            <span className="text-sm">({formatPercent(portfolio.totalReturnPercent)})</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="보유 현금 (예수금)"
            value={formatCurrency(portfolio.cashBalance)}
            sub="주문가능 금액"
          />
          <StatCard
            label="주식 평가액"
            value={formatCurrency(stockValue)}
            sub={`${portfolio.holdings.length}개 종목`}
          />
          <StatCard
            label="시드 머니"
            value={formatCurrency(user.seedMoney)}
            sub="최초 투자 원금"
          />
          <StatCard
            label="총 수익/손실"
            value={formatCurrency(portfolio.totalReturn)}
            sub={formatPercent(portfolio.totalReturnPercent)}
            subColor={getColorClass(portfolio.totalReturn)}
          />
        </div>
      </motion.div>

      {/* 보유 주식 */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.14 }}
        className="bg-card rounded-3xl p-6 border border-border/50 shadow-sm"
      >
        <div className="flex items-center gap-2 mb-4">
          <PieChart className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-extrabold text-foreground">보유 주식</h3>
          <span className="ml-auto text-sm font-semibold text-muted-foreground">{portfolio.holdings.length}종목</span>
        </div>

        {portfolio.holdings.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <PieChart className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">보유한 주식이 없습니다.</p>
            <Link href="/" className="mt-2 inline-block text-primary font-bold text-sm hover:underline">
              주식 보러 가기 →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {portfolio.holdings.map((holding) => (
              <Link
                key={holding.ticker}
                href={`/stock/${holding.ticker}`}
                className="flex items-center justify-between py-4 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-gradient-to-br from-gray-700 to-gray-900 rounded-full flex items-center justify-center text-white font-extrabold text-base shadow-inner group-hover:scale-105 transition-transform">
                    {holding.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-foreground group-hover:text-primary transition-colors">{holding.name}</p>
                    <p className="text-xs font-semibold text-muted-foreground">{holding.shares}주 · 평균 {formatCurrency(holding.avgPrice)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-extrabold text-foreground">{formatCurrency(holding.evaluationAmount)}</p>
                  <p className={cn("text-xs font-bold", getColorClass(holding.profitLoss))}>
                    {holding.profitLoss > 0 ? "+" : ""}{formatCurrency(holding.profitLoss)} ({formatPercent(holding.profitLossPercent)})
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground ml-2 opacity-50 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>
        )}
      </motion.div>

      {/* 매매 기록 */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card rounded-3xl p-6 border border-border/50 shadow-sm"
      >
        <div className="flex items-center gap-2 mb-4">
          <ClipboardList className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-extrabold text-foreground">매매 기록</h3>
          {trades && <span className="ml-auto text-sm font-semibold text-muted-foreground">총 {trades.length}건</span>}
        </div>

        {tradesLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : !trades || trades.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">거래 내역이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-0 divide-y divide-border/50">
            {trades.map((trade) => (
              <div key={trade.id} className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center text-xs font-extrabold flex-shrink-0",
                    trade.type === "buy" ? "bg-up-light text-up" : "bg-down-light text-down"
                  )}>
                    {trade.type === "buy" ? "매수" : "매도"}
                  </span>
                  <div>
                    <p className="font-bold text-foreground text-sm">{trade.stockName}</p>
                    <p className="text-xs text-muted-foreground font-medium">
                      {trade.shares}주 · {formatCurrency(trade.price)} ·{" "}
                      {format(new Date(trade.createdAt), "M월 d일 HH:mm", { locale: ko })}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={cn("font-extrabold text-sm", trade.type === "buy" ? "text-foreground" : "text-foreground")}>
                    {trade.type === "buy" ? "-" : "+"}{formatCurrency(trade.totalAmount)}
                  </p>
                  <p className="text-xs text-muted-foreground font-medium">
                    {trade.type === "buy" ? "매수금액" : "매도금액"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
