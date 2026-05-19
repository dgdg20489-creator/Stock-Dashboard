import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, Sparkles, Star, FlaskConical, History } from "lucide-react";
import { useMissions } from "@/hooks/use-missions";
import { cn } from "@/lib/utils";
import cardSsrUrl from "/card_defensive_ssr.png";

const PULL_COST = 10;
const PULL_COUNT = 10;

// SSR 등장 시 무작위로 표시할 캐릭터 대사
const SSR_QUOTES = [
  { line1: "파도가 높을수록,", line2: "더 높이 날아오른다.", name: "서퍼 Analyst" },
  { line1: "시장을 지배하는 자,", line2: "이제 그 카드를 쥐어라.", name: "서퍼 Analyst" },
  { line1: "냉정한 판단이", line2: "최고의 무기다.", name: "서퍼 Analyst" },
  { line1: "기회는 준비된 자에게만", line2: "찾아온다.", name: "서퍼 Analyst" },
  { line1: "숫자 뒤에 숨겨진 진실,", line2: "내가 꿰뚫어 본다.", name: "서퍼 Analyst" },
  { line1: "폭풍 속에서도", line2: "나침반은 흔들리지 않는다.", name: "서퍼 Analyst" },
];

function getUid() { return localStorage.getItem("toss_userId") ?? "guest"; }
function collectedKey() { return `wonkwang_gacha_collected_${getUid()}`; }
function historyKey() { return `wonkwang_gacha_history_${getUid()}`; }
function loadCollected(): string[] {
  try { return JSON.parse(localStorage.getItem(collectedKey()) ?? "[]"); } catch { return []; }
}
function saveCollected(items: string[]) { localStorage.setItem(collectedKey(), JSON.stringify(items)); }

type HistoryEntry = { timestamp: number; hasSsr: boolean; ssrName?: string };
function loadHistory(): HistoryEntry[] {
  try { return JSON.parse(localStorage.getItem(historyKey()) ?? "[]"); } catch { return []; }
}
function saveHistory(h: HistoryEntry[]) { localStorage.setItem(historyKey(), JSON.stringify(h.slice(-50))); }

