#!/usr/bin/env python3
"""
한국투자증권 Open API 모듈 (실전투자)
- REST API: 실시간 시세 조회 (토큰 자동 갱신)
- WebSocket: 실시간 체결가 수신 → DB 즉시 반영
- 실제 계좌 거래 없음 — 시세 조회 전용
"""
import os
import json
import time
import logging
import threading
import requests
import websocket
from datetime import datetime, timedelta, timezone

log = logging.getLogger(__name__)

KIS_APP_KEY    = os.environ.get("KIS_APP_KEY", "")
KIS_APP_SECRET = os.environ.get("KIS_APP_SECRET", "")

# ── 실전투자 API URL (SSL 정상 동작)
KIS_BASE_URL = "https://openapi.koreainvestment.com:9443"
KIS_WS_URL   = "ws://ops.koreainvestment.com:21000"

KST = timezone(timedelta(hours=9))

# ─────────────────────────────────────────────────
# 토큰 관리 (스레드 안전)
# ─────────────────────────────────────────────────

_token_lock       = threading.Lock()
_access_token: str = ""
_token_expires_at: float = 0.0


def _issue_token() -> tuple[str, float]:
    """한투 OAuth 2.0 액세스 토큰 발급 (실전)."""
    url = f"{KIS_BASE_URL}/oauth2/tokenP"
    payload = {
        "grant_type": "client_credentials",
        "appkey":     KIS_APP_KEY,
        "appsecret":  KIS_APP_SECRET,
    }
    try:
        r = requests.post(url, json=payload, timeout=10)
        r.raise_for_status()
        data = r.json()
        token = data.get("access_token", "")
        expire_str = data.get("access_token_token_expired", "")
        if expire_str:
            try:
                exp_dt = datetime.strptime(expire_str, "%Y-%m-%d %H:%M:%S").replace(tzinfo=KST)
                expires_at = exp_dt.timestamp()
            except Exception:
                expires_at = time.time() + 86400
        else:
            expires_at = time.time() + 86400
        log.info(f"[KIS] 액세스 토큰 발급 성공 (만료: {expire_str})")
        return token, expires_at
    except Exception as e:
        log.warning(f"[KIS] 토큰 발급 실패: {e}")
        return "", 0.0


def get_access_token() -> str:
    """유효한 액세스 토큰 반환. 만료 10분 전에 자동 갱신."""
    global _access_token, _token_expires_at
    with _token_lock:
        if not _access_token or time.time() >= _token_expires_at - 600:
            tok, exp = _issue_token()
            if tok:
                _access_token     = tok
                _token_expires_at = exp
        return _access_token


def _kis_headers(tr_id: str) -> dict:
    token = get_access_token()
    if not token:
        return {}
    return {
        "Content-Type":  "application/json; charset=UTF-8",
        "authorization": f"Bearer {token}",
        "appkey":        KIS_APP_KEY,
        "appsecret":     KIS_APP_SECRET,
        "tr_id":         tr_id,
        "custtype":      "P",
    }


def is_available() -> bool:
    """KIS API 키가 설정되어 있고 토큰을 발급받을 수 있는지 확인."""
    if not KIS_APP_KEY or not KIS_APP_SECRET:
        return False
    return bool(get_access_token())


# ─────────────────────────────────────────────────
# WebSocket 실시간 체결가 수신
# ─────────────────────────────────────────────────

# WebSocket 승인 키 (실시간 등록용)
_ws_approval_key: str = ""
_ws_approval_key_expires: float = 0.0
_ws_lock = threading.Lock()

# 실시간 가격 캐시: {ticker: {price, change, change_pct, volume, ...}}
_ws_prices: dict = {}
_ws_prices_lock = threading.Lock()

# WebSocket 연결 상태
_ws_connected = False
_ws_subscribed: set = set()
_ws_app = None


