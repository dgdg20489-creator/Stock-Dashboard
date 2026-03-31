import { useState } from "react";
import { motion } from "framer-motion";
import { useCreateUser } from "@workspace/api-client-react";

type AvatarType = "male" | "female";
type DifficultyType = "beginner" | "intermediate" | "expert";

interface DifficultyScreenProps {
  onComplete: (userId: number) => void;
}

export default function DifficultyScreen({ onComplete }: DifficultyScreenProps) {
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState<AvatarType>("male");
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

  const difficulties: { id: DifficultyType; title: string; seed: string; desc: string; emoji: string }[] = [
    { id: "beginner", title: "초보", seed: "1,000만 원", desc: "여유롭게 시작하는 투자", emoji: "🌱" },
    { id: "intermediate", title: "중수", seed: "500만 원", desc: "적당한 긴장감과 수익", emoji: "🌿" },
    { id: "expert", title: "고수", seed: "100만 원", desc: "실력으로 승부하는 챌린지", emoji: "🔥" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-br from-red-700 to-red-500 rounded-3xl mx-auto flex items-center justify-center shadow-lg mb-6 p-2">
            <img src="/phoenix-logo.svg" alt="원광증권 봉황" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-3 tracking-tight">원광증권 모의투자</h1>
          <p className="text-muted-foreground font-medium text-lg">프로필과 난이도를 설정하고 투자를 시작해보세요</p>
        </div>

        <div className="bg-card p-8 rounded-[2rem] shadow-xl border border-border/50 mb-8 space-y-8">
          <div className="space-y-4">
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

          <div className="space-y-4">
            <label className="block text-sm font-bold text-foreground">아바타 선택</label>
            <div className="flex gap-4">
              {(["male", "female"] as AvatarType[]).map((av) => (
                <button
                  key={av}
                  onClick={() => setAvatar(av)}
                  className={`flex-1 py-4 text-4xl rounded-2xl border-2 transition-all ${
                    avatar === av ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/30 bg-card"
                  }`}
                >
                  {av === "male" ? "👨" : "👩"}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-bold text-foreground">난이도 선택 (초기 자산)</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {difficulties.map((diff) => (
                <button
                  key={diff.id}
                  onClick={() => setDifficulty(diff.id)}
                  className={`p-5 rounded-2xl border-2 text-left transition-all ${
                    difficulty === diff.id ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/30 bg-card"
                  }`}
                >
                  <div className="text-3xl mb-3">{diff.emoji}</div>
                  <div className="font-bold text-lg text-foreground mb-1">{diff.title}</div>
                  <div className="text-primary font-bold mb-2">{diff.seed}</div>
                  <div className="text-sm text-muted-foreground font-medium">{diff.desc}</div>
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
