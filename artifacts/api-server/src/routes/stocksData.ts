export const STOCKS_DATA = [
  {
    ticker: "005930", name: "삼성전자", basePrice: 72000, sector: "반도체",
    marketCap: 4295000, high52w: 88800, low52w: 59900,
    per: 14.2, pbr: 1.35, eps: 5070, dividendYield: 2.1,
  },
  {
    ticker: "000660", name: "SK하이닉스", basePrice: 186000, sector: "반도체",
    marketCap: 1352000, high52w: 238000, low52w: 138000,
    per: 8.5, pbr: 2.1, eps: 21900, dividendYield: 0.8,
  },
  {
    ticker: "035420", name: "NAVER", basePrice: 165000, sector: "IT서비스",
    marketCap: 270000, high52w: 235000, low52w: 145000,
    per: 28.3, pbr: 1.8, eps: 5830, dividendYield: 0.5,
  },
  {
    ticker: "035720", name: "카카오", basePrice: 38500, sector: "IT서비스",
    marketCap: 171500, high52w: 62000, low52w: 33000,
    per: 42.1, pbr: 1.2, eps: 915, dividendYield: 0.3,
  },
  {
    ticker: "373220", name: "LG에너지솔루션", basePrice: 320000, sector: "배터리",
    marketCap: 749000, high52w: 420000, low52w: 285000,
    per: 52.4, pbr: 3.8, eps: 6110, dividendYield: 0.2,
  },
  {
    ticker: "005380", name: "현대차", basePrice: 195000, sector: "자동차",
    marketCap: 416500, high52w: 287000, low52w: 180000,
    per: 5.8, pbr: 0.65, eps: 33620, dividendYield: 3.2,
  },
  {
    ticker: "051910", name: "LG화학", basePrice: 295000, sector: "화학",
    marketCap: 208500, high52w: 380000, low52w: 262000,
    per: 18.2, pbr: 0.95, eps: 16210, dividendYield: 1.8,
  },
  {
    ticker: "006400", name: "삼성SDI", basePrice: 275000, sector: "배터리",
    marketCap: 189200, high52w: 380000, low52w: 230000,
    per: 22.5, pbr: 1.2, eps: 12220, dividendYield: 0.9,
  },
  {
    ticker: "207940", name: "삼성바이오로직스", basePrice: 870000, sector: "바이오",
    marketCap: 620000, high52w: 1050000, low52w: 780000,
    per: 68.5, pbr: 6.2, eps: 12700, dividendYield: 0.1,
  },
  {
    ticker: "000270", name: "기아", basePrice: 85000, sector: "자동차",
    marketCap: 345000, high52w: 120000, low52w: 72000,
    per: 4.2, pbr: 0.72, eps: 20240, dividendYield: 4.5,
  },
  {
    ticker: "066570", name: "LG전자", basePrice: 95000, sector: "전자",
    marketCap: 155000, high52w: 130000, low52w: 85000,
    per: 12.4, pbr: 0.88, eps: 7660, dividendYield: 2.3,
  },
  {
    ticker: "105560", name: "KB금융", basePrice: 68000, sector: "금융",
    marketCap: 280000, high52w: 82000, low52w: 54000,
    per: 6.2, pbr: 0.58, eps: 10970, dividendYield: 5.1,
  },
];

