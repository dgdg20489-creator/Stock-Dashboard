import { useState, useEffect, useRef } from "react";
import { useGetStockHistory, useGetStockByTicker, GetStockHistoryPeriod } from "@workspace/api-client-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine } from "recharts";
import { cn } from "@/lib/utils";

type ChartType = "line" | "candle";
type PeriodKey = "realtime" | "1d" | "1w" | "1m" | "3m" | "1y";

interface OHLCPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// ── 캔들스틱 SVG 차트 ──────────────────────────────────────
function CandleChartSVG({
  data,
  containerWidth,
  avgCost,
}: {
  data: OHLCPoint[];
  containerWidth: number;
  avgCost?: number;
}) {
  const height = 260;
  if (!data.length) return null;

  const prices = data.flatMap((d) => [d.high, d.low]);
  const minP = Math.min(...prices) * 0.998;
  const maxP = Math.max(...prices) * 1.002;
  const range = maxP - minP || 1;

  const padL = 4;
  const chartW = containerWidth - padL;
  const slotW = chartW / data.length;
  const bodyW = Math.max(1.5, Math.min(14, slotW * 0.65));

  const toY = (p: number) => ((maxP - p) / range) * height;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((pct) => ({
    y: pct * height,
    price: Math.round(maxP - pct * range),
  }));

  return (
    <svg width={containerWidth} height={height} className="overflow-visible select-none">
      {/* 격자 */}
      {yTicks.map(({ y, price }) => (
        <g key={y}>
          <line x1={0} y1={y} x2={containerWidth} y2={y} stroke="#f0f0f0" strokeWidth={1} />
          <text x={containerWidth - 2} y={y - 3} fontSize={9} fill="#bbb" textAnchor="end">
            {new Intl.NumberFormat("ko-KR").format(price)}
          </text>
        </g>
      ))}

      {/* 캔들 */}
      {data.map((d, i) => {
        const x = padL + i * slotW + slotW / 2;
        const isUp = d.close >= d.open;
        const color = isUp ? "#F04452" : "#3182F6";
        const highY = toY(d.high);
        const lowY = toY(d.low);
        const openY = toY(d.open);
        const closeY = toY(d.close);
        const bodyTop = Math.min(openY, closeY);
        const bodyH = Math.max(1, Math.abs(closeY - openY));

        return (
          <g key={i}>
            <line x1={x} y1={highY} x2={x} y2={lowY} stroke={color} strokeWidth={1} />
            <rect x={x - bodyW / 2} y={bodyTop} width={bodyW} height={bodyH} fill={color} rx={1} />
          </g>
        );
      })}

      {/* 평균 매수가 점선 */}
      {avgCost && avgCost >= minP && avgCost <= maxP && (
        <g>
          <line
            x1={0}
            y1={toY(avgCost)}
            x2={containerWidth}
            y2={toY(avgCost)}
            stroke="#F97316"
            strokeWidth={1.5}
            strokeDasharray="5 4"
          />
          <rect x={containerWidth - 62} y={toY(avgCost) - 9} width={60} height={16} rx={4} fill="#F97316" />
          <text x={containerWidth - 32} y={toY(avgCost) + 3} fontSize={9} fill="white" textAnchor="middle" fontWeight="bold">
            평균 {new Intl.NumberFormat("ko-KR").format(Math.round(avgCost))}
          </text>
        </g>
      )}
    </svg>
  );
}

// ── 거래량 SVG 바 ──────────────────────────────────────────
function VolumeBars({
  data,
  containerWidth,
}: {
  data: OHLCPoint[];
  containerWidth: number;
}) {
  if (!data.length) return null;
  const height = 56;
  const padL = 4;
  const chartW = containerWidth - padL;
  const slotW = chartW / data.length;
  const barW = Math.max(1, slotW * 0.65);
  const maxVol = Math.max(...data.map((d) => d.volume));

  return (
    <svg width={containerWidth} height={height} className="overflow-visible select-none">
      <text x={containerWidth - 2} y={9} fontSize={9} fill="#ccc" textAnchor="end">
        거래량
      </text>
      {data.map((d, i) => {
        const x = padL + i * slotW + slotW / 2;
        const barH = Math.max(1, (d.volume / maxVol) * (height - 12));
        const isUp = d.close >= d.open;
        return (
          <rect
            key={i}
            x={x - barW / 2}
            y={height - barH}
            width={barW}
            height={barH}
            fill={isUp ? "#F04452" : "#3182F6"}
            fillOpacity={0.5}
            rx={0.5}
          />
        );
      })}
    </svg>
  );
}

