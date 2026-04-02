import { useGetIpoStocks, type IpoStock } from "@workspace/api-client-react";
import { formatCurrency, cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { TrendingUp, Clock, CheckCircle, CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

function StatusBadge({ stock }: { stock: IpoStock }) {
  if (stock.status === "today") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-red-500 text-white animate-pulse">
        🔴 오늘 상장
      </span>
    );
  }
  if (stock.status === "upcoming") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-600 border border-blue-200">
        D-{stock.dDay}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-muted text-muted-foreground">
      상장완료
    </span>
  );
}

function IpoCard({ stock, delay }: { stock: IpoStock; delay: number }) {
  const dateStr = format(new Date(stock.listingDate), "M월 d일 (EEE)", { locale: ko });
  const isToday = stock.status === "today";
  const isListed = stock.status === "listed";

  const inner = (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={cn(
        "flex items-center justify-between py-4 px-1 group",
        isToday && "bg-red-50/50 -mx-1 px-2 rounded-2xl"
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center text-white font-extrabold text-xs flex-shrink-0",
          isToday ? "bg-red-500" : isListed ? "bg-muted-foreground/40" : "bg-blue-500"
        )}>
          {stock.market === "KOSPI" ? "PI" : "DQ"}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-foreground text-sm">{stock.name}</p>
            <StatusBadge stock={stock} />
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <CalendarDays className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            <p className="text-xs text-muted-foreground font-medium">{dateStr}</p>
            <span className="text-muted-foreground/40">·</span>
            <span className="text-xs font-semibold text-muted-foreground">{stock.market}</span>
          </div>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        {stock.ipoPrice ? (
          <>
            <p className="text-sm font-extrabold text-foreground">{formatCurrency(stock.ipoPrice)}</p>
            <p className="text-[10px] text-muted-foreground font-medium mt-0.5">공모가</p>
          </>
        ) : (
          <p className="text-xs text-muted-foreground font-medium">공모가 미정</p>
        )}
      </div>
    </motion.div>
  );

  if (isListed || isToday) {
    return (
      <Link href={`/stock/${stock.ticker}`} className="block hover:bg-muted/40 rounded-2xl transition-colors -mx-1 px-1">
        {inner}
      </Link>
    );
  }

  return <div>{inner}</div>;
}

export default function Ipo() {
  const { data: stocks, isLoading } = useGetIpoStocks({
    query: { refetchInterval: 60000 },
  });

  const todayStocks = stocks?.filter((s) => s.status === "today") ?? [];
  const upcomingStocks = stocks?.filter((s) => s.status === "upcoming") ?? [];
  const listedStocks = stocks?.filter((s) => s.status === "listed") ?? [];

  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-in fade-in duration-500">
      <div className="px-1">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">공모주 · IPO</h1>
        <p className="text-sm text-muted-foreground font-medium mt-0.5">신규 상장 주식 일정과 공모가를 확인하세요.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : !stocks || stocks.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">현재 예정된 공모주가 없습니다.</p>
        </div>
      ) : (
        <>
          {todayStocks.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 rounded-3xl p-4 border border-red-200"
            >
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-red-500" />
                <h3 className="text-base font-extrabold text-red-600">오늘 상장</h3>
                <span className="ml-auto text-xs font-bold text-red-400">{todayStocks.length}종목</span>
              </div>
              <div className="divide-y divide-red-100">
                {todayStocks.map((s, i) => (
                  <IpoCard key={s.ticker} stock={s} delay={i * 0.05} />
                ))}
              </div>
            </motion.div>
          )}

          {upcomingStocks.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-card rounded-3xl p-4 border border-border/50 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5 text-primary" />
                <h3 className="text-base font-extrabold text-foreground">상장 예정</h3>
                <span className="ml-auto text-xs font-bold text-muted-foreground">{upcomingStocks.length}종목</span>
              </div>
              <div className="divide-y divide-border/50">
                {upcomingStocks.map((s, i) => (
                  <IpoCard key={s.ticker} stock={s} delay={0.05 + i * 0.05} />
                ))}
              </div>
            </motion.div>
          )}

          {listedStocks.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card rounded-3xl p-4 border border-border/50 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-muted-foreground" />
                <h3 className="text-base font-extrabold text-foreground">최근 상장</h3>
                <span className="ml-auto text-xs font-bold text-muted-foreground">{listedStocks.length}종목</span>
              </div>
              <div className="divide-y divide-border/50">
                {listedStocks.map((s, i) => (
                  <IpoCard key={s.ticker} stock={s} delay={0.1 + i * 0.05} />
                ))}
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
