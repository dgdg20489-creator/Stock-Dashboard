import { useState, useEffect, useRef, useMemo } from "react";
import { useGetStockHistory, useGetStockByTicker, GetStockHistoryPeriod } from "@workspace/api-client-react";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, ReferenceLine, Tooltip as RechartsTooltip } from "recharts";
import { Settings, X } from "lucide-react";
import { cn } from "@/lib/utils";

// ── 타입 ──────────────────────────────────────────────────────────
type ChartType = "line" | "candle";
type PeriodKey = "realtime" | "1d" | "1w" | "1m" | "3m" | "1y";
type TFKey = "1m" | "5m" | "15m" | "30m" | "60m" | "120m";

export interface OHLCPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface Indicators {
  ma5: boolean; ma20: boolean; ma60: boolean; ma120: boolean;
  bb: boolean; ichimoku: boolean; rsi: boolean; macd: boolean;
}

const DEFAULT_IND: Indicators = {
  ma5: true, ma20: true, ma60: false, ma120: false,
  bb: false, ichimoku: false, rsi: false, macd: false,
};

const MA_COLORS = { ma5: "#F97316", ma20: "#3182F6", ma60: "#22C55E", ma120: "#A855F7" };
const TF_BARS: Record<TFKey, number> = { "1m": 390, "5m": 78, "15m": 26, "30m": 13, "60m": 7, "120m": 4 };

// ── 지표 계산 함수 ─────────────────────────────────────────────────
function calcMA(data: OHLCPoint[], p: number): (number | null)[] {
  return data.map((_, i) =>
    i < p - 1 ? null : data.slice(i - p + 1, i + 1).reduce((s, d) => s + d.close, 0) / p
  );
}

function calcBB(data: OHLCPoint[], p = 20, k = 2) {
  const mid = calcMA(data, p);
  const bands = data.map((_, i) => {
    if (i < p - 1 || mid[i] == null) return { u: null, l: null };
    const m = mid[i]!;
    const std = Math.sqrt(data.slice(i - p + 1, i + 1).reduce((s, d) => s + (d.close - m) ** 2, 0) / p);
    return { u: m + k * std, l: m - k * std };
  });
  return { mid, upper: bands.map(b => b.u), lower: bands.map(b => b.l) };
}

function midHL(arr: OHLCPoint[]) {
  return (Math.max(...arr.map(d => d.high)) + Math.min(...arr.map(d => d.low))) / 2;
}

function calcIchimoku(data: OHLCPoint[]) {
  const n = data.length;
  const tenkan = data.map((_, i) => i >= 8 ? midHL(data.slice(i - 8, i + 1)) : null);
  const kijun  = data.map((_, i) => i >= 25 ? midHL(data.slice(i - 25, i + 1)) : null);
  const senkouA = data.map((_, i) => {
    if (i < 26) return null;
    const t = tenkan[i - 26], k = kijun[i - 26];
    return t != null && k != null ? (t + k) / 2 : null;
  });
  const senkouB = data.map((_, i) => i >= 77 ? midHL(data.slice(i - 77, i - 25)) : null);
  const chikou  = data.map((_, i) => i + 26 < n ? data[i + 26].close : null);
  return { tenkan, kijun, senkouA, senkouB, chikou };
}

function calcEMA(arr: number[], p: number): number[] {
  const k = 2 / (p + 1);
  return arr.reduce<number[]>((acc, v, i) => {
    acc.push(i === 0 ? v : v * k + acc[i - 1] * (1 - k));
    return acc;
  }, []);
}

function calcRSI(data: OHLCPoint[], p = 14): (number | null)[] {
  if (data.length < p + 1) return Array(data.length).fill(null);
  let ag = 0, al = 0;
  for (let i = 1; i <= p; i++) {
    const d = data[i].close - data[i - 1].close;
    if (d > 0) ag += d; else al -= d;
  }
  ag /= p; al /= p;
  const result: (number | null)[] = Array(p).fill(null);
  result.push(al === 0 ? 100 : 100 - 100 / (1 + ag / al));
  for (let i = p + 1; i < data.length; i++) {
    const d = data[i].close - data[i - 1].close;
    ag = (ag * (p - 1) + Math.max(0, d)) / p;
    al = (al * (p - 1) + Math.max(0, -d)) / p;
    result.push(al === 0 ? 100 : 100 - 100 / (1 + ag / al));
  }
  return result;
}

