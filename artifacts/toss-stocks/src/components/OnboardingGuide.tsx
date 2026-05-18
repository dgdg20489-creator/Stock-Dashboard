import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, X, TrendingUp, Trophy, Brain, Shirt, Sparkles, Check } from "lucide-react";

interface Props {
  onComplete: () => void;
}

const QUIZ = {
  question: "📈 PER(주가수익비율)이란 무엇인가요?",
  options: [
    "주가를 하루 거래량으로 나눈 값",
    "주가를 주당순이익(EPS)으로 나눈 값",
    "시가총액을 매출액으로 나눈 값",
    "전일 종가 대비 등락폭",
  ],
  answer: 1,
  explanation: "PER = 주가 ÷ EPS(주당순이익). PER이 낮을수록 저평가된 주식일 수 있어요!",
};

const slides = [
  { id: "welcome" },
  { id: "trading" },
  { id: "ranking" },
  { id: "quiz" },
  { id: "avatar" },
  { id: "start" },
];

export default function OnboardingGuide({ onComplete }: Props) {
  const [page, setPage] = useState(0);
  const [dir, setDir] = useState(1);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const total = slides.length;

  const go = (next: number) => {
    setDir(next > page ? 1 : -1);
    setPage(next);
  };

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 340 : -340, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -340 : 340, opacity: 0 }),
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* 블러 배경 */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* 카드 */}
      <div className="relative w-full max-w-sm mx-4 flex flex-col" style={{ height: 560 }}>
        {/* 상단: 건너뛰기 버튼만 */}
        <div className="flex items-center justify-end mb-3">
          <button
            onClick={onComplete}
            className="flex items-center gap-1 text-white/50 text-xs font-semibold hover:text-white/80 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            건너뛰기
          </button>
        </div>

        {/* 슬라이드 카드 */}
        <div className="relative flex-1 overflow-hidden rounded-2xl">
          <AnimatePresence custom={dir} mode="popLayout">
            <motion.div
              key={page}
              custom={dir}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 340, damping: 32, mass: 0.9 }}
              className="absolute inset-0"
            >
              {page === 0 && <SlideWelcome />}
              {page === 1 && <SlideTrading />}
              {page === 2 && <SlideRanking />}
              {page === 3 && (
                <SlideQuiz
                  answer={quizAnswer}
                  setAnswer={setQuizAnswer}
                  submitted={quizSubmitted}
                  setSubmitted={setQuizSubmitted}
                />
              )}
              {page === 4 && <SlideAvatar />}
              {page === 5 && <SlideStart onComplete={onComplete} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 하단 버튼 */}
        {page < total - 1 && (
          <div className="flex items-center justify-between mt-3 px-1">
            <button
              onClick={() => go(page - 1)}
              disabled={page === 0}
              className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-semibold text-white/60 hover:text-white disabled:opacity-0 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              이전
            </button>

            <div />

            <button
              onClick={() => go(page + 1)}
              className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all shadow-lg"
            >
              다음
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── 슬라이드 1: 환영 ───────────────────────────────── */
function SlideWelcome() {
  return (
    <div className="h-full bg-gradient-to-br from-green-50 via-white to-green-100/40 rounded-2xl flex flex-col items-center justify-center p-7 text-center relative overflow-hidden border border-green-100">
      {/* 씨앗 장식 배경 */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 4 + (i % 3) * 2,
            height: 4 + (i % 3) * 2,
            left: `${(i * 37 + 11) % 95}%`,
            top: `${(i * 53 + 7) % 90}%`,
            backgroundColor: i % 2 === 0 ? "hsl(142 65% 36% / 0.12)" : "hsl(262 75% 56% / 0.10)",
          }}
          animate={{ opacity: [0.3, 0.8, 0.3], scale: [1, 1.2, 1] }}
          transition={{ duration: 2 + i * 0.3, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}

      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", delay: 0.1 }}
        className="w-20 h-20 rounded-2xl bg-white border border-green-100 shadow-lg flex items-center justify-center mb-5"
      >
        <img src="/seed-logo.png" alt="seed" className="w-16 h-16 object-contain p-1" />
      </motion.div>

      <motion.h1
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-2xl font-extrabold text-gray-900 mb-2 leading-tight"
      >
        seed<br />모의투자에 오신 것을<br />환영합니다! 🌱
      </motion.h1>

      <motion.p
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-gray-500 text-sm leading-relaxed mb-6"
      >
        실제 한국 주식 시장 데이터로<br />투자 실력을 키워보세요
      </motion.p>

      <motion.div
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-3 gap-3 w-full"
      >
        {[
          { icon: "📊", label: "2,400+", sub: "실시간 종목" },
          { icon: "🏆", label: "랭킹", sub: "경쟁 시스템" },
          { icon: "🤖", label: "AI 비서", sub: "투자 조언" },
        ].map((item) => (
          <div key={item.label} className="bg-green-50 border border-green-100 rounded-xl px-2 py-3 text-center">
            <div className="text-xl mb-1">{item.icon}</div>
            <div className="text-gray-800 text-xs font-bold">{item.label}</div>
            <div className="text-gray-400 text-[10px]">{item.sub}</div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

/* ── 슬라이드 2: 매수/매도 ──────────────────────────── */
function SlideTrading() {
  const [tab, setTab] = useState<"buy" | "sell">("buy");
  const buySteps = [
    { num: "1", text: "홈에서 원하는 종목 검색·터치" },
    { num: "2", text: "종목 상세 → 하단 '매수' 버튼 탭" },
    { num: "3", text: "수량 입력 후 '매수 확인'" },
  ];
  const sellSteps = [
    { num: "1", text: "홈에서 보유 종목 터치" },
    { num: "2", text: "종목 상세 → 하단 '매도' 버튼 탭" },
    { num: "3", text: "수량 입력 후 '매도 확인'" },
  ];
  const steps = tab === "buy" ? buySteps : sellSteps;

  return (
    <div className="h-full bg-white rounded-2xl flex flex-col overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 pt-6 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-5 h-5 text-white" />
          <span className="text-white/80 text-xs font-semibold">거래 방법</span>
        </div>
        <h2 className="text-xl font-extrabold text-white">주식 사고 팔기</h2>
        <p className="text-white/70 text-xs mt-1">간단한 3단계로 누구나 쉽게!</p>

        <div className="flex gap-2 mt-4">
          {(["buy", "sell"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                tab === t ? "bg-white text-blue-600" : "bg-white/20 text-white"
              }`}
            >
              {t === "buy" ? "🔴 매수 (사기)" : "🔵 매도 (팔기)"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-5 flex flex-col gap-3 overflow-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, x: tab === "buy" ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-3"
          >
            {steps.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-extrabold text-white flex-shrink-0 ${tab === "buy" ? "bg-red-500" : "bg-blue-500"}`}>
                  {s.num}
                </div>
                <p className="text-sm font-semibold text-gray-700">{s.text}</p>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        <div className={`mt-auto rounded-xl px-4 py-3 text-xs font-semibold leading-relaxed ${tab === "buy" ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"}`}>
          {tab === "buy"
            ? "💡 한국 주식은 빨강=상승, 파랑=하락이에요. 매수 전 차트와 뉴스를 꼭 확인하세요!"
            : "💡 매도 시 수익이 발생하면 순위가 올라가요. 타이밍이 중요합니다!"}
        </div>
      </div>
    </div>
  );
}

/* ── 슬라이드 3: 랭킹 & 승급 ────────────────────────── */
function SlideRanking() {
  const levels = [
    { icon: "🌱", name: "초보", seed: "1,000만원", up: "+20% 달성 시 승급", color: "bg-emerald-50 border-emerald-200", badge: "bg-emerald-500" },
    { icon: "🌿", name: "중수", seed: "500만원", up: "+50% 달성 시 승급", color: "bg-blue-50 border-blue-200", badge: "bg-blue-500" },
    { icon: "🔥", name: "고수", seed: "100만원", up: "최정상 도전!", color: "bg-orange-50 border-orange-200", badge: "bg-orange-500" },
  ];

  return (
    <div className="h-full bg-white rounded-2xl flex flex-col overflow-hidden">
      <div className="bg-gradient-to-r from-yellow-500 to-orange-500 px-6 pt-6 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <Trophy className="w-5 h-5 text-white" />
          <span className="text-white/80 text-xs font-semibold">경쟁 시스템</span>
        </div>
        <h2 className="text-xl font-extrabold text-white">랭킹 & 승급 시스템</h2>
        <p className="text-white/80 text-xs mt-1">수익률로 경쟁하고 등급을 올려보세요!</p>
      </div>

      <div className="flex-1 p-5 flex flex-col gap-3 overflow-auto">
        {levels.map((lv, i) => (
          <motion.div
            key={lv.name}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`flex items-center gap-3 rounded-xl px-4 py-3 border ${lv.color}`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0 ${lv.badge} bg-opacity-10`}>
              {lv.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-gray-800">{lv.name}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white bg-gray-400">{lv.seed} 시드</span>
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5">{lv.up}</p>
            </div>
            {i < 2 && <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />}
          </motion.div>
        ))}

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-xs font-semibold text-yellow-800 leading-relaxed"
        >
          ⚠️ 수익률이 <strong>-20% 이하</strong>로 떨어지면 강등될 수 있어요.<br />
          🏅 랭킹은 초보/중수/고수 등급별로 따로 집계됩니다!
        </motion.div>
      </div>
    </div>
  );
}

/* ── 슬라이드 4: 주식 용어 퀴즈 ─────────────────────── */
function SlideQuiz({
  answer, setAnswer, submitted, setSubmitted,
}: {
  answer: number | null;
  setAnswer: (n: number) => void;
  submitted: boolean;
  setSubmitted: (b: boolean) => void;
}) {
  const isCorrect = answer === QUIZ.answer;

  return (
    <div className="h-full bg-white rounded-2xl flex flex-col overflow-hidden">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 pt-6 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <Brain className="w-5 h-5 text-white" />
          <span className="text-white/80 text-xs font-semibold">주식 용어 퀴즈</span>
        </div>
        <h2 className="text-xl font-extrabold text-white">도전! 퀴즈</h2>
        <p className="text-white/70 text-xs mt-1">기초 용어를 알면 투자가 더 쉬워져요</p>
      </div>

      <div className="flex-1 p-5 flex flex-col gap-3 overflow-auto">
        <div className="bg-purple-50 rounded-xl px-4 py-3 text-sm font-bold text-purple-800 leading-relaxed">
          {QUIZ.question}
        </div>

        <div className="flex flex-col gap-2">
          {QUIZ.options.map((opt, i) => {
            let style = "bg-gray-50 border-gray-200 text-gray-700";
            if (submitted) {
              if (i === QUIZ.answer) style = "bg-green-50 border-green-400 text-green-800";
              else if (i === answer && i !== QUIZ.answer) style = "bg-red-50 border-red-400 text-red-800";
              else style = "bg-gray-50 border-gray-200 text-gray-400";
            } else if (answer === i) {
              style = "bg-indigo-50 border-indigo-400 text-indigo-800";
            }

            return (
              <button
                key={i}
                onClick={() => !submitted && setAnswer(i)}
                disabled={submitted}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm font-semibold text-left transition-all ${style}`}
              >
                <span className="w-5 h-5 rounded-full border flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ borderColor: "currentColor" }}>
                  {submitted && i === QUIZ.answer ? <Check className="w-3 h-3" /> : String.fromCharCode(65 + i)}
                </span>
                {opt}
              </button>
            );
          })}
        </div>

        <AnimatePresence>
          {!submitted && answer !== null && (
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setSubmitted(true)}
              className="py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-500 transition-colors active:scale-95"
            >
              정답 확인
            </motion.button>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {submitted && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`rounded-xl px-4 py-3 text-xs font-semibold leading-relaxed ${isCorrect ? "bg-green-50 text-green-800 border border-green-200" : "bg-orange-50 text-orange-800 border border-orange-200"}`}
            >
              {isCorrect ? "🎉 정답! " : "💡 아깝네요! 정답은 B예요. "}
              {QUIZ.explanation}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ── 슬라이드 5: 아바타 & AI 비서 ───────────────────── */
function SlideAvatar() {
  const features = [
    {
      icon: "👗",
      title: "아바타 & 옷장",
      desc: "수익을 올리면 포인트로 아바타 아이템을 구매할 수 있어요! 등급에 따라 전용 아이템이 열려요.",
      color: "bg-pink-50 border-pink-200",
      tag: "bg-pink-500",
    },
    {
      icon: "🤖",
      title: "AI 투자 비서",
      desc: "내 포트폴리오를 AI가 분석해 위험도·섹터 분포·추천 종목 3개를 알려줘요. (내정보 탭)",
      color: "bg-blue-50 border-blue-200",
      tag: "bg-blue-500",
    },
    {
      icon: "📰",
      title: "종목 뉴스 & 감성 분석",
      desc: "실시간 뉴스와 AI 호재/악재 감성 분석으로 시장 흐름을 빠르게 파악하세요.",
      color: "bg-amber-50 border-amber-200",
      tag: "bg-amber-500",
    },
  ];

  return (
    <div className="h-full bg-white rounded-2xl flex flex-col overflow-hidden">
      <div className="bg-gradient-to-r from-pink-500 to-rose-500 px-6 pt-6 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <Shirt className="w-5 h-5 text-white" />
          <span className="text-white/80 text-xs font-semibold">숨겨진 기능들</span>
        </div>
        <h2 className="text-xl font-extrabold text-white">더 재밌게 즐기기</h2>
        <p className="text-white/70 text-xs mt-1">다양한 기능으로 투자를 더 풍성하게!</p>
      </div>

      <div className="flex-1 p-5 flex flex-col gap-3 overflow-auto">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`flex gap-3 rounded-xl p-4 border ${f.color}`}
          >
            <div className="text-2xl flex-shrink-0 mt-0.5">{f.icon}</div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-extrabold text-gray-800">{f.title}</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded text-white ${f.tag}`}>NEW</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">{f.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ── 슬라이드 6: 시작하기 ───────────────────────────── */
function SlideStart({ onComplete }: { onComplete: () => void }) {
  return (
    <div className="h-full bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-2xl flex flex-col items-center justify-center p-7 text-center relative overflow-hidden">
      {/* 배경 장식 원 */}
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/5 rounded-full" />
      <div className="absolute -bottom-20 -left-12 w-56 h-56 bg-white/5 rounded-full" />

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", delay: 0.15, stiffness: 200 }}
        className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mb-5 shadow-2xl"
      >
        <Sparkles className="w-10 h-10 text-blue-600" />
      </motion.div>

      <motion.h2
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-2xl font-extrabold text-white mb-3 leading-tight"
      >
        이제 준비 완료!<br />투자를 시작해봐요 🚀
      </motion.h2>

      <motion.p
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-white/70 text-sm leading-relaxed mb-7"
      >
        실제 2026 시장 데이터로<br />나만의 투자 전략을 만들어보세요.<br />
        <span className="text-white/50 text-xs">가이드는 언제든지 내정보 탭에서 다시 볼 수 있어요.</span>
      </motion.p>

      <motion.div
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-3 gap-2 w-full mb-6"
      >
        {[
          { emoji: "📈", label: "종목 탐색" },
          { emoji: "💼", label: "포트폴리오" },
          { emoji: "🏆", label: "랭킹 도전" },
        ].map((item) => (
          <div key={item.label} className="bg-white/15 rounded-xl py-3 text-center">
            <div className="text-xl mb-1">{item.emoji}</div>
            <div className="text-white text-[11px] font-bold">{item.label}</div>
          </div>
        ))}
      </motion.div>

      <motion.button
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: "spring" }}
        onClick={onComplete}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        className="w-full py-4 bg-white text-blue-700 rounded-2xl font-extrabold text-lg shadow-2xl hover:shadow-white/20 transition-all"
      >
        시작하기 🎯
      </motion.button>
    </div>
  );
}