def _get_ws_approval_key() -> str:
    """WebSocket 접속 승인 키 발급."""
    global _ws_approval_key, _ws_approval_key_expires
    with _ws_lock:
        if _ws_approval_key and time.time() < _ws_approval_key_expires - 300:
            return _ws_approval_key
        url = f"{KIS_BASE_URL}/oauth2/Approval"
        payload = {
            "grant_type": "client_credentials",
            "appkey":     KIS_APP_KEY,
            "secretkey":  KIS_APP_SECRET,
        }
        try:
            r = requests.post(url, json=payload, timeout=10)
            r.raise_for_status()
            data = r.json()
            key = data.get("approval_key", "")
            if key:
                _ws_approval_key = key
                _ws_approval_key_expires = time.time() + 86400
                log.info("[KIS-WS] 승인 키 발급 성공")
            else:
                log.warning(f"[KIS-WS] 승인 키 없음: {data}")
            return key
        except Exception as e:
            log.warning(f"[KIS-WS] 승인 키 발급 실패: {e}")
            return ""


def _parse_ws_trade(data: str) -> dict | None:
    """
    실시간 체결가 데이터 파싱.
    tr_id: H0STCNT0 (실시간 체결)
    데이터 형식: 데이터헤더|데이터바디 (구분자 '^')
    """
    try:
        parts = data.split("|")
        if len(parts) < 4:
            return None
        tr_id = parts[1]
        if tr_id not in ("H0STCNT0",):
            return None
        body = parts[3]
        cols = body.split("^")
        if len(cols) < 13:
            return None
        ticker    = cols[0]
        price     = int(cols[2]) if cols[2] else 0
        change    = int(cols[4]) if cols[4] else 0
        change_pct = float(cols[5]) if cols[5] else 0.0
        volume    = int(cols[9]) if cols[9] else 0
        high      = int(cols[7]) if cols[7] else 0
        low       = int(cols[8]) if cols[8] else 0
        open_p    = int(cols[6]) if cols[6] else 0
        if price <= 0 or not ticker:
            return None
        return {
            "ticker":     ticker,
            "price":      price,
            "change":     change,
            "change_pct": change_pct,
            "volume":     volume,
            "high":       high,
            "low":        low,
            "open":       open_p,
        }
    except Exception as e:
        log.debug(f"[KIS-WS] 파싱 오류: {e} / {data[:80]}")
        return None


def _ws_on_message(ws, message: str):
    global _ws_connected
    try:
        if message.startswith("{"):
            msg = json.loads(message)
            tr_id = msg.get("header", {}).get("tr_id", "")
            rt_cd = msg.get("body", {}).get("rt_cd", "")
            msg1  = msg.get("body", {}).get("msg1", "")
            if tr_id == "PINGPONG":
                ws.send(message)
                return
            if rt_cd == "0":
                log.debug(f"[KIS-WS] 구독 성공: {tr_id} {msg1}")
            else:
                log.warning(f"[KIS-WS] 구독 응답: {tr_id} rt_cd={rt_cd} {msg1}")
            return
        trade = _parse_ws_trade(message)
        if trade:
            with _ws_prices_lock:
                _ws_prices[trade["ticker"]] = trade
    except Exception as e:
        log.debug(f"[KIS-WS] on_message 오류: {e}")


def _ws_on_open(ws):
    global _ws_connected
    _ws_connected = True
    log.info("[KIS-WS] WebSocket 연결됨")


def _ws_on_error(ws, error):
    global _ws_connected
    _ws_connected = False
    log.warning(f"[KIS-WS] 오류: {error}")


def _ws_on_close(ws, code, msg):
    global _ws_connected
    _ws_connected = False
    log.info(f"[KIS-WS] 연결 종료: {code} {msg}")


def _ws_subscribe(ws, ticker: str):
    """특정 종목 실시간 체결 구독."""
    approval_key = _get_ws_approval_key()
    if not approval_key:
        return
    req = {
        "header": {
            "approval_key": approval_key,
            "custtype":     "P",
            "tr_type":      "1",
            "content-type": "utf-8",
        },
        "body": {
            "input": {
                "tr_id":  "H0STCNT0",
                "tr_key": ticker,
            }
        }
    }
    try:
        ws.send(json.dumps(req))
    except Exception as e:
        log.debug(f"[KIS-WS] 구독 오류 {ticker}: {e}")


