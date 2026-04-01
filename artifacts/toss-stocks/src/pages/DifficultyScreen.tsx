import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCreateUser } from "@workspace/api-client-react";
import { GameAvatar, AVATAR_LIST, INVEST_TYPES, type AvatarId, type InvestType } from "@/components/GameAvatar";
import { Check } from "lucide-react";
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
      onSuccess: (data) => {
        onComplete(data.id);
      }
    }
  });

  const handleStart = () => {
    if (!username.trim() || !difficulty) return;
    createUserMutation.mutate({
      data: {
        username: username.trim(),
        avatar,
        difficulty,
      }
    });
  };

  const difficulties: { id: DifficultyType; title: string; seed: string; desc: string; emoji: string; color: string }[] = [
    { id: "beginner",     title: "초보",    seed: "1,000만 원", desc: "여유롭게 시작하는 투자", emoji: "🌱", color: "emerald" },
    { id: "intermediate", title: "중수",    seed: "500만 원",   desc: "긴장감과 수익의 균형",   emoji: "🌿", color: "blue"    },
    { id: "expert",       title: "고수",    seed: "100만 원",   desc: "실력으로 승부하는 챌린지", emoji: "🔥", color: "red"    },
  ];

  const selectedInvest = INVEST_TYPES.find((t) => t.type === selectedType)!;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white rounded-3xl mx-auto flex items-center justify-center shadow-lg mb-6 p-1">
            <img src="/wonkwang-logo.png" alt="원광대학교 로고" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2 tracking-tight">원광증권 모의투자</h1>
          <p className="text-muted-foreground font-medium">프로필과 난이도를 설정하고 투자를 시작해보세요</p>
        </div>

        <div className="bg-card p-6 rounded-[2rem] shadow-xl border border-border/50 mb-6 space-y-7">

          {/* Nickname */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-foreground">닉네임</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="사용할 닉네임을 입력해주세요"
              className="w-full px-5 py-4 rounded-2xl bg-muted border-none text-foreground font-semibold placeholder:text-muted-foreground/70 focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
              maxLength={10}
              onKeyDown={(e) => e.key === "Enter" && handleStart()}
            />
          </div>

          {/* Investment Style Selection */}
          <div className="space-y-4">
            <label className="block text-sm font-bold text-foreground">투자 성향 선택</label>

            {/* 5 type cards */}
            <div className="grid grid-cols-5 gap-2">
              {INVEST_TYPES.map((inv) => {
                const isSelected = selectedType === inv.type;
                return (
                  <button
                    key={inv.type}
                    onClick={() => setSelectedType(inv.type)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 py-3 px-1 rounded-2xl border-2 transition-all",
                      isSelected
                        ? "border-primary bg-primary/8 shadow-md shadow-primary/15 scale-105"
                        : "border-border/50 hover:border-primary/30 bg-muted/50 hover:bg-muted"
                    )}
                  >
                    <span className="text-xl leading-none">{inv.emoji}</span>
                    <span className={cn(
                      "text-[10px] font-extrabold leading-none",
                      isSelected ? "text-primary" : "text-muted-foreground"
                    )}>
                      {inv.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Gender toggle */}
            <div className="flex gap-2 justify-end">
              {(["남", "녀"] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setGender(g)}
                  className={cn(
                    "px-4 py-1.5 rounded-xl text-xs font-extrabold transition-all border",
                    gender === g
                      ? "bg-foreground text-background border-foreground"
                      : "bg-muted text-muted-foreground border-border hover:border-foreground/30"
                  )}
                >
                  {g === "남" ? "👨 남성" : "👩 여성"}
                </button>
              ))}
            </div>

            {/* Selected preview card */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`${selectedType}_${gender}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-4 p-4 rounded-2xl border-2 border-primary/30 bg-primary/5"
              >
                <GameAvatar avatarId={avatar} size={80} rounded="rounded-2xl" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{selectedInvest.emoji}</span>
                    <span className="text-base font-extrabold text-foreground">{selectedInvest.label}</span>
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      {selectedInvest.tagline}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                    {selectedInvest.desc}
                  </p>
                  <p className="text-[10px] text-muted-foreground/60 font-semibold mt-1">
                    {gender === "남" ? "남성 캐릭터" : "여성 캐릭터"}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Difficulty Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-foreground">난이도 선택 (초기 자산)</label>
            <div className="grid grid-cols-3 gap-3">
              {difficulties.map((diff) => (
                <button
                  key={diff.id}
                  onClick={() => setDifficulty(diff.id)}
                  className={cn(
                    "p-4 rounded-2xl border-2 text-left transition-all",
                    difficulty === diff.id
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-primary/30 bg-card"
                  )}
                >
                  <div className="text-2xl mb-2">{diff.emoji}</div>
                  <div className="font-bold text-sm text-foreground mb-1">{diff.title}</div>
                  <div className="text-primary font-bold text-xs mb-1">{diff.seed}</div>
                  <div className="text-[10px] text-muted-foreground font-medium leading-tight">{diff.desc}</div>
                  {difficulty === diff.id && (
                    <div className="mt-2">
                      <Check className="w-3.5 h-3.5 text-primary" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={handleStart}
          disabled={!username.trim() || !difficulty || createUserMutation.isPending}
          className="w-full py-5 rounded-2xl font-bold text-xl bg-primary text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all duration-200"
        >
          {createUserMutation.isPending ? "준비중..." : "투자 시작하기"}
        </button>
      </motion.div>
    </div>
  );
}
