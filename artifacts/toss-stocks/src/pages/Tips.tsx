import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, TrendingUp, BarChart2, DollarSign, ShieldCheck,
  Clock, Lightbulb, GraduationCap, CheckCircle2, XCircle,
  ChevronRight, Tag, Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMissions } from "@/hooks/use-missions";

type TabType = "tips" | "quiz";

/* ─────────────────────────────────────────────────
   주식 팁 데이터 (나중에 엑셀로 교체)
───────────────────────────────────────────────── */
interface TipItem {
  id: string;
  category: string;
  categoryColor: string;
  title: string;
  body: string;
  icon: typeof TrendingUp;
}

const TIPS_DATA: TipItem[] = [
  {
    id: "t1",
    category: "주식 기초",
    categoryColor: "bg-primary/10 text-primary",
    title: "PER(주가수익비율)이란?",
    body: "PER = 주가 ÷ 주당순이익(EPS). 낮을수록 이익 대비 저평가된 주식. 동종 업종 평균과 비교하는 것이 핵심입니다.",
    icon: TrendingUp,
  },
  {
    id: "t2",
    category: "차트 읽기",
    categoryColor: "bg-blue-500/10 text-blue-600",
    title: "캔들차트 기본 — 양봉 vs 음봉",
    body: "양봉(빨강)은 종가 > 시가, 음봉(파랑)은 종가 < 시가. 꼬리 길이가 길수록 변동성이 큰 날입니다.",
    icon: BarChart2,
  },
  {
    id: "t3",
    category: "투자 전략",
    categoryColor: "bg-green-500/10 text-green-600",
    title: "분산투자의 황금법칙",
    body: "한 종목에 전액 투자하지 말고, 5~10개 종목에 나눠 담으세요. 한 종목이 -50%여도 전체 손실은 -5~10%로 줄어듭니다.",
    icon: DollarSign,
  },
  {
    id: "t4",
    category: "리스크 관리",
    categoryColor: "bg-orange-500/10 text-orange-600",
    title: "손절선 설정하기 (-8% 원칙)",
    body: "매수가 대비 -8% 하락 시 손절하면 큰 손실을 막을 수 있습니다. 감정을 배제하고 원칙을 지키는 것이 중요합니다.",
    icon: ShieldCheck,
  },
  {
    id: "t5",
    category: "시장 타이밍",
    categoryColor: "bg-purple-500/10 text-purple-600",
    title: "매수는 공포, 매도는 탐욕일 때",
    body: "워런 버핏의 격언: '남들이 탐욕스러울 때 두려워하고, 남들이 두려워할 때 탐욕스러워져라.' 시장 공포는 매수 기회입니다.",
    icon: Clock,
  },
  {
    id: "t6",
    category: "주식 용어",
    categoryColor: "bg-cyan-500/10 text-cyan-600",
    title: "ROE(자기자본이익률) 읽는 법",
    body: "ROE = 당기순이익 ÷ 자기자본 × 100. 15% 이상이면 우량 기업으로 봅니다. 꾸준히 높은 ROE 기업이 좋은 투자처입니다.",
    icon: BookOpen,
  },
];

/* ─────────────────────────────────────────────────
   퀴즈 데이터 (나중에 엑셀로 교체)
   구조: { id, question, options[], answerIndex, explanation, difficulty }
───────────────────────────────────────────────── */
interface QuizItem {
  id: string;
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  difficulty: "쉬움" | "보통" | "어려움";
  category: string;
}

const QUIZ_DATA: QuizItem[] = [
  {
    id: "q1",
    question: "PER(주가수익비율)이 낮을수록 주식이 어떻다고 볼 수 있을까요?",
    options: [
      "고평가되어 있다",
      "저평가되어 있다",
      "수익성이 낮다",
      "배당금이 높다",
    ],
    answerIndex: 1,
    explanation: "PER = 주가 ÷ EPS(주당순이익)입니다. PER이 낮을수록 이익 대비 주가가 낮게 형성되어 있어 상대적으로 저평가 상태로 볼 수 있습니다. 단, 업종 평균과 비교해야 합니다.",
    difficulty: "쉬움",
    category: "주식 기초",
  },
  // 나중에 엑셀 데이터로 추가 예정
];