def start_websocket(tickers: list[str], on_price_update=None):
    """
    WebSocket 백그라운드 스레드로 실시간 체결가 수신 시작.
    tickers: 구독할 종목 코드 목록 (최대 40개/연결)
    on_price_update: 체결 수신 시 호출되는 콜백 (ticker, price_dict) -> None
    """
    global _ws_app, _ws_subscribed

    if not KIS_APP_KEY or not KIS_APP_SECRET:
        log.warning("[KIS-WS] API 키 없음 — WebSocket 비활성")
        return

    approval_key = _get_ws_approval_key()
    if not approval_key:
        log.warning("[KIS-WS] 승인 키 발급 실패 — WebSocket 비활성")
        return

    subscribe_list = list(tickers)[:40]
    _ws_subscribed = set(subscribe_list)

    def _on_open_with_subscribe(ws):
        _ws_on_open(ws)
        for tkr in subscribe_list:
            _ws_subscribe(ws, tkr)
            time.sleep(0.05)
        log.info(f"[KIS-WS] {len(subscribe_list)}종목 구독 완료")

    def _on_message_with_cb(ws, message):
        _ws_on_message(ws, message)
        if on_price_update:
            trade = None
            if not message.startswith("{"):
                trade = _parse_ws_trade(message)
            if trade:
                try:
                    on_price_update(trade["ticker"], trade)
                except Exception as e:
                    log.debug(f"[KIS-WS] 콜백 오류: {e}")

    def _run():
        while True:
            try:
                app = websocket.WebSocketApp(
                    KIS_WS_URL,
                    on_open=_on_open_with_subscribe,
                    on_message=_on_message_with_cb,
                    on_error=_ws_on_error,
                    on_close=_ws_on_close,
                )
                app.run_forever(ping_interval=30, ping_timeout=10)
            except Exception as e:
                log.warning(f"[KIS-WS] 재연결 대기 중: {e}")
            time.sleep(10)
            log.info("[KIS-WS] WebSocket 재연결 시도...")

    t = threading.Thread(target=_run, name="kis-websocket", daemon=True)
    t.start()
    log.info(f"[KIS-WS] WebSocket 스레드 시작 (URL: {KIS_WS_URL})")


# 다중 WebSocket 연결 상태 추적
_multi_ws_threads: list = []
_multi_ws_subscribed: set = set()
_multi_ws_lock = threading.Lock()


def start_websocket_multi(tickers: list[str], on_price_update=None, batch_size: int = 40):
    """
    다중 WebSocket 연결로 200종목 이상 실시간 체결가 수신.
    - 각 연결당 최대 40종목 구독
    - 자동 재연결 포함
    tickers: 구독할 종목 목록 (최대 batch_size * 연결수)
    on_price_update: 체결 수신 콜백 (ticker, price_dict) -> None
    """
    global _multi_ws_subscribed

    if not KIS_APP_KEY or not KIS_APP_SECRET:
        log.warning("[KIS-WS-MULTI] API 키 없음")
        return

    all_tickers = list(tickers)
    batches = [all_tickers[i:i + batch_size] for i in range(0, len(all_tickers), batch_size)]

    with _multi_ws_lock:
        _multi_ws_subscribed = set(all_tickers)

    log.info(f"[KIS-WS-MULTI] {len(all_tickers)}종목 → {len(batches)}개 연결 (각 최대 {batch_size}종목)")

    for idx, batch in enumerate(batches):
        _start_single_ws_thread(idx, batch, on_price_update)
        time.sleep(1.0)  # 연결 간격 (레이트 리밋)


