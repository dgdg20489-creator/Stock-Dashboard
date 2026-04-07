import { Router, type IRouter } from "express";
import { pool } from "@workspace/db";
import { ai } from "@workspace/integrations-gemini-ai";

const router: IRouter = Router();

/* ─────────────────────────────────────────────
   섹터 분류 (ticker prefix 기반 간이 분류)
───────────────────────────────────────────── */
function classifySector(ticker: string, name: string): string {
  const n = name.toLowerCase();
  if (/etf|kodex|tiger|ace|kbstar|mirae|hanaro|sol |rise |plus /.test(n)) return "ETF/펀드";
  if (/etn/.test(n)) return "ETN";
  if (/삼성전자|sk하이닉스|db하이텍|하나마이크론|리노공업|실리콘|반도체/.test(n)) return "반도체";
  if (/카카오|네이버|크래프톤|넥슨|넷마블|엔씨/.test(n)) return "IT/플랫폼";
  if (/셀트리온|한미약품|유한양행|종근당|동국제약|오스템/.test(n)) return "바이오/제약";
  if (/현대차|기아|현대모비스|만도|한온시스템/.test(n)) return "자동차";
  if (/lg에너지|에코프로|포스코퓨처|sk이노/.test(n)) return "2차전지";
  if (/posco|현대제철|고려아연|풍산/.test(n)) return "철강/소재";
  if (/sk텔레콤|kt|lg유플러스/.test(n)) return "통신";
  if (/삼성생명|삼성화재|미래에셋|kb금융|신한|하나금융/.test(n)) return "금융/보험";
  if (/삼성물산|현대건설|대우건설|gS건설/.test(n)) return "건설";
  const code = parseInt(ticker);
  if (code >= 900000) return "ETN";
  return "기타";
}

/* ─────────────────────────────────────────────
   변동성 계산 (보유 종목 최근 히스토리 기반)
───────────────────────────────────────────── */
async function calcVolatility(tickers: string[]): Promise<Record<string, number>> {
  if (tickers.length === 0) return {};
  const result = await pool.query(
    `SELECT ticker, close_price
     FROM stocks_history
     WHERE ticker = ANY($1) AND date >= NOW() - INTERVAL '30 days'
     ORDER BY ticker, date`,
    [tickers]
  );

  const grouped: Record<string, number[]> = {};
  for (const row of result.rows) {
    if (!grouped[row.ticker]) grouped[row.ticker] = [];
    grouped[row.ticker].push(Number(row.close_price));
  }

  const vol: Record<string, number> = {};
  for (const [ticker, prices] of Object.entries(grouped)) {
    if (prices.length < 2) { vol[ticker] = 0; continue; }
    const returns = prices.slice(1).map((p, i) => (p - prices[i]) / prices[i]);
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
    vol[ticker] = Math.sqrt(variance) * 100; // % 단위
  }
  return vol;
}

/* ─────────────────────────────────────────────
   위험 성향 판별 알고리즘
───────────────────────────────────────────── */
function judgeRiskProfile(
  cashPercent: number,
  etfPercent: number,
  avgVolatility: number,
  holdingCount: number
): { profile: string; label: string; reason: string } {
  const score =
    (cashPercent > 50 ? -2 : cashPercent > 30 ? -1 : 0) +
    (etfPercent > 40 ? -2 : etfPercent > 20 ? -1 : 0) +
    (avgVolatility > 3 ? 2 : avgVolatility > 1.5 ? 1 : 0) +
    (holdingCount > 10 ? -1 : holdingCount <= 2 ? 1 : 0);

  if (score >= 2) return {
    profile: "aggressive",
    label: "🔥 공격적 투자자",
    reason: "고변동성 종목 집중, 분산 부족",
  };
  if (score <= -2) return {
    profile: "defensive",
    label: "🛡️ 안정 추구형",
    reason: "현금/ETF 비중 높음, 안정 지향",
  };
  return {
    profile: "balanced",
    label: "⚖️ 균형 투자자",
    reason: "적절한 분산과 위험 배분",
  };
}

