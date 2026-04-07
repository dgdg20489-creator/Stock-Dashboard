import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useGetStockHistory, useGetStockByTicker, GetStockHistoryPeriod } from "@workspace/api-client-react";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, ReferenceLine, Tooltip as RechartsTooltip } from "recharts";
import { Settings, X } from "lucide-react";
import { cn } from "@/lib/utils";

// ── 타입 ──────────────────────────────────────────────────────────
type ChartType = "line" | "candle";
type PeriodKey = "realtime" | "day" | "week" | "month" | "year";
type TFKey = "1m" | "5m" | "15m" | "30m" | "60m";

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
const TF_BARS: Record<TFKey, number> = { "1m": 390, "5m": 78, "15m": 26, "30m": 13, "60m": 7 };

// ── 데이터 정규화: 문자열 → 숫자, 0/NaN 제거 ─────────────────────
function normalizeOHLC(raw: unknown[], fallbackPrice?: number): OHLCPoint[] {
  const rows = (raw as any[]).map(r => ({
    date:   String(r.date ?? ""),
    open:   Number(r.open)   || 0,
    high:   Number(r.high)   || 0,
    low:    Number(r.low)    || 0,
    close:  Number(r.close)  || 0,
    volume: Number(r.volume) || 0,
  }));
  // Filter out rows where close == 0 (DB not yet populated)
  const valid = rows.filter(r => r.close > 0 && r.high > 0 && r.low > 0);
  if (valid.length > 0) return valid;

  // Fallback: synthesize 30 days of data from fallbackPrice
  if (fallbackPrice && fallbackPrice > 0) {
    const result: OHLCPoint[] = [];
    let p = fallbackPrice;
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const change = (Math.sin(i * 3.7 + fallbackPrice * 0.001) * 0.015);
      p = Math.round(p * (1 + change));
      if (p <= 0) p = fallbackPrice;
      result.push({ date: dateStr, open: Math.round(p * 0.999), high: Math.round(p * 1.01),
        low: Math.round(p * 0.99), close: p, volume: 1_000_000 });
    }
    result[result.length - 1].close = fallbackPrice;
    return result;
  }
  return [];
}

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