function calcMACD(data: OHLCPoint[], fast = 12, slow = 26, sig = 9) {
  const closes = data.map(d => d.close);
  const macdLine = calcEMA(closes, fast).map((v, i) => v - calcEMA(closes, slow)[i]);
  const sigLine  = calcEMA(macdLine, sig);
  return { macd: macdLine, signal: sigLine, hist: macdLine.map((v, i) => v - sigLine[i]) };
}

// ── 분봉 데이터 생성 (일봉 → N분봉 시뮬레이션) ─────────────────────
function genIntradayCandles(daily: OHLCPoint[], tf: TFKey): OHLCPoint[] {
  const bpd = TF_BARS[tf];
  const result: OHLCPoint[] = [];
  let seed = 42;
  const rng = () => { seed = (seed * 16807 + 7) % 2147483647; return (seed - 1) / 2147483646; };

  for (const day of daily) {
    let price = day.open;
    const range = (day.high - day.low) || day.close * 0.01;
    for (let j = 0; j < bpd; j++) {
      const isLast = j === bpd - 1;
      const drift = (day.close - price) / Math.max(1, bpd - j) * (0.4 + rng() * 0.6);
      const close = isLast ? day.close
        : Math.max(day.low, Math.min(day.high, price + drift + (rng() - 0.5) * range * 0.04));
      const wick = range * 0.015 * rng();
      const high = Math.min(day.high, Math.max(price, close) + wick);
      const low  = Math.max(day.low,  Math.min(price, close) - wick);
      result.push({ date: `${day.date} ${j}`, open: price, high, low, close, volume: Math.round(day.volume / bpd * (0.4 + rng() * 1.2)) });
      price = close;
    }
  }
  return result.slice(-200);
}

// ── SVG 좌표 변환 헬퍼 ────────────────────────────────────────────
function polyline(pts: [number, number][], stroke: string, sw: number, dash?: string) {
  if (pts.length < 2) return null;
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  return <path d={d} stroke={stroke} strokeWidth={sw} fill="none" strokeDasharray={dash} strokeLinejoin="round" />;
}