/* ─────────────────────────────────────────────
   추천 종목 풀 (안정적 대형주 + ETF)
───────────────────────────────────────────── */
const STABLE_STOCKS = [
  { ticker: "005930", name: "삼성전자",    sector: "반도체",   desc: "대한민국 대표 반도체 우량주" },
  { ticker: "000660", name: "SK하이닉스", sector: "반도체",   desc: "HBM 수혜, AI 인프라 핵심주" },
  { ticker: "069500", name: "KODEX 200",  sector: "ETF/펀드", desc: "코스피 200 추종 분산 ETF" },
  { ticker: "114800", name: "KODEX 인버스", sector: "ETF/펀드", desc: "하락장 헤지용 인버스 ETF" },
  { ticker: "122630", name: "KODEX 레버리지", sector: "ETF/펀드", desc: "상승장 레버리지 ETF" },
  { ticker: "051910", name: "LG화학",     sector: "2차전지",  desc: "배터리 소재 글로벌 리더" },
  { ticker: "035720", name: "카카오",     sector: "IT/플랫폼", desc: "국내 최대 플랫폼 기업" },
  { ticker: "207940", name: "삼성바이오로직스", sector: "바이오/제약", desc: "글로벌 바이오 CMO 1위" },
];

/* ─────────────────────────────────────────────
   POST /api/ai-advisor/analyze
   Body: { userId }
   → 포트폴리오 분석 + AI 조언 JSON 반환
───────────────────────────────────────────── */
router.post("/ai-advisor/analyze", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "userId 필요" });

    // 1. 포트폴리오 데이터 가져오기
    const userRes = await pool.query(
      "SELECT username, seed_money, cash_balance, difficulty FROM users WHERE id = $1",
      [userId]
    );
    if (userRes.rows.length === 0) return res.status(404).json({ error: "사용자 없음" });
    const user = userRes.rows[0];

    const holdingsRes = await pool.query(
      `SELECT h.ticker, h.shares, h.avg_price,
              COALESCE(sr.current_price, h.avg_price) AS current_price,
              sr.name
       FROM holdings h
       LEFT JOIN stocks_realtime sr ON sr.ticker = h.ticker
       WHERE h.user_id = $1`,
      [userId]
    );
    const holdings = holdingsRes.rows;

    const cashBalance = Number(user.cash_balance);
    const seedMoney = Number(user.seed_money);

    // 2. 평가액 계산
    let stockValue = 0;
    const holdingDetails: Array<{
      ticker: string; name: string; shares: number;
      avgPrice: number; currentPrice: number; value: number;
      sector: string; profitLossPct: number;
    }> = [];

    for (const h of holdings) {
      const shares = Number(h.shares);
      const price = Number(h.current_price);
      const avg = Number(h.avg_price);
      const value = shares * price;
      stockValue += value;
      holdingDetails.push({
        ticker: h.ticker,
        name: h.name || h.ticker,
        shares,
        avgPrice: avg,
        currentPrice: price,
        value,
        sector: h.sector || classifySector(h.ticker, h.name || ""),
        profitLossPct: avg > 0 ? ((price - avg) / avg) * 100 : 0,
      });
    }

    const totalAssets = cashBalance + stockValue;
    const totalReturn = totalAssets - seedMoney;
    const totalReturnPct = seedMoney > 0 ? (totalReturn / seedMoney) * 100 : 0;
    const cashPercent = totalAssets > 0 ? (cashBalance / totalAssets) * 100 : 100;

    // 3. 섹터 분포
    const sectorMap: Record<string, number> = {};
    let etfValue = 0;
    for (const h of holdingDetails) {
      sectorMap[h.sector] = (sectorMap[h.sector] || 0) + h.value;
      if (h.sector === "ETF/펀드" || h.sector === "ETN") etfValue += h.value;
    }
    const sectorBreakdown = Object.entries(sectorMap)
      .map(([sector, value]) => ({
        sector,
        percent: totalAssets > 0 ? (value / totalAssets) * 100 : 0,
        value,
      }))
      .sort((a, b) => b.value - a.value);

    const etfPercent = totalAssets > 0 ? (etfValue / totalAssets) * 100 : 0;

    // 4. 변동성 계산
    const volMap = await calcVolatility(holdingDetails.map((h) => h.ticker));
    const volValues = Object.values(volMap);
    const avgVolatility = volValues.length > 0
      ? volValues.reduce((a, b) => a + b, 0) / volValues.length
      : 0;

    // 5. 위험 성향 판별
    const riskProfile = judgeRiskProfile(cashPercent, etfPercent, avgVolatility, holdingDetails.length);

    // 6. Gemini AI 조언 생성
    const holdingsSummary = holdingDetails.length === 0
      ? "현재 보유 종목 없음 (전액 현금 보유)"
      : holdingDetails.map((h) =>
          `- ${h.name}(${h.ticker}): ${h.shares}주, 현재가 ${h.currentPrice.toLocaleString()}원, ` +
          `수익률 ${h.profitLossPct.toFixed(1)}%, 섹터: ${h.sector}`
        ).join("\n");

    const sectorSummary = sectorBreakdown.length === 0
      ? "없음"
      : sectorBreakdown.map((s) => `${s.sector} ${s.percent.toFixed(0)}%`).join(", ");

    const prompt = `당신은 한국 주식 투자 전문 AI 비서입니다. 아래 포트폴리오를 분석해서 맞춤형 조언을 JSON으로 반환해주세요.

## 포트폴리오 현황
- 사용자 난이도: ${user.difficulty === "beginner" ? "초보" : user.difficulty === "intermediate" ? "중수" : "고수"}
- 총 자산: ${totalAssets.toLocaleString()}원
- 현금 비중: ${cashPercent.toFixed(1)}% (${cashBalance.toLocaleString()}원)
- 주식 평가액: ${stockValue.toLocaleString()}원
- 총 수익률: ${totalReturnPct.toFixed(2)}%
- 투자 성향: ${riskProfile.label} (${riskProfile.reason})
- 섹터 분포: ${sectorSummary}
- 평균 변동성(30일): ${avgVolatility.toFixed(2)}%

## 보유 종목
${holdingsSummary}

## 지시사항
한국 주식 투자자를 위한 조언을 작성하세요. 반드시 아래 JSON 형식으로만 응답하세요 (다른 텍스트 없이):
{
  "summary": "현재 포트폴리오의 핵심 특징과 주의점 2-3문장 (친근하고 쉬운 말로)",
  "keyRisks": ["리스크 1", "리스크 2"],
  "adviceList": ["조언 1", "조언 2", "조언 3"],
  "recommendations": [
    {"ticker": "종목코드", "name": "종목명", "reason": "추천 이유 1줄"}
  ],
  "rebalanceNote": "리밸런싱 방향 한 문장"
}
추천 종목은 현재 보유하지 않은 종목 중에서 2-3개 선택하세요. 종목코드는 반드시 실제 코드로 정확히 작성하세요.`;

    let aiResponse: {
      summary: string;
      keyRisks: string[];
      adviceList: string[];
      recommendations: { ticker: string; name: string; reason: string }[];
      rebalanceNote: string;
    };

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          maxOutputTokens: 8192,
          responseMimeType: "application/json",
        },
      });

      const raw = response.text ?? "{}";
      const parsed = JSON.parse(raw.replace(/```json\n?|\n?```/g, "").trim());
      aiResponse = {
        summary: parsed.summary || "포트폴리오 분석을 완료했습니다.",
        keyRisks: Array.isArray(parsed.keyRisks) ? parsed.keyRisks : [],
        adviceList: Array.isArray(parsed.adviceList) ? parsed.adviceList : [],
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
        rebalanceNote: parsed.rebalanceNote || "",
      };
    } catch (aiErr) {
      console.error("Gemini 응답 파싱 실패:", aiErr);
      aiResponse = {
        summary: "현재 포트폴리오를 분석했습니다. 아래 지표를 참고하세요.",
        keyRisks: ["AI 분석 일시 불가"],
        adviceList: ["분산 투자를 늘려보세요", "현금 비중을 점검하세요"],
        recommendations: STABLE_STOCKS.slice(0, 2).map((s) => ({
          ticker: s.ticker,
          name: s.name,
          reason: s.desc,
        })),
        rebalanceNote: "안정적인 ETF 비중을 늘려보는 것을 권장합니다.",
      };
    }

    // 7. 보유 종목과 겹치지 않는 추천 종목 필터링
    const ownedTickers = new Set(holdingDetails.map((h) => h.ticker));
    const filteredRecs = aiResponse.recommendations.filter(
      (r) => r.ticker && !ownedTickers.has(r.ticker)
    );

    // 추천 종목 풀에서 보완
    if (filteredRecs.length < 2) {
      for (const s of STABLE_STOCKS) {
        if (!ownedTickers.has(s.ticker) && !filteredRecs.find((r) => r.ticker === s.ticker)) {
          filteredRecs.push({ ticker: s.ticker, name: s.name, reason: s.desc });
          if (filteredRecs.length >= 3) break;
        }
      }
    }

    res.json({
      riskProfile: {
        profile: riskProfile.profile,
        label: riskProfile.label,
        reason: riskProfile.reason,
      },
      stats: {
        totalAssets,
        cashBalance,
        stockValue,
        cashPercent,
        totalReturnPct,
        avgVolatility,
        etfPercent,
        holdingCount: holdingDetails.length,
      },
      sectorBreakdown,
      ai: {
        summary: aiResponse.summary,
        keyRisks: aiResponse.keyRisks,
        adviceList: aiResponse.adviceList,
        recommendations: filteredRecs.slice(0, 3),
        rebalanceNote: aiResponse.rebalanceNote,
      },
    });
  } catch (e) {
    console.error("AI advisor error:", e);
    res.status(500).json({ error: "분석 중 오류가 발생했습니다." });
  }
});

