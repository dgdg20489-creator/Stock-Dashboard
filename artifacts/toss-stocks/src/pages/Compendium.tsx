import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, X, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CardDef {
  id: string;
  label: string;
  sublabel: string;
  rarity: "기본" | "SSR" | "UR";
  image: string | null;
  avatarTypes: string[];
  description: string;
  group: "defensive" | "aggressive" | "neutral" | "basic";
}

export const ALL_CARDS: CardDef[] = [
  {
    id: "defensive_basic",
    label: "안정형",
    sublabel: "Analyst",
    rarity: "기본",
    image: "/card_defensive_basic.png",
    avatarTypes: [
      "basic_m", "basic_f",
      "defensive_m", "defensive_f",
      "aggressive_m", "aggressive_f",
      "neutral_m", "neutral_f",
      "balanced_m", "balanced_f",
      "analytical_m", "analytical_f",
      "growth_m", "growth_f",
    ],
    description: "냉정한 판단력과 강한 책임감. 데이터와 흐름을 읽어 최적의 전략을 제시한다.",
    group: "defensive",
  },
  {
    id: "defensive_ssr_chibi",
    label: "안정형",
    sublabel: "Analyst · 치비",
    rarity: "SSR",
    image: "/card_ssr_chibi.png",
    avatarTypes: ["defensive_m", "defensive_f"],
    description: "분석은 재미있어! 세상을 이해하는 방법이거든!",
    group: "defensive",
  },
  {
    id: "defensive_ssr_concert",
    label: "안정형",
    sublabel: "Analyst · 콘서트",
    rarity: "SSR",
    image: "/card_ssr_concert.png",
    avatarTypes: ["defensive_m", "defensive_f"],
    description: "우리의 데이터는 반짝이는 가능성이야. 지금, 함께 성장하자!",
    group: "defensive",
  },
  {
    id: "defensive_ssr_surfer",
    label: "안정형",
    sublabel: "Analyst · 서퍼",
    rarity: "SSR",
    image: "/card_ssr_surfer.png",
    avatarTypes: ["defensive_m", "defensive_f"],
    description: "끝없이 펼쳐진 수평선처럼, 우리의 가능성도 무한해!",
    group: "defensive",
  },
  {
    id: "defensive_ssr_magical",
    label: "안정형",
    sublabel: "Analyst · 매지컬",
    rarity: "SSR",
    image: "/card_ssr_magical.png",
    avatarTypes: ["defensive_m", "defensive_f"],
    description: "데이터도, 미래도, 내 손안에 있어! 함께라면 뭐든지 가능해!",
    group: "defensive",
  },
  {
    id: "defensive_ssr_gamer",
    label: "안정형",
    sublabel: "Analyst · 게이머",
    rarity: "SSR",
    image: "/card_ssr_gamer.png",
    avatarTypes: ["defensive_m", "defensive_f"],
    description: "게임은 전략이야. 승리도, 성장도 계획이 필요하지!",
    group: "defensive",
  },
  {
    id: "defensive_ssr_mystic",
    label: "안정형",
    sublabel: "Analyst · 미스틱",
    rarity: "SSR",
    image: "/card_ssr_mystic.png",
    avatarTypes: ["defensive_m", "defensive_f"],
    description: "진실은 언제나 데이터 속에 숨어 있어. 내가 찾아낼 뿐이지.",
    group: "defensive",
  },
  {
    id: "aggressive_basic",
    label: "공격형",
    sublabel: "Trader",
    rarity: "기본",
    image: null,
    avatarTypes: ["aggressive_m", "aggressive_f"],
    description: "과감한 결단력으로 시장을 공략하는 선봉장. 리스크를 두려워하지 않는다.",
    group: "aggressive",
  },
  {
    id: "aggressive_ssr",
    label: "공격형",
    sublabel: "베어킬러 Trader",
    rarity: "SSR",
    image: null,
    avatarTypes: ["aggressive_m", "aggressive_f"],
    description: "하락장에서도 수익을 창출하는 전설의 트레이더. 곰도 무릎 꿇게 만든다.",
    group: "aggressive",
  },
  {
    id: "neutral_basic",
    label: "균형형",
    sublabel: "Balancer",
    rarity: "기본",
    image: null,
    avatarTypes: ["neutral_m", "neutral_f"],
    description: "수익과 안정 사이에서 균형을 잡는 전략가. 포트폴리오의 중심을 지킨다.",
    group: "neutral",
  },
  {
    id: "neutral_ssr",
    label: "균형형",
    sublabel: "퀀트 Balancer",
    rarity: "SSR",
    image: null,
    avatarTypes: ["neutral_m", "neutral_f"],
    description: "알고리즘과 직관을 결합한 퀀트 전략가. 수학적 아름다움으로 시장을 정복한다.",
    group: "neutral",
  },
  {
    id: "basic_basic",
    label: "기본형",
    sublabel: "Investor",
    rarity: "기본",
    image: null,
    avatarTypes: ["basic_m", "basic_f"],
    description: "투자를 시작하는 모든 이의 첫걸음. 성장의 씨앗을 품고 있다.",
    group: "basic",
  },
];

const GROUPS = [
  { key: "defensive", label: "안정형", emoji: "🛡️" },
  { key: "aggressive", label: "공격형", emoji: "⚔️" },
  { key: "neutral", label: "균형형", emoji: "⚖️" },
] as const;

function profileCardKey(uid: string | number) {
  return `wonkwang_profile_card_${uid}`;
}
function gachaCollectedKey(uid: string | number) {
  return `wonkwang_gacha_collected_${uid}`;
}

