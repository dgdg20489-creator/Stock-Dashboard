import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCreateUser } from "@workspace/api-client-react";
import { GameAvatar, AVATAR_LIST, INVEST_TYPES, type AvatarId, type InvestType } from "@/components/GameAvatar";
import { Check, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type DifficultyType = "beginner" | "intermediate" | "expert";

interface DifficultyScreenProps {
  onComplete: (userId: number) => void;
}

export default function DifficultyScreen({ onComplete }: DifficultyScreenProps) {
  const [username, setUsername] = useState("");
  const [selectedType, setSelectedType] = useState<InvestType>("balanced");
  const [gender, setGender] = useState<"남" | "녀">("남");
  const [difficulty, setDifficulty] = useState<DifficultyType | null>(null);

  const avatar: AvatarId = `${selectedType}_${gender === "남" ? "m" : "f"}` as AvatarId;

  const createUserMutation = useCreateUser({
    mutation: {
      onSuccess: (data) => { onComplete(data.id); }
    }
  });

  const handleStart = () => {
    if (!username.trim() || !difficulty) return;
    createUserMutation.mutate({ data: { username: username.trim(), avatar, difficulty } });
  };

  const difficulties: { id: DifficultyType; title: string; sub: string; seed: string; color: string; dot: string }[] = [
    { id: "beginner",     title: "입문",  sub: "여유롭게 시작",      seed: "1,000만원", color: "text-emerald-600", dot: "bg-emerald-500" },
    { id: "intermediate", title: "중급",  sub: "긴장감 있는 트레이드", seed: "500만원",   color: "text-blue-600",    dot: "bg-blue-500"    },
    { id: "expert",       title: "고수",  sub: "실력으로 승부",       seed: "100만원",   color: "text-red-600",     dot: "bg-red-500"     },
  ];

  const selectedInvest = INVEST_TYPES.find((t) => t.type === selectedType)!;
  const canSubmit = username.trim().length > 0 && difficulty !== null;

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-xl overflow-hidden bg-white/10 mx-auto flex items-center justify-center mb-5">
            <img src="/wonkwang-logo.png" alt="원광대학교 로고" className="w-10 h-10 object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1.5 tracking-tight">원광증권 모의투자</h1>
          <p className="text-sm text-white/40 font-medium">프로필을 설정하고 투자를 시작하세요</p>
        </div>

        {/* 폼 카드 */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">

          {/* 닉네임 */}
          <div className="px-6 pt-6 pb-4">
            <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">닉네임</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="사용할 닉네임 입력"
              className="w-full px-4 py-3 rounded-xl bg-muted/60 border border-border/60 text-foreground text-sm font-medium placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/20 focus:border-primary/30 focus:outline-none transition-all"
              maxLength={10}
              onKeyDown={(e) => e.key === "Enter" && handleStart()}
            />
          </div>

          <div className="h-px bg-border/50 mx-6" />

          {/* 투자 성향 */}
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">투자 성향</label>
              <div className="flex gap-1">
                {(["남", "녀"] as const).map((g) => (
                  <button
                    key={g}
                    onClick={() => setGender(g)}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all",
                      gender === g
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {g === "남" ? "남성" : "여성"}
                  </button>
                ))}
              </div>
            </div>

            {/* 성향 5개 버튼 */}
            <div className="grid grid-cols-5 gap-1.5 mb-3">
              {INVEST_TYPES.map((inv) => {
                const isSelected = selectedType === inv.type;
                return (
                  <button
                    key={inv.type}
                    onClick={() => setSelectedType(inv.type)}
                    className={cn(
                      "flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border transition-all duration-150",
                      isSelected
                        ? "border-transparent shadow-sm"
                        : "border-border/50 hover:border-border bg-muted/30 hover:bg-muted/60"
                    )}
                    style={isSelected ? { background: `${inv.themeColor}12`, borderColor: `${inv.themeColor}60` } : {}}
                  >
                    <span className="text-base leading-none">{inv.emoji}</span>
                    <span
                      className="text-[9px] font-bold leading-none"
                      style={isSelected ? { color: inv.themeColor } : {}}
                    >
                      {inv.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* 선택된 캐릭터 프리뷰 */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`${selectedType}_${gender}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-3 p-3 rounded-xl border"
                style={{ background: `${selectedInvest.themeColor}08`, borderColor: `${selectedInvest.themeColor}30` }}
              >
                <div className="flex-shrink-0 rounded-xl overflow-hidden ring-1" style={{ ringColor: selectedInvest.themeColor }}>
                  <GameAvatar avatarId={avatar} size={56} rounded="rounded-xl" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="font-bold text-sm text-foreground">{selectedInvest.label}</span>
                    <span
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md text-white"
                      style={{ background: selectedInvest.themeColor }}
                    >
                      {selectedInvest.tagline}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                    {selectedInvest.desc}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="h-px bg-border/50 mx-6" />

          {/* 난이도 */}
          <div className="px-6 py-4">
            <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">난이도 · 초기 자산</label>
            <div className="space-y-1.5">
              {difficulties.map((diff) => (
                <button
                  key={diff.id}
                  onClick={() => setDifficulty(diff.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-150 text-left",
                    difficulty === diff.id
                      ? "border-foreground/20 bg-foreground/4"
                      : "border-border/50 hover:border-border/80 hover:bg-muted/40"
                  )}
                >
                  <div className={cn("w-2 h-2 rounded-full flex-shrink-0", diff.dot)} />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-foreground mr-2">{diff.title}</span>
                    <span className="text-xs text-muted-foreground">{diff.sub}</span>
                  </div>
                  <span className={cn("text-xs font-bold flex-shrink-0", diff.color)}>{diff.seed}</span>
                  {difficulty === diff.id && (
                    <Check className="w-3.5 h-3.5 text-foreground/60 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 시작 버튼 */}
          <div className="px-6 pb-6">
            <button
              onClick={handleStart}
              disabled={!canSubmit || createUserMutation.isPending}
              className={cn(
                "w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2",
                canSubmit
                  ? "bg-[#0f172a] text-white hover:bg-[#1e293b] active:scale-[0.99] shadow-lg"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              {createUserMutation.isPending ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>준비 중...</span>
                </>
              ) : (
                <>
                  <span>투자 시작하기</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
