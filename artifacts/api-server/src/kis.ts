/**
 * 한국투자증권 Open API — TypeScript 클라이언트
 * - OAuth 토큰 관리 (자동 갱신)
 * - 분봉 / 일봉 / 주봉 / 월봉 / 년봉 조회
 * - 호가창 (FHKST01010200)
 * - 체결내역 (FHKST01010300)
 * 시세 조회 전용. 실계좌 거래 없음.
 */

const KIS_BASE   = "https://openapi.koreainvestment.com:9443";
const APP_KEY    = process.env.KIS_APP_KEY    ?? "";
const APP_SECRET = process.env.KIS_APP_SECRET ?? "";

// ── 토큰 캐시 ──────────────────────────────────────────────────────
let _token    = "";
let _tokenExp = 0;   // epoch ms

async function issueToken(): Promise<string> {
  if (!APP_KEY || !APP_SECRET) return "";
  try {
    const res = await fetch(`${KIS_BASE}/oauth2/tokenP`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "client_credentials",
        appkey:     APP_KEY,
        appsecret:  APP_SECRET,
      }),
    });
    if (!res.ok) return "";
    const d   = await res.json() as Record<string, string>;
    const tok = d.access_token ?? "";
    const expS = d.access_token_token_expired ?? "";
    let expMs: number;
    if (expS) {
      const [ymd, hms] = expS.split(" ");
      expMs = new Date(`${ymd}T${hms}+09:00`).getTime();
    } else {
      expMs = Date.now() + 86_400_000;
    }
    console.log("[KIS-TS] 토큰 발급 완료");
    return (_token = tok, _tokenExp = expMs, tok);
  } catch (e) {
    console.error("[KIS-TS] 토큰 발급 오류:", e);
    return "";
  }
}

export async function getToken(): Promise<string> {
  if (_token && Date.now() < _tokenExp - 600_000) return _token;
  return issueToken();
}

function headers(trId: string): Record<string, string> {
  return {
    "Content-Type": "application/json; charset=UTF-8",
    authorization:  `Bearer ${_token}`,
    appkey:         APP_KEY,
    appsecret:      APP_SECRET,
    tr_id:          trId,
    custtype:       "P",
  };
}

// KST 오늘 날짜를 "YYYYMMDD" 로 반환
function todayKST(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 3_600_000);
  return kst.toISOString().slice(0, 10).replace(/-/g, "");
}

// N일 전 KST 날짜를 "YYYYMMDD" 로 반환
function pastDateKST(daysAgo: number): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 3_600_000 - daysAgo * 86_400_000);
  return kst.toISOString().slice(0, 10).replace(/-/g, "");
}

// ── 공통 OHLCV 타입 ────────────────────────────────────────────────
export interface OHLCBar {
  date:   string;  // "YYYY-MM-DD" 또는 "HH:MM"
  open:   number;
  high:   number;
  low:    number;
  close:  number;
  volume: number;
}

// ── 분봉 (FHKST03010200) ──────────────────────────────────────────
async function fetchMinutePage(ticker: string, endTime: string): Promise<OHLCBar[]> {
  const token = await getToken();
  if (!token) return [];
  const url = new URL(`${KIS_BASE}/uapi/domestic-stock/v1/quotations/inquire-time-itemchartprice`);
  url.searchParams.set("fid_etc_cls_code",       "");
  url.searchParams.set("fid_cond_mrkt_div_code", "J");
  url.searchParams.set("fid_input_iscd",         ticker);
  url.searchParams.set("fid_input_hour_1",       endTime);
  url.searchParams.set("fid_pw_data_incu_yn",    "Y");
  try {
    const res = await fetch(url.toString(), { headers: headers("FHKST03010200") });
    if (!res.ok) return [];
    const d = await res.json() as Record<string, unknown>;
    if ((d.rt_cd as string) !== "0") return [];
    const out = (d.output2 as Record<string, string>[]) ?? [];
    return out.map(o => {
      const hms  = o.stck_cntg_hour ?? "";
      const time = hms.length >= 4 ? `${hms.slice(0, 2)}:${hms.slice(2, 4)}` : hms;
      return {
        date:   time,
        open:   parseInt(o.stck_oprc ?? "0") || 0,
        high:   parseInt(o.stck_hgpr ?? "0") || 0,
        low:    parseInt(o.stck_lwpr ?? "0") || 0,
        close:  parseInt(o.stck_prpr ?? "0") || 0,
        volume: parseInt(o.cntg_vol  ?? "0") || 0,
      };
    }).filter(c => c.close > 0);
  } catch { return []; }
}