// ── 실시간 라인 차트 ────────────────────────────────────────
function RealtimeChart({
  ticker,
  isPositive,
  avgCost,
}: {
  ticker: string;
  isPositive: boolean;
  avgCost?: number;
}) {
  const [ticks, setTicks] = useState<{ t: number; price: number }[]>([]);
  const { data: stockData } = useGetStockByTicker(ticker);

  useEffect(() => {
    if (!stockData) return;
    setTicks((prev) => {
      const next = [...prev, { t: Date.now(), price: stockData.currentPrice }];
      return next.slice(-60);
    });
  }, [stockData?.currentPrice]);

  const color = isPositive ? "#F04452" : "#3182F6";
  const gradientId = `rt-gradient-${ticker}`;
  const displayData = ticks.map((t, i) => ({ i, price: t.price }));

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={displayData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.15} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="i" hide />
          <YAxis domain={["auto", "auto"]} hide />
          <Tooltip
            content={({ active, payload }) =>
              active && payload?.length ? (
                <div className="bg-gray-900 text-white text-xs font-bold py-1.5 px-3 rounded-xl shadow-xl">
                  {new Intl.NumberFormat("ko-KR").format(payload[0].value as number)}원
                </div>
              ) : null
            }
            cursor={{ stroke: "#ccc", strokeWidth: 1, strokeDasharray: "4 4" }}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke={color}
            strokeWidth={2}
            fillOpacity={1}
            fill={`url(#${gradientId})`}
            isAnimationActive={false}
            dot={false}
          />
          {avgCost && (
            <ReferenceLine
              y={avgCost}
              stroke="#F97316"
              strokeDasharray="6 4"
              strokeWidth={1.5}
              label={{ value: `평균 ${new Intl.NumberFormat("ko-KR").format(Math.round(avgCost))}원`, position: "insideTopRight", fontSize: 9, fill: "#F97316", fontWeight: "bold" }}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── 일반 라인 차트 ──────────────────────────────────────────
function LineChart({ data, isPositive, avgCost }: { data: OHLCPoint[]; isPositive: boolean; avgCost?: number }) {
  const color = isPositive ? "#F04452" : "#3182F6";
  const gradientId = "line-gradient";

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.18} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" hide />
          <YAxis domain={["auto", "auto"]} hide />
          <Tooltip
            content={({ active, payload }) =>
              active && payload?.length ? (
                <div className="bg-gray-900 text-white text-xs font-bold py-1.5 px-3 rounded-xl shadow-xl">
                  {new Intl.NumberFormat("ko-KR").format(payload[0].value as number)}원
                </div>
              ) : null
            }
            cursor={{ stroke: "#ccc", strokeWidth: 1, strokeDasharray: "4 4" }}
          />
          <Area
            type="monotone"
            dataKey="close"
            stroke={color}
            strokeWidth={2.5}
            fillOpacity={1}
            fill={`url(#${gradientId})`}
            animationDuration={600}
            dot={false}
          />
          {avgCost && (
            <ReferenceLine
              y={avgCost}
              stroke="#F97316"
              strokeDasharray="6 4"
              strokeWidth={1.5}
              label={{ value: `평균 ${new Intl.NumberFormat("ko-KR").format(Math.round(avgCost))}원`, position: "insideTopRight", fontSize: 9, fill: "#F97316", fontWeight: "bold" }}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── 메인 StockChart 컴포넌트 ────────────────────────────────
interface StockChartProps {
  ticker: string;
  isPositive: boolean;
  currentPrice: number;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  volume: number;
  avgCost?: number;
}

export function StockChart({
  ticker,
  isPositive,
  currentPrice,
  openPrice,
  highPrice,
  lowPrice,
  volume,
  avgCost,
}: StockChartProps) {
  const [period, setPeriod] = useState<PeriodKey>("1d");
  const [chartType, setChartType] = useState<ChartType>("line");
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(600);

  const apiPeriod =
    period === "realtime" || period === "1d"
      ? GetStockHistoryPeriod["1d"]
      : period === "1w"
      ? GetStockHistoryPeriod["1w"]
      : period === "1m"
      ? GetStockHistoryPeriod["1m"]
      : period === "3m"
      ? GetStockHistoryPeriod["3m"]
      : GetStockHistoryPeriod["1y"];

  const { data: history, isLoading } = useGetStockHistory(ticker, { period: apiPeriod });

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    ro.observe(containerRef.current);
    setContainerWidth(containerRef.current.clientWidth);
    return () => ro.disconnect();
  }, []);

  const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(n);
  const fmtAmt = (vol: number, price: number) => {
    const amt = vol * price;
    return amt >= 1e8 ? `${(amt / 1e8).toFixed(0)}억` : `${(amt / 1e4).toFixed(0)}만`;
  };

  const periods: { key: PeriodKey; label: string }[] = [
    { key: "realtime", label: "실시간" },
    { key: "1d", label: "일" },
    { key: "1w", label: "주" },
    { key: "1m", label: "월" },
    { key: "3m", label: "3개월" },
    { key: "1y", label: "연" },
  ];

  const ohlcData: OHLCPoint[] = (history as OHLCPoint[] | undefined) ?? [];

  return (
    <div className="w-full mt-4">
      {/* 차트 타입 토글 */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-bold text-muted-foreground">차트</span>
        <div className="flex bg-muted rounded-xl p-0.5">
          {(["line", "candle"] as ChartType[]).map((t) => (
            <button
              key={t}
              onClick={() => setChartType(t)}
              className={cn(
                "px-3 py-1 text-xs font-bold rounded-lg transition-all",
                chartType === t ? "bg-white text-foreground shadow-sm" : "text-muted-foreground"
              )}
            >
              {t === "line" ? "라인" : "캔들"}
            </button>
          ))}
        </div>
        {period === "realtime" && (
          <div className="flex items-center gap-1.5 ml-1">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-extrabold text-red-500">LIVE</span>
          </div>
        )}
      </div>

      {/* 차트 영역 */}
      <div ref={containerRef} className="w-full relative">
        {isLoading && period !== "realtime" ? (
          <div className="h-[260px] flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : period === "realtime" ? (
          <RealtimeChart ticker={ticker} isPositive={isPositive} avgCost={avgCost} />
        ) : chartType === "line" ? (
          <LineChart data={ohlcData} isPositive={isPositive} avgCost={avgCost} />
        ) : (
          <>
            <CandleChartSVG data={ohlcData} containerWidth={containerWidth} avgCost={avgCost} />
            {/* 캔들 차트 X축 날짜 */}
            {ohlcData.length > 0 && (
              <div className="flex justify-between px-1 mt-0.5">
                <span className="text-[9px] text-muted-foreground">{ohlcData[0]?.date?.slice(5)}</span>
                <span className="text-[9px] text-muted-foreground">
                  {ohlcData[Math.floor(ohlcData.length / 2)]?.date?.slice(5)}
                </span>
                <span className="text-[9px] text-muted-foreground">
                  {ohlcData[ohlcData.length - 1]?.date?.slice(5)}
                </span>
              </div>
            )}
          </>
        )}

        {/* 거래량 바 (실시간 제외) */}
        {period !== "realtime" && ohlcData.length > 0 && (
          <div className="mt-2 border-t border-border/30 pt-1">
            <VolumeBars data={ohlcData} containerWidth={containerWidth} />
          </div>
        )}
      </div>

      {/* 기간 탭 */}
      <div className="flex items-center bg-muted p-1 rounded-2xl mt-3 gap-0.5">
        {periods.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={cn(
              "flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-200 whitespace-nowrap",
              period === p.key
                ? "bg-white text-red-600 shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* 일별 통계 */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        {[
          { label: "시가", value: fmt(openPrice) + "원", color: "" },
          { label: "고가", value: fmt(highPrice) + "원", color: "text-up" },
          { label: "저가", value: fmt(lowPrice) + "원", color: "text-down" },
          { label: "현재가", value: fmt(currentPrice) + "원", color: isPositive ? "text-up" : "text-down" },
          { label: "거래량", value: fmt(volume) + "주", color: "" },
          { label: "거래대금", value: fmtAmt(volume, currentPrice) + "원", color: "" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-muted/60 rounded-xl p-3">
            <p className="text-[10px] font-semibold text-muted-foreground mb-0.5">{label}</p>
            <p className={cn("text-sm font-extrabold text-foreground", color)}>{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