def _start_single_ws_thread(conn_idx: int, subscribe_list: list[str], on_price_update=None):
    """단일 WebSocket 연결 스레드 시작 (다중 연결용)."""

    connected_flag = [False]
    conn_name = f"kis-ws-{conn_idx}"

    def _on_open_sub(ws):
        connected_flag[0] = True
        log.info(f"[KIS-WS-{conn_idx}] 연결됨, {len(subscribe_list)}종목 구독 시작")
        for tkr in subscribe_list:
            approval_key = _get_ws_approval_key()
            if not approval_key:
                break
            req = {
                "header": {
                    "approval_key": approval_key,
                    "custtype": "P",
                    "tr_type": "1",
                    "content-type": "utf-8",
                },
                "body": {"input": {"tr_id": "H0STCNT0", "tr_key": tkr}}
            }
            try:
                ws.send(json.dumps(req))
                time.sleep(0.05)
            except Exception as e:
                log.debug(f"[KIS-WS-{conn_idx}] 구독 오류 {tkr}: {e}")
        log.info(f"[KIS-WS-{conn_idx}] 구독 완료: {subscribe_list[:3]}...")

    def _on_msg(ws, message):
        try:
            if message.startswith("{"):
                msg = json.loads(message)
                tr_id = msg.get("header", {}).get("tr_id", "")
                if tr_id == "PINGPONG":
                    ws.send(message)
                return
            trade = _parse_ws_trade(message)
            if trade:
                with _ws_prices_lock:
                    _ws_prices[trade["ticker"]] = trade
                if on_price_update:
                    try:
                        on_price_update(trade["ticker"], trade)
                    except Exception as e:
                        log.debug(f"[KIS-WS-{conn_idx}] 콜백 오류: {e}")
        except Exception as e:
            log.debug(f"[KIS-WS-{conn_idx}] on_message 오류: {e}")

    def _on_err(ws, error):
        connected_flag[0] = False
        log.warning(f"[KIS-WS-{conn_idx}] 오류: {error}")

    def _on_close(ws, code, msg):
        connected_flag[0] = False
        log.info(f"[KIS-WS-{conn_idx}] 종료: {code}")

    def _run():
        while True:
            try:
                app = websocket.WebSocketApp(
                    KIS_WS_URL,
                    on_open=_on_open_sub,
                    on_message=_on_msg,
                    on_error=_on_err,
                    on_close=_on_close,
                )
                app.run_forever(ping_interval=30, ping_timeout=10)
            except Exception as e:
                log.warning(f"[KIS-WS-{conn_idx}] 재연결 대기: {e}")
            time.sleep(15)
            log.info(f"[KIS-WS-{conn_idx}] 재연결 시도...")

    t = threading.Thread(target=_run, name=conn_name, daemon=True)
    with _multi_ws_lock:
        _multi_ws_threads.append(t)
    t.start()


def get_ws_prices() -> dict:
    """WebSocket으로 수신한 실시간 체결가 캐시 반환."""
    with _ws_prices_lock:
        return dict(_ws_prices)


def is_ws_connected() -> bool:
    return _ws_connected


# ─────────────────────────────────────────────────
# 실시간 시세 조회 (REST)
# ─────────────────────────────────────────────────

def fetch_price(ticker: str) -> dict | None:
    """
    한투 REST API로 단일 종목 현재가 조회.
    tr_id: FHKST01010100 (주식 현재가 시세)
    """
    headers = _kis_headers("FHKST01010100")
    if not headers:
        return None
    params = {
        "fid_cond_mrkt_div_code": "J",
        "fid_input_iscd":         ticker,
    }
    try:
        r = requests.get(
            f"{KIS_BASE_URL}/uapi/domestic-stock/v1/quotations/inquire-price",
            headers=headers, params=params, timeout=6
        )
        if r.status_code != 200:
            log.debug(f"[KIS] 시세 조회 오류 {ticker}: HTTP {r.status_code}")
            return None
        d = r.json()
        if d.get("rt_cd") != "0":
            log.debug(f"[KIS] 시세 조회 오류 {ticker}: {d.get('msg1','')}")
            return None
        o = d.get("output", {})
        price      = int(o.get("stck_prpr",  "0").replace(",", "") or 0)
        change_val = int(o.get("prdy_vrss",  "0").replace(",", "") or 0)
        change_pct = float(o.get("prdy_ctrt", "0").replace(",", "") or 0)
        volume     = int(o.get("acml_vol",   "0").replace(",", "") or 0)
        high       = int(o.get("stck_hgpr",  "0").replace(",", "") or 0)
        low        = int(o.get("stck_lwpr",  "0").replace(",", "") or 0)
        open_p     = int(o.get("stck_oprc",  "0").replace(",", "") or 0)
        base       = int(o.get("stck_sdpr",  "0").replace(",", "") or 0)
        if price <= 0:
            return None
        return {
            "price":      price,
            "change":     change_val,
            "change_pct": change_pct,
            "volume":     volume,
            "high":       high,
            "low":        low,
            "open":       open_p,
            "base":       base,
        }
    except Exception as e:
        log.debug(f"[KIS] fetch_price {ticker}: {e}")
        return None


