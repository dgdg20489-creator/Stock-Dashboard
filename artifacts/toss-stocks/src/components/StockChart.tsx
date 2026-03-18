import { useGetStockHistory, GetStockHistoryPeriod } from "@workspace/api-client-react";
import { useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/utils";

interface StockChartProps {
  ticker: string;
  isPositive: boolean;
}

export function StockChart({ ticker, isPositive }: StockChartProps) {
  const [period, setPeriod] = useState<GetStockHistoryPeriod>(GetStockHistoryPeriod["1m"]);
  const { data: history, isLoading } = useGetStockHistory(ticker, { period });

  const periods = [
    { label: "1일", value: GetStockHistoryPeriod["1d"] },
    { label: "1주", value: GetStockHistoryPeriod["1w"] },
    { label: "1개월", value: GetStockHistoryPeriod["1m"] },
    { label: "3개월", value: GetStockHistoryPeriod["3m"] },
    { label: "1년", value: GetStockHistoryPeriod["1y"] },
  ];

  // Colors matching Toss Securities
  const color = isPositive ? "#F04452" : "#3182F6"; 
  const gradientId = `chart-gradient-${ticker}`;

  return (
    <div className="w-full mt-6">
      <div className="h-[280px] w-full relative">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : history && history.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" hide />
              <YAxis domain={['auto', 'auto']} hide />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-foreground text-background text-sm font-bold py-1.5 px-3 rounded-xl shadow-xl">
                        {new Intl.NumberFormat('ko-KR').format(payload[0].value as number)}원
                      </div>
                    );
                  }
                  return null;
                }}
                cursor={{ stroke: '#E5E8EB', strokeWidth: 1.5, strokeDasharray: '4 4' }}
              />
              <Area
                type="monotone"
                dataKey="close"
                stroke={color}
                strokeWidth={2.5}
                fillOpacity={1}
                fill={`url(#${gradientId})`}
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground font-medium">
            데이터가 없습니다
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-6 bg-muted p-1.5 rounded-2xl">
        {periods.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={cn(
              "flex-1 py-2 text-sm font-bold rounded-xl transition-all duration-200",
              period === p.value
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
