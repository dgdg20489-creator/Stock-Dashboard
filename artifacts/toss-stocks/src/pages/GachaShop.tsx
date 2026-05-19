import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, Sparkles, Star, FlaskConical, History } from "lucide-react";
import { useMissions } from "@/hooks/use-missions";
import { cn } from "@/lib/utils";

const PULL_COST = 10;
const PULL_COUNT = 10;
const SSR_RATE = 0.05; // 5%

// ─── SSR 카드 풀 ───────────────────────────────────────────────
const SSR_POOL = [
  {
    id: "defensive_ssr_chibi",
    name: "Analyst · 치비",
    image: "/card_ssr_chibi.png",
    line1: "분석은 재미있어!",
    line2: "세상을 이해하는 방법이거든!",
  },
  {
    id: "defensive_ssr_concert",
    name: "Analyst · 콘서트",
    image: "/card_ssr_concert.png",
    line1: "우리의 데이터는 반짝이는 가능성이야.",
    line2: "지금, 함께 성장하자!",
  },
  {
    id: "defensive_ssr_surfer",
    name: "Analyst · 서퍼",
    image: "/card_ssr_surfer.png",
    line1: "끝없이 펼쳐진 수평선처럼,",
    line2: "우리의 가능성도 무한해!",
  },
  {
    id: "defensive_ssr_magical",
    name: "Analyst · 매지컬",
    image: "/card_ssr_magical.png",
    line1: "데이터도, 미래도, 내 손안에 있어!",
    line2: "함께라면 뭐든지 가능해!",
  },
  {
    id: "defensive_ssr_gamer",
    name: "Analyst · 게이머",
    image: "/card_ssr_gamer.png",
    line1: "게임은 전략이야.",
    line2: "승리도, 성장도 계획이 필요하지!",
  },
  {
    id: "defensive_ssr_mystic",
    name: "Analyst · 미스틱",
    image: "/card_ssr_mystic.png",
    line1: "진실은 언제나 데이터 속에 숨어 있어.",
    line2: "내가 찾아낼 뿐이지.",
  },
] as const;

type SsrCard = typeof SSR_POOL[number];

// ─── 로컬스토리지 헬퍼 ────────────────────────────────────────
function getUid() { return localStorage.getItem("toss_userId") ?? "guest"; }
function collectedKey() { return `wonkwang_gacha_collected_${getUid()}`; }
function historyKey() { return `wonkwang_gacha_history_${getUid()}`; }
function loadCollected(): string[] {
  try { return JSON.parse(localStorage.getItem(collectedKey()) ?? "[]"); } catch { return []; }
}
function saveCollected(items: string[]) { localStorage.setItem(collectedKey(), JSON.stringify(items)); }

type HistoryEntry = { timestamp: number; ssrCards: string[] };
function loadHistory(): HistoryEntry[] {
  try { return JSON.parse(localStorage.getItem(historyKey()) ?? "[]"); } catch { return []; }
}
function saveHistory(h: HistoryEntry[]) { localStorage.setItem(historyKey(), JSON.stringify(h.slice(-50))); }

// ─── 뽑기 생성 (5% SSR) ──────────────────────────────────────
type PullResult = { idx: number; type: "ssr" | "miss"; card?: SsrCard };
function generatePull(): PullResult[] {
  return Array.from({ length: PULL_COUNT }, (_, i) => {
    if (Math.random() < SSR_RATE) {
      const card = SSR_POOL[Math.floor(Math.random() * SSR_POOL.length)];
      return { idx: i, type: "ssr" as const, card };
    }
    return { idx: i, type: "miss" as const };
  });
}

