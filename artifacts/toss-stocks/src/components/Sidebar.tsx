import { useGetUser, useGetUserPortfolio, useGetUserTrades } from "@workspace/api-client-react";
import { formatCurrency, formatPercent, getColorClass } from "@/lib/utils";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { motion } from "framer-motion";
import { Link } from "wouter";

interface SidebarProps {
  userId: number;
}

export function Sidebar({ userId }: SidebarProps) {
  const { data: user } = useGetUser(userId);
  const { data: portfolio } = useGetUserPortfolio(userId);
  const { data: trades } = useGetUserTrades(userId);

  if (!user || !portfolio) return null;

  return (
    <aside className="w-80 flex-shrink-0 flex flex-col gap-6 hidden lg:flex">
      {/* Profile Card */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-card rounded-3xl p-6 shadow-sm border border-border/50"
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center text-3xl shadow-inner">
            {user.avatar === 'male' ? '👨' : '👩'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">{user.username}</h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary mt-1">
              {user.difficulty === 'beginner' ? '초보' : user.difficulty === 'intermediate' ? '중수' : '고수'}
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">총 자산</p>
          <div className="text-2xl font-bold text-foreground">
            {formatCurrency(portfolio.totalAssets)}
          </div>
          <div className={`text-sm font-bold flex items-center gap-1 ${getColorClass(portfolio.totalReturn)}`}>
            <span>{portfolio.totalReturn > 0 ? "▲" : portfolio.totalReturn < 0 ? "▼" : ""}</span>
            <span>{formatCurrency(Math.abs(portfolio.totalReturn))}</span>
            <span>({formatPercent(portfolio.totalReturnPercent)})</span>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-border flex justify-between items-center text-sm">
          <span className="text-muted-foreground font-medium">주문가능 금액</span>
          <span className="font-bold text-foreground">{formatCurrency(portfolio.cashBalance)}</span>
        </div>
      </motion.div>

      {/* Holdings */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card rounded-3xl p-6 shadow-sm border border-border/50 flex-1 flex flex-col"
      >
        <h3 className="text-lg font-bold mb-4">보유 주식</h3>
        <div className="space-y-4 overflow-y-auto flex-1 pr-2 scrollbar-hide max-h-[300px]">
          {portfolio.holdings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm font-medium">
              보유한 주식이 없습니다.
            </div>
          ) : (
            portfolio.holdings.map((holding) => (
              <Link key={holding.ticker} href={`/stock/${holding.ticker}`} className="flex items-center justify-between group cursor-pointer block hover:bg-muted/50 p-2 -mx-2 rounded-xl transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-900 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-inner">
                    {holding.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-foreground group-hover:text-primary transition-colors">{holding.name}</div>
                    <div className="text-xs text-muted-foreground font-medium">{holding.shares}주</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm text-foreground">{formatCurrency(holding.evaluationAmount)}</div>
                  <div className={`text-xs font-bold ${getColorClass(holding.profitLoss)}`}>
                    {formatPercent(holding.profitLossPercent)}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </motion.div>

      {/* Recent Trades */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card rounded-3xl p-6 shadow-sm border border-border/50"
      >
        <h3 className="text-lg font-bold mb-4">최근 거래</h3>
        <div className="space-y-4">
          {!trades || trades.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground text-sm font-medium">
              거래 내역이 없습니다.
            </div>
          ) : (
            trades.slice(0, 4).map((trade) => (
              <div key={trade.id} className="flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${trade.type === 'buy' ? 'bg-up-light text-up' : 'bg-down-light text-down'}`}>
                      {trade.type === 'buy' ? '매수' : '매도'}
                    </span>
                    <span className="font-bold text-sm">{trade.stockName}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 font-medium">
                    {format(new Date(trade.createdAt), 'M.d HH:mm')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm">{formatCurrency(trade.totalAmount)}</div>
                  <div className="text-xs text-muted-foreground font-medium">{trade.shares}주 · {formatCurrency(trade.price)}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </aside>
  );
}
