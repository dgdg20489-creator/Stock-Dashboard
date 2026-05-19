import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, RefreshCw, CheckCircle, Lock, Clock } from "lucide-react";
import { Avatar3D } from "@/components/Avatar3D";
import type { EquippedItems } from "@/hooks/use-equipped";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

// 성향별 카드 이미지 — 나중에 이미지 추가 시 여기에 경로 넣으면 바로 적용됨
const STYLE_CARD_IMAGE: Record<string, string | null> = {
  defensive: "/card_defensive_basic.png",
  aggressive: null,  // 이미지 받으면 "/card_aggressive_basic.png" 추가
  neutral: null,     // 이미지 받으면 "/card_neutral_basic.png" 추가
};

interface StyleResult {
  styleType: "aggressive" | "defensive" | "neutral";
  styleLabel: string;
  styleEmoji: string;
  styleColor: string;
  reason: string;
  newAvatar: string;
}

const STYLE_META = {
  aggressive: {
    label: "공격형",
    emoji: "🔥",
    color: "#FF4020",
    bg: "#FF402015",
    border: "#FF402040",
    tagline: "고수익 고위험",
    desc: "과감한 베팅으로 최대 수익을 노리는 투자 스타일이에요.",
  },
  defensive: {
    label: "안정형",
    emoji: "🛡️",
    color: "#208050",
    bg: "#20805015",
    border: "#20805040",
    tagline: "원금 보전 우선",
    desc: "손실 최소화를 최우선으로, 보수적으로 자산을 지키는 스타일이에요.",
  },
  neutral: {
    label: "중립형",
    emoji: "⚖️",
    color: "#2060CC",
    bg: "#2060CC15",
    border: "#2060CC40",
    tagline: "균형 잡힌 투자",
    desc: "리스크와 수익의 균형을 잘 추구하는 안정적 성장 스타일이에요.",
  },
};

const EMPTY_EQUIPPED: EquippedItems = {};

interface InvestmentStyleAnalyzerProps {
  userId: number;
  currentAvatar: string;
  gender: string;
  firstTradeDate?: string;
}