def fetch_price_batch(tickers: list[str], delay: float = 0.05) -> dict:
    """여러 종목 현재가 일괄 조회."""
    result = {}
    for ticker in tickers:
        d = fetch_price(ticker)
        if d:
            result[ticker] = d
        time.sleep(delay)
    return result


# ─────────────────────────────────────────────────
# 시장 순위 조회
# ─────────────────────────────────────────────────

def fetch_volume_ranking(market: str = "J", top_n: int = 30) -> list:
    """거래량 순위 조회. tr_id: FHPST01710000"""
    headers = _kis_headers("FHPST01710000")
    if not headers:
        return []
    params = {
        "fid_cond_mrkt_div_code": "J",
        "fid_cond_scr_div_code":  "20171",
        "fid_input_iscd":         "0000",
        "fid_div_cls_code":       "0",
        "fid_blng_cls_code":      "0",
        "fid_trgt_cls_code":      "111111111",
        "fid_trgt_exls_cls_code": "000000",
        "fid_input_price_1":      "",
        "fid_input_price_2":      "",
        "fid_vol_cnt":            "",
        "fid_input_date_1":       "",
    }
    try:
        r = requests.get(
            f"{KIS_BASE_URL}/uapi/domestic-stock/v1/ranking/volume",
            headers=headers, params=params, timeout=8
        )
        if r.status_code != 200:
            return []
        d = r.json()
        if d.get("rt_cd") != "0":
            return []
        items = []
        for o in d.get("output", [])[:top_n]:
            ticker = o.get("mksc_shrn_iscd", "")
            if not ticker:
                continue
            items.append({
                "ticker":       ticker,
                "name":         o.get("hts_kor_isnm", ""),
                "price":        int(o.get("stck_prpr", "0").replace(",", "") or 0),
                "change_pct":   float(o.get("prdy_ctrt", "0") or 0),
                "volume":       int(o.get("acml_vol", "0").replace(",", "") or 0),
                "trade_amount": int(o.get("acml_tr_pbmn", "0").replace(",", "") or 0),
            })
        log.info(f"[KIS] 거래량 순위: {len(items)}종목")
        return items
    except Exception as e:
        log.debug(f"[KIS] fetch_volume_ranking: {e}")
        return []


def fetch_fluctuation_ranking(top_n: int = 30) -> list:
    """등락률 상위 종목 조회. tr_id: FHPST01700000"""
    headers = _kis_headers("FHPST01700000")
    if not headers:
        return []
    params = {
        "fid_cond_mrkt_div_code": "J",
        "fid_cond_scr_div_code":  "20170",
        "fid_input_iscd":         "0000",
        "fid_rank_sort_cls_code": "0",
        "fid_input_cnt_1":        "0",
        "fid_prc_cls_code":       "1",
        "fid_input_price_1":      "",
        "fid_input_price_2":      "",
        "fid_vol_cnt":            "100000",
        "fid_trgt_cls_code":      "0",
        "fid_trgt_exls_cls_code": "0",
        "fid_div_cls_code":       "0",
        "fid_rsfl_rate1":         "",
        "fid_rsfl_rate2":         "",
    }
    try:
        r = requests.get(
            f"{KIS_BASE_URL}/uapi/domestic-stock/v1/ranking/fluctuation",
            headers=headers, params=params, timeout=8
        )
        if r.status_code != 200:
            return []
        d = r.json()
        if d.get("rt_cd") != "0":
            return []
        items = []
        for o in d.get("output", [])[:top_n]:
            ticker = o.get("mksc_shrn_iscd", "")
            if not ticker:
                continue
            items.append({
                "ticker":     ticker,
                "name":       o.get("hts_kor_isnm", ""),
                "price":      int(o.get("stck_prpr", "0").replace(",", "") or 0),
                "change_pct": float(o.get("prdy_ctrt", "0") or 0),
                "volume":     int(o.get("acml_vol", "0").replace(",", "") or 0),
            })
        log.info(f"[KIS] 등락률 순위: {len(items)}종목")
        return items
    except Exception as e:
        log.debug(f"[KIS] fetch_fluctuation_ranking: {e}")
        return []