function formatAgo(ts: number) {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}초 전`;
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
}

interface GachaShopProps { userId: number; }

export default function GachaShop({ userId: _userId }: GachaShopProps) {
  const { coins, deductCoins, addCoins } = useMissions();
  const [collected, setCollected] = useState<string[]>(loadCollected);
  const [history, setHistory] = useState<HistoryEntry[]>(loadHistory);

  const [results, setResults] = useState<PullResult[] | null>(null);
  const [revealed, setRevealed] = useState<boolean[]>([]);
  const [pulling, setPulling] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // 시네마틱
  const [cinematicCard, setCinematicCard] = useState<SsrCard | null>(null);

  const totalPulls = history.length * PULL_COUNT;
  const totalSsr = history.reduce((acc, h) => acc + h.ssrCards.length, 0);

  const handlePull = () => {
    if (coins < PULL_COST || pulling) return;
    if (!deductCoins(PULL_COST)) return;
    const pull = generatePull();
    setResults(pull);
    setRevealed(new Array(PULL_COUNT).fill(false));
    setCinematicCard(null);
    setShowModal(true);
    setPulling(true);

    pull.forEach((_, i) => {
      setTimeout(() => {
        setRevealed(prev => { const n = [...prev]; n[i] = true; return n; });
        if (i === PULL_COUNT - 1) {
          setPulling(false);
          const ssrCards = pull.filter(r => r.type === "ssr" && r.card).map(r => r.card!.id);
          const entry: HistoryEntry = { timestamp: Date.now(), ssrCards };
          const next = [entry, ...history];
          setHistory(next);
          saveHistory(next);
          // 새로 획득한 카드 저장
          const newCollected = [...collected];
          ssrCards.forEach(id => { if (!newCollected.includes(id)) newCollected.push(id); });
          if (newCollected.length !== collected.length) {
            setCollected(newCollected);
            saveCollected(newCollected);
          }
        }
      }, i * 220 + 200);
    });
  };

  const handleSsrCardClick = (card: SsrCard) => {
    setCinematicCard(card);
  };

  const allRevealed = revealed.length > 0 && revealed.every(Boolean);
  const hasSsr = results?.some(r => r.type === "ssr") ?? false;

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-4">
      <div className="text-center mb-1">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">✨ 뽑기 상점</h1>
        <p className="text-sm text-muted-foreground mt-0.5">투자 성향 캐릭터 카드를 모아보세요</p>
      </div>

      <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
        <div className="flex items-center gap-2">
          <Coins className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <span className="font-bold text-amber-700">{coins} 코인 보유</span>
        </div>
        <button
          onClick={() => addCoins(10)}
          className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-amber-200 hover:bg-amber-300 rounded-lg text-amber-800 font-bold transition-colors"
        >
          <FlaskConical className="w-3.5 h-3.5" />
          테스트 +10
        </button>
      </div>

      <button
        onClick={handlePull}
        disabled={coins < PULL_COST || pulling}
        className={cn(
          "w-full py-4 rounded-2xl font-extrabold text-base flex items-center justify-center gap-2 transition-all",
          coins >= PULL_COST && !pulling
            ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:opacity-90 active:scale-[0.98] shadow-lg shadow-violet-200"
            : "bg-muted text-muted-foreground cursor-not-allowed"
        )}
      >
        <Sparkles className="w-5 h-5" />
        10연차 뽑기
        <span className="ml-1 opacity-80 text-sm font-semibold">({PULL_COST}코인)</span>
      </button>

      {coins < PULL_COST && (
        <p className="text-center text-xs text-muted-foreground -mt-2">
          코인이 부족합니다. 일일 미션을 완료해 코인을 모아보세요!
        </p>
      )}

      <div className="bg-muted/40 rounded-2xl p-3 border border-border/40">
        <div className="flex items-center gap-1.5 mb-2">
          <Star className="w-4 h-4 text-yellow-500" />
          <span className="text-sm font-bold">뽑기 확률</span>
          <span className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-yellow-100 text-yellow-700">안정형 SSR 6종</span>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="font-semibold text-yellow-600">🌟 SSR — 안정형 Analyst 6종 중 랜덤</span>
            <span className="font-bold text-yellow-700">5%</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>꽝 (일반)</span>
            <span>95%</span>
          </div>
        </div>
        {/* 카드 미리보기 */}
        <div className="flex gap-1.5 mt-2.5 overflow-x-auto pb-1">
          {SSR_POOL.map(card => (
            <div key={card.id} className="flex-shrink-0 w-9 h-[54px] rounded-lg overflow-hidden border border-yellow-400/40">
              <img src={card.image} alt={card.name} className="w-full h-full object-cover object-top" />
            </div>
          ))}
        </div>
      </div>

      {/* 뽑기 기록 */}
      <div className="bg-card rounded-3xl p-4 border border-border/50">
        <div className="flex items-center gap-2 mb-3">
          <History className="w-5 h-5 text-primary" />
          <h3 className="font-extrabold text-foreground">내 뽑기 기록</h3>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-muted/50 rounded-2xl p-3 text-center">
            <p className="text-2xl font-extrabold text-foreground">{history.length}</p>
            <p className="text-[11px] text-muted-foreground font-semibold mt-0.5">총 뽑기 횟수</p>
          </div>
          <div className="bg-muted/50 rounded-2xl p-3 text-center">
            <p className="text-2xl font-extrabold text-foreground">{totalPulls}</p>
            <p className="text-[11px] text-muted-foreground font-semibold mt-0.5">총 소환 수</p>
          </div>
          <div className="bg-amber-50 rounded-2xl p-3 text-center border border-amber-100">
            <p className="text-2xl font-extrabold text-amber-600">{totalSsr}</p>
            <p className="text-[11px] text-amber-600/70 font-semibold mt-0.5">SSR 획득</p>
          </div>
        </div>
        {history.length === 0 ? (
          <div className="h-20 flex flex-col items-center justify-center gap-1 bg-muted/30 rounded-2xl">
            <div className="text-2xl opacity-30">🎰</div>
            <p className="text-xs text-muted-foreground">아직 뽑기 기록이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
            {history.slice(0, 20).map((entry, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2.5 bg-muted/30 rounded-xl">
                <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-sm", entry.ssrCards.length > 0 ? "bg-yellow-100" : "bg-muted")}>
                  {entry.ssrCards.length > 0 ? "✨" : "🎴"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-xs font-bold leading-tight", entry.ssrCards.length > 0 ? "text-amber-700" : "text-foreground")}>
                    {entry.ssrCards.length > 0
                      ? `SSR ${entry.ssrCards.length}장 · ${entry.ssrCards.map(id => SSR_POOL.find(c => c.id === id)?.name ?? id).join(", ")}`
                      : "10연차 (꽝)"}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">10소환 · {formatAgo(entry.timestamp)}</p>
                </div>
                {entry.ssrCards.length > 0 && <span className="text-[10px] font-extrabold px-1.5 py-0.5 bg-yellow-400 text-yellow-900 rounded-md flex-shrink-0">SSR</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══ 뽑기 결과 모달 ═══ */}
      <AnimatePresence>
        {showModal && results && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="w-full max-w-sm"
            >
              <h2 className="text-white font-extrabold text-xl text-center mb-4">🎰 10연차 결과</h2>

              <div className="grid grid-cols-5 gap-2 mb-5">
                {results.map((result, i) => (
                  <div key={result.idx} className="relative aspect-[2/3]">
                    <AnimatePresence mode="wait">
                      {!revealed[i] ? (
                        <motion.div
                          key="back"
                          exit={{ rotateY: 90, opacity: 0 }}
                          transition={{ duration: 0.18 }}
                          className="absolute inset-0 rounded-xl bg-gradient-to-br from-violet-800 to-purple-900 flex items-center justify-center border border-violet-600/40"
                        >
                          <span className="text-white/50 text-base font-bold">?</span>
                        </motion.div>
                      ) : result.type === "ssr" && result.card ? (
                        /* ── 황금 SSR 카드 ── */
                        <motion.div
                          key="ssr"
                          initial={{ rotateY: -90, scale: 0.7 }}
                          animate={{ rotateY: 0, scale: 1 }}
                          transition={{ type: "spring", bounce: 0.45, duration: 0.5 }}
                          onClick={() => handleSsrCardClick(result.card!)}
                          className="absolute inset-0 rounded-xl overflow-hidden cursor-pointer"
                          style={{
                            background: "linear-gradient(135deg, #6b4c00, #FFD700, #b8830a, #FFD700, #6b4c00)",
                            boxShadow: "0 0 18px 5px #FFD70088, 0 0 6px 2px #FFD700",
                          }}
                        >
                          <motion.div
                            className="absolute inset-0"
                            style={{ background: "linear-gradient(110deg, transparent 30%, rgba(255,255,200,0.55) 50%, transparent 70%)" }}
                            animate={{ x: ["-100%", "200%"] }}
                            transition={{ duration: 1.1, repeat: Infinity, repeatDelay: 0.7 }}
                          />
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                            <motion.span animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }} transition={{ duration: 1.5, repeat: Infinity }} className="text-lg">✦</motion.span>
                            <p className="text-[8px] font-extrabold text-yellow-900/80 tracking-widest">SSR</p>
                            <motion.span animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }} className="text-lg">✦</motion.span>
                          </div>
                          <motion.div
                            animate={{ opacity: [0, 0.7, 0] }}
                            transition={{ duration: 1.1, repeat: Infinity, repeatDelay: 0.4 }}
                            className="absolute bottom-1 left-0 right-0 text-center"
                          >
                            <span className="text-[7px] font-bold text-yellow-900/60">TAP</span>
                          </motion.div>
                        </motion.div>
                      ) : (
                        /* ── 꽝 ── */
                        <motion.div
                          key="miss"
                          initial={{ rotateY: -90, scale: 0.8 }}
                          animate={{ rotateY: 0, scale: 1 }}
                          transition={{ type: "spring", bounce: 0.3, duration: 0.4 }}
                          className="absolute inset-0 rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center border border-gray-600/30"
                        >
                          <span className="text-gray-400 font-bold text-xs">꽝</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>

              {allRevealed && hasSsr && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-yellow-400 text-xs font-bold mb-3">
                  ✨ 황금 카드를 탭해서 확인하세요!
                </motion.p>
              )}

              {allRevealed && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  onClick={() => { setShowModal(false); setResults(null); setRevealed([]); }}
                  className="w-full bg-white/10 hover:bg-white/20 text-white font-extrabold py-3 rounded-2xl transition-colors border border-white/20"
                >
                  닫기
                </motion.button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ SSR 시네마틱 ═══ */}
      <AnimatePresence>
        {cinematicCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="fixed inset-0 z-[60] flex items-center justify-center cursor-pointer overflow-hidden"
            style={{ background: "#000" }}
            onClick={() => setCinematicCard(null)}
          >
            {/* 빛줄기 */}
            <div className="absolute inset-0 pointer-events-none">
              {Array.from({ length: 14 }).map((_, i) => (
                <motion.div key={i} className="absolute"
                  style={{ left: "50%", top: "50%", width: 2, height: "70vh", background: "linear-gradient(to bottom, #FFD70077, transparent)", transformOrigin: "top center", rotate: `${i * (360 / 14)}deg`, translateX: "-50%", translateY: "-5%" }}
                  initial={{ opacity: 0, scaleY: 0 }}
                  animate={{ opacity: [0, 0.7, 0.35], scaleY: 1 }}
                  transition={{ delay: 0.15 + i * 0.03, duration: 0.7 }}
                />
              ))}
            </div>

            {/* 파티클 */}
            {Array.from({ length: 22 }).map((_, i) => (
              <motion.div key={`p${i}`} className="absolute rounded-full pointer-events-none"
                style={{ width: Math.random() * 5 + 3, height: Math.random() * 5 + 3, background: i % 3 === 0 ? "#FFD700" : i % 3 === 1 ? "#FFF8B0" : "#FFAA00", left: `${15 + Math.random() * 70}%`, top: `${10 + Math.random() * 80}%` }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 1, 0], scale: [0, 1.4, 0], y: [0, -(40 + Math.random() * 60)] }}
                transition={{ delay: 0.2 + Math.random() * 0.8, duration: 1 + Math.random() * 0.8, repeat: Infinity, repeatDelay: Math.random() * 1.2 }}
              />
            ))}

            {/* 레이아웃: 왼쪽 대사 / 오른쪽 카드 */}
            <div className="relative z-10 flex items-center justify-center gap-5 px-6 w-full max-w-sm">
              {/* 왼쪽 대사 */}
              <div className="flex-1 min-w-0">
                <motion.p initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
                  className="text-yellow-400/60 text-[10px] font-bold tracking-widest uppercase mb-3">SSR CARD</motion.p>

                <motion.p initial={{ opacity: 0, x: -22 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
                  style={{ fontSize: "1.05rem", fontWeight: 900, color: "#FFD700", textShadow: "0 0 18px #FFD700, 0 0 36px #FFD70066", lineHeight: 1.5 }}>
                  {cinematicCard.line1}
                </motion.p>

                <motion.p initial={{ opacity: 0, x: -22 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.75 }}
                  style={{ fontSize: "1.05rem", fontWeight: 900, color: "#FFD700", textShadow: "0 0 18px #FFD700, 0 0 36px #FFD70066", lineHeight: 1.5 }}>
                  {cinematicCard.line2}
                </motion.p>

                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }}
                  className="text-yellow-200/45 text-[11px] font-semibold mt-3">
                  — {cinematicCard.name}
                </motion.p>

                <motion.p
                  animate={{ opacity: [0, 0.5, 0.15, 0.5] }}
                  transition={{ delay: 2.2, duration: 1.3, repeat: Infinity, repeatType: "reverse" }}
                  className="text-white/25 text-[10px] font-medium mt-7">
                  탭하여 닫기
                </motion.p>
              </div>

              {/* 오른쪽 카드 */}
              <div className="flex-shrink-0 relative" style={{ width: 136 }}>
                <motion.div className="absolute -inset-4 rounded-2xl"
                  animate={{ boxShadow: ["0 0 24px 10px #FFD70044", "0 0 48px 20px #FFD70099", "0 0 24px 10px #FFD70044"] }}
                  transition={{ duration: 1.6, repeat: Infinity }} />

                <motion.div
                  initial={{ scale: 0.3, opacity: 0, y: 30, rotate: 8 }}
                  animate={{ scale: 1, opacity: 1, y: 0, rotate: 0 }}
                  transition={{ delay: 0.25, duration: 0.65, type: "spring", bounce: 0.38 }}
                  className="relative"
                >
                  <img src={cinematicCard.image} alt={cinematicCard.name} className="w-full rounded-xl"
                    style={{ boxShadow: "0 6px 28px rgba(255,215,0,0.45)" }} />

                  {/* shimmer */}
                  <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
                    <motion.div className="absolute inset-0"
                      style={{ background: "linear-gradient(108deg, transparent 30%, rgba(255,245,150,0.5) 50%, transparent 70%)" }}
                      animate={{ x: ["-110%", "210%"] }}
                      transition={{ delay: 0.7, duration: 1, repeat: Infinity, repeatDelay: 1.3 }} />
                  </div>

                  {/* 등장 플래시 */}
                  <motion.div initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ delay: 0.25, duration: 0.4 }}
                    className="absolute inset-0 bg-white rounded-xl pointer-events-none" />

                  {/* SSR 뱃지 */}
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.85, type: "spring", bounce: 0.6 }}
                    className="absolute -top-2 -right-2 z-20 bg-yellow-400 text-yellow-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full"
                    style={{ boxShadow: "0 0 10px #FFD700" }}>
                    SSR
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