// ── 주봉 집계 ─────────────────────────────────────────────────────
function aggregateWeekly(daily: OHLCPoint[]): OHLCPoint[] {
  if (!daily.length) return [];
  const weeks: OHLCPoint[] = [];
  let group: OHLCPoint[] = [];
  const getWeekKey = (d: string) => {
    const dt = new Date(d);
    const jan1 = new Date(dt.getFullYear(), 0, 1);
    const week = Math.ceil(((dt.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
    return `${dt.getFullYear()}-W${week}`;
  };
  let currentWeek = getWeekKey(daily[0].date);
  for (const d of daily) {
    const wk = getWeekKey(d.date);
    if (wk !== currentWeek && group.length) {
      weeks.push({ date: group[0].date, open: group[0].open, high: Math.max(...group.map(g => g.high)),
        low: Math.min(...group.map(g => g.low)), close: group[group.length - 1].close,
        volume: group.reduce((s, g) => s + g.volume, 0) });
      group = []; currentWeek = wk;
    }
    group.push(d);
  }
  if (group.length) weeks.push({ date: group[0].date, open: group[0].open,
    high: Math.max(...group.map(g => g.high)), low: Math.min(...group.map(g => g.low)),
    close: group[group.length - 1].close, volume: group.reduce((s, g) => s + g.volume, 0) });
  return weeks;
}

// ── 월봉 집계 ─────────────────────────────────────────────────────
function aggregateMonthly(daily: OHLCPoint[]): OHLCPoint[] {
  if (!daily.length) return [];
  const months: OHLCPoint[] = [];
  let group: OHLCPoint[] = [];
  let currentMonth = daily[0].date.slice(0, 7);
  for (const d of daily) {
    const m = d.date.slice(0, 7);
    if (m !== currentMonth && group.length) {
      months.push({ date: group[0].date, open: group[0].open, high: Math.max(...group.map(g => g.high)),
        low: Math.min(...group.map(g => g.low)), close: group[group.length - 1].close,
        volume: group.reduce((s, g) => s + g.volume, 0) });
      group = []; currentMonth = m;
    }
    group.push(d);
  }
  if (group.length) months.push({ date: group[0].date, open: group[0].open,
    high: Math.max(...group.map(g => g.high)), low: Math.min(...group.map(g => g.low)),
    close: group[group.length - 1].close, volume: group.reduce((s, g) => s + g.volume, 0) });
  return months;
}

// ── 년봉 집계 ─────────────────────────────────────────────────────
function aggregateYearly(daily: OHLCPoint[]): OHLCPoint[] {
  if (!daily.length) return [];
  const years: OHLCPoint[] = [];
  let group: OHLCPoint[] = [];
  let currentYear = daily[0].date.slice(0, 4);
  for (const d of daily) {
    const yr = d.date.slice(0, 4);
    if (yr !== currentYear && group.length) {
      years.push({
        date: `${currentYear}-01-01`,
        open:   group[0].open,
        high:   Math.max(...group.map(g => g.high)),
        low:    Math.min(...group.map(g => g.low)),
        close:  group[group.length - 1].close,
        volume: group.reduce((s, g) => s + g.volume, 0),
      });
      group = []; currentYear = yr;
    }
    group.push(d);
  }
  if (group.length) years.push({
    date: `${currentYear}-01-01`,
    open:   group[0].open,
    high:   Math.max(...group.map(g => g.high)),
    low:    Math.min(...group.map(g => g.low)),
    close:  group[group.length - 1].close,
    volume: group.reduce((s, g) => s + g.volume, 0),
  });
  return years;
}

// ── 분봉 데이터 생성 (일봉 → N분봉 시뮬레이션) ─────────────────────
function genIntradayCandles(daily: OHLCPoint[], tf: TFKey): OHLCPoint[] {
  if (!daily.length) return [];
  const bpd = TF_BARS[tf];
  const result: OHLCPoint[] = [];
  let seed = 42;
  const rng = () => { seed = (seed * 16807 + 7) % 2147483647; return (seed - 1) / 2147483646; };
  // Box-Muller 정규분포 (현실적인 가격 변동 시뮬레이션)
  const randn = () => {
    const u1 = Math.max(1e-10, rng()), u2 = rng();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  };

  for (const day of daily) {
    if (day.close <= 0) continue;
    let price = day.open > 0 ? day.open : day.close;
    const dailyRange = (day.high - day.low) || day.close * 0.015;
    // TF별 변동성 계수: 큰 TF(30m·60m)는 봉당 노이즈가 너무 커지지 않도록 축소
    const volFactor = ({ "1m": 0.60, "5m": 0.60, "15m": 0.55, "30m": 0.28, "60m": 0.18 } as Record<TFKey, number>)[tf] ?? 0.50;
    const barVol = (dailyRange / Math.sqrt(bpd)) * volFactor;

    for (let j = 0; j < bpd; j++) {
      const isLast = j === bpd - 1;
      const open = price;
      // 종가 방향으로의 드리프트 (남은 봉 수에 비례)
      const remaining = bpd - j;
      const drift = (day.close - price) / remaining * (0.4 + rng() * 0.6);
      // 정규분포 노이즈로 현실적인 가격 움직임
      const noise = randn() * barVol;
      const close = isLast
        ? day.close
        : Math.max(day.low * 0.998, Math.min(day.high * 1.002, open + drift + noise));

      // 꼬리: 봉 크기에 비례 (body 범위의 30~80%)
      const bodyHigh = Math.max(open, close);
      const bodyLow  = Math.min(open, close);
      const wickSize = Math.abs(noise) * (0.3 + rng() * 0.5);
      const high = Math.min(day.high, bodyHigh + wickSize);
      const low  = Math.max(day.low,  bodyLow  - wickSize);

      result.push({
        date: `${day.date} ${String(j).padStart(4, "0")}`,
        open,
        high: Math.max(high, bodyHigh),
        low:  Math.min(low,  bodyLow),
        close,
        volume: Math.round(day.volume / bpd * (0.3 + rng() * 1.4)),
      });
      price = close;
    }
  }
  return result;
}

// ── 1분봉 → N분봉 집계 ────────────────────────────────────────────
function aggregateMinutes(candles1m: OHLCPoint[], minutes: number): OHLCPoint[] {
  if (!candles1m.length || minutes <= 1) return candles1m;
  const result: OHLCPoint[] = [];
  for (let i = 0; i < candles1m.length; i += minutes) {
    const group = candles1m.slice(i, i + minutes);
    if (!group.length) continue;
    result.push({
      date:   group[0].date,
      open:   group[0].open,
      high:   Math.max(...group.map(g => g.high)),
      low:    Math.min(...group.map(g => g.low)),
      close:  group[group.length - 1].close,
      volume: group.reduce((s, g) => s + g.volume, 0),
    });
  }
  return result;
}

// ── SVG 좌표 변환 헬퍼 ────────────────────────────────────────────
function polyline(pts: [number, number][], stroke: string, sw: number, dash?: string) {
  if (pts.length < 2) return null;
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  return <path d={d} stroke={stroke} strokeWidth={sw} fill="none" strokeDasharray={dash} strokeLinejoin="round" />;
}

// ── 캔들/라인 SVG 차트 ───────────────────────────────────────────
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

  const MAIN_H = 280;
  const PAD_L = 8;
  const PAD_R = 68;
  const chartW = containerWidth - PAD_L - PAD_R;

  if (!data.length || chartW <= 0) return (
    <div className="h-[280px] flex flex-col items-center justify-center gap-2 text-muted-foreground">
      <div className="text-3xl">📊</div>
      <p className="text-sm font-medium">차트 데이터 준비 중...</p>
      <p className="text-xs">잠시 후 다시 시도해주세요</p>
    </div>
  );

  const n = data.length;
  const slotW = chartW / n;
  // bodyW: 슬롯의 80% 사용, 최소 1.5px (많은 봉), 최대는 슬롯 너비 제한만 (간격 없음)
  const bodyW = Math.max(1.5, slotW * 0.8);
  const wickW = Math.max(0.6, Math.min(1.5, slotW * 0.12));

  // ── Y축 오토스케일: 유효한 가격값만 사용 ──
  const validPrices = data.flatMap(d => [d.high, d.low]).filter(v => isFinite(v) && v > 0);
  if (validPrices.length === 0) return (
    <div className="h-[280px] flex items-center justify-center text-muted-foreground">
      <p className="text-sm">가격 데이터를 불러오는 중...</p>
    </div>
  );

  let minP = Math.min(...validPrices);
  let maxP = Math.max(...validPrices);

  // 지표 가격 범위 확장
  if (indicators.bb) {
    const bb = calcBB(data);
    bb.upper.forEach(v => { if (v && isFinite(v)) maxP = Math.max(maxP, v); });
    bb.lower.forEach(v => { if (v && isFinite(v)) minP = Math.min(minP, v); });
  }
  if (indicators.ichimoku) {
    const ich = calcIchimoku(data);
    [...ich.senkouA, ...ich.senkouB, ...ich.tenkan, ...ich.kijun].forEach(v => {
      if (v != null && isFinite(v)) { maxP = Math.max(maxP, v); minP = Math.min(minP, v); }
    });
  }

  // ── 패딩: 최소 0.5% 이상 확보 ──
  const range = maxP - minP;
  const pad = range > 0 ? range * 0.06 : maxP * 0.03 || 500;
  minP -= pad; maxP += pad;
  const rangeP = maxP - minP;

  const toX = (i: number) => PAD_L + i * slotW + slotW / 2;
  const toY = (p: number) => {
    if (!isFinite(p)) return MAIN_H / 2;
    return ((maxP - p) / rangeP) * MAIN_H;
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const sx = clientX - rect.left;
    const sy = clientY - rect.top;
    const idx = Math.max(0, Math.min(n - 1, Math.floor((sx - PAD_L) / slotW)));
    setHover({ idx, sx, sy });
  };

  // Y-axis ticks: 5개 균등 간격, 한국식 숫자 포맷 (단위: 원)
  const fmt = (v: number) => {
    if (v >= 100_000_000) return `${(v / 100_000_000).toFixed(1)}억`;
    if (v >= 10_000)      return `${Math.round(v / 10_000)}만원`;
    return `${new Intl.NumberFormat("ko-KR").format(Math.round(v))}원`;
  };
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(pct => ({
    y:     pct * MAIN_H,
    price: maxP - pct * rangeP,
  }));

  const ma5v   = indicators.ma5   ? calcMA(data, 5)   : [];
  const ma20v  = indicators.ma20  ? calcMA(data, 20)  : [];
  const ma60v  = indicators.ma60  ? calcMA(data, 60)  : [];
  const ma120v = indicators.ma120 ? calcMA(data, 120) : [];
  const bbv    = indicators.bb    ? calcBB(data)       : null;
  const ichv   = indicators.ichimoku ? calcIchimoku(data) : null;

  const maPoints = (vals: (number | null)[]) =>
    vals.reduce<[number, number][][]>((segs, v, i) => {
      if (v == null || !isFinite(v)) { segs.push([]); return segs; }
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
            <text x={containerWidth - PAD_R + 6} y={y + 4} fontSize={9.5} fill="#999" dominantBaseline="middle" fontWeight="600">
              {fmt(price)}
            </text>
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
              fill={a > b ? "#22C55E" : "#F04452"} fillOpacity={0.07} />
          );
        })}

        {/* 볼린저 밴드 */}
        {bbv && (() => {
          const midPts = maPoints(bbv.mid);
          const upPts  = maPoints(bbv.upper);
          const loPts  = maPoints(bbv.lower);
          const fill = bbv.upper.reduce<[number,number][]>((acc, v, i) => {
            if (v != null) acc.push([toX(i), toY(v)]); return acc;
          }, []);
          const fillBot = bbv.lower.reduce<[number,number][]>((acc, v, i) => {
            if (v != null) acc.unshift([toX(i), toY(v)]); return acc;
          }, []);
          const allFill = [...fill, ...fillBot];
          return (
            <>
              {allFill.length > 2 && (
                <path d={allFill.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ") + " Z"}
                  fill="#94A3B8" fillOpacity={0.06} stroke="none" />
              )}
              {midPts.map((seg, i) => <g key={i}>{polyline(seg, "#94A3B8", 0.8)}</g>)}
              {upPts.map((seg, i) => <g key={i}>{polyline(seg, "#94A3B8", 0.8, "4 3")}</g>)}
              {loPts.map((seg, i) => <g key={i}>{polyline(seg, "#94A3B8", 0.8, "4 3")}</g>)}
            </>
          );
        })()}

        {/* 일목균형표 선 */}
        {ichv && (() => (
          <>
            {maPoints(ichv.tenkan).map((s, i) => <g key={i}>{polyline(s, "#F04452", 0.9)}</g>)}
            {maPoints(ichv.kijun).map((s, i) => <g key={i}>{polyline(s, "#3182F6", 0.9)}</g>)}
            {maPoints(ichv.senkouA).map((s, i) => <g key={i}>{polyline(s, "#22C55E", 0.7, "3 2")}</g>)}
            {maPoints(ichv.senkouB).map((s, i) => <g key={i}>{polyline(s, "#F97316", 0.7, "3 2")}</g>)}
            {maPoints(ichv.chikou).map((s, i) => <g key={i}>{polyline(s, "#A855F7", 0.8)}</g>)}
          </>
        ))()}

        {/* ── 캔들 or 라인 ── */}
        {chartType === "candle" ? (
          data.map((d, i) => {
            if (d.close <= 0) return null;
            const isUp = d.close >= d.open;
            const color = isUp ? "#F04452" : "#3182F6";
            const hy = toY(d.high), ly = toY(d.low);
            const oy = toY(d.open), cy = toY(d.close);
            // body 범위: SVG상 위(작은 y) ~ 아래(큰 y)
            const rawBodyTop = Math.min(oy, cy);
            const rawBodyBot = Math.max(oy, cy);
            // 최소 높이 적용하되 ly(저가)를 초과하지 않도록 클램핑
            const bodyTop = Math.max(hy, rawBodyTop);
            const bodyBot = Math.min(ly, Math.max(rawBodyBot, rawBodyTop + 1.5));
            const bodyH   = Math.max(1, bodyBot - bodyTop);
            const cx = toX(i);
            return (
              <g key={i}>
                {/* 위 꼬리: 고가선 → 몸통 상단 */}
                {hy < bodyTop && (
                  <line x1={cx} y1={hy} x2={cx} y2={bodyTop} stroke={color} strokeWidth={wickW} />
                )}
                {/* 아래 꼬리: 몸통 하단 → 저가선 */}
                {bodyBot < ly && (
                  <line x1={cx} y1={bodyBot} x2={cx} y2={ly} stroke={color} strokeWidth={wickW} />
                )}
                <rect x={cx - bodyW / 2} y={bodyTop} width={bodyW} height={bodyH}
                  fill={isUp ? "#F04452" : "#3182F6"} stroke={isUp ? "#d03040" : "#2060c0"}
                  strokeWidth={0.4} rx={bodyW > 4 ? 1 : 0} />
              </g>
            );
          })
        ) : (
          (() => {
            const pts = data.filter(d => d.close > 0).map((d, i): [number, number] => [toX(i), toY(d.close)]);
            const isPos = (data[data.length - 1]?.close ?? 0) >= (data[0]?.close ?? 0);
            const color = isPos ? "#F04452" : "#3182F6";
            const gradId = "chart-line-grad";
            if (pts.length < 2) return null;
            const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
            const fillD = pathD + ` L${pts[pts.length-1][0]},${MAIN_H} L${pts[0][0]},${MAIN_H} Z`;
            return (
              <>
                <defs>
                  <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.15} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <path d={fillD} fill={`url(#${gradId})`} stroke="none" />
                <path d={pathD} stroke={color} strokeWidth={2} fill="none" strokeLinejoin="round" />
              </>
            );
          })()
        )}

        {/* 이동평균선 */}
        {maPoints(ma5v).map((s, i) => <g key={`ma5-${i}`}>{polyline(s, MA_COLORS.ma5, 1)}</g>)}
        {maPoints(ma20v).map((s, i) => <g key={`ma20-${i}`}>{polyline(s, MA_COLORS.ma20, 1)}</g>)}
        {maPoints(ma60v).map((s, i) => <g key={`ma60-${i}`}>{polyline(s, MA_COLORS.ma60, 1)}</g>)}
        {maPoints(ma120v).map((s, i) => <g key={`ma120-${i}`}>{polyline(s, MA_COLORS.ma120, 1)}</g>)}

        {/* 평균 매수가 — 회색 점선, 차트 위에 옅게 표시 */}
        {avgCost && isFinite(avgCost) && avgCost >= minP && avgCost <= maxP && (
          <>
            <line x1={PAD_L} y1={toY(avgCost)} x2={containerWidth - PAD_R} y2={toY(avgCost)}
              stroke="#94A3B8" strokeWidth={1} strokeDasharray="4 4" opacity={0.7} />
            <rect x={PAD_L + 4} y={toY(avgCost) - 9} width={70} height={16} rx={3}
              fill="#F8FAFC" stroke="#CBD5E1" strokeWidth={0.8} opacity={0.9} />
            <text x={PAD_L + 39} y={toY(avgCost) + 4} fontSize={8.5} fill="#64748B" textAnchor="middle" fontWeight="600">
              평균 {fmt(avgCost)}
            </text>
          </>
        )}

        {/* 크로스헤어 */}
        {hover && hPoint && hPoint.close > 0 && (
          <>
            <line x1={hover.sx} y1={0} x2={hover.sx} y2={MAIN_H} stroke="#64748B" strokeWidth={0.8} strokeDasharray="4 3" pointerEvents="none" />
            <line x1={PAD_L} y1={hover.sy} x2={containerWidth - PAD_R} y2={hover.sy} stroke="#64748B" strokeWidth={0.8} strokeDasharray="4 3" pointerEvents="none" />
            <rect x={containerWidth - PAD_R + 1} y={hover.sy - 8} width={PAD_R - 2} height={16} rx={3} fill="#1E293B" />
            <text x={containerWidth - PAD_R + (PAD_R - 2) / 2 + 1} y={hover.sy + 4} fontSize={9} fill="white" textAnchor="middle" fontWeight="bold">
              {fmt(maxP - (hover.sy / MAIN_H) * rangeP)}
            </text>
            <circle cx={toX(hover.idx)} cy={toY(hPoint.close)} r={3.5} fill="white" stroke="#64748B" strokeWidth={1.5} />
          </>
        )}
      </svg>

      {/* OHLCV 툴팁 */}
      {hover && hPoint && hPoint.close > 0 && (() => {
        const tipW = 168;
        const left = hover.sx + tipW + 10 > containerWidth - PAD_R
          ? hover.sx - tipW - 6 : hover.sx + 10;
        const fmtFull = (v: number) => new Intl.NumberFormat("ko-KR").format(Math.round(v));
        return (
          <div
            className="absolute pointer-events-none z-20 bg-gray-900/95 text-white rounded-xl px-3 py-2 shadow-xl border border-white/10"
            style={{ left, top: Math.max(4, hover.sy - 60), width: tipW }}
          >
            <p className="text-[10px] font-semibold text-gray-400 mb-1 truncate">{hPoint.date}</p>
            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[11px]">
              <span className="text-gray-400">시가</span><span className="font-bold text-right">{fmtFull(hPoint.open)}</span>
              <span className="text-gray-400">고가</span><span className="font-bold text-up text-right">{fmtFull(hPoint.high)}</span>
              <span className="text-gray-400">저가</span><span className="font-bold text-down text-right">{fmtFull(hPoint.low)}</span>
              <span className="text-gray-400">종가</span><span className="font-bold text-right">{fmtFull(hPoint.close)}</span>
              <span className="text-gray-400">거래량</span><span className="font-bold text-right">{fmtFull(hPoint.volume)}</span>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ── 거래량 바 (캔들 색과 동기화) ─────────────────────────────────
function VolumeBars({ data, containerWidth }: { data: OHLCPoint[]; containerWidth: number }) {
  if (!data.length) return null;
  const H = 60; const PAD_L = 8; const PAD_R = 68;
  const chartW = containerWidth - PAD_L - PAD_R;
  const slotW = chartW / data.length;
  const barW = Math.max(1, slotW * 0.62);
  const maxV = Math.max(...data.map(d => d.volume).filter(v => v > 0)) || 1;
  const fmtVol = (v: number) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${Math.round(v/1000)}K` : String(v);

  return (
    <svg width={containerWidth} height={H} className="overflow-visible select-none">
      {/* 라벨 */}
      <text x={PAD_L + 2} y={11} fontSize={9} fill="#94A3B8" fontWeight="bold">거래량</text>
      <text x={containerWidth - PAD_R + 6} y={11} fontSize={8.5} fill="#94A3B8">{fmtVol(maxV)}</text>
      {/* 최대 수평선 */}
      <line x1={PAD_L} y1={14} x2={containerWidth - PAD_R} y2={14} stroke="#f5f5f5" strokeWidth={0.5} />
      {/* 막대 */}
      {data.map((d, i) => {
        if (d.volume <= 0) return null;
        const bh = Math.max(1, (d.volume / maxV) * (H - 18));
        const isUp = d.close >= d.open;
        return (
          <rect key={i}
            x={PAD_L + i * slotW + slotW / 2 - barW / 2}
            y={H - bh}
            width={barW} height={bh}
            fill={isUp ? "#F04452" : "#3182F6"}
            fillOpacity={0.45}
            rx={0.5}
          />
        );
      })}
    </svg>
  );
}

// ── RSI 패널 ──────────────────────────────────────────────────────
function RSIPanel({ data, containerWidth }: { data: OHLCPoint[]; containerWidth: number }) {
  const H = 76; const PAD_L = 8; const PAD_R = 68;
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
      <text x={containerWidth - PAD_R + 5} y={toY(70) + 4} fontSize={8} fill="#F04452">70</text>
      <text x={containerWidth - PAD_R + 5} y={toY(30) + 4} fontSize={8} fill="#3182F6">30</text>
      {pts.length >= 2 && <path d={d} stroke="#A78BFA" strokeWidth={1.2} fill="none" />}
    </svg>
  );
}

// ── MACD 패널 ─────────────────────────────────────────────────────
function MACDPanel({ data, containerWidth }: { data: OHLCPoint[]; containerWidth: number }) {
  const H = 76; const PAD_L = 8; const PAD_R = 68;
  const chartW = containerWidth - PAD_L - PAD_R;
  const { macd, signal, hist } = useMemo(() => calcMACD(data), [data]);
  const allV = [...macd, ...signal, ...hist].filter(v => isFinite(v));
  if (!allV.length) return null;
  const minV = Math.min(...allV), maxV = Math.max(...allV);
  const rangeV = maxV - minV || 1;
  const slotW = chartW / data.length;
  const toX = (i: number) => PAD_L + i * slotW + slotW / 2;
  const toY = (v: number) => H - ((v - minV) / rangeV) * (H - 14) - 4;
  const barW = Math.max(1, slotW * 0.62);
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

// ── 시간축 (연도 구분선 + 날짜 라벨) ────────────────────────────
function TimeAxis({ data, containerWidth, period, tf }: {
  data: OHLCPoint[];
  containerWidth: number;
  period: PeriodKey;
  tf: TFKey;
}) {
  const PAD_L = 8; const PAD_R = 68;
  const chartW = containerWidth - PAD_L - PAD_R;
  const n = data.length;
  if (n === 0 || chartW <= 0) return null;
  const slotW = chartW / n;
  const isIntraday = period === "realtime";
  const tfMin = { "1m": 1, "5m": 5, "15m": 15, "30m": 30, "60m": 60 }[tf] ?? 1;

  // 데이터 범위가 얼마나 긴지 계산
  const firstDate = data[0]?.date?.slice(0, 4) ?? "";
  const lastDate  = data[data.length - 1]?.date?.slice(0, 4) ?? "";
  const yearSpan  = parseInt(lastDate || "0") - parseInt(firstDate || "0");

  // 라벨 전략 자동 선택
  const labels: { x: number; text: string; bold: boolean; isYear: boolean }[] = [];
  const yearLines: { x: number; year: string }[] = [];

  if (isIntraday) {
    // 분봉: 시:분 표시
    const targetLabels = Math.max(4, Math.min(8, Math.floor(chartW / 60)));
    const labelInterval = Math.max(1, Math.round(n / targetLabels));
    for (let i = 0; i < n; i += labelInterval) {
      const x = PAD_L + i * slotW + slotW / 2;
      const d = data[i];
      const parts = d.date.split(" ");
      const barJ = parseInt(parts[1] ?? "0");
      if (barJ === 0) {
        labels.push({ x, text: parts[0]?.slice(5, 10) ?? "", bold: true, isYear: false });
      } else {
        const totalMins = 9 * 60 + barJ * tfMin;
        const hh = Math.floor(totalMins / 60).toString().padStart(2, "0");
        const mm = (totalMins % 60).toString().padStart(2, "0");
        labels.push({ x, text: `${hh}:${mm}`, bold: false, isYear: false });
      }
    }
  } else if (period === "week" || period === "month") {
    // 주봉/월봉: 연-월 표시
    const targetLabels = Math.max(3, Math.min(8, Math.floor(chartW / 70)));
    const labelInterval = Math.max(1, Math.round(n / targetLabels));
    let prevYear = "";
    for (let i = 0; i < n; i += labelInterval) {
      const x = PAD_L + i * slotW + slotW / 2;
      const yr = data[i]?.date?.slice(0, 4) ?? "";
      const text = yr !== prevYear ? yr : data[i]?.date?.slice(5, 7) ?? "";
      labels.push({ x, text, bold: yr !== prevYear, isYear: yr !== prevYear });
      if (yr !== prevYear) prevYear = yr;
    }
  } else if (period === "year") {
    // 년봉: 각 슬롯 = 1년, 연도 라벨을 각 봉 위에 표시
    const targetLabels = Math.max(3, Math.min(data.length, Math.floor(chartW / 45)));
    const labelInterval = Math.max(1, Math.round(data.length / targetLabels));
    for (let i = 0; i < data.length; i += labelInterval) {
      const x = PAD_L + i * slotW + slotW / 2;
      labels.push({ x, text: data[i]?.date?.slice(0, 4) ?? "", bold: true, isYear: true });
    }
  } else if (yearSpan >= 2) {
    // 다년 일봉: 연도 경계선 + 연도 라벨
    let prevYear = "";
    data.forEach((d, i) => {
      const yr = d.date?.slice(0, 4) ?? "";
      if (yr !== prevYear) {
        const x = PAD_L + i * slotW;
        if (prevYear !== "") yearLines.push({ x, year: yr }); // 연도 구분선
        labels.push({ x: x + slotW / 2, text: yr, bold: true, isYear: true });
        prevYear = yr;
      }
    });
  } else {
    // 1년 이내: 월-일 표시
    const targetLabels = Math.max(4, Math.min(8, Math.floor(chartW / 60)));
    const labelInterval = Math.max(1, Math.round(n / targetLabels));
    for (let i = 0; i < n; i += labelInterval) {
      const x = PAD_L + i * slotW + slotW / 2;
      labels.push({ x, text: data[i]?.date?.slice(5, 10) ?? "", bold: false, isYear: false });
    }
  }

  return (
    <svg width={containerWidth} height={20} className="overflow-visible select-none">
      {/* 연도 구분 수직선 */}
      {yearLines.map(({ x, year }, idx) => (
        <line key={`yl-${idx}`} x1={x} y1={0} x2={x} y2={-280}
          stroke="#e2e8f0" strokeWidth={1} strokeDasharray="4 2" pointerEvents="none" />
      ))}
      {/* 날짜/연도 라벨 */}
      {labels.map(({ x, text, bold, isYear }, idx) => (
        <text key={idx} x={x} y={14}
          fontSize={isYear ? 10 : 9}
          fill={bold ? "#374151" : "#94A3B8"}
          textAnchor="middle"
          fontWeight={bold ? "700" : "normal"}>
          {text}
        </text>
      ))}
    </svg>
  );
}

// ── 실시간 라인 차트 (Recharts) ───────────────────────────────────
function RealtimeLineChart({ ticker, isPositive, avgCost, currentPrice }: {
  ticker: string;
  isPositive: boolean;
  avgCost?: number;
  currentPrice: number;
}) {
  const [ticks, setTicks] = useState<{ t: number; price: number }[]>([]);
  const { data: stockData } = useGetStockByTicker(ticker);
  useEffect(() => {
    const p = stockData?.currentPrice ?? currentPrice;
    if (p > 0) setTicks(prev => [...prev, { t: Date.now(), price: p }].slice(-120));
  }, [stockData?.currentPrice, currentPrice]);
  const color = isPositive ? "#F04452" : "#3182F6";
  const gid = `rt-${ticker}`;
  const displayTicks = ticks.length >= 2 ? ticks : [
    { t: 0, price: currentPrice * 0.998 }, { t: 1, price: currentPrice }
  ];
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={displayTicks.map((t, i) => ({ i, price: t.price }))} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
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
                  {new Intl.NumberFormat("ko-KR").format(Math.round(payload[0].value as number))}원
                </div>
              ) : null
            }
            cursor={{ stroke: "#94A3B8", strokeWidth: 1, strokeDasharray: "4 4" }}
          />
          {avgCost && <ReferenceLine y={avgCost} stroke="#F97316" strokeDasharray="4 3" strokeWidth={1.2} />}
          <Area type="monotone" dataKey="price" stroke={color} strokeWidth={2} fill={`url(#${gid})`} isAnimationActive={false} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── 지표 설정 패널 ────────────────────────────────────────────────
function SettingsPanel({ indicators, onChange, onClose }: {
  indicators: Indicators;
  onChange: (k: keyof Indicators) => void;
  onClose: () => void;
}) {
  const items: { key: keyof Indicators; label: string; color?: string }[] = [
    { key: "ma5",      label: "MA5",       color: MA_COLORS.ma5 },
    { key: "ma20",     label: "MA20",      color: MA_COLORS.ma20 },
    { key: "ma60",     label: "MA60",      color: MA_COLORS.ma60 },
    { key: "ma120",    label: "MA120",     color: MA_COLORS.ma120 },
    { key: "bb",       label: "볼린저 밴드" },
    { key: "ichimoku", label: "일목균형표" },
    { key: "rsi",      label: "RSI" },
    { key: "macd",     label: "MACD" },
  ];
  return (
    <div className="absolute right-0 top-8 z-30 bg-white rounded-2xl shadow-2xl border border-border/60 p-4 w-48">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-extrabold text-foreground">지표 설정</span>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
      </div>
      <div className="space-y-2">
        {items.map(({ key, label, color }) => (
          <label key={key} className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" checked={indicators[key]} onChange={() => onChange(key)} className="rounded accent-primary" />
            {color && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />}
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

// 초기 뷰 설정 (봉 개수)
const DEFAULT_SPANS: Record<PeriodKey, number> = {
  realtime: 120, day: 60, week: 52, month: 60, year: 30,
};
// 분봉별 기본 표시 봉 수 (1분:120봉=2시간 / 5분:78봉=1일 / 15분:52봉=2일 / 30분:39봉=3일 / 60분:30봉=5일)
const TF_DEFAULT_SPANS: Record<TFKey, number> = {
  "1m": 120, "5m": 78, "15m": 52, "30m": 39, "60m": 30,
};

export function StockChart({ ticker, isPositive, currentPrice, avgCost }: StockChartProps) {
  const [period, setPeriod] = useState<PeriodKey>("day");
  const [chartType, setChartType] = useState<ChartType>("candle");
  const [tf, setTF] = useState<TFKey>("1m");
  const [indicators, setIndicators] = useState<Indicators>(DEFAULT_IND);
  const [showSettings, setShowSettings] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(600);

  const [viewOffset, setViewOffset] = useState(0);
  const [viewSpan, setViewSpan] = useState(DEFAULT_SPANS["day"]);
  const dragStartRef = useRef<{ x: number; offset: number } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(es => {
      for (const e of es) {
        const w = e.contentRect.width;
        if (w > 0) setContainerWidth(w);
      }
    });
    ro.observe(containerRef.current);
    const w = containerRef.current.clientWidth;
    if (w > 0) setContainerWidth(w);
    return () => ro.disconnect();
  }, []);

  // ── KIS 실시간 분봉 fetch ─────────────────────────────────────
  const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
  const [kisCandles1m,  setKisCandles1m]  = useState<OHLCPoint[]>([]);
  const [kisLoading,    setKisLoading]    = useState(false);
  const [kisError,      setKisError]      = useState(false);

  useEffect(() => {
    if (period !== "realtime") return;
    let alive = true;
    setKisLoading(true);
    setKisError(false);

    async function load() {
      try {
        const res = await fetch(`${API_BASE}/api/stocks/${ticker}/minute-candles?pages=6`);
        if (!res.ok) { if (alive) setKisError(true); return; }
        const raw = await res.json() as { time: string; open: number; high: number; low: number; close: number; volume: number }[];
        if (!alive) return;
        const points: OHLCPoint[] = raw.map(c => ({
          date:   c.time,
          open:   c.open,
          high:   c.high,
          low:    c.low,
          close:  c.close,
          volume: c.volume,
        })).filter(c => c.close > 0);
        setKisCandles1m(points);
      } catch {
        if (alive) setKisError(true);
      } finally {
        if (alive) setKisLoading(false);
      }
    }

    load();
    const interval = setInterval(load, 30_000);
    return () => { alive = false; clearInterval(interval); };
  }, [ticker, period, API_BASE]);

  // 나머지 기간 → "all" (상장일 ~ 오늘 수정주가 전체)
  const apiPeriod = useMemo(() => {
    return GetStockHistoryPeriod["all"];
  }, []);

  const { data: history, isLoading: histLoading } = useGetStockHistory(ticker, { period: apiPeriod });
  const isLoading = period === "realtime" ? kisLoading : histLoading;

  // ── 핵심 수정: 모든 값을 숫자로 강제 변환 + 0값 필터링 ──
  const rawData: OHLCPoint[] = useMemo(() => {
    return normalizeOHLC(history ? (history as any[]) : [], currentPrice);
  }, [history, currentPrice]);

  // 주봉/월봉/년봉 집계 or KIS 실시간 분봉
  const chartData = useMemo(() => {
    if (period === "realtime") {
      // KIS 실시간 분봉 (1m 원본 → TF 집계)
      if (kisError || !kisCandles1m.length) {
        // KIS 실패 시 시뮬레이션 폴백
        if (!rawData.length) return rawData;
        const bpd = TF_BARS[tf];
        const daysNeeded = Math.ceil(120 / bpd) + 5;
        return genIntradayCandles(rawData.slice(-daysNeeded), tf);
      }
      const mins: Record<TFKey, number> = { "1m": 1, "5m": 5, "15m": 15, "30m": 30, "60m": 60 };
      return aggregateMinutes(kisCandles1m, mins[tf]);
    }
    if (!rawData.length) return rawData;
    if (period === "week")  return aggregateWeekly(rawData);
    if (period === "month") return aggregateMonthly(rawData);
    if (period === "year")  return aggregateYearly(rawData);
    return rawData; // "day"
  }, [rawData, period, tf, kisCandles1m, kisError]);

  // period/tf 바뀌면 뷰 리셋
  useEffect(() => {
    const defaultSpan = period === "realtime"
      ? TF_DEFAULT_SPANS[tf]
      : (DEFAULT_SPANS[period] ?? 60);
    const span = Math.min(defaultSpan, chartData.length || defaultSpan);
    setViewSpan(span);
    setViewOffset(0);
  }, [period, tf, chartData.length]);

  // 보여줄 데이터 슬라이스 (오른쪽 최신 기준)
  const visibleData = useMemo(() => {
    if (!chartData.length) return chartData;
    const span = Math.max(5, Math.min(viewSpan, chartData.length));
    const end = Math.max(span, chartData.length - viewOffset);
    const start = Math.max(0, end - span);
    return chartData.slice(start, end);
  }, [chartData, viewOffset, viewSpan]);

  // 마우스 휠 → 줌 (±20%)
  const handleChartWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 1.2 : 0.83;
    setViewSpan(prev => {
      const next = Math.round(prev * factor);
      return Math.max(5, Math.min(chartData.length || 500, next));
    });
  }, [chartData.length]);

  // 드래그 → 팬 (과거로 이동)
  const handleChartMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragStartRef.current = { x: e.clientX, offset: viewOffset };
  }, [viewOffset]);

  const handleChartMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const pxPerBar = Math.max(1, (containerWidth - 76) / viewSpan);
    const shiftBars = Math.round(-dx / pxPerBar);
    const maxOff = Math.max(0, chartData.length - viewSpan);
    setViewOffset(Math.max(0, Math.min(maxOff, dragStartRef.current.offset + shiftBars)));
  }, [viewSpan, containerWidth, chartData.length]);

  const handleChartMouseUp = useCallback(() => { dragStartRef.current = null; }, []);

  const toggleIndicator = (k: keyof Indicators) => setIndicators(prev => ({ ...prev, [k]: !prev[k] }));

  const showRealtimeLine = period === "realtime" && chartType === "line";
  const showTFSub = period === "realtime" && chartType === "candle";

  const periods: { key: PeriodKey; label: string }[] = [
    { key: "realtime", label: "실시간" },
    { key: "day",      label: "일봉" },
    { key: "week",     label: "주봉" },
    { key: "month",    label: "월봉" },
    { key: "year",     label: "년봉" },
  ];

  const tfs: { key: TFKey; label: string }[] = [
    { key: "1m", label: "1분" }, { key: "5m", label: "5분" },
    { key: "15m", label: "15분" }, { key: "30m", label: "30분" }, { key: "60m", label: "60분" },
  ];

  return (
    <div className="w-full mt-4">
      {/* ── 상단 컨트롤 바 ── */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        {/* 차트 타입 */}
        <div className="flex bg-muted rounded-xl p-0.5 gap-0.5">
          {(["line", "candle"] as ChartType[]).map(t => (
            <button key={t} onClick={() => setChartType(t)}
              className={cn("px-3 py-1 text-xs font-bold rounded-lg transition-all",
                chartType === t ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              {t === "line" ? "라인" : "캔들"}
            </button>
          ))}
        </div>

        {/* 기간 탭 */}
        <div className="flex bg-muted rounded-xl p-0.5 gap-0.5 flex-1">
          {periods.map(({ key, label }) => (
            <button key={key} onClick={() => setPeriod(key)}
              className={cn("flex-1 py-1 text-xs font-bold rounded-lg transition-all whitespace-nowrap",
                period === key
                  ? key === "realtime" ? "bg-red-500 text-white shadow-sm" : "bg-white text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground")}>
              {key === "realtime" && period === "realtime" ? (
                <span className="flex items-center justify-center gap-1">
                  <span className="w-1 h-1 bg-white rounded-full animate-pulse" />{label}
                </span>
              ) : label}
            </button>
          ))}
        </div>

        {/* 지표 설정 */}
        <div className="relative">
          <button onClick={() => setShowSettings(v => !v)}
            className={cn("p-1.5 rounded-xl border transition-colors",
              showSettings ? "bg-primary/10 border-primary/30 text-primary" : "bg-muted border-transparent text-muted-foreground hover:text-foreground")}>
            <Settings className="w-3.5 h-3.5" />
          </button>
          {showSettings && (
            <SettingsPanel indicators={indicators} onChange={toggleIndicator} onClose={() => setShowSettings(false)} />
          )}
        </div>
      </div>

      {/* ── 실시간 TF 서브메뉴 (캔들 & 실시간 탭일 때만) ── */}
      {showTFSub && (
        <div className="flex items-center bg-red-50 border border-red-100 rounded-xl p-1 mb-2 gap-1">
          <span className="text-[10px] font-bold text-red-400 px-1">분봉</span>
          {tfs.map(t => (
            <button key={t.key} onClick={() => setTF(t.key)}
              className={cn("flex-1 py-1 text-[10px] font-bold rounded-lg transition-all",
                tf === t.key ? "bg-red-500 text-white shadow-sm" : "text-red-400 hover:bg-red-100")}>
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* ── MA 레전드 ── */}
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

      {/* ── 차트 영역 ── */}
      <div ref={containerRef} className="w-full relative">
        {isLoading ? (
          <div className="h-[280px] flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : showRealtimeLine ? (
          <RealtimeLineChart ticker={ticker} isPositive={isPositive} avgCost={avgCost} currentPrice={currentPrice} />
        ) : (
          <div
            className="cursor-grab active:cursor-grabbing select-none"
            onWheel={handleChartWheel}
            onMouseDown={handleChartMouseDown}
            onMouseMove={handleChartMouseMove}
            onMouseUp={handleChartMouseUp}
            onMouseLeave={handleChartMouseUp}
          >
            <EnhancedChart
              data={visibleData}
              containerWidth={containerWidth}
              avgCost={avgCost}
              chartType={chartType}
              indicators={indicators}
            />
            <TimeAxis data={visibleData} containerWidth={containerWidth} period={period} tf={tf} />
            <div className="flex justify-between px-1 mt-0.5">
              <span className="text-[8px] text-muted-foreground/50">
                {visibleData.length}봉 표시 / 총 {chartData.length}봉
                {chartData.length > 0 && chartData[0]?.date && (
                  <> &middot; {chartData[0].date.slice(0, 4)}~{chartData[chartData.length-1]?.date?.slice(0, 7)}</>
                )}
              </span>
              <span className="text-[8px] text-muted-foreground/50 pr-16">
                🔍 휠 줌 &middot; ← 드래그: 과거 탐색
              </span>
            </div>
          </div>
        )}

        {/* ── 거래량 (캔들 색 동기화: 상승=빨강, 하락=파랑) ── */}
        {!showRealtimeLine && visibleData.length > 0 && (
          <div className="mt-1 border-t border-border/30 pt-1">
            <VolumeBars data={visibleData} containerWidth={containerWidth} />
          </div>
        )}

        {/* RSI */}
        {indicators.rsi && !showRealtimeLine && visibleData.length > 0 && (
          <div className="mt-1 border-t border-border/30 pt-1">
            <RSIPanel data={visibleData} containerWidth={containerWidth} />
          </div>
        )}

        {/* MACD */}
        {indicators.macd && !showRealtimeLine && visibleData.length > 0 && (
          <div className="mt-1 border-t border-border/30 pt-1">
            <MACDPanel data={visibleData} containerWidth={containerWidth} />
          </div>
        )}
      </div>
    </div>
  );
}
