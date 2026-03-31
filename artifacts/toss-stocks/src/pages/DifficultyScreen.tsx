import { useState } from "react";
import { motion } from "framer-motion";
import { useCreateUser } from "@workspace/api-client-react";
import { GameAvatar, AVATAR_LIST, type AvatarId } from "@/components/GameAvatar";

type DifficultyType = "beginner" | "intermediate" | "expert";

interface DifficultyScreenProps {
  onComplete: (userId: number) => void;
}

export default function DifficultyScreen({ onComplete }: DifficultyScreenProps) {
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState<AvatarId>("warrior_m");
  const [difficulty, setDifficulty] = useState<DifficultyType | null>(null);

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
    { id: "beginner",     title: "초보", seed: "1,000만 원", desc: "여유롭게 시작하는 투자", emoji: "🌱", color: "emerald" },
    { id: "intermediate", title: "중수", seed: "500만 원",   desc: "적당한 긴장감과 수익",   emoji: "🌿", color: "blue" },
    { id: "expert",       title: "고수", seed: "100만 원",   desc: "실력으로 승부하는 챌린지", emoji: "🔥", color: "red" },
  ];

  const maleAvatars = AVATAR_LIST.filter(a => a.gender === "남");
  const femaleAvatars = AVATAR_LIST.filter(a => a.gender === "녀");

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white rounded-3xl mx-auto flex items-center justify-center shadow-lg mb-6 p-1">
            <img src="/wonkwang-logo.png" alt="원광대학교 로고" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2 tracking-tight">원광증권 모의투자</h1>
          <p className="text-muted-foreground font-medium">프로필과 난이도를 설정하고 투자를 시작해보세요</p>
        </div>

        <div className="bg-card p-6 rounded-[2rem] shadow-xl border border-border/50 mb-6 space-y-6">
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

          {/* Avatar Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-foreground">캐릭터 선택</label>

            {/* Selected preview */}
            {avatar && (
              <div className="flex items-center gap-4 p-3 bg-primary/5 rounded-2xl border border-primary/20 mb-2">
                <GameAvatar avatarId={avatar} size={72} rounded="rounded-xl" />
                <div>
                  <p className="font-bold text-foreground">
                    {AVATAR_LIST.find(a => a.id === avatar)?.class} {AVATAR_LIST.find(a => a.id === avatar)?.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {AVATAR_LIST.find(a => a.id === avatar)?.gender === "남" ? "남성 캐릭터" : "여성 캐릭터"}
                  </p>
                </div>
              </div>
            )}

            {/* Male row */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">남성</p>
              <div className="grid grid-cols-4 gap-2">
                {maleAvatars.map((av) => (
                  <button
                    key={av.id}
                    onClick={() => setAvatar(av.id)}
                    className={`flex flex-col items-center gap-1 p-1.5 rounded-xl border-2 transition-all ${
                      avatar === av.id
                        ? "border-primary bg-primary/8 shadow-md shadow-primary/20 scale-105"
                        : "border-border/50 hover:border-primary/40 bg-card/50 hover:scale-102"
                    }`}
                  >
                    <GameAvatar avatarId={av.id} size={56} rounded="rounded-lg" />
                    <span className="text-[9px] font-bold text-muted-foreground leading-none">{av.class} {av.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Female row */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">여성</p>
              <div className="grid grid-cols-4 gap-2">
                {femaleAvatars.map((av) => (
                  <button
                    key={av.id}
                    onClick={() => setAvatar(av.id)}
                    className={`flex flex-col items-center gap-1 p-1.5 rounded-xl border-2 transition-all ${
                      avatar === av.id
                        ? "border-primary bg-primary/8 shadow-md shadow-primary/20 scale-105"
                        : "border-border/50 hover:border-primary/40 bg-card/50 hover:scale-102"
                    }`}
                  >
                    <GameAvatar avatarId={av.id} size={56} rounded="rounded-lg" />
                    <span className="text-[9px] font-bold text-muted-foreground leading-none">{av.class} {av.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Difficulty Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-foreground">난이도 선택 (초기 자산)</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {difficulties.map((diff) => (
                <button
                  key={diff.id}
                  onClick={() => setDifficulty(diff.id)}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${
                    difficulty === diff.id
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-primary/30 bg-card"
                  }`}
                >
                  <div className="text-2xl mb-2">{diff.emoji}</div>
                  <div className="font-bold text-base text-foreground mb-1">{diff.title}</div>
                  <div className="text-primary font-bold text-sm mb-1">{diff.seed}</div>
                  <div className="text-xs text-muted-foreground font-medium">{diff.desc}</div>
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