# ─────────────────────────────────────────────────
# 일별 OHLCV (차트 데이터)
# ─────────────────────────────────────────────────

def fetch_daily_ohlcv(ticker: str, start: str, end: str) -> list:
    """
    일별 주가 OHLCV 조회.
    tr_id: FHKST03010100
    start/end: "YYYYMMDD"
    반환: [(ticker, date_str, open, high, low, close, volume), ...]
    """
    headers = _kis_headers("FHKST03010100")
    if not headers:
        return []
    params = {
        "fid_cond_mrkt_div_code": "J",
        "fid_input_iscd":         ticker,
        "fid_input_date_1":       start,
        "fid_input_date_2":       end,
        "fid_period_div_code":    "D",
        "fid_org_adj_prc":        "1",
    }
    try:
        r = requests.get(
            f"{KIS_BASE_URL}/uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice",
            headers=headers, params=params, timeout=10
        )
        if r.status_code != 200:
            return []
        d = r.json()
        if d.get("rt_cd") != "0":
            return []
        rows = []
        for o in d.get("output2", []):
            date_str = o.get("stck_bsop_date", "")
            if not date_str or len(date_str) != 8:
                continue
            try:
                close  = int(o.get("stck_clpr", "0").replace(",", "") or 0)
                open_p = int(o.get("stck_oprc", "0").replace(",", "") or 0)
                high   = int(o.get("stck_hgpr", "0").replace(",", "") or 0)
                low    = int(o.get("stck_lwpr", "0").replace(",", "") or 0)
                vol    = int(o.get("acml_vol",  "0").replace(",", "") or 0)
                if close <= 0:
                    continue
                date_fmt = f"{date_str[:4]}-{date_str[4:6]}-{date_str[6:8]}"
                rows.append((ticker, date_fmt, open_p, high, low, close, vol))
            except Exception:
                continue
        return rows
    except Exception as e:
        log.debug(f"[KIS] fetch_daily_ohlcv {ticker}: {e}")
        return []


# ─────────────────────────────────────────────────
# 종목 기본 정보
# ─────────────────────────────────────────────────

def fetch_stock_info(ticker: str) -> dict | None:
    """종목 기본 정보 조회. tr_id: CTPF1604R"""
    headers = _kis_headers("CTPF1604R")
    if not headers:
        return None
    params = {
        "PDNO":         ticker,
        "PRDT_TYPE_CD": "300",
    }
    try:
        r = requests.get(
            f"{KIS_BASE_URL}/uapi/domestic-stock/v1/quotations/search-stock-info",
            headers=headers, params=params, timeout=6
        )
        if r.status_code != 200:
            return None
        d = r.json()
        if d.get("rt_cd") != "0":
            return None
        o = d.get("output", {})
        return {
            "ticker": ticker,
            "name":   o.get("prdt_abrv_name", "") or o.get("prdt_name", ""),
            "market": "KOSPI" if o.get("mket_id_cd", "") == "STK" else "KOSDAQ",
        }
    except Exception as e:
        log.debug(f"[KIS] fetch_stock_info {ticker}: {e}")
        return None
