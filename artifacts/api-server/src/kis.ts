/**
 * 한국투자증권 Open API — TypeScript 클라이언트
 * - OAuth 토큰 관리 (자동 갱신)
 * - 주식 당일 분봉 조회 (FHKST03010200)
 * - 주식 현재가 호가 조회 (FHKST01010200)
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
    const res  = await fetch(`${KIS_BASE}/oauth2/tokenP`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        grant_type: "client_credentials",
        appkey:     APP_KEY,
        appsecret:  APP_SECRET,
      }),
    });
    if (!res.ok) return "";
    const d    = await res.json() as Record<string, string>;
    const tok  = d.access_token ?? "";
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

function headers(trId: string) {
  return {
    "Content-Type":  "application/json; charset=UTF-8",
    authorization:   `Bearer ${_token}`,
    appkey:          APP_KEY,
    appsecret:       APP_SECRET,
    tr_id:           trId,
    custtype:        "P",
  };
}

// ── 분봉 (FHKST03010200) ──────────────────────────────────────────
export interface MinuteCandle {
  time:   string;   // "HH:MM"
  open:   number;
  high:   number;
  low:    number;
  close:  number;
  volume: number;
}

/**
 * 당일 분봉 조회. endTime="153000" → 장 종료 시점부터 과거 방향으로 최대 30봉.
 * 여러 번 호출해서 이어붙임.
 */
async function fetchMinutePage(ticker: string, endTime: string): Promise<MinuteCandle[]> {
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
    const d   = await res.json() as Record<string, unknown>;
    if ((d.rt_cd as string) !== "0") return [];
    const out = (d.output2 as Record<string, string>[]) ?? [];
    return out.map(o => {
      const hms  = o.stck_cntg_hour ?? "";
      const time = hms.length >= 4 ? `${hms.slice(0, 2)}:${hms.slice(2, 4)}` : hms;
      return {
        time,
        open:   parseInt(o.stck_oprc  ?? "0") || 0,
        high:   parseInt(o.stck_hgpr  ?? "0") || 0,
        low:    parseInt(o.stck_lwpr  ?? "0") || 0,
        close:  parseInt(o.stck_prpr  ?? "0") || 0,
        volume: parseInt(o.cntg_vol   ?? "0") || 0,
      };
    }).filter(c => c.close > 0);
  } catch {
    return [];
  }
}

/** 당일 분봉 전체 조회 (최대 pages 페이지). 시간순(오래된 것 먼저) 반환. */
export async function fetchMinuteCandles(ticker: string, pages = 4): Promise<MinuteCandle[]> {
  await getToken();
  const allCandles: MinuteCandle[] = [];
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 3600_000);
  let hh = kst.getUTCHours();
  let mm = kst.getUTCMinutes();
  // 장 종료 이후라면 15:30으로 고정
  if (hh > 15 || (hh === 15 && mm >= 30)) { hh = 15; mm = 30; }
  // 장 시작 전이라면 09:00으로
  if (hh < 9) { hh = 9; mm = 0; }

  for (let p = 0; p < pages; p++) {
    const endTime = `${String(hh).padStart(2, "0")}${String(mm).padStart(2, "0")}00`;
    const page    = await fetchMinutePage(ticker, endTime);
    if (!page.length) break;
    allCandles.push(...page);
    // 다음 페이지: 마지막 봉의 시간 - 1분
    const last  = page[page.length - 1].time;
    const [lhh, lmm] = last.split(":").map(Number);
    let nextMm  = lmm - 1;
    let nextHh  = lhh;
    if (nextMm < 0) { nextMm = 59; nextHh -= 1; }
    if (nextHh < 9) break;
    hh = nextHh; mm = nextMm;
    // 요청 간 50ms 딜레이 (KIS rate-limit)
    await new Promise(r => setTimeout(r, 50));
  }
  // 중복 제거, 시간순 정렬
  const seen = new Set<string>();
  const deduped = allCandles.filter(c => {
    if (seen.has(c.time)) return false;
    seen.add(c.time); return true;
  });
  return deduped.sort((a, b) => a.time.localeCompare(b.time));
}

// ── 호가 (FHKST01010200) ─────────────────────────────────────────
export interface OrderBookLevel {
  price: number;
  qty:   number;
}

export interface OrderBookData {
  asks:        OrderBookLevel[];  // 매도 호가 (낮은 가격부터)
  bids:        OrderBookLevel[];  // 매수 호가 (높은 가격부터)
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
    const d   = await res.json() as Record<string, unknown>;
    if ((d.rt_cd as string) !== "0") return null;
    const o   = (d.output1 as Record<string, string>) ?? {};

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

    const totalAskQty = parseInt(o.total_askp_rsqn ?? "0") || asks.reduce((s, a) => s + a.qty, 0);
    const totalBidQty = parseInt(o.total_bidp_rsqn ?? "0") || bids.reduce((s, b) => s + b.qty, 0);

    return { asks, bids, totalAskQty, totalBidQty };
  } catch {
    return null;
  }
}
