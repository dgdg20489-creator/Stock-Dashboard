#!/usr/bin/env python3
"""
한국투자증권 Open API 모듈
- 실시간 주가 조회 (모의투자 시세 데이터 소스)
- OAuth 액세스 토큰 자동 갱신
- 실제 계좌 거래 없음 — 시세 조회 전용
"""
import os
import time
import logging
import threading
import requests
from datetime import datetime, timedelta, timezone

log = logging.getLogger(__name__)

KIS_APP_KEY    = os.environ.get("KIS_APP_KEY", "")
KIS_APP_SECRET = os.environ.get("KIS_APP_SECRET", "")

# 한국투자증권 실전 API 기본 URL
KIS_BASE_URL = "https://openapi.koreainvestment.com:9443"

KST = timezone(timedelta(hours=9))

# ─────────────────────────────────────────────────
# 토큰 관리 (스레드 안전)
# ─────────────────────────────────────────────────

_token_lock   = threading.Lock()
_access_token: str = ""
_token_expires_at: float = 0.0   # epoch seconds


def _issue_token() -> str:
    """한투 OAuth 2.0 액세스 토큰 발급."""
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
        # 만료 시간: access_token_token_expired 필드 (예: "2026-04-08 08:00:00")
        expire_str = data.get("access_token_token_expired", "")
        if expire_str:
            try:
                exp_dt = datetime.strptime(expire_str, "%Y-%m-%d %H:%M:%S").replace(tzinfo=KST)
                expires_at = exp_dt.timestamp()
            except Exception:
                expires_at = time.time() + 86400  # 기본 24시간
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
# 실시간 시세 조회
# ─────────────────────────────────────────────────

def fetch_price(ticker: str) -> dict | None:
    """
    한투 API로 단일 종목 현재가 조회.
    tr_id: FHKST01010100 (주식 현재가 시세)
    반환: {price, change, change_pct, volume, high, low, open}
    """
    headers = _kis_headers("FHKST01010100")
    if not headers:
        return None
    params = {
        "fid_cond_mrkt_div_code": "J",   # J=주식
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
        base       = int(o.get("stck_sdpr",  "0").replace(",", "") or 0)  # 기준가(전일종가)
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
    """
    여러 종목 현재가 일괄 조회.
    반환: {ticker: price_dict, ...}
    """
    result = {}
    for ticker in tickers:
        d = fetch_price(ticker)
        if d:
            result[ticker] = d
        time.sleep(delay)
    return result


# ─────────────────────────────────────────────────
# 시장 순위 조회 (거래량 상위 / 등락률 상위)
# ─────────────────────────────────────────────────

def fetch_volume_ranking(market: str = "J", top_n: int = 30) -> list:
    """
    거래량 순위 조회.
    tr_id: FHPST01710000 (국내주식 거래량 순위)
    market: J=주식전체, 0=KOSPI, 1=KOSDAQ
    """
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
    """
    등락률 상위 종목 조회.
    tr_id: FHPST01700000
    """
    headers = _kis_headers("FHPST01700000")
    if not headers:
        return []
    params = {
        "fid_cond_mrkt_div_code": "J",
        "fid_cond_scr_div_code":  "20170",
        "fid_input_iscd":         "0000",
        "fid_rank_sort_cls_code": "0",   # 0=등락률 상위
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
        "fid_period_div_code":    "D",   # D=일봉
        "fid_org_adj_prc":        "1",   # 수정주가
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
# 종목 기본 정보 (종목명 등)
# ─────────────────────────────────────────────────

def fetch_stock_info(ticker: str) -> dict | None:
    """
    종목 기본 정보 조회.
    tr_id: CTPF1604R
    """
    headers = _kis_headers("CTPF1604R")
    if not headers:
        return None
    params = {
        "PDNO":          ticker,
        "PRDT_TYPE_CD":  "300",   # 300=국내주식
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
