export const STOCKS_DATA = [
  {
    ticker: "005930", name: "삼성전자", basePrice: 60500, sector: "반도체",
    marketCap: 3607500, high52w: 88800, low52w: 49900,
    per: 14.2, pbr: 1.35, eps: 4260, dividendYield: 2.8,
  },
  {
    ticker: "000660", name: "SK하이닉스", basePrice: 211500, sector: "반도체",
    marketCap: 1537200, high52w: 248500, low52w: 144700,
    per: 8.5, pbr: 2.1, eps: 24880, dividendYield: 0.8,
  },
  {
    ticker: "035420", name: "NAVER", basePrice: 207000, sector: "IT서비스",
    marketCap: 338100, high52w: 235500, low52w: 151100,
    per: 28.3, pbr: 1.8, eps: 7315, dividendYield: 0.5,
  },
  {
    ticker: "035720", name: "카카오", basePrice: 41900, sector: "IT서비스",
    marketCap: 186900, high52w: 55700, low52w: 32550,
    per: 42.1, pbr: 1.2, eps: 995, dividendYield: 0.3,
  },
  {
    ticker: "373220", name: "LG에너지솔루션", basePrice: 331500, sector: "배터리",
    marketCap: 776500, high52w: 444000, low52w: 311000,
    per: 52.4, pbr: 3.8, eps: 6330, dividendYield: 0.2,
  },
  {
    ticker: "005380", name: "현대차", basePrice: 213000, sector: "자동차",
    marketCap: 454700, high52w: 299500, low52w: 189200,
    per: 5.8, pbr: 0.65, eps: 36720, dividendYield: 3.2,
  },
  {
    ticker: "051910", name: "LG화학", basePrice: 264500, sector: "화학",
    marketCap: 186800, high52w: 466000, low52w: 208000,
    per: 18.2, pbr: 0.95, eps: 14530, dividendYield: 1.8,
  },
  {
    ticker: "006400", name: "삼성SDI", basePrice: 197275, sector: "배터리",
    marketCap: 135500, high52w: 484131, low52w: 182882,
    per: 22.5, pbr: 1.2, eps: 8768, dividendYield: 0.9,
  },
  {
    ticker: "207940", name: "삼성바이오로직스", basePrice: 1586540, sector: "바이오",
    marketCap: 1130800, high52w: 1779339, low52w: 1061127,
    per: 68.5, pbr: 6.2, eps: 23164, dividendYield: 0.1,
  },
  {
    ticker: "000270", name: "기아", basePrice: 98700, sector: "자동차",
    marketCap: 402800, high52w: 135000, low52w: 89500,
    per: 4.2, pbr: 0.72, eps: 23500, dividendYield: 4.5,
  },
  {
    ticker: "066570", name: "LG전자", basePrice: 81800, sector: "전자",
    marketCap: 133700, high52w: 115400, low52w: 75600,
    per: 12.4, pbr: 0.88, eps: 6600, dividendYield: 2.3,
  },
  {
    ticker: "105560", name: "KB금융", basePrice: 81800, sector: "금융",
    marketCap: 336700, high52w: 103900, low52w: 62000,
    per: 6.2, pbr: 0.58, eps: 13200, dividendYield: 5.1,
  },
  {
    ticker: "096770", name: "SK이노베이션", basePrice: 125500, sector: "에너지",
    marketCap: 110400, high52w: 140200, low52w: 91700,
    per: 15.3, pbr: 0.72, eps: 8200, dividendYield: 1.5,
  },
  {
    ticker: "003550", name: "LG", basePrice: 69700, sector: "지주",
    marketCap: 121500, high52w: 91400, low52w: 66000,
    per: 9.1, pbr: 0.55, eps: 7660, dividendYield: 3.8,
  },
  {
    ticker: "086790", name: "하나금융지주", basePrice: 62500, sector: "금융",
    marketCap: 186200, high52w: 69300, low52w: 51600,
    per: 5.5, pbr: 0.52, eps: 11360, dividendYield: 5.8,
  },
  {
    ticker: "055550", name: "신한지주", basePrice: 48600, sector: "금융",
    marketCap: 247000, high52w: 64600, low52w: 40450,
    per: 5.2, pbr: 0.50, eps: 9350, dividendYield: 5.5,
  },
  {
    ticker: "012330", name: "현대모비스", basePrice: 279500, sector: "자동차부품",
    marketCap: 271700, high52w: 281000, low52w: 200500,
    per: 7.8, pbr: 0.68, eps: 35840, dividendYield: 2.1,
  },
  {
    ticker: "030200", name: "KT", basePrice: 49600, sector: "통신",
    marketCap: 130100, high52w: 51500, low52w: 33000,
    per: 8.9, pbr: 0.62, eps: 5573, dividendYield: 4.2,
  },
  {
    ticker: "028260", name: "삼성물산", basePrice: 124000, sector: "건설/무역",
    marketCap: 225500, high52w: 161300, low52w: 112400,
    per: 11.2, pbr: 0.79, eps: 11071, dividendYield: 2.0,
  },
  {
    ticker: "032830", name: "삼성생명", basePrice: 85000, sector: "보험",
    marketCap: 404600, high52w: 111000, low52w: 76600,
    per: 8.3, pbr: 0.55, eps: 10240, dividendYield: 3.5,
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
    { id: "n9", title: "카카오, 3분기 연속 영업익 흑자 달성", summary: "카카오가 비용 구조 효율화 후 3분기 연속 영업이익 흑자를 달성했다. AI 광고 매출 증가가 기여했다.", source: "연합뉴스", publishedAt: new Date(Date.now() - 10 * 3600000).toISOString(), url: "#" },
  ],
  "373220": [
    { id: "n10", title: "LG에너지솔루션, 북미 배터리 공장 가동률 상향", summary: "LG에너지솔루션 미국 오하이오 배터리 공장이 목표 가동률을 달성했다. GM과의 합작 공장 확장도 예정됐다.", source: "한국경제", publishedAt: new Date(Date.now() - 2 * 3600000).toISOString(), url: "#" },
  ],
  "005380": [
    { id: "n11", title: "현대차, 글로벌 전기차 판매 20% 증가", summary: "현대차그룹이 1분기 글로벌 전기차 판매량 20% 증가를 기록했다. 아이오닉 6·9가 유럽과 북미에서 인기를 끌고 있다.", source: "매일경제", publishedAt: new Date(Date.now() - 3 * 3600000).toISOString(), url: "#" },
  ],
  "096770": [
    { id: "n12", title: "SK이노베이션, 배터리 사업 분사 일정 확정", summary: "SK이노베이션이 배터리 사업부 SK온의 상장 일정을 2025년 말로 잠정 확정했다.", source: "한국경제", publishedAt: new Date(Date.now() - 5 * 3600000).toISOString(), url: "#" },
  ],
  "105560": [
    { id: "n13", title: "KB금융, 역대 최고 배당금 발표", summary: "KB금융그룹이 주주환원 강화 정책의 일환으로 역대 최고 수준의 배당금을 발표했다.", source: "연합뉴스", publishedAt: new Date(Date.now() - 4 * 3600000).toISOString(), url: "#" },
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
  const timeBasedFactor = Math.sin(Date.now() / 300000 + seed * 0.17) * 0.02;
  const driftFactor = Math.sin(Date.now() / 10800000 + seed * 0.41) * 0.015;
  const randomFactor = (Math.random() - 0.5) * 0.006;
  const totalFactor = timeBasedFactor + driftFactor + randomFactor;
  const price = Math.round(basePrice * (1 + totalFactor));
  const change = price - basePrice;
  const changePercent = (change / basePrice) * 100;
  return { price, change, changePercent: Math.round(changePercent * 100) / 100 };
}

export function getVolume(ticker: string): number {
  const seed = ticker.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const timeSeed = Math.floor(Date.now() / 10000);
  return Math.floor(((seed * 9876 + timeSeed) % 8_000_000) + 200_000);
}

export function getNews(ticker: string) {
  return NEWS_DATA[ticker] ?? DEFAULT_NEWS;
}