/* ─────────────────────────────────────────────────
   TipCard 컴포넌트
───────────────────────────────────────────────── */
function TipCard({ tip, index }: { tip: TipItem; index: number }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden"
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-4 p-5 text-left hover:bg-muted/20 transition-colors"
      >
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", tip.categoryColor)}>
          <tip.icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", tip.categoryColor)}>
              {tip.category}
            </span>
          </div>
          <p className="font-bold text-foreground text-sm leading-snug">{tip.title}</p>
        </div>
        <ChevronRight
          className={cn(
            "w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform duration-200",
            expanded && "rotate-90"
          )}
        />
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-0">
              <div className="h-px bg-border/40 mb-4" />
              <p className="text-sm text-muted-foreground leading-relaxed font-medium">{tip.body}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────
   QuizSection 컴포넌트
───────────────────────────────────────────────── */
type QuizPhase = "question" | "correct" | "wrong";

function QuizSection() {
  const { missions, completeQuiz } = useMissions();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [phase, setPhase] = useState<QuizPhase>("question");
  const [totalCorrect, setTotalCorrect] = useState(0);

  const quiz = QUIZ_DATA[currentIdx];
  const isLast = currentIdx === QUIZ_DATA.length - 1;
  const alreadyDone = missions.quiz;

  const handleSelect = (idx: number) => {
    if (phase !== "question") return;
    setSelected(idx);
    const correct = idx === quiz.answerIndex;
    setPhase(correct ? "correct" : "wrong");
    if (correct) {
      const newCount = totalCorrect + 1;
      setTotalCorrect(newCount);
      if (!alreadyDone) completeQuiz();
    }
  };

  const handleNext = () => {
    if (!isLast) {
      setCurrentIdx((i) => i + 1);
      setSelected(null);
      setPhase("question");
    }
  };

  const handleRetry = () => {
    setSelected(null);
    setPhase("question");
  };

  const difficultyColor = {
    "쉬움": "bg-green-50 text-green-600 border-green-200",
    "보통": "bg-yellow-50 text-yellow-600 border-yellow-200",
    "어려움": "bg-red-50 text-red-600 border-red-200",
  };

  return (
    <div className="space-y-4">
      {/* 미션 완료 배너 */}
      <AnimatePresence>
        {alreadyDone && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl px-5 py-3.5"
          >
            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
            <div>
              <p className="font-bold text-green-700 text-sm">오늘의 퀴즈 미션 완료! +40P 획득</p>
              <p className="text-xs text-green-600 font-medium">내일 새로운 퀴즈가 준비됩니다.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 퀴즈 카드 */}
      <motion.div
        key={currentIdx}
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-card rounded-3xl border border-border/50 shadow-sm overflow-hidden"
      >
        {/* 헤더 */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className={cn("text-[11px] font-bold px-2.5 py-1 rounded-full border", difficultyColor[quiz.difficulty])}>
              {quiz.difficulty}
            </span>
            <span className="text-[11px] font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
              {quiz.category}
            </span>
            <span className="ml-auto text-xs font-bold text-muted-foreground">
              {currentIdx + 1} / {QUIZ_DATA.length}
            </span>
          </div>
          <p className="text-base font-bold text-foreground leading-snug">{quiz.question}</p>
        </div>

        {/* 선택지 */}
        <div className="px-6 pb-4 space-y-2.5">
          {quiz.options.map((opt, i) => {
            const isAnswer = i === quiz.answerIndex;
            const isSelected = i === selected;
            let style = "border-border/60 bg-muted/30 text-foreground hover:border-primary/40 hover:bg-primary/5";
            if (phase !== "question") {
              if (isAnswer) style = "border-green-400 bg-green-50 text-green-700";
              else if (isSelected && !isAnswer) style = "border-red-300 bg-red-50 text-red-600";
              else style = "border-border/30 bg-muted/20 text-muted-foreground";
            }
            return (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                disabled={phase !== "question"}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 text-left text-sm font-semibold transition-all duration-150",
                  style,
                  phase === "question" && "cursor-pointer active:scale-[0.99]",
                  phase !== "question" && "cursor-default"
                )}
              >
                <span className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 border",
                  phase !== "question" && isAnswer ? "bg-green-500 text-white border-green-500" :
                  phase !== "question" && isSelected ? "bg-red-400 text-white border-red-400" :
                  "border-current"
                )}>
                  {String.fromCharCode(65 + i)}
                </span>
                {opt}
                {phase !== "question" && isAnswer && (
                  <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto flex-shrink-0" />
                )}
                {phase !== "question" && isSelected && !isAnswer && (
                  <XCircle className="w-4 h-4 text-red-400 ml-auto flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* 결과 & 해설 */}
        <AnimatePresence>
          {phase !== "question" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className={cn(
                "mx-6 mb-6 p-4 rounded-2xl border",
                phase === "correct"
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
              )}>
                <div className="flex items-center gap-2 mb-2">
                  {phase === "correct" ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <p className="font-extrabold text-green-700">정답입니다! {!alreadyDone && "+40P 획득"}</p>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                      <p className="font-extrabold text-red-600">오답입니다</p>
                    </>
                  )}
                </div>
                <p className="text-sm text-muted-foreground font-medium leading-relaxed">{quiz.explanation}</p>

                <div className="flex gap-2 mt-3">
                  {phase === "wrong" && (
                    <button
                      onClick={handleRetry}
                      className="flex-1 py-2.5 rounded-xl bg-white border border-red-200 text-red-600 font-bold text-sm hover:bg-red-50 transition-colors"
                    >
                      다시 풀기
                    </button>
                  )}
                  {!isLast && (
                    <button
                      onClick={handleNext}
                      className="flex-1 py-2.5 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-1"
                    >
                      다음 문제 <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                  {isLast && (
                    <div className="flex-1 py-2.5 rounded-xl bg-muted text-muted-foreground font-bold text-sm text-center">
                      🎉 모든 문제 완료!
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* 엑셀 연동 안내 */}
      <div className="flex items-center gap-3 bg-muted/50 rounded-2xl px-5 py-3.5 border border-dashed border-border">
        <Upload className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <p className="text-xs text-muted-foreground font-medium">
          퀴즈 문제는 엑셀 데이터와 연동하여 확장할 수 있습니다.
          <span className="ml-1 text-primary font-bold">현재 {QUIZ_DATA.length}문제 등록됨</span>
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   메인 Tips 페이지
───────────────────────────────────────────────── */
export default function Tips() {
  const [tab, setTab] = useState<TabType>("tips");
  const { missions } = useMissions();

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* 헤더 */}
      <div className="px-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">주식 팁 &amp; 퀴즈</h1>
        <p className="text-muted-foreground font-medium mt-1">투자 지식을 쌓고 미션 포인트를 획득하세요</p>
      </div>

      {/* 탭 */}
      <div className="flex gap-1 bg-muted p-1.5 rounded-2xl">
        <button
          onClick={() => setTab("tips")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all duration-200",
            tab === "tips" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Lightbulb className="w-4 h-4" />
          주식 팁
          <span className={cn(
            "text-[10px] font-extrabold px-1.5 py-0.5 rounded-full",
            tab === "tips" ? "bg-primary/10 text-primary" : "bg-background/60"
          )}>
            {TIPS_DATA.length}
          </span>
        </button>
        <button
          onClick={() => setTab("quiz")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all duration-200",
            tab === "quiz" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <GraduationCap className="w-4 h-4" />
          투자 퀴즈
          {missions.quiz ? (
            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-green-100 text-green-600">완료</span>
          ) : (
            <span className={cn(
              "text-[10px] font-extrabold px-1.5 py-0.5 rounded-full",
              tab === "quiz" ? "bg-blue-100 text-blue-600" : "bg-background/60 text-muted-foreground"
            )}>+40P</span>
          )}
        </button>
      </div>

      {/* 탭 콘텐츠 */}
      <AnimatePresence mode="wait">
        {tab === "tips" ? (
          <motion.div
            key="tips"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ duration: 0.18 }}
            className="space-y-4"
          >
            {/* 엑셀 연동 안내 */}
            <div className="flex items-center gap-3 bg-muted/50 rounded-2xl px-5 py-3.5 border border-dashed border-border">
              <Tag className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <p className="text-xs text-muted-foreground font-medium">
                팁 카드는 엑셀 데이터와 연동하여 확장할 수 있습니다.
                <span className="ml-1 text-primary font-bold">현재 {TIPS_DATA.length}개 팁 등록됨</span>
              </p>
            </div>

            {/* 팁 카드 목록 */}
            {TIPS_DATA.map((tip, i) => (
              <TipCard key={tip.id} tip={tip} index={i} />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="quiz"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.18 }}
          >
            <QuizSection />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