type PullResult = { idx: number; type: "ssr" | "miss" };
function generatePull(): PullResult[] {
  const results: PullResult[] = Array.from({ length: PULL_COUNT }, (_, i) => ({ idx: i, type: "miss" }));
  const ssrPos = Math.floor(Math.random() * PULL_COUNT);
  results[ssrPos] = { idx: ssrPos, type: "ssr" };
  return results;
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
  const [ssrCinematic, setSsrCinematic] = useState(false);
  const [currentQuote, setCurrentQuote] = useState(SSR_QUOTES[0]);
  const [cinematicReady, setCinematicReady] = useState(false);
  const shimmerRef = useRef<HTMLDivElement>(null);

  const totalPulls = history.length * PULL_COUNT;
  const totalSsr = history.filter(h => h.hasSsr).length;

  const handlePull = () => {
    if (coins < PULL_COST || pulling) return;
    if (!deductCoins(PULL_COST)) return;
    const pull = generatePull();
    setResults(pull);
    setRevealed(new Array(PULL_COUNT).fill(false));
    setSsrCinematic(false);
    setCinematicReady(false);
    setShowModal(true);
    setPulling(true);

    pull.forEach((r, i) => {
      setTimeout(() => {
        setRevealed(prev => { const n = [...prev]; n[i] = true; return n; });
        if (i === PULL_COUNT - 1) {
          setPulling(false);
          const gotSsr = pull.some(r => r.type === "ssr");
          const newEntry: HistoryEntry = { timestamp: Date.now(), hasSsr: gotSsr, ssrName: gotSsr ? "서퍼 Analyst" : undefined };
          const nextHistory = [newEntry, ...history];
          setHistory(nextHistory);
          saveHistory(nextHistory);
          if (gotSsr) {
            if (!collected.includes("defensive_ssr")) {
              const next = [...collected, "defensive_ssr"];
              setCollected(next);
              saveCollected(next);
            }
            // SSR 연출 시작
            const q = SSR_QUOTES[Math.floor(Math.random() * SSR_QUOTES.length)];
            setCurrentQuote(q);
            setTimeout(() => setSsrCinematic(true), 600);
          }
        }
      }, i * 280 + 300);
    });
  };

  const closeCinematic = () => {
    setSsrCinematic(false);
    setCinematicReady(false);
  };
  const closeModal = () => {
    setShowModal(false);
    setResults(null);
    setRevealed([]);
  };
  const allRevealed = revealed.length > 0 && revealed.every(Boolean);

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
        <div className="flex items-center gap-1.5 mb-1.5">
          <Star className="w-4 h-4 text-yellow-500" />
          <span className="text-sm font-bold">뽑기 확률</span>
          <span className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-yellow-100 text-yellow-700">테스트 모드</span>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="font-semibold text-yellow-600">🌟 SSR — 안정형 서퍼 Analyst</span>
            <span className="font-bold text-yellow-700">10연차 1회 보장</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>꽝 (일반)</span>
            <span>나머지 9회</span>
          </div>
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
                <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-sm", entry.hasSsr ? "bg-yellow-100" : "bg-muted")}>
                  {entry.hasSsr ? "✨" : "🎴"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-xs font-bold leading-tight", entry.hasSsr ? "text-amber-700" : "text-foreground")}>
                    {entry.hasSsr ? `SSR 획득 · ${entry.ssrName}` : "10연차 (꽝)"}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">10소환 · {formatAgo(entry.timestamp)}</p>
                </div>
                {entry.hasSsr && <span className="text-[10px] font-extrabold px-1.5 py-0.5 bg-yellow-400 text-yellow-900 rounded-md flex-shrink-0">SSR</span>}
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
            className="fixed inset-0 z-50 bg-black/88 flex flex-col items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="w-full max-w-sm"
            >
              <h2 className="text-white font-extrabold text-xl text-center mb-4">🎰 10연차 결과</h2>
              <div className="grid grid-cols-5 gap-2 mb-4">
                {results.map((result, i) => (
                  <div key={result.idx} className="relative aspect-[2/3]">
                    <AnimatePresence mode="wait">
                      {!revealed[i] ? (
                        <motion.div
                          key="back"
                          initial={{ opacity: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.15 }}
                          className="absolute inset-0 rounded-xl bg-gradient-to-br from-violet-800 to-purple-900 flex items-center justify-center border border-violet-600/50"
                        >
                          <span className="text-white text-lg font-bold opacity-60">?</span>
                        </motion.div>
                      ) : result.type === "ssr" ? (
                        <motion.div
                          key="ssr"
                          initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
                          animate={{ scale: 1, opacity: 1, rotate: 0 }}
                          transition={{ type: "spring", bounce: 0.5 }}
                          className="absolute inset-0 rounded-xl overflow-hidden"
                          style={{ boxShadow: "0 0 20px 6px #FFD70099, 0 0 40px 12px #FFD70044" }}
                        >
                          <img src={cardSsrUrl} alt="SSR" className="w-full h-full object-cover" />
                          <div className="absolute top-0.5 right-0.5 bg-yellow-400 text-yellow-900 text-[7px] font-extrabold px-1 py-0.5 rounded leading-none">SSR</div>
                          <motion.div
                            initial={{ opacity: 0.9 }}
                            animate={{ opacity: 0 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            className="absolute inset-0 bg-white"
                          />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="miss"
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.2 }}
                          className="absolute inset-0 rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center border border-gray-600/30"
                        >
                          <span className="text-gray-400 font-bold text-sm">꽝</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
              {allRevealed && !ssrCinematic && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  onClick={closeModal}
                  className="w-full bg-white text-gray-900 font-extrabold py-3 rounded-2xl hover:bg-gray-100 transition-colors"
                >
                  확인
                </motion.button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ SSR 시네마틱 연출 ═══ */}
      <AnimatePresence>
        {ssrCinematic && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[60] flex items-center justify-center cursor-pointer overflow-hidden"
            style={{ background: "#000" }}
            onClick={closeCinematic}
          >
            {/* 황금 빛줄기 배경 */}
            <div className="absolute inset-0 pointer-events-none">
              {Array.from({ length: 12 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute"
                  style={{
                    left: "50%",
                    top: "50%",
                    width: 2,
                    height: "65vh",
                    background: "linear-gradient(to bottom, #FFD70099, transparent)",
                    transformOrigin: "top center",
                    rotate: `${i * 30}deg`,
                    translateX: "-50%",
                    translateY: "-10%",
                  }}
                  initial={{ opacity: 0, scaleY: 0 }}
                  animate={{ opacity: [0, 0.6, 0.3], scaleY: 1 }}
                  transition={{ delay: 0.3 + i * 0.04, duration: 0.8 }}
                />
              ))}
            </div>

            {/* 파티클 */}
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={`p${i}`}
                className="absolute rounded-full pointer-events-none"
                style={{
                  width: Math.random() * 6 + 3,
                  height: Math.random() * 6 + 3,
                  background: i % 3 === 0 ? "#FFD700" : i % 3 === 1 ? "#FFF5B0" : "#FFAA00",
                  left: `${20 + Math.random() * 60}%`,
                  top: `${10 + Math.random() * 80}%`,
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1.5, 0],
                  y: [0, -(Math.random() * 60 + 20)],
                }}
                transition={{
                  delay: 0.4 + Math.random() * 0.8,
                  duration: 1.2 + Math.random() * 0.8,
                  repeat: Infinity,
                  repeatDelay: Math.random() * 1,
                }}
              />
            ))}

            {/* 레이아웃: 왼쪽 대사 / 오른쪽 카드 */}
            <div className="relative z-10 flex items-center justify-center gap-6 px-8 w-full max-w-sm">
              {/* 왼쪽: 캐릭터 대사 */}
              <div className="flex-1 min-w-0">
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                >
                  <p className="text-yellow-400/60 text-[10px] font-bold tracking-widest uppercase mb-2">SSR CARD</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7, duration: 0.5 }}
                >
                  <p
                    className="font-extrabold leading-snug mb-1"
                    style={{
                      fontSize: "1.15rem",
                      color: "#FFD700",
                      textShadow: "0 0 20px #FFD700, 0 0 40px #FFD70066",
                    }}
                  >
                    {currentQuote.line1}
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.95, duration: 0.5 }}
                >
                  <p
                    className="font-extrabold leading-snug"
                    style={{
                      fontSize: "1.15rem",
                      color: "#FFD700",
                      textShadow: "0 0 20px #FFD700, 0 0 40px #FFD70066",
                    }}
                  >
                    {currentQuote.line2}
                  </p>
                </motion.div>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.4 }}
                  className="text-yellow-200/50 text-[11px] font-semibold mt-3"
                >
                  — {currentQuote.name}
                </motion.p>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.6, 0.3, 0.6] }}
                  transition={{ delay: 2.2, duration: 1, repeat: Infinity, repeatType: "reverse" }}
                  className="text-white/30 text-[10px] font-medium mt-6"
                >
                  탭하여 닫기
                </motion.p>
              </div>

              {/* 오른쪽: SSR 카드 */}
              <div className="flex-shrink-0" style={{ width: 130 }}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.4, y: 30, rotate: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
                  transition={{ delay: 0.4, duration: 0.7, type: "spring", bounce: 0.4 }}
                  className="relative"
                >
                  {/* 카드 빛 후광 */}
                  <motion.div
                    className="absolute -inset-3 rounded-2xl"
                    animate={{
                      boxShadow: [
                        "0 0 20px 8px #FFD70055",
                        "0 0 40px 16px #FFD70099",
                        "0 0 20px 8px #FFD70055",
                      ],
                    }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  />

                  {/* 황금 회전 shimmer */}
                  <motion.div
                    className="absolute inset-0 rounded-xl overflow-hidden z-10 pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    <motion.div
                      className="absolute inset-0"
                      style={{
                        background: "linear-gradient(105deg, transparent 30%, rgba(255,215,0,0.45) 50%, transparent 70%)",
                      }}
                      animate={{ x: ["-100%", "200%"] }}
                      transition={{ delay: 0.8, duration: 1.2, repeat: Infinity, repeatDelay: 1.5 }}
                    />
                  </motion.div>

                  <img
                    src={cardSsrUrl}
                    alt="SSR"
                    className="w-full rounded-xl relative z-0"
                    style={{ boxShadow: "0 8px 32px rgba(255,215,0,0.4)" }}
                  />

                  {/* SSR 뱃지 */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.9, type: "spring", bounce: 0.6 }}
                    className="absolute -top-2 -right-2 z-20 bg-yellow-400 text-yellow-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-lg"
                    style={{ boxShadow: "0 0 12px #FFD700" }}
                  >
                    SSR
                  </motion.div>

                  {/* 등장 플래시 */}
                  <motion.div
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="absolute inset-0 bg-white rounded-xl z-30"
                  />
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
