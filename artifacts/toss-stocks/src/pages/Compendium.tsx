import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, CheckCircle2, BookOpen, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CardDef {
  id: string;
  label: string;
  sublabel: string;
  rarity: "기본" | "SSR" | "UR";
  image: string | null;
  avatarTypes: string[];
  description: string;
}

export const ALL_CARDS: CardDef[] = [
  {
    id: "defensive_basic",
    label: "안정형",
    sublabel: "Analyst",
    rarity: "기본",
    image: "/card_defensive_basic.png",
    avatarTypes: ["defensive_m", "defensive_f"],
    description: "냉정한 판단력과 강한 책임감. 데이터와 흐름을 읽어 최적의 전략을 제시한다.",
  },
  {
    id: "defensive_ssr",
    label: "안정형",
    sublabel: "서퍼 Analyst",
    rarity: "SSR",
    image: "/card_defensive_ssr.png",
    avatarTypes: ["defensive_m", "defensive_f"],
    description: "파도 위에서도 흔들리지 않는 분석력. 어떤 시장에서도 최적의 타이밍을 찾아낸다.",
  },
  {
    id: "aggressive_basic",
    label: "공격형",
    sublabel: "Trader",
    rarity: "기본",
    image: null,
    avatarTypes: ["aggressive_m", "aggressive_f"],
    description: "과감한 결단력으로 시장을 공략하는 선봉장. 리스크를 두려워하지 않는다.",
  },
  {
    id: "aggressive_ssr",
    label: "공격형",
    sublabel: "베어킬러 Trader",
    rarity: "SSR",
    image: null,
    avatarTypes: ["aggressive_m", "aggressive_f"],
    description: "하락장에서도 수익을 창출하는 전설의 트레이더. 곰도 무릎 꿇게 만든다.",
  },
  {
    id: "neutral_basic",
    label: "균형형",
    sublabel: "Balancer",
    rarity: "기본",
    image: null,
    avatarTypes: ["neutral_m", "neutral_f"],
    description: "수익과 안정 사이에서 균형을 잡는 전략가. 포트폴리오의 중심을 지킨다.",
  },
  {
    id: "neutral_ssr",
    label: "균형형",
    sublabel: "퀀트 Balancer",
    rarity: "SSR",
    image: null,
    avatarTypes: ["neutral_m", "neutral_f"],
    description: "알고리즘과 직관을 결합한 퀀트 전략가. 수학적 아름다움으로 시장을 정복한다.",
  },
  {
    id: "basic_basic",
    label: "기본형",
    sublabel: "Investor",
    rarity: "기본",
    image: null,
    avatarTypes: ["basic_m", "basic_f"],
    description: "투자를 시작하는 모든 이의 첫걸음. 성장의 씨앗을 품고 있다.",
  },
];

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
  const [profileCard, setProfileCard] = useState<string | null>(() => loadProfileCard(uid));
  const [justSet, setJustSet] = useState<string | null>(null);

  const handleSelectCard = (cardId: string) => {
    saveProfileCard(uid, cardId);
    setProfileCard(cardId);
    setJustSet(cardId);
    setTimeout(() => setJustSet(null), 1500);
  };

  const totalCollected = collected.length;
  const total = ALL_CARDS.length;

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center gap-3 mb-1">
        <BookOpen className="w-6 h-6 text-primary" />
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">카드 도감</h1>
          <p className="text-xs text-muted-foreground font-medium">
            수집 {totalCollected}/{total}
          </p>
        </div>
        <div className="ml-auto">
          <div className="text-right">
            <div className="text-xs text-muted-foreground font-semibold mb-1">수집률</div>
            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-purple-600 rounded-full transition-all"
                style={{ width: `${(totalCollected / total) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {profileCard && (
        <div className="flex items-center gap-2 bg-violet-50 border border-violet-200 rounded-2xl px-4 py-2.5">
          <Star className="w-4 h-4 text-violet-500 flex-shrink-0" />
          <p className="text-sm font-bold text-violet-700">
            프로필에 표시 중: {ALL_CARDS.find(c => c.id === profileCard)?.sublabel ?? profileCard}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {ALL_CARDS.map((card, idx) => {
          const isCollected = collected.includes(card.id);
          const isSelected = profileCard === card.id;
          const wasJustSet = justSet === card.id;

          return (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06 }}
              onClick={() => isCollected && handleSelectCard(card.id)}
              className={cn(
                "rounded-3xl overflow-hidden border transition-all",
                isCollected ? "cursor-pointer hover:scale-[1.02] active:scale-[0.98]" : "cursor-not-allowed",
                isSelected
                  ? "ring-2 ring-yellow-400 border-yellow-300 shadow-lg shadow-yellow-200/50"
                  : isCollected
                  ? "border-border/50 shadow-sm hover:shadow-md"
                  : "border-border/30 opacity-70"
              )}
            >
              <div className="relative aspect-[2/3] bg-muted/40">
                {card.image && isCollected ? (
                  <img
                    src={card.image}
                    alt={`${card.label} ${card.sublabel}`}
                    className="w-full h-full object-cover"
                  />
                ) : card.image && !isCollected ? (
                  <>
                    <img
                      src={card.image}
                      alt=""
                      className="w-full h-full object-cover brightness-[0.15] grayscale"
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                      <Lock className="w-8 h-8 text-white/60" />
                      <span className="text-white/50 text-xs font-bold">미획득</span>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-800 to-slate-900">
                    <Lock className="w-8 h-8 text-white/30" />
                    <span className="text-white/30 text-xs font-bold">준비 중</span>
                  </div>
                )}

                {isSelected && (
                  <div className="absolute top-2 right-2 bg-yellow-400 rounded-full p-1 shadow-md">
                    <CheckCircle2 className="w-3.5 h-3.5 text-yellow-900" />
                  </div>
                )}
                {wasJustSet && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-3xl"
                  >
                    <span className="text-white font-extrabold text-sm bg-black/50 px-3 py-1.5 rounded-xl">
                      프로필 적용됨!
                    </span>
                  </motion.div>
                )}
              </div>

              <div className="p-3 bg-card">
                <div className="flex items-start justify-between gap-1 mb-0.5">
                  <p className="font-extrabold text-sm text-foreground leading-tight">{card.sublabel}</p>
                  <span className={cn("text-[10px] font-extrabold px-1.5 py-0.5 rounded-md flex-shrink-0 leading-none", RARITY_STYLE[card.rarity])}>
                    {card.rarity}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground font-semibold">{card.label}</p>
                {isCollected && !isSelected && (
                  <p className="text-[10px] text-violet-500 font-bold mt-1.5">탭하여 프로필 적용</p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="bg-muted/40 rounded-2xl p-4 border border-border/40 text-center">
        <p className="text-xs text-muted-foreground font-medium">
          🎴 더 많은 카드가 업데이트될 예정입니다<br />
          <span className="font-bold text-foreground/60">뽑기 상점에서 SSR 카드를 획득하세요!</span>
        </p>
      </div>
    </div>
  );
}