// ── 향상된 캔들/라인 SVG 차트 ─────────────────────────────────────
function EnhancedChart({
  data, containerWidth, avgCost, chartType, indicators,
}: {
  data: OHLCPoint[];
  containerWidth: number;
  avgCost?: number;
  chartType: ChartType;
  indicators: Indicators;
}) {
  const [hover, setHover] = useState<{ idx: number; sx: number; sy: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const MAIN_H = 258;
  const PAD_L = 4;
  const PAD_R = 60;
  const chartW = containerWidth - PAD_L - PAD_R;
  if (!data.length || chartW <= 0) return null;

  const slotW = chartW / data.length;
  const bodyW = Math.max(1.5, Math.min(14, slotW * 0.65));

  const allPrices = data.flatMap(d => [d.high, d.low]);
  let minP = Math.min(...allPrices);
  let maxP = Math.max(...allPrices);

  // Expand for indicators
  if (indicators.bb) {
    const bb = calcBB(data);
    bb.upper.forEach(v => { if (v) { maxP = Math.max(maxP, v); } });
    bb.lower.forEach(v => { if (v) { minP = Math.min(minP, v); } });
  }
  if (indicators.ichimoku) {
    const ich = calcIchimoku(data);
    [...ich.senkouA, ...ich.senkouB, ...ich.tenkan, ...ich.kijun].forEach(v => {
      if (v != null) { maxP = Math.max(maxP, v); minP = Math.min(minP, v); }
    });
  }
  const pad = (maxP - minP) * 0.05 || 1;
  minP -= pad; maxP += pad;
  const rangeP = maxP - minP || 1;

  const toX = (i: number) => PAD_L + i * slotW + slotW / 2;
  const toY = (p: number) => ((maxP - p) / rangeP) * MAIN_H;

  const handleMove = (clientX: number, clientY: number) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const sx = clientX - rect.left;
    const sy = clientY - rect.top;
    const idx = Math.max(0, Math.min(data.length - 1, Math.floor((sx - PAD_L) / slotW)));
    setHover({ idx, sx, sy });
  };

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(pct => ({
    y: pct * MAIN_H,
    price: Math.round(maxP - pct * rangeP),
  }));

  // ── 지표 계산 ──
  const ma5v   = indicators.ma5   ? calcMA(data, 5)   : [];
  const ma20v  = indicators.ma20  ? calcMA(data, 20)  : [];
  const ma60v  = indicators.ma60  ? calcMA(data, 60)  : [];
  const ma120v = indicators.ma120 ? calcMA(data, 120) : [];
  const bbv    = indicators.bb    ? calcBB(data)       : null;
  const ichv   = indicators.ichimoku ? calcIchimoku(data) : null;

  // ── MA 폴리라인 포인트 생성 ──
  const maPoints = (vals: (number | null)[]) =>
    vals.reduce<[number, number][][]>((segs, v, i) => {
      if (v == null) { segs.push([]); return segs; }
      if (!segs.length) segs.push([]);
      segs[segs.length - 1].push([toX(i), toY(v)]);
      return segs;
    }, [[]]).filter(s => s.length >= 2);

  const hPoint = hover ? data[hover.idx] : null;

  return (
    <div className="relative select-none" style={{ userSelect: "none" }}>
      <svg
        ref={svgRef}
        width={containerWidth}
        height={MAIN_H}
        className="overflow-visible cursor-crosshair"
        onMouseMove={e => handleMove(e.clientX, e.clientY)}
        onMouseLeave={() => setHover(null)}
        onTouchMove={e => { e.preventDefault(); const t = e.touches[0]; handleMove(t.clientX, t.clientY); }}
        onTouchEnd={() => setHover(null)}
      >
        {/* 격자 */}
        {yTicks.map(({ y, price }) => (
          <g key={y}>
            <line x1={PAD_L} y1={y} x2={containerWidth - PAD_R} y2={y} stroke="#f0f0f0" strokeWidth={0.8} />
            <text x={containerWidth - PAD_R + 4} y={y + 4} fontSize={9} fill="#ccc" dominantBaseline="middle">{new Intl.NumberFormat("ko-KR").format(price)}</text>
          </g>
        ))}

        {/* 일목균형표 구름 */}
        {ichv && data.map((_, i) => {
          const a = ichv.senkouA[i], b = ichv.senkouB[i];
          if (a == null || b == null) return null;
          const top = Math.min(toY(a), toY(b));
          const bot = Math.max(toY(a), toY(b));
          return (
            <rect key={i} x={toX(i) - slotW / 2} y={top} width={slotW} height={Math.max(0.5, bot - top)}
              fill={a > b ? "#22C55E" : "#F04452"} fillOpacity={0.08} />
          );
        })}

        {/* 볼린저 밴드 */}
        {bbv && (() => {
          const midPts = maPoints(bbv.mid);
          const upPts  = maPoints(bbv.upper);
          const loPts  = maPoints(bbv.lower);
          const fill = bbv.upper.reduce<[number,number][]>((acc, v, i) => {
            if (v != null) acc.push([toX(i), toY(v)]);
            return acc;
          }, []);
          const fillBot = bbv.lower.reduce<[number,number][]>((acc, v, i) => {
            if (v != null) acc.unshift([toX(i), toY(v)]);
            return acc;
          }, []);
          const allFill = [...fill, ...fillBot];
          return (
            <>
              {allFill.length > 2 && (
                <path d={allFill.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ") + " Z"}
                  fill="#94A3B8" fillOpacity={0.06} stroke="none" />
              )}
              {midPts.map((seg, i) => polyline(seg, "#94A3B8", 0.8, undefined))}
              {upPts.map((seg, i) => polyline(seg, "#94A3B8", 0.8, "4 3"))}
              {loPts.map((seg, i) => polyline(seg, "#94A3B8", 0.8, "4 3"))}
            </>
          );
        })()}

        {/* 일목균형표 선 */}
        {ichv && (() => {
          return (
            <>
              {maPoints(ichv.tenkan).map((s, i) => polyline(s, "#F04452", 0.9))}
              {maPoints(ichv.kijun).map((s, i) => polyline(s, "#3182F6", 0.9))}
              {maPoints(ichv.senkouA).map((s, i) => polyline(s, "#22C55E", 0.7, "3 2"))}
              {maPoints(ichv.senkouB).map((s, i) => polyline(s, "#F97316", 0.7, "3 2"))}
              {maPoints(ichv.chikou).map((s, i) => polyline(s, "#A855F7", 0.8))}
            </>
          );
        })()}

        {/* 캔들 or 라인 */}
        {chartType === "candle" ? (
          data.map((d, i) => {
            const isUp = d.close >= d.open;
            const color = isUp ? "#F04452" : "#3182F6";
            const hy = toY(d.high), ly = toY(d.low), oy = toY(d.open), cy = toY(d.close);
            const bodyTop = Math.min(oy, cy), bodyH = Math.max(1, Math.abs(cy - oy));
            return (
              <g key={i}>
                <line x1={toX(i)} y1={hy} x2={toX(i)} y2={ly} stroke={color} strokeWidth={0.9} />
                <rect x={toX(i) - bodyW / 2} y={bodyTop} width={bodyW} height={bodyH} fill={color} rx={0.5} />
              </g>
            );
          })
        ) : (
          (() => {
            const pts = data.map((d, i): [number, number] => [toX(i), toY(d.close)]);
            const isPos = (data[data.length - 1]?.close ?? 0) >= (data[0]?.close ?? 0);
            const color = isPos ? "#F04452" : "#3182F6";
            const gradId = "chart-line-grad";
            const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
            const fillD = d + ` L${pts[pts.length-1][0]},${MAIN_H} L${pts[0][0]},${MAIN_H} Z`;
            return (
              <>
                <defs>
                  <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.18} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <path d={fillD} fill={`url(#${gradId})`} stroke="none" />
                <path d={d} stroke={color} strokeWidth={2} fill="none" strokeLinejoin="round" />
              </>
            );
          })()
        )}

        {/* 이동평균선 */}
        {maPoints(ma5v).map((s, i) => polyline(s, MA_COLORS.ma5, 1, undefined))}
        {maPoints(ma20v).map((s, i) => polyline(s, MA_COLORS.ma20, 1, undefined))}
        {maPoints(ma60v).map((s, i) => polyline(s, MA_COLORS.ma60, 1, undefined))}
        {maPoints(ma120v).map((s, i) => polyline(s, MA_COLORS.ma120, 1, undefined))}

        {/* 평균 매수가 */}
        {avgCost && avgCost >= minP && avgCost <= maxP && (
          <>
            <line x1={PAD_L} y1={toY(avgCost)} x2={containerWidth - PAD_R} y2={toY(avgCost)}
              stroke="#F97316" strokeWidth={1.2} strokeDasharray="5 4" />
            <rect x={containerWidth - PAD_R - 64} y={toY(avgCost) - 9} width={62} height={16} rx={4} fill="#F97316" />
            <text x={containerWidth - PAD_R - 33} y={toY(avgCost) + 4} fontSize={9} fill="white" textAnchor="middle" fontWeight="bold">
              평균 {new Intl.NumberFormat("ko-KR").format(Math.round(avgCost))}
            </text>
          </>
        )}

        {/* 크로스헤어 */}
        {hover && hPoint && (
          <>
            <line x1={hover.sx} y1={0} x2={hover.sx} y2={MAIN_H} stroke="#64748B" strokeWidth={0.8} strokeDasharray="4 3" pointerEvents="none" />
            <line x1={PAD_L} y1={hover.sy} x2={containerWidth - PAD_R} y2={hover.sy} stroke="#64748B" strokeWidth={0.8} strokeDasharray="4 3" pointerEvents="none" />
            {/* Y축 가격 레이블 */}
            <rect x={containerWidth - PAD_R + 1} y={hover.sy - 8} width={PAD_R - 2} height={16} rx={3} fill="#1E293B" />
            <text x={containerWidth - PAD_R + PAD_R / 2} y={hover.sy + 4} fontSize={9} fill="white" textAnchor="middle" fontWeight="bold">
              {new Intl.NumberFormat("ko-KR").format(Math.round(maxP - (hover.sy / MAIN_H) * rangeP))}
            </text>
            {/* 하이라이트 점 */}
            <circle cx={toX(hover.idx)} cy={toY(hPoint.close)} r={3.5} fill="white" stroke="#64748B" strokeWidth={1.5} />
          </>
        )}
      </svg>

      {/* OHLCV 툴팁 */}
      {hover && hPoint && (() => {
        const tipW = 160;
        const left = hover.sx + tipW + 10 > containerWidth - PAD_R
          ? hover.sx - tipW - 6
          : hover.sx + 10;
        return (
          <div
            className="absolute pointer-events-none z-20 bg-gray-900/95 text-white rounded-xl px-3 py-2 shadow-xl border border-white/10"
            style={{ left, top: Math.max(4, hover.sy - 60), width: tipW }}
          >
            <p className="text-[10px] font-semibold text-gray-400 mb-1 truncate">{hPoint.date}</p>
            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[11px]">
              <span className="text-gray-400">시가</span><span className="font-bold text-right">{new Intl.NumberFormat("ko-KR").format(hPoint.open)}</span>
              <span className="text-gray-400">고가</span><span className="font-bold text-up text-right">{new Intl.NumberFormat("ko-KR").format(hPoint.high)}</span>
              <span className="text-gray-400">저가</span><span className="font-bold text-down text-right">{new Intl.NumberFormat("ko-KR").format(hPoint.low)}</span>
              <span className="text-gray-400">종가</span><span className="font-bold text-right">{new Intl.NumberFormat("ko-KR").format(hPoint.close)}</span>
              <span className="text-gray-400">거래량</span><span className="font-bold text-right">{new Intl.NumberFormat("ko-KR").format(hPoint.volume)}</span>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ── 거래량 바 ──────────────────────────────────────────────────────
function VolumeBarsEnhanced({ data, containerWidth }: { data: OHLCPoint[]; containerWidth: number }) {
  if (!data.length) return null;
  const H = 52; const PAD_L = 4; const PAD_R = 60;
  const chartW = containerWidth - PAD_L - PAD_R;
  const slotW = chartW / data.length;
  const barW = Math.max(1, slotW * 0.65);
  const maxV = Math.max(...data.map(d => d.volume)) || 1;
  return (
    <svg width={containerWidth} height={H} className="overflow-visible select-none">
      <text x={containerWidth - PAD_R + 4} y={10} fontSize={9} fill="#ccc">거래량</text>
      {data.map((d, i) => {
        const bh = Math.max(1, (d.volume / maxV) * (H - 14));
        return (
          <rect key={i} x={PAD_L + i * slotW + slotW / 2 - barW / 2} y={H - bh} width={barW} height={bh}
            fill={d.close >= d.open ? "#F04452" : "#3182F6"} fillOpacity={0.45} rx={0.5} />
        );
      })}
    </svg>
  );
}

// ── RSI 패널 ──────────────────────────────────────────────────────
function RSIPanel({ data, containerWidth }: { data: OHLCPoint[]; containerWidth: number }) {
  const H = 76; const PAD_L = 4; const PAD_R = 60;
  const chartW = containerWidth - PAD_L - PAD_R;
  const rsi = useMemo(() => calcRSI(data), [data]);
  const slotW = chartW / data.length;
  const toX = (i: number) => PAD_L + i * slotW + slotW / 2;
  const toY = (v: number) => H - (v / 100) * H;
  const pts = rsi.reduce<[number, number][]>((acc, v, i) => { if (v != null) acc.push([toX(i), toY(v)]); return acc; }, []);
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  return (
    <svg width={containerWidth} height={H} className="overflow-visible select-none">
      <text x={PAD_L + 2} y={10} fontSize={9} fill="#94A3B8" fontWeight="bold">RSI(14)</text>
      <line x1={PAD_L} y1={toY(70)} x2={containerWidth - PAD_R} y2={toY(70)} stroke="#F04452" strokeWidth={0.5} strokeDasharray="3 2" opacity={0.5} />
      <line x1={PAD_L} y1={toY(30)} x2={containerWidth - PAD_R} y2={toY(30)} stroke="#3182F6" strokeWidth={0.5} strokeDasharray="3 2" opacity={0.5} />
      <line x1={PAD_L} y1={toY(50)} x2={containerWidth - PAD_R} y2={toY(50)} stroke="#CBD5E1" strokeWidth={0.5} opacity={0.4} />
      <text x={containerWidth - PAD_R + 4} y={toY(70) + 4} fontSize={8} fill="#F04452">70</text>
      <text x={containerWidth - PAD_R + 4} y={toY(30) + 4} fontSize={8} fill="#3182F6">30</text>
      {pts.length >= 2 && <path d={d} stroke="#A78BFA" strokeWidth={1.2} fill="none" />}
    </svg>
  );
}

// ── MACD 패널 ─────────────────────────────────────────────────────
function MACDPanel({ data, containerWidth }: { data: OHLCPoint[]; containerWidth: number }) {
  const H = 76; const PAD_L = 4; const PAD_R = 60;
  const chartW = containerWidth - PAD_L - PAD_R;
  const { macd, signal, hist } = useMemo(() => calcMACD(data), [data]);
  const allV = [...macd, ...signal, ...hist].filter(v => isFinite(v));
  if (!allV.length) return null;
  const minV = Math.min(...allV), maxV = Math.max(...allV);
  const rangeV = maxV - minV || 1;
  const slotW = chartW / data.length;
  const toX = (i: number) => PAD_L + i * slotW + slotW / 2;
  const toY = (v: number) => H - ((v - minV) / rangeV) * (H - 14) - 4;
  const barW = Math.max(1, slotW * 0.65);
  const zeroY = toY(0);
  const macdPts = macd.map<[number, number]>((v, i) => [toX(i), toY(v)]);
  const sigPts  = signal.map<[number, number]>((v, i) => [toX(i), toY(v)]);
  const md = macdPts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const sd = sigPts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  return (
    <svg width={containerWidth} height={H} className="overflow-visible select-none">
      <text x={PAD_L + 2} y={10} fontSize={9} fill="#94A3B8" fontWeight="bold">MACD(12,26,9)</text>
      {isFinite(zeroY) && <line x1={PAD_L} y1={zeroY} x2={containerWidth - PAD_R} y2={zeroY} stroke="#CBD5E1" strokeWidth={0.5} opacity={0.5} />}
      {hist.map((v, i) => {
        const y = toY(v), yz = isFinite(zeroY) ? zeroY : H / 2;
        return (
          <rect key={i} x={toX(i) - barW / 2} y={Math.min(y, yz)} width={barW} height={Math.max(0.5, Math.abs(y - yz))}
            fill={v >= 0 ? "#F04452" : "#3182F6"} fillOpacity={0.5} />
        );
      })}
      {macdPts.length >= 2 && <path d={md} stroke="#3182F6" strokeWidth={1.1} fill="none" />}
      {sigPts.length >= 2 && <path d={sd} stroke="#F97316" strokeWidth={1.1} fill="none" />}
    </svg>
  );
}

// ── 실시간 라인 차트 (Recharts) ───────────────────────────────────
function RealtimeChart({ ticker, isPositive, avgCost }: { ticker: string; isPositive: boolean; avgCost?: number }) {
  const [ticks, setTicks] = useState<{ t: number; price: number }[]>([]);
  const { data: stockData } = useGetStockByTicker(ticker);
  useEffect(() => {
    if (!stockData) return;
    setTicks(prev => [...prev, { t: Date.now(), price: stockData.currentPrice }].slice(-60));
  }, [stockData?.currentPrice]);
  const color = isPositive ? "#F04452" : "#3182F6";
  const gid = `rt-${ticker}`;
  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={ticks.map((t, i) => ({ i, price: t.price }))} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.15} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="i" hide />
          <YAxis domain={["auto", "auto"]} hide />
          <RechartsTooltip
            content={({ active, payload }) =>
              active && payload?.length ? (
                <div className="bg-gray-900 text-white text-xs font-bold py-1.5 px-3 rounded-xl shadow-xl">
                  {new Intl.NumberFormat("ko-KR").format(payload[0].value as number)}원
                </div>
              ) : null
            }
            cursor={{ stroke: "#94A3B8", strokeWidth: 1, strokeDasharray: "4 4" }}
          />
          <Area type="monotone" dataKey="price" stroke={color} strokeWidth={2} fill={`url(#${gid})`} isAnimationActive={false} dot={false} />
          {avgCost && <ReferenceLine y={avgCost} stroke="#F97316" strokeDasharray="6 4" strokeWidth={1.5} label={{ value: `평균 ${new Intl.NumberFormat("ko-KR").format(Math.round(avgCost))}원`, position: "insideTopRight", fontSize: 9, fill: "#F97316", fontWeight: "bold" }} />}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── 지표 설정 패널 ────────────────────────────────────────────────
interface SettingsPanelProps {
  indicators: Indicators;
  onChange: (k: keyof Indicators) => void;
  onClose: () => void;
}
function SettingsPanel({ indicators, onChange, onClose }: SettingsPanelProps) {
  const items: { key: keyof Indicators; label: string; color?: string }[] = [
    { key: "ma5",      label: "MA5 (5일)",     color: MA_COLORS.ma5 },
    { key: "ma20",     label: "MA20 (20일)",   color: MA_COLORS.ma20 },
    { key: "ma60",     label: "MA60 (60일)",   color: MA_COLORS.ma60 },
    { key: "ma120",    label: "MA120 (120일)", color: MA_COLORS.ma120 },
    { key: "bb",       label: "볼린저 밴드" },
    { key: "ichimoku", label: "일목균형표" },
    { key: "rsi",      label: "RSI (별도 패널)" },
    { key: "macd",     label: "MACD (별도 패널)" },
  ];
  return (
    <div className="absolute right-0 top-8 z-30 bg-white rounded-2xl shadow-2xl border border-border/60 p-4 w-52">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-extrabold text-foreground">지표 설정</span>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
      </div>
      <div className="space-y-2">
        {items.map(({ key, label, color }) => (
          <label key={key} className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={indicators[key]}
              onChange={() => onChange(key)}
              className="rounded accent-primary"
            />
            {color && <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />}
            <span className="text-xs font-semibold text-foreground">{label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

// ── 메인 StockChart ───────────────────────────────────────────────
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

export function StockChart({ ticker, isPositive, currentPrice, openPrice, highPrice, lowPrice, volume, avgCost }: StockChartProps) {
  const [period, setPeriod] = useState<PeriodKey>("1d");
  const [chartType, setChartType] = useState<ChartType>("line");
  const [tf, setTF] = useState<TFKey>("5m");
  const [indicators, setIndicators] = useState<Indicators>(DEFAULT_IND);
  const [showSettings, setShowSettings] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(600);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(es => { for (const e of es) setContainerWidth(e.contentRect.width); });
    ro.observe(containerRef.current);
    setContainerWidth(containerRef.current.clientWidth);
    return () => ro.disconnect();
  }, []);

  const apiPeriod = period === "realtime" || period === "1d" ? GetStockHistoryPeriod["1d"]
    : period === "1w" ? GetStockHistoryPeriod["1w"]
    : period === "1m" ? GetStockHistoryPeriod["1m"]
    : period === "3m" ? GetStockHistoryPeriod["3m"]
    : GetStockHistoryPeriod["1y"];

  const { data: history, isLoading } = useGetStockHistory(ticker, { period: apiPeriod });

  const rawData: OHLCPoint[] = useMemo(() => (history as OHLCPoint[] | undefined) ?? [], [history]);

  // 분봉 모드일 때 데이터 생성 (candle + 기간 선택)
  const showTF = chartType === "candle" && period !== "realtime";
  const chartData = useMemo(() => {
    if (!showTF) return rawData;
    return genIntradayCandles(rawData, tf);
  }, [rawData, showTF, tf]);

  const toggleIndicator = (k: keyof Indicators) => setIndicators(prev => ({ ...prev, [k]: !prev[k] }));

  const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(n);
  const fmtAmt = (vol: number, price: number) => {
    const a = vol * price;
    return a >= 1e8 ? `${(a / 1e8).toFixed(0)}억` : `${(a / 1e4).toFixed(0)}만`;
  };

  const periods: { key: PeriodKey; label: string }[] = [
    { key: "realtime", label: "실시간" }, { key: "1d", label: "일" }, { key: "1w", label: "주" },
    { key: "1m", label: "월" }, { key: "3m", label: "3개월" }, { key: "1y", label: "연" },
  ];
  const tfs: { key: TFKey; label: string }[] = [
    { key: "1m", label: "1분" }, { key: "5m", label: "5분" }, { key: "15m", label: "15분" },
    { key: "30m", label: "30분" }, { key: "60m", label: "60분" }, { key: "120m", label: "120분" },
  ];

  return (
    <div className="w-full mt-4">
      {/* 상단 컨트롤 */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {/* 차트 타입 */}
        <div className="flex bg-muted rounded-xl p-0.5">
          {(["line", "candle"] as ChartType[]).map(t => (
            <button key={t} onClick={() => setChartType(t)}
              className={cn("px-3 py-1 text-xs font-bold rounded-lg transition-all", chartType === t ? "bg-white text-foreground shadow-sm" : "text-muted-foreground")}>
              {t === "line" ? "라인" : "캔들"}
            </button>
          ))}
        </div>

        {period === "realtime" && <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" /><span className="text-[10px] font-extrabold text-red-500">LIVE</span></div>}

        <div className="ml-auto relative">
          <button onClick={() => setShowSettings(v => !v)}
            className={cn("p-1.5 rounded-xl border transition-colors", showSettings ? "bg-primary/10 border-primary/30 text-primary" : "bg-muted border-transparent text-muted-foreground hover:text-foreground")}>
            <Settings className="w-3.5 h-3.5" />
          </button>
          {showSettings && (
            <SettingsPanel indicators={indicators} onChange={toggleIndicator} onClose={() => setShowSettings(false)} />
          )}
        </div>
      </div>

      {/* 분봉 탭 (캔들 모드일 때만) */}
      {showTF && (
        <div className="flex items-center bg-muted p-0.5 rounded-xl mb-2 gap-0.5">
          {tfs.map(t => (
            <button key={t.key} onClick={() => setTF(t.key)}
              className={cn("flex-1 py-1 text-[10px] font-bold rounded-lg transition-all", tf === t.key ? "bg-white text-blue-600 shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* MA 레전드 */}
      {(indicators.ma5 || indicators.ma20 || indicators.ma60 || indicators.ma120 || indicators.ichimoku) && (
        <div className="flex flex-wrap gap-2 mb-1.5 px-1">
          {indicators.ma5   && <span className="text-[9px] font-bold" style={{ color: MA_COLORS.ma5 }}>MA5</span>}
          {indicators.ma20  && <span className="text-[9px] font-bold" style={{ color: MA_COLORS.ma20 }}>MA20</span>}
          {indicators.ma60  && <span className="text-[9px] font-bold" style={{ color: MA_COLORS.ma60 }}>MA60</span>}
          {indicators.ma120 && <span className="text-[9px] font-bold" style={{ color: MA_COLORS.ma120 }}>MA120</span>}
          {indicators.ichimoku && <>
            <span className="text-[9px] font-bold text-red-500">전환</span>
            <span className="text-[9px] font-bold text-blue-500">기준</span>
            <span className="text-[9px] font-bold text-green-500">선행A</span>
            <span className="text-[9px] font-bold text-orange-500">선행B</span>
          </>}
        </div>
      )}

      {/* 차트 영역 */}
      <div ref={containerRef} className="w-full relative">
        {isLoading && period !== "realtime" ? (
          <div className="h-[260px] flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : period === "realtime" ? (
          <RealtimeChart ticker={ticker} isPositive={isPositive} avgCost={avgCost} />
        ) : (
          <>
            <EnhancedChart data={chartData} containerWidth={containerWidth} avgCost={avgCost} chartType={chartType} indicators={indicators} />
            {/* X축 날짜 */}
            {chartData.length > 0 && (
              <div className="flex justify-between px-1 mt-0.5 pr-16">
                <span className="text-[9px] text-muted-foreground">{chartData[0]?.date?.slice(5, 10)}</span>
                <span className="text-[9px] text-muted-foreground">{chartData[Math.floor(chartData.length / 2)]?.date?.slice(5, 10)}</span>
                <span className="text-[9px] text-muted-foreground">{chartData[chartData.length - 1]?.date?.slice(5, 10)}</span>
              </div>
            )}
          </>
        )}

        {/* 거래량 */}
        {period !== "realtime" && chartData.length > 0 && (
          <div className="mt-1 border-t border-border/30 pt-1">
            <VolumeBarsEnhanced data={chartData} containerWidth={containerWidth} />
          </div>
        )}

        {/* RSI */}
        {indicators.rsi && period !== "realtime" && chartData.length > 0 && (
          <div className="mt-1 border-t border-border/20 pt-1">
            <RSIPanel data={chartData} containerWidth={containerWidth} />
          </div>
        )}

        {/* MACD */}
        {indicators.macd && period !== "realtime" && chartData.length > 0 && (
          <div className="mt-1 border-t border-border/20 pt-1">
            <MACDPanel data={chartData} containerWidth={containerWidth} />
          </div>
        )}
      </div>

      {/* 기간 탭 */}
      <div className="flex items-center bg-muted p-1 rounded-2xl mt-3 gap-0.5">
        {periods.map(p => (
          <button key={p.key} onClick={() => setPeriod(p.key)}
            className={cn("flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-200 whitespace-nowrap",
              period === p.key ? "bg-white text-red-600 shadow-sm" : "text-muted-foreground hover:text-foreground")}>
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