export function loadProfileCard(uid: string | number): string | null {
  return localStorage.getItem(profileCardKey(uid));
}
export function saveProfileCard(uid: string | number, cardId: string) {
  localStorage.setItem(profileCardKey(uid), cardId);
}
function loadGachaCollected(uid: string | number): string[] {
  try {
    const raw = localStorage.getItem(gachaCollectedKey(uid));
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function getCollectedCards(uid: string | number, avatarId: string): string[] {
  const gacha = loadGachaCollected(uid);
  const auto: string[] = [];
  for (const card of ALL_CARDS) {
    if (card.rarity === "기본" && card.avatarTypes.includes(avatarId)) {
      auto.push(card.id);
    }
  }
  return [...new Set([...auto, ...gacha])];
}

const RARITY_STYLE: Record<string, string> = {
  기본: "bg-slate-100 text-slate-600",
  SSR: "bg-gradient-to-r from-yellow-400 to-amber-500 text-yellow-900",
  UR: "bg-gradient-to-r from-purple-500 to-pink-500 text-white",
};

interface CompendiumProps {
  userId: number;
  avatarId: string;
}

export default function Compendium({ userId, avatarId }: CompendiumProps) {
  const uid = String(userId);
  const collected = getCollectedCards(uid, avatarId);
  const [zoomCard, setZoomCard] = useState<CardDef | null>(null);

  const totalCollected = collected.length;
  const totalWithImage = ALL_CARDS.filter(c => c.image !== null).length;

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <BookOpen className="w-6 h-6 text-primary" />
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">카드 도감</h1>
          <p className="text-xs text-muted-foreground font-medium">
            수집 {totalCollected}/{totalWithImage}장
          </p>
        </div>
        <div className="ml-auto">
          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-purple-600 rounded-full transition-all"
              style={{ width: `${(totalCollected / Math.max(1, totalWithImage)) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* 그룹별 섹션 */}
      {GROUPS.map((group) => {
        const groupCards = ALL_CARDS.filter(c => c.group === group.key);
        const groupCollected = groupCards.filter(c => collected.includes(c.id));

        return (
          <div key={group.key}>
            {/* 섹션 헤더 */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{group.emoji}</span>
              <h2 className="font-extrabold text-foreground">{group.label}</h2>
              <span className="text-xs text-muted-foreground font-semibold ml-auto">
                {groupCollected.length}/{groupCards.length}
              </span>
            </div>

            {(() => {
              const visibleCards = groupCards.filter(c => c.image !== null);
              if (visibleCards.length === 0) return null;
              return (
                <div className="grid grid-cols-2 gap-3">
                  {visibleCards.map((card, idx) => {
                    const isCollected = collected.includes(card.id);
                    return (
                      <motion.div
                        key={card.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        onClick={() => isCollected && setZoomCard(card)}
                        className={cn(
                          "rounded-3xl overflow-hidden border transition-all",
                          isCollected
                            ? "cursor-pointer hover:scale-[1.02] active:scale-[0.97] border-border/50 shadow-sm hover:shadow-md"
                            : "border-border/20 opacity-50"
                        )}
                      >
                        <div className="relative aspect-[2/3]">
                          {isCollected ? (
                            <img
                              src={card.image!}
                              alt={`${card.label} ${card.sublabel}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <>
                              <img
                                src={card.image!}
                                alt=""
                                className="w-full h-full object-cover brightness-[0.12] grayscale"
                              />
                              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                                <Lock className="w-8 h-8 text-white/50" />
                                <span className="text-white/40 text-xs font-bold">미획득</span>
                              </div>
                            </>
                          )}
                        </div>
                        <div className="p-3 bg-card">
                          <div className="flex items-start justify-between gap-1 mb-0.5">
                            <p className="font-extrabold text-sm text-foreground leading-tight">{card.sublabel}</p>
                            <span className={cn("text-[10px] font-extrabold px-1.5 py-0.5 rounded-md flex-shrink-0 leading-none mt-0.5", RARITY_STYLE[card.rarity])}>
                              {card.rarity}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground font-semibold">{card.label}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        );
      })}

      <div className="bg-muted/40 rounded-2xl p-4 border border-border/40 text-center">
        <p className="text-xs text-muted-foreground font-medium">
          🎴 더 많은 카드가 업데이트될 예정입니다<br />
          <span className="font-bold text-foreground/60">뽑기 상점에서 SSR 카드를 획득하세요!</span>
        </p>
      </div>

      {/* 카드 확대 모달 */}
      <AnimatePresence>
        {zoomCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/92 flex items-center justify-center p-4"
            onClick={() => setZoomCard(null)}
          >
            <button
              className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white rounded-full p-2 transition-colors"
              onClick={() => setZoomCard(null)}
            >
              <X className="w-5 h-5" />
            </button>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.3 }}
              className="max-w-xs w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={zoomCard.image!}
                alt={zoomCard.sublabel}
                className="w-full rounded-3xl shadow-2xl"
              />
              <div className="text-center mt-4">
                <p className="text-white font-extrabold text-lg">{zoomCard.sublabel}</p>
                <p className="text-white/60 text-sm font-semibold mt-0.5">{zoomCard.label} · {zoomCard.rarity}</p>
                <p className="text-white/50 text-xs font-medium mt-2 leading-relaxed px-4">{zoomCard.description}</p>
              </div>
            </motion.div>
            <div className="absolute bottom-6 text-center">
              <p className="text-white/50 text-xs font-semibold">화면을 탭하면 닫힙니다</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