export function InvestmentStyleAnalyzer({ userId, currentAvatar, gender, firstTradeDate }: InvestmentStyleAnalyzerProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StyleResult | null>(null);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState("");
  const qc = useQueryClient();

  const genderSuffix = gender === "여" || gender === "녀" || currentAvatar?.endsWith("_f") ? "f" : "m";
  const avatarGender: "male" | "female" = genderSuffix === "f" ? "female" : "male";

  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const firstDate = firstTradeDate ? new Date(firstTradeDate) : null;
  const elapsed = firstDate ? Date.now() - firstDate.getTime() : 0;
  const isLocked = !firstDate || elapsed < sevenDaysMs;
  const daysLeft = firstDate
    ? Math.max(1, Math.ceil((sevenDaysMs - elapsed) / (24 * 60 * 60 * 1000)))
    : 7;

  const analyze = async () => {
    if (isLocked) return;
    setLoading(true);
    setResult(null);
    setApplied(false);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/ai-advisor/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.message ?? "분석에 실패했습니다. 잠시 후 다시 시도해주세요.");
        return;
      }
      const data = await res.json();
      const rp = data.riskProfile as { profile: string; label: string; reason: string };

      let styleType: "aggressive" | "defensive" | "neutral";
      if (rp.profile === "aggressive") styleType = "aggressive";
      else if (rp.profile === "defensive") styleType = "defensive";
      else styleType = "neutral";

      const meta = STYLE_META[styleType];
      const newAvatar = `${styleType}_${genderSuffix}`;

      setResult({
        styleType,
        styleLabel: meta.label,
        styleEmoji: meta.emoji,
        styleColor: meta.color,
        reason: rp.reason,
        newAvatar,
      });
    } catch {
      setError("서버 연결에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const applyAvatar = async () => {
    if (!result) return;
    setApplying(true);
    try {
      const res = await fetch(`${API_BASE}/api/users/${userId}/avatar`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar: result.newAvatar }),
      });
      if (!res.ok) {
        setError("캐릭터 적용에 실패했습니다.");
        return;
      }
      setApplied(true);
      qc.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
    } catch {
      setError("서버 연결에 실패했습니다.");
    } finally {
      setApplying(false);
    }
  };

  const isBasicAvatar = currentAvatar?.startsWith("basic");
  const resultMeta = result ? STYLE_META[result.styleType] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.07 }}
      className="bg-card rounded-3xl p-4 border border-border/50 shadow-sm"
    >
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-5 h-5 text-violet-500" />
        <h3 className="text-lg font-extrabold text-foreground">투자 성향 분석</h3>
        {!isBasicAvatar && (
          <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-600">
            성향 캐릭터 보유 중
          </span>
        )}
      </div>

      {/* 에러 */}
      {error && (
        <div className="mb-3 px-3 py-2 bg-red-50 rounded-xl border border-red-200">
          <p className="text-xs text-red-600 font-semibold">{error}</p>
        </div>
      )}

      {/* 분석 결과 */}
      <AnimatePresence mode="wait">
        {result && resultMeta && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="mb-3 rounded-2xl border overflow-hidden"
            style={{ borderColor: resultMeta.border }}
          >
            {/* 카드 이미지 or 3D 아바타 */}
            {STYLE_CARD_IMAGE[result.styleType] ? (
              <div className="w-full overflow-hidden" style={{ maxHeight: 220 }}>
                <img
                  src={STYLE_CARD_IMAGE[result.styleType]!}
                  alt={`${result.styleLabel} 카드`}
                  className="w-full object-cover object-top"
                  style={{ maxHeight: 220 }}
                />
              </div>
            ) : (
              <div className="w-full h-44" style={{ background: "linear-gradient(170deg, #071a10 0%, #0d2b1a 45%, #071a10 100%)" }}>
                <Avatar3D equipped={EMPTY_EQUIPPED} avatar={avatarGender} className="w-full h-full" />
              </div>
            )}

            {/* 성향 정보 */}
            <div className="p-3" style={{ background: resultMeta.bg }}>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-base">{result.styleEmoji}</span>
                <span className="font-extrabold text-sm" style={{ color: result.styleColor }}>
                  {result.styleLabel}
                </span>
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-md text-white"
                  style={{ background: result.styleColor }}
                >
                  {resultMeta.tagline}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed mb-1">{resultMeta.desc}</p>
              <p className="text-[11px] text-foreground/80 leading-relaxed font-medium border-t border-border/30 pt-1 mt-1">
                {result.reason}
              </p>

              {/* 적용 버튼 */}
              <div className="mt-3">
                {applied ? (
                  <div className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-green-50 border border-green-200">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-bold text-green-700">캐릭터가 적용되었어요!</span>
                  </div>
                ) : (
                  <button
                    onClick={applyAvatar}
                    disabled={applying}
                    className={cn(
                      "w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all",
                      applying ? "opacity-60 cursor-not-allowed" : "hover:opacity-90 active:scale-[0.98]"
                    )}
                    style={{ background: `linear-gradient(135deg, ${result.styleColor}, ${result.styleColor}CC)` }}
                  >
                    {applying ? (
                      <span className="flex items-center justify-center gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        적용 중...
                      </span>
                    ) : (
                      `이 캐릭터 적용하기 ${result.styleEmoji}`
                    )}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 분석 버튼 */}
      {isLocked ? (
        <div className="w-full py-3 rounded-2xl border border-border/50 bg-muted/40 flex flex-col items-center justify-center gap-1">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-bold text-muted-foreground">
              {firstDate ? `${daysLeft}일 후 해금` : "첫 거래 후 7일 뒤 해금"}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground">
            {firstDate
              ? `거래 시작일로부터 7일이 지나야 분석할 수 있어요`
              : "먼저 주식을 거래해보세요"}
          </p>
        </div>
      ) : (
        <button
          onClick={analyze}
          disabled={loading}
          className={cn(
            "w-full py-3 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2",
            loading
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:opacity-90 active:scale-[0.98] shadow-md shadow-violet-200"
          )}
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              AI가 분석 중이에요...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              {result ? "다시 분석하기" : "내 투자 성향 분석하기"}
            </>
          )}
        </button>
      )}
      <p className="text-[10px] text-muted-foreground text-center mt-2">
        보유 주식·거래 내역을 AI가 분석해 성향 캐릭터를 추천해드려요
      </p>
    </motion.div>
  );
}