/* ─────────────────────────────────────────────
   POST /api/ai-advisor/chat
   Body: { userId, messages: [{role,content}], analysisContext? }
   → SSE 스트리밍 응답
───────────────────────────────────────────── */
router.post("/ai-advisor/chat", async (req, res) => {
  try {
    const { userId, messages, analysisContext } = req.body;
    if (!userId || !Array.isArray(messages)) {
      return res.status(400).json({ error: "userId와 messages 필요" });
    }

    // 포트폴리오 요약 (컨텍스트용)
    let portfolioContext = "";
    if (analysisContext) {
      portfolioContext = analysisContext;
    } else {
      const userRes = await pool.query(
        "SELECT username, difficulty, cash_balance, seed_money FROM users WHERE id = $1",
        [userId]
      );
      if (userRes.rows.length > 0) {
        const u = userRes.rows[0];
        const holdingsRes = await pool.query(
          `SELECT h.ticker, h.shares, h.avg_price,
                  COALESCE(sr.current_price, h.avg_price) AS current_price,
                  sr.name
           FROM holdings h
           LEFT JOIN stocks_realtime sr ON sr.ticker = h.ticker
           WHERE h.user_id = $1 LIMIT 20`,
          [userId]
        );
        const hs = holdingsRes.rows.map((h: { name: string; ticker: string; shares: number; avg_price: number; current_price: number }) =>
          `${h.name || h.ticker} ${h.shares}주`
        ).join(", ");
        portfolioContext = `사용자: ${u.username}, 난이도: ${u.difficulty}, ` +
          `현금: ${Number(u.cash_balance).toLocaleString()}원, ` +
          `보유 종목: ${hs || "없음"}`;
      }
    }

    const systemMsg = `당신은 한국 주식 투자 전문 AI 비서입니다. 사용자의 포트폴리오 정보:
${portfolioContext}

친근하고 쉬운 말로, 한국 주식 투자 관련 질문에 답변해주세요. 답변은 2-4문장으로 간결하게 작성하세요. 투자 조언 시 리스크도 함께 언급하세요.`;

    const chatMessages = [
      { role: "user" as const, parts: [{ text: systemMsg }] },
      { role: "model" as const, parts: [{ text: "알겠습니다! 포트폴리오를 파악했습니다. 궁금한 점을 질문해주세요." }] },
      ...messages.map((m: { role: string; content: string }) => ({
        role: (m.role === "assistant" ? "model" : "user") as "user" | "model",
        parts: [{ text: m.content }],
      })),
    ];

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");

    const stream = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: chatMessages,
      config: { maxOutputTokens: 8192 },
    });

    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) {
        res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
      }
    }
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (e) {
    console.error("AI chat error:", e);
    if (!res.headersSent) {
      res.status(500).json({ error: "채팅 중 오류가 발생했습니다." });
    } else {
      res.write(`data: ${JSON.stringify({ error: "오류가 발생했습니다." })}\n\n`);
      res.end();
    }
  }
});

export default router;