export const NEWS_DATA: Record<string, Array<{id: string; title: string; summary: string; source: string; publishedAt: string; url: string}>> = {
  "005930": [
    { id: "n1", title: "삼성전자, HBM4 양산 돌입 예정", summary: "삼성전자가 HBM4(High Bandwidth Memory 4) 양산을 준비 중이라고 밝혔다. AI 반도체 수요 증가에 따른 대응책으로 풀이된다.", source: "한국경제", publishedAt: new Date(Date.now() - 2 * 3600000).toISOString(), url: "#" },
    { id: "n2", title: "삼성전자 1분기 실적 전망 상향", summary: "증권가에서 삼성전자의 1분기 영업이익 전망을 기존 대비 15% 상향 조정했다. 메모리 반도체 가격 상승이 주요 요인이다.", source: "매일경제", publishedAt: new Date(Date.now() - 5 * 3600000).toISOString(), url: "#" },
    { id: "n3", title: "삼성전자, 파운드리 고객 확대 추진", summary: "삼성전자 파운드리 사업부가 북미 팹리스 기업들과 협력을 강화하고 있다. 2nm 공정 수주 경쟁이 본격화되고 있다.", source: "전자신문", publishedAt: new Date(Date.now() - 8 * 3600000).toISOString(), url: "#" },
  ],
  "000660": [
    { id: "n4", title: "SK하이닉스, AI 서버용 HBM 공급 확대", summary: "SK하이닉스가 엔비디아에 납품하는 HBM3E 물량을 대폭 늘린다. AI 붐에 따른 수혜가 기대된다.", source: "한국경제", publishedAt: new Date(Date.now() - 1 * 3600000).toISOString(), url: "#" },
    { id: "n5", title: "SK하이닉스 실적 어닝서프라이즈", summary: "SK하이닉스가 시장 전망을 크게 웃도는 분기 실적을 발표했다. HBM 제품의 높은 수익성이 이익률을 끌어올렸다.", source: "연합뉴스", publishedAt: new Date(Date.now() - 6 * 3600000).toISOString(), url: "#" },
  ],
  "035420": [
    { id: "n6", title: "네이버, 라인야후 지분 정리 가속화", summary: "네이버가 라인야후 지분 매각 협상을 진행 중이다. 일본 측 압박에 따른 불확실성 해소가 기대된다.", source: "매일경제", publishedAt: new Date(Date.now() - 3 * 3600000).toISOString(), url: "#" },
    { id: "n7", title: "네이버 클라우드, 기업 시장 공략 강화", summary: "네이버 클라우드가 B2B 시장에서 점유율을 확대하고 있다. AI 기반 기업용 솔루션을 앞세운다.", source: "전자신문", publishedAt: new Date(Date.now() - 7 * 3600000).toISOString(), url: "#" },
  ],
  "035720": [
    { id: "n8", title: "카카오, 인공지능 서비스 전면 개편", summary: "카카오가 주요 서비스에 AI를 통합하는 대규모 개편을 예고했다. 카카오T, 카카오맵 등에 AI 기능이 추가된다.", source: "아이뉴스24", publishedAt: new Date(Date.now() - 4 * 3600000).toISOString(), url: "#" },
  ],
};

const DEFAULT_NEWS = [
  { id: "dn1", title: "코스피, 기관 매수세에 소폭 반등", summary: "기관투자자의 순매수세가 유입되면서 코스피가 전 거래일 대비 소폭 올랐다.", source: "연합뉴스", publishedAt: new Date(Date.now() - 2 * 3600000).toISOString(), url: "#" },
  { id: "dn2", title: "외국인 투자자 한국 주식 연속 순매수", summary: "외국인이 최근 5거래일 연속 한국 주식을 순매수하며 시장 신뢰를 드러냈다.", source: "한국경제", publishedAt: new Date(Date.now() - 4 * 3600000).toISOString(), url: "#" },
  { id: "dn3", title: "증권가, 하반기 실적 개선 기대감 확산", summary: "증권사들이 주요 종목들의 하반기 실적 전망치를 잇따라 상향 조정하고 있다.", source: "매일경제", publishedAt: new Date(Date.now() - 6 * 3600000).toISOString(), url: "#" },
];

export function getStockByTicker(ticker: string) {
  return STOCKS_DATA.find((s) => s.ticker === ticker);
}

export function getStockName(ticker: string): string {
  return STOCKS_DATA.find((s) => s.ticker === ticker)?.name ?? ticker;
}

export function getStockPrice(
  basePrice: number,
  ticker: string
): { price: number; change: number; changePercent: number } {
  const seed = ticker.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const timeBasedFactor = Math.sin(Date.now() / 1000000 + seed) * 0.03;
  const randomFactor = (Math.random() - 0.5) * 0.005;
  const totalFactor = timeBasedFactor + randomFactor;
  const price = Math.round(basePrice * (1 + totalFactor));
  const change = price - basePrice;
  const changePercent = (change / basePrice) * 100;
  return { price, change, changePercent: Math.round(changePercent * 100) / 100 };
}

export function getVolume(ticker: string): number {
  const seed = ticker.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return Math.floor((seed * 12345) % 5000000) + 500000;
}

export function getNews(ticker: string) {
  return NEWS_DATA[ticker] ?? DEFAULT_NEWS;
}
