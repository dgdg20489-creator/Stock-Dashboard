import { useState } from "react";
import { Avatar3D } from "@/components/Avatar3D";
import { GameAvatar, getAvatarDef, getGenderFromAvatarId, INVEST_TYPES } from "@/components/GameAvatar";
import { useEquipped } from "@/hooks/use-equipped";
import { useMissions } from "@/hooks/use-missions";
import { WARDROBE_ITEMS, CATEGORIES, DIFFICULTY_CONFIG, type ItemCategory, type Difficulty } from "@/data/wardrobe-items";
import { cn } from "@/lib/utils";
import { Lock, Check, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const DIFFICULTY_ORDER: Difficulty[] = ["beginner", "intermediate", "expert"];

interface WardrobeProps {
  userId: number;
  userDifficulty: Difficulty;
  avatarId?: string;
}

export default function Wardrobe({ userId: _userId, userDifficulty, avatarId = "balanced_m" }: WardrobeProps) {
  const { equipped, equip } = useEquipped();
  const { coins, spendCoins, isItemUnlocked } = useMissions();
  const [activeCategory, setActiveCategory] = useState<ItemCategory>("hat");
  const [buyConfirm, setBuyConfirm] = useState<string | null>(null);
  const [recentUnlock, setRecentUnlock] = useState<string | null>(null);

  const userLevel = DIFFICULTY_ORDER.indexOf(userDifficulty);
  const isDifficultyUnlocked = (diff: Difficulty) => DIFFICULTY_ORDER.indexOf(diff) <= userLevel;

  const categoryItems = WARDROBE_ITEMS.filter((i) => i.category === activeCategory);

  const handleItemClick = (itemId: string, coinCost: number, diffUnlocked: boolean) => {
    if (!diffUnlocked) return;
    if (isItemUnlocked(itemId, coinCost)) {
      equip(activeCategory, itemId);
    } else {
      setBuyConfirm(buyConfirm === itemId ? null : itemId);
    }
  };

  const handleBuy = (itemId: string, coinCost: number) => {
    const success = spendCoins(itemId, coinCost);
    if (success) {
      equip(activeCategory, itemId);
      setRecentUnlock(itemId);
      setTimeout(() => setRecentUnlock(null), 2000);
    } else {
      alert("코인이 부족합니다. 일일 미션을 완료해 코인을 획득하세요!");
    }
    setBuyConfirm(null);
  };

  // 아바타 정보 파악
  const avatarDef = getAvatarDef(avatarId);
  const avatarGender: "male" | "female" = getGenderFromAvatarId(avatarId);
  const investType = INVEST_TYPES.find((t) => t.type === avatarDef.type);

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-500">
      <div className="mb-6 px-1 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">아바타 옷장</h1>
          <p className="text-muted-foreground font-medium mt-1">
            마우스로 아바타를 360도 회전해 보세요!
          </p>
        </div>
        <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 px-4 py-2.5 rounded-2xl">
          <span className="text-xl">🪙</span>
          <div>
            <p className="text-xs text-muted-foreground font-semibold">보유 코인</p>
            <p className="text-xl font-extrabold text-amber-600">{coins}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ── 왼쪽: 내 캐릭터 + 3D 뷰어 ── */}
        <div className="lg:w-[340px] flex-shrink-0 space-y-4">

          {/* 내 캐릭터 아이덴티티 카드 */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-3xl border border-border/50 shadow-sm overflow-hidden"
          >
            {/* 컬러 배너 */}
            <div
              className="h-2 w-full"
              style={{
                background: `linear-gradient(90deg, ${investType?.themeColor ?? "#666"}, ${investType?.themeColor ?? "#666"}88)`,
              }}
            />
            <div className="p-4 flex items-center gap-4">
              {/* 2D 초상화 */}
              <div
                className="flex-shrink-0 rounded-2xl overflow-hidden ring-2 ring-offset-2 shadow-lg"
                style={{ ringColor: investType?.themeColor ?? "#666" }}
              >
                <GameAvatar avatarId={avatarId} size={80} rounded="rounded-2xl" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-lg leading-none">{investType?.emoji ?? "👤"}</span>
                  <span className="text-base font-extrabold text-foreground">{avatarDef.label}</span>
                  <span
                    className="text-[10px] font-extrabold px-2 py-0.5 rounded-full text-white"
                    style={{ background: investType?.themeColor ?? "#666" }}
                  >
                    {investType?.tagline}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground font-medium leading-relaxed line-clamp-2">
                  {investType?.desc}
                </p>
                <p className="text-[10px] text-muted-foreground/60 font-semibold mt-1">
                  {avatarDef.gender === "남" ? "👨 남성 캐릭터" : "👩 여성 캐릭터"}
                </p>
              </div>
            </div>
          </motion.div>

          {/* 3D 아바타 뷰어 */}
          <div className="bg-card rounded-3xl overflow-hidden border border-border/50 shadow-sm">
            <div className="px-4 pt-3 pb-1">
              <p className="text-xs font-bold text-muted-foreground">3D 의상 미리보기</p>
            </div>
            <div className="h-[380px] lg:h-[420px]">
              <Avatar3D equipped={equipped} avatar={avatarGender} difficulty={userDifficulty} />
            </div>
          </div>

          {/* 현재 착용 요약 */}
          <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-4 space-y-2">
            <p className="text-sm font-bold text-muted-foreground mb-3">현재 착용 아이템</p>
            {CATEGORIES.map(({ id, label }) => {
              const equippedId = equipped[id];
              const item = equippedId ? WARDROBE_ITEMS.find((i) => i.id === equippedId) : null;
              return (
                <div key={id} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground font-semibold">{label}</span>
                  {item ? (
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-3.5 h-3.5 rounded-full border border-border/50"
                        style={{ background: item.color }}
                      />
                      <span className="font-bold text-foreground">{item.name}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground/60">미착용</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* 등급 안내 */}
          <div className="p-4 bg-card rounded-2xl border border-border/50">
            <p className="text-xs font-bold text-muted-foreground mb-2">현재 등급 현황</p>
            <div className="flex gap-2">
              {(Object.entries(DIFFICULTY_CONFIG) as [Difficulty, typeof DIFFICULTY_CONFIG[Difficulty]][]).map(([key, cfg]) => (
                <div
                  key={key}
                  className={cn(
                    "flex-1 rounded-xl p-2 text-center border",
                    isDifficultyUnlocked(key) ? `${cfg.bgColor} ${cfg.borderColor}` : "bg-muted border-border/30 opacity-40"
                  )}
                >
                  <div className="w-4 h-4 rounded-full mx-auto mb-1" style={{ background: cfg.color }} />
                  <p className={cn("text-[10px] font-bold", isDifficultyUnlocked(key) ? cfg.textColor : "text-muted-foreground")}>
                    {cfg.label}
                  </p>
                  {isDifficultyUnlocked(key) && (
                    <Check className={cn("w-2.5 h-2.5 mx-auto mt-0.5", cfg.textColor)} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── 아이템 선택창 ── */}
        <div className="flex-1 min-w-0">
          {/* 카테고리 탭 */}
          <div className="flex gap-2 mb-4 bg-muted p-1.5 rounded-2xl">
            {CATEGORIES.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => { setActiveCategory(id); setBuyConfirm(null); }}
                className={cn(
                  "flex-1 py-2.5 text-sm font-bold rounded-xl transition-all",
                  activeCategory === id
                    ? "bg-white text-red-600 shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* 아이템 그리드 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {categoryItems.map((item) => {
              const diffUnlocked = isDifficultyUnlocked(item.difficulty);
              const coinUnlocked = isItemUnlocked(item.id, item.coinCost);
              const isFullyUnlocked = diffUnlocked && coinUnlocked;
              const isEquipped = equipped[item.category] === item.id;
              const cfg = DIFFICULTY_CONFIG[item.difficulty];
              const showingBuyConfirm = buyConfirm === item.id;
              const justUnlocked = recentUnlock === item.id;

              return (
                <div key={item.id} className="relative">
                  <motion.button
                    whileTap={isFullyUnlocked ? { scale: 0.97 } : {}}
                    disabled={!diffUnlocked}
                    onClick={() => handleItemClick(item.id, item.coinCost, diffUnlocked)}
                    className={cn(
                      "relative w-full rounded-2xl p-4 text-left border-2 transition-all duration-200",
                      !diffUnlocked ? "opacity-45 cursor-not-allowed bg-muted border-border/30" :
                      isEquipped ? "border-red-400 bg-red-50 shadow-sm shadow-red-100" :
                      !coinUnlocked ? "border-amber-200 bg-amber-50/50 cursor-pointer hover:border-amber-300" :
                      "border-border/50 bg-card cursor-pointer hover:border-border hover:shadow-sm"
                    )}
                  >
                    {/* 색상 스와치 */}
                    <div className="flex items-center gap-2 mb-3">
                      <div
                        className="w-10 h-10 rounded-full shadow-inner flex-shrink-0 border border-border/30"
                        style={{
                          background: item.accentColor
                            ? `linear-gradient(135deg, ${item.color} 50%, ${item.accentColor} 50%)`
                            : item.color,
                        }}
                      />
                    </div>

                    <p className="font-bold text-foreground text-sm leading-tight mb-1">{item.name}</p>
                    <p className="text-xs text-muted-foreground leading-snug mb-2">{item.description}</p>

                    {/* 난이도 배지 */}
                    <div className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border", cfg.bgColor, cfg.textColor, cfg.borderColor)}>
                      <span className="w-2 h-2 rounded-full" style={{ background: cfg.color }} />
                      {cfg.label}
                    </div>

                    {/* 코인 비용 */}
                    {item.coinCost > 0 && (
                      <div className={cn(
                        "mt-2 flex items-center gap-1 text-xs font-bold",
                        coinUnlocked ? "text-green-600" : "text-amber-600"
                      )}>
                        {coinUnlocked ? (
                          <><Check className="w-3 h-3" /> 보유 중</>
                        ) : (
                          <><span>🪙</span> {item.coinCost}코인 필요</>
                        )}
                      </div>
                    )}
                    {item.coinCost === 0 && diffUnlocked && (
                      <div className="mt-2 text-xs font-bold text-green-600 flex items-center gap-1">
                        <Check className="w-3 h-3" /> 무료
                      </div>
                    )}

                    {/* 착용 중 배지 */}
                    {isEquipped && (
                      <div className="absolute top-3 right-3 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}

                    {/* 잠금 아이콘 */}
                    {!diffUnlocked && (
                      <div className="absolute top-3 right-3 w-6 h-6 bg-muted-foreground/20 rounded-full flex items-center justify-center">
                        <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                    )}
                    {diffUnlocked && !coinUnlocked && (
                      <div className="absolute top-3 right-3 w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center">
                        <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />
                      </div>
                    )}
                  </motion.button>

                  {/* 구매 확인 팝업 */}
                  <AnimatePresence>
                    {showingBuyConfirm && (
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        className="absolute top-full left-0 right-0 mt-2 z-20 bg-card border-2 border-amber-300 rounded-2xl p-3 shadow-lg"
                      >
                        <p className="text-xs font-bold text-foreground mb-2">
                          🪙 {item.coinCost}코인으로 잠금 해제할까요?
                        </p>
                        <p className="text-xs text-muted-foreground mb-3">
                          현재 보유: {coins}코인
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleBuy(item.id, item.coinCost)}
                            disabled={coins < item.coinCost}
                            className="flex-1 py-1.5 bg-amber-500 text-white rounded-xl text-xs font-bold disabled:opacity-50 hover:bg-amber-600 transition-colors"
                          >
                            구매
                          </button>
                          <button
                            onClick={() => setBuyConfirm(null)}
                            className="flex-1 py-1.5 bg-muted text-muted-foreground rounded-xl text-xs font-bold hover:bg-muted/80 transition-colors"
                          >
                            취소
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* 잠금 해제 축하 */}
                  <AnimatePresence>
                    {justUnlocked && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute inset-0 bg-green-500/10 border-2 border-green-400 rounded-2xl flex items-center justify-center"
                      >
                        <span className="text-2xl">🎉</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