/** 당일 분봉 (pages 페이지, 시간순) */
export async function fetchMinuteCandles(ticker: string, pages = 6): Promise<OHLCBar[]> {
  await getToken();
  const all: OHLCBar[] = [];
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 3_600_000);
  let hh = kst.getUTCHours();
  let mm = kst.getUTCMinutes();
  if (hh > 15 || (hh === 15 && mm >= 30)) { hh = 15; mm = 30; }
  if (hh < 9) { hh = 9; mm = 0; }

  for (let p = 0; p < pages; p++) {
    const endTime = `${String(hh).padStart(2,"0")}${String(mm).padStart(2,"0")}00`;
    const page = await fetchMinutePage(ticker, endTime);
    if (!page.length) break;
    all.push(...page);
    const last = page[page.length - 1].date;
    const [lhh, lmm] = last.split(":").map(Number);
    let nm = lmm - 1, nh = lhh;
    if (nm < 0) { nm = 59; nh--; }
    if (nh < 9) break;
    hh = nh; mm = nm;
    await new Promise(r => setTimeout(r, 50));
  }
  const seen = new Set<string>();
  return all.filter(c => {
    if (seen.has(c.date)) return false;
    seen.add(c.date); return true;
  }).sort((a, b) => a.date.localeCompare(b.date));
}

// ── 일봉/주봉/월봉 (FHKST03010100) ──────────────────────────────
export type PeriodCode = "D" | "W" | "M" | "Y";

async function fetchPeriodPage(
  ticker: string,
  periodCode: "D" | "W" | "M",
  startDate: string,
  endDate: string,
): Promise<OHLCBar[]> {
  const token = await getToken();
  if (!token) return [];
  const url = new URL(`${KIS_BASE}/uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice`);
  url.searchParams.set("fid_cond_mrkt_div_code", "J");
  url.searchParams.set("fid_input_iscd",         ticker);
  url.searchParams.set("fid_input_date_1",       startDate);
  url.searchParams.set("fid_input_date_2",       endDate);
  url.searchParams.set("fid_period_div_code",    periodCode);
  url.searchParams.set("fid_org_adj_prc",        "1"); // 수정주가
  try {
    const res = await fetch(url.toString(), { headers: headers("FHKST03010100") });
    if (!res.ok) return [];
    const d = await res.json() as Record<string, unknown>;
    if ((d.rt_cd as string) !== "0") return [];
    const out = (d.output2 as Record<string, string>[]) ?? [];
    return out.map(o => {
      const raw = o.stck_bsop_date ?? "";
      const date = raw.length === 8
        ? `${raw.slice(0,4)}-${raw.slice(4,6)}-${raw.slice(6,8)}`
        : raw;
      return {
        date,
        open:   parseInt(o.stck_oprc ?? "0") || 0,
        high:   parseInt(o.stck_hgpr ?? "0") || 0,
        low:    parseInt(o.stck_lwpr ?? "0") || 0,
        close:  parseInt(o.stck_clpr ?? "0") || 0,
        volume: parseInt(o.acml_vol  ?? "0") || 0,
      };
    }).filter(c => c.close > 0 && c.date.length === 10);
  } catch { return []; }
}

/**
 * 일봉/주봉/월봉/년봉 조회.
 * - D: 최대 3페이지 × 100봉 = 최근 ~300거래일
 * - W: 2페이지 × 100봉 = 최근 ~200주
 * - M: 1페이지 × 100봉 = 최근 ~100개월
 * - Y: 월봉을 년도로 집계
 */
export async function fetchPeriodCandles(
  ticker: string,
  period: PeriodCode,
  maxPages = 3,
): Promise<OHLCBar[]> {
  await getToken();

  // 년봉은 월봉 데이터를 집계
  if (period === "Y") {
    const monthly = await fetchPeriodCandles(ticker, "M", 2);
    return aggregateYearly(monthly);
  }

  const all: OHLCBar[] = [];
  let endDate = todayKST();
  const limitPages = period === "D" ? maxPages : Math.min(maxPages, period === "W" ? 2 : 1);

  for (let p = 0; p < limitPages; p++) {
    // 시작 날짜: 일봉=100거래일, 주봉=100주, 월봉=100개월 전
    const daysBack = period === "D" ? 140 : period === "W" ? 700 : 3100;
    const startDate = pastDateKST(daysBack + p * daysBack);
    const page = await fetchPeriodPage(ticker, period, startDate, endDate);
    if (!page.length) break;
    all.push(...page);
    // 다음 페이지: 가장 오래된 봉의 날짜 - 1일
    const oldest = page[page.length - 1].date.replace(/-/g, "");
    const dt = new Date(`${oldest.slice(0,4)}-${oldest.slice(4,6)}-${oldest.slice(6,8)}`);
    dt.setDate(dt.getDate() - 1);
    endDate = dt.toISOString().slice(0,10).replace(/-/g, "");
    await new Promise(r => setTimeout(r, 50));
  }

  // 중복 제거 + 날짜 오름차순
  const seen = new Set<string>();
  return all.filter(c => {
    if (seen.has(c.date)) return false;
    seen.add(c.date); return true;
  }).sort((a, b) => a.date.localeCompare(b.date));
}

