import { useMissions } from "@/hooks/use-missions";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { CheckCircle2, Star, TrendingUp, Zap, BookOpen, Gift } from "lucide-react";
import { Link, useLocation } from "wouter";

const COIN_ICON = "🪙";

interface MissionRowProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
  points: number;
  done: boolean;
  actionLabel?: string;
  onAction?: () => void;
  color: string;
}

function MissionRow({ icon, title, desc, points, done, actionLabel, onAction, color, quizLink }: MissionRowProps & { quizLink?: boolean }) {
  const [, navigate] = useLocation();
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "flex items-center gap-4 p-4 rounded-2xl border-2 transition-all",
        done ? "bg-muted/40 border-border/30 opacity-80" : `border-border/50 bg-card hover:border-primary/20`
      )}
    >
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0", done ? "bg-muted" : color)}>
        {done ? <CheckCircle2 className="w-6 h-6 text-green-500" /> : icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={cn("font-bold text-foreground text-base", done && "line-through text-muted-foreground")}>{title}</p>
          <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-extrabold border border-primary/20">
            +{points}P
          </span>
        </div>
        <p className="text-sm text-muted-foreground font-medium mt-0.5">{desc}</p>
      </div>
      {!done && onAction && actionLabel && (
        <button
          onClick={onAction}
          className="flex-shrink-0 px-4 py-2 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 active:scale-95 transition-all shadow-sm shadow-primary/20"
        >
          {actionLabel}
        </button>
      )}
      {!done && !onAction && quizLink && actionLabel && (
        <button
          onClick={() => navigate("/tips?tab=quiz")}
          className="flex-shrink-0 px-4 py-2 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 active:scale-95 transition-all shadow-sm"
        >
          {actionLabel}
        </button>
      )}
    </motion.div>
  );
}

interface DailyMissionsProps {
  userId?: number;
}

export default function DailyMissions({ userId: _userId }: DailyMissionsProps) {
  const { missions, coins, justEarnedCoin, claimCoin, checkAttendance } = useMissions();

  const totalRequired = 100;
  const pct = Math.min(100, (missions.points / totalRequired) * 100);
  const isComplete = missions.points >= totalRequired;
  const canClaim = isComplete && !missions.coinClaimed;

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="px-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">일일 미션</h1>
        <p className="text-muted-foreground font-medium mt-1">매일 미션을 완료하고 아바타 코인을 받으세요!</p>
      </div>

      {/* 포인트 프로그레스 카드 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-gradient-to-br from-primary to-primary/80 rounded-3xl p-6 text-white shadow-lg shadow-primary/20"
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-white/80 font-semibold text-sm">오늘의 포인트</p>
            <p className="text-4xl font-extrabold mt-0.5">
              {missions.points}
              <span className="text-2xl text-white/60 ml-1">/ 100P</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-white/70 text-xs font-semibold mb-1">보유 코인</p>
            <p className="text-2xl font-extrabold">{COIN_ICON} {coins}</p>
          </div>
        </div>

        <div className="h-3 bg-white/20 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-white rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          />
        </div>

        {missions.coinClaimed ? (
          <p className="mt-3 text-sm font-bold text-white/90">✅ 오늘 코인을 이미 받았습니다!</p>
        ) : isComplete ? (
          <p className="mt-3 text-sm font-bold text-yellow-200">🎉 미션 완료! 아래에서 코인을 받으세요.</p>
        ) : (
          <p className="mt-3 text-sm font-semibold text-white/80">
            {totalRequired - missions.points}P 더 모으면 🪙 코인 1개 획득!
          </p>
        )}

        {/* 장식 원 */}
        <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/5 rounded-full" />
        <div className="absolute -bottom-4 right-8 w-20 h-20 bg-white/5 rounded-full" />
      </motion.div>

      {/* 코인 받기 버튼 */}
      <AnimatePresence>
        {canClaim && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={claimCoin}
            className="w-full py-4 bg-gradient-to-r from-yellow-400 to-amber-400 text-white rounded-2xl font-extrabold text-base shadow-lg shadow-amber-300/30 hover:from-yellow-500 hover:to-amber-500 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Gift className="w-5 h-5" />
            일일미션 완료 — 코인 1개 받기!
          </motion.button>
        )}
      </AnimatePresence>

      {/* 코인 획득 알림 */}
      <AnimatePresence>
        {justEarnedCoin && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -10 }}
            className="bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-4 flex items-center gap-3"
          >
            <Gift className="w-8 h-8 text-yellow-500 flex-shrink-0" />
            <div>
              <p className="font-extrabold text-yellow-700">🎉 아바타 코인 1개 지급!</p>
              <p className="text-xs text-yellow-600 font-medium">뽑기 상점에서 캐릭터 카드를 뽑아보세요!</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 미션 목록 */}
      <div className="space-y-3">
        <h2 className="font-extrabold text-foreground px-1">오늘의 미션</h2>

        <MissionRow
          icon={<Star className="w-6 h-6 text-yellow-500" />}
          title="출석 체크"
          desc="오늘 하루 첫 방문 인증"
          points={30}
          done={missions.attendance}
          color="bg-yellow-50"
          actionLabel="출석 체크하기"
          onAction={checkAttendance}
        />

        <MissionRow
          icon={<TrendingUp className="w-6 h-6 text-primary" />}
          title="매수 및 매도"
          desc="종목을 매수하거나 매도하면 달성"
          points={30}
          done={missions.trade}
          color="bg-primary/10"
        />

        <MissionRow
          icon={<BookOpen className="w-6 h-6 text-sky-500" />}
          title="투자 퀴즈 풀기"
          desc="주식 학습 퀴즈에서 2문제 이상 정답 맞추기"
          points={40}
          done={missions.quiz}
          color="bg-sky-50"
          actionLabel="퀴즈 풀기"
          quizLink={true}
        />
      </div>

      {/* 코인으로 아바타 아이템 구매 안내 */}
      <div className="bg-gradient-to-r from-sky-400 to-blue-400 rounded-3xl p-5 text-white shadow-lg shadow-blue-300/20">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-extrabold">아바타 코인 사용처</p>
            <p className="text-xs text-white/80 font-medium">코인으로 아바타 아이템 잠금 해제!</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3 text-center text-xs font-bold">
          {[
            { label: "초보 아이템", cost: "무료" },
            { label: "중수 아이템", cost: "🪙 1~2개" },
            { label: "고수 아이템", cost: "🪙 3~5개" },
          ].map(({ label, cost }) => (
            <div key={label} className="bg-white/15 rounded-xl p-2">
              <p className="text-white/80">{label}</p>
              <p className="text-white mt-0.5">{cost}</p>
            </div>
          ))}
        </div>
        <Link href="/gacha">
          <button className="mt-4 w-full py-3 bg-white text-violet-600 rounded-2xl font-extrabold text-sm hover:bg-violet-50 active:scale-95 transition-all">
            뽑기 상점 바로 가기 →
          </button>
        </Link>
      </div>
    </div>
  );
}
