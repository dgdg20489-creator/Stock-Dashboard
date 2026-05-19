import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, Sparkles, Trophy, Star, FlaskConical } from "lucide-react";
import { useMissions } from "@/hooks/use-missions";
import { cn } from "@/lib/utils";
import cardBasicUrl from "/card_defensive_basic.png";
import cardSsrUrl from "/card_defensive_ssr.png";

const PULL_COST = 10;
const PULL_COUNT = 10;

function collectedKey() {
  const uid = localStorage.getItem("toss_userId") ?? "guest";
  return `wonkwang_gacha_collected_${uid}`;
}
function loadCollected(): string[] {
  try {
    const raw = localStorage.getItem(collectedKey());
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
function saveCollected(items: string[]) {
  localStorage.setItem(collectedKey(), JSON.stringify(items));
}

type PullResult = { idx: number; type: "ssr" | "miss" };

function generatePull(): PullResult[] {
  const results: PullResult[] = Array.from({ length: PULL_COUNT }, (_, i) => ({
    idx: i,
    type: "miss",
  }));
  const ssrPos = Math.floor(Math.random() * PULL_COUNT);
  results[ssrPos] = { idx: ssrPos, type: "ssr" };
  return results;
}

interface GachaShopProps {
  userId: number;
}

export default function GachaShop({ userId: _userId }: GachaShopProps) {
  const { coins, deductCoins, addCoins } = useMissions();
  const [collected, setCollected] = useState<string[]>(loadCollected);
  const [results, setResults] = useState<PullResult[] | null>(null);
  const [revealed, setRevealed] = useState<boolean[]>([]);
  const [pulling, setPulling] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [ssrJustObtained, setSsrJustObtained] = useState(false);

  const hasSSR = collected.includes("defensive_ssr");

  const handlePull = () => {
    if (coins < PULL_COST || pulling) return;
    const ok = deductCoins(PULL_COST);
    if (!ok) return;

    const pull = generatePull();
    setResults(pull);
    setRevealed(new Array(PULL_COUNT).fill(false));
    setSsrJustObtained(false);
    setShowModal(true);
    setPulling(true);

    pull.forEach((_, i) => {
      setTimeout(() => {
        setRevealed((prev) => {
          const next = [...prev];
          next[i] = true;
          return next;
        });
        if (i === PULL_COUNT - 1) {
          setPulling(false);
          const gotSsr = pull.some((r) => r.type === "ssr");
          if (gotSsr && !collected.includes("defensive_ssr")) {
            const next = [...collected, "defensive_ssr"];
            setCollected(next);
            saveCollected(next);
            setSsrJustObtained(true);
          }
        }
      }, i * 280 + 300);
    });
  };

  const closeModal = () => {
    setShowModal(false);
    setResults(null);
    setRevealed([]);
  };

  const allRevealed = revealed.length > 0 && revealed.every(Boolean);

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-4">
      {/* 헤더 */}
      <div className="text-center mb-1">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">✨ 뽑기 상점</h1>
        <p className="text-sm text-muted-foreground mt-0.5">투자 성향 캐릭터 카드를 모아보세요</p>
      </div>

      {/* 코인 잔액 */}
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

      {/* 안정형 기본 카드 디스플레이 */}
      <div className="bg-card rounded-3xl overflow-hidden shadow-lg border border-border/50">
        <img
          src={cardBasicUrl}
          alt="안정형 기본 카드"
          className="w-full object-contain"
        />
        <div className="p-3 text-center bg-gradient-to-r from-slate-50 to-blue-50">
          <p className="font-bold text-sm text-foreground">안정형 · Analyst</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">기본 보유 카드 · 뽑기로 SSR 버전을 획득하세요!</p>
        </div>
      </div>

      {/* 10연차 뽑기 버튼 */}
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

      {/* 확률 안내 */}
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

      {/* 획득 카드 컬렉션 */}
      <div className="bg-card rounded-3xl p-4 border border-border/50">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-5 h-5 text-amber-500" />
          <h3 className="font-extrabold text-foreground">획득한 카드</h3>
          <span className="ml-auto text-xs text-muted-foreground">
            {hasSSR ? "1/1" : "0/1"}
          </span>
        </div>
        {hasSSR ? (
          <div className="rounded-2xl overflow-hidden shadow-md ring-2 ring-yellow-400">
            <img src={cardSsrUrl} alt="안정형 SSR 카드" className="w-full object-contain" />
            <div className="p-2 text-center bg-gradient-to-r from-yellow-50 to-amber-50">
              <span className="text-xs font-bold text-amber-700">✨ 안정형 SSR · 서퍼 Analyst 획득!</span>
            </div>
          </div>
        ) : (
          <div className="h-24 flex flex-col items-center justify-center bg-muted/40 rounded-2xl gap-1">
            <div className="text-2xl opacity-30">🎴</div>
            <p className="text-xs text-muted-foreground">아직 획득한 카드가 없습니다</p>
          </div>
        )}
      </div>

      {/* 뽑기 결과 모달 */}
      <AnimatePresence>
        {showModal && results && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 flex flex-col items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="w-full max-w-sm"
            >
              <h2 className="text-white font-extrabold text-xl text-center mb-4">
                🎰 10연차 결과
              </h2>

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
                          className="absolute inset-0 rounded-xl overflow-hidden ring-2 ring-yellow-400 shadow-lg shadow-yellow-400/60"
                        >
                          <img src={cardSsrUrl} alt="SSR" className="w-full h-full object-cover" />
                          <div className="absolute top-0.5 right-0.5 bg-yellow-400 text-yellow-900 text-[7px] font-extrabold px-1 py-0.5 rounded leading-none">
                            SSR
                          </div>
                          <motion.div
                            initial={{ opacity: 0.8 }}
                            animate={{ opacity: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
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

              <AnimatePresence>
                {ssrJustObtained && allRevealed && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-3 py-2 rounded-xl bg-gradient-to-r from-yellow-400/20 to-amber-400/20 border border-yellow-400/40"
                  >
                    <p className="text-yellow-300 font-extrabold text-sm">🎉 SSR 획득! 서퍼 Analyst 카드를 얻었습니다!</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {allRevealed && (
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
    </div>
  );
}
