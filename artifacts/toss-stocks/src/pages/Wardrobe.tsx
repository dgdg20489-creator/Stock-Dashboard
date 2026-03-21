import { useState } from "react";
import { Avatar3D } from "@/components/Avatar3D";
import { useEquipped } from "@/hooks/use-equipped";
import { WARDROBE_ITEMS, CATEGORIES, DIFFICULTY_CONFIG, type ItemCategory, type Difficulty } from "@/data/wardrobe-items";
import { cn } from "@/lib/utils";
import { Lock, Check, Shirt } from "lucide-react";

const DIFFICULTY_ORDER: Difficulty[] = ["beginner", "intermediate", "expert"];

interface WardrobeProps {
  userId: number;
  userDifficulty: Difficulty;
  avatar?: "male" | "female";
}

export default function Wardrobe({ userId: _userId, userDifficulty, avatar = "male" }: WardrobeProps) {
  const { equipped, equip } = useEquipped();
  const [activeCategory, setActiveCategory] = useState<ItemCategory>("hat");

  const userLevel = DIFFICULTY_ORDER.indexOf(userDifficulty);

  const isUnlocked = (diff: Difficulty) => DIFFICULTY_ORDER.indexOf(diff) <= userLevel;

  const categoryItems = WARDROBE_ITEMS.filter((i) => i.category === activeCategory);

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-500">
      <div className="mb-6 px-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">아바타 옷장</h1>
        <p className="text-muted-foreground font-medium mt-1">
          현재 등급: {" "}
          <span
            className="font-bold"
            style={{ color: DIFFICULTY_CONFIG[userDifficulty].color }}
          >
            {DIFFICULTY_CONFIG[userDifficulty].label}
          </span>
          {" "}— 마우스로 아바타를 360도 회전해 보세요!
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ── 3D 아바타 뷰어 ── */}
        <div className="lg:w-[340px] flex-shrink-0">
          <div className="bg-card rounded-3xl overflow-hidden border border-border/50 shadow-sm">
            <div className="h-[440px] lg:h-[500px]">
              <Avatar3D equipped={equipped} avatar={avatar} />
            </div>
          </div>

          {/* 현재 착용 요약 */}
          <div className="mt-4 bg-card rounded-2xl border border-border/50 shadow-sm p-4 space-y-2">
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
        </div>

        {/* ── 아이템 선택창 ── */}
        <div className="flex-1 min-w-0">
          {/* 카테고리 탭 */}
          <div className="flex gap-2 mb-4 bg-muted p-1.5 rounded-2xl">
            {CATEGORIES.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setActiveCategory(id)}
                className={cn(
                  "flex-1 py-2.5 text-sm font-bold rounded-xl transition-all",
                  activeCategory === id
                    ? "bg-white text-foreground shadow-sm"
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
              const unlocked = isUnlocked(item.difficulty);
              const isEquipped = equipped[item.category] === item.id;
              const cfg = DIFFICULTY_CONFIG[item.difficulty];

              return (
                <button
                  key={item.id}
                  disabled={!unlocked}
                  onClick={() => unlocked && equip(item.category, item.id)}
                  className={cn(
                    "relative rounded-2xl p-4 text-left border-2 transition-all",
                    unlocked ? "hover:shadow-md active:scale-95 cursor-pointer" : "opacity-50 cursor-not-allowed",
                    isEquipped
                      ? "border-primary bg-primary/5 shadow-sm"
                      : `border-border/50 bg-card ${unlocked ? "hover:border-border" : ""}`
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
                    {item.accentColor && (
                      <div
                        className="w-5 h-5 rounded-full border border-border/30"
                        style={{ background: item.accentColor }}
                      />
                    )}
                  </div>

                  <p className="font-bold text-foreground text-sm leading-tight mb-1.5">{item.name}</p>
                  <p className="text-xs text-muted-foreground leading-snug">{item.description}</p>

                  {/* 난이도 배지 */}
                  <div
                    className={cn("mt-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border", cfg.bgColor, cfg.textColor, cfg.borderColor)}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ background: cfg.color }}
                    />
                    {cfg.label}
                  </div>

                  {/* 착용 중 */}
                  {isEquipped && (
                    <div className="absolute top-3 right-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}

                  {/* 잠금 */}
                  {!unlocked && (
                    <div className="absolute top-3 right-3 w-6 h-6 bg-muted-foreground/20 rounded-full flex items-center justify-center">
                      <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* 등급 안내 */}
          <div className="mt-4 p-4 bg-card rounded-2xl border border-border/50">
            <p className="text-sm font-bold text-muted-foreground mb-3">등급별 잠금 해제</p>
            <div className="flex gap-3">
              {(Object.entries(DIFFICULTY_CONFIG) as [Difficulty, typeof DIFFICULTY_CONFIG[Difficulty]][]).map(([key, cfg]) => (
                <div
                  key={key}
                  className={cn(
                    "flex-1 rounded-xl p-3 text-center border",
                    isUnlocked(key) ? `${cfg.bgColor} ${cfg.borderColor}` : "bg-muted border-border/30 opacity-50"
                  )}
                >
                  <div
                    className="w-5 h-5 rounded-full mx-auto mb-1.5"
                    style={{ background: cfg.color }}
                  />
                  <p className={cn("text-xs font-bold", isUnlocked(key) ? cfg.textColor : "text-muted-foreground")}>
                    {cfg.label}
                  </p>
                  {isUnlocked(key) && (
                    <Check className={cn("w-3 h-3 mx-auto mt-1", cfg.textColor)} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