function aggregateYearly(monthly: OHLCBar[]): OHLCBar[] {
  const map = new Map<string, OHLCBar>();
  for (const c of monthly) {
    const yr = c.date.slice(0, 4);
    const ex = map.get(yr);
    if (!ex) {
      map.set(yr, { date: `${yr}-01-01`, open: c.open, high: c.high, low: c.low, close: c.close, volume: c.volume });
    } else {
      ex.high   = Math.max(ex.high, c.high);
      ex.low    = Math.min(ex.low,  c.low);
      ex.close  = c.close;
      ex.volume += c.volume;
    }
  }
  return [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
}

// ── 호가 (FHKST01010200) ─────────────────────────────────────────
export interface OrderBookLevel { price: number; qty: number; }
export interface OrderBookData {
  asks: OrderBookLevel[];
  bids: OrderBookLevel[];
  totalAskQty: number;
  totalBidQty: number;
}

export async function fetchOrderbook(ticker: string): Promise<OrderBookData | null> {
  const token = await getToken();
  if (!token) return null;
  const url = new URL(`${KIS_BASE}/uapi/domestic-stock/v1/quotations/inquire-asking-price-exp-ccn`);
  url.searchParams.set("fid_cond_mrkt_div_code", "J");
  url.searchParams.set("fid_input_iscd",         ticker);
  try {
    const res = await fetch(url.toString(), { headers: headers("FHKST01010200") });
    if (!res.ok) return null;
    const d = await res.json() as Record<string, unknown>;
    if ((d.rt_cd as string) !== "0") return null;
    const o = (d.output1 as Record<string, string>) ?? {};

    const asks: OrderBookLevel[] = [];
    const bids: OrderBookLevel[] = [];
    for (let i = 10; i >= 1; i--) {
      const ap = parseInt(o[`askp${i}`]      ?? "0") || 0;
      const aq = parseInt(o[`askp_rsqn${i}`] ?? "0") || 0;
      if (ap > 0) asks.push({ price: ap, qty: aq });
    }
    for (let i = 1; i <= 10; i++) {
      const bp = parseInt(o[`bidp${i}`]      ?? "0") || 0;
      const bq = parseInt(o[`bidp_rsqn${i}`] ?? "0") || 0;
      if (bp > 0) bids.push({ price: bp, qty: bq });
    }
    const totalAskQty = parseInt(o.total_askp_rsqn ?? "0") || asks.reduce((s,a) => s+a.qty, 0);
    const totalBidQty = parseInt(o.total_bidp_rsqn ?? "0") || bids.reduce((s,b) => s+b.qty, 0);
    return { asks, bids, totalAskQty, totalBidQty };
  } catch { return null; }
}

// ── 체결내역 (FHKST01010300) ──────────────────────────────────────
export interface ExecutionTick {
  time:   string;   // "HH:MM:SS"
  price:  number;
  volume: number;
  isBuy:  boolean;  // 매수=true, 매도=false
}

export async function fetchExecutions(ticker: string): Promise<ExecutionTick[]> {
  const token = await getToken();
  if (!token) return [];
  const url = new URL(`${KIS_BASE}/uapi/domestic-stock/v1/quotations/inquire-ccnl`);
  url.searchParams.set("fid_cond_mrkt_div_code", "J");
  url.searchParams.set("fid_input_iscd",         ticker);
  try {
    const res = await fetch(url.toString(), { headers: headers("FHKST01010300") });
    if (!res.ok) return [];
    const d = await res.json() as Record<string, unknown>;
    if ((d.rt_cd as string) !== "0") return [];
    const out = (d.output as Record<string, string>[]) ?? [];
    return out.map(o => {
      const hms = o.stck_cntg_hour ?? "";
      const time = hms.length >= 6
        ? `${hms.slice(0,2)}:${hms.slice(2,4)}:${hms.slice(4,6)}`
        : hms;
      const sign = o.prdy_vrss_sign ?? "3";  // 2=상승,5=하락,3=보합
      const price  = parseInt(o.stck_prpr ?? "0") || 0;
      const volume = parseInt(o.cntg_vol  ?? "0") || 0;
      // sign 2=상승(매수), 5=하락(매도), 그 외=보합
      const isBuy = sign === "2" || sign === "1";
      return { time, price, volume, isBuy };
    }).filter(t => t.price > 0);
  } catch { return []; }
}
