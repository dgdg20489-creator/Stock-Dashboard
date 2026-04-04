import { useState, useEffect, useMemo } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";

import { useAuth } from "./hooks/use-auth";
import { useGetUser, useGetUserPortfolio } from "@workspace/api-client-react";
import { Layout } from "./components/Layout";
import DifficultyScreen from "./pages/DifficultyScreen";
import Home from "./pages/Home";
import StockDetail from "./pages/StockDetail";
import Rankings from "./pages/Rankings";
import MyInfo from "./pages/MyInfo";
import News from "./pages/News";
import Watchlist from "./pages/Watchlist";
import Wardrobe from "./pages/Wardrobe";
import DailyMissions from "./pages/DailyMissions";
import InvestorProfile from "./pages/InvestorProfile";
import Tips from "./pages/Tips";
import Ipo from "./pages/Ipo";
import Guide from "./pages/Guide";
import NotFound from "./pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, staleTime: 1000 * 60 * 5 } },
});

type NotifType = "promoted" | "demoted" | null;

const DIFFICULTY_META = {
  beginner:     { label: "초보", icon: "🌱", color: "text-green-700",  bg: "bg-green-50",  border: "border-green-200"  },
  intermediate: { label: "중수", icon: "🌿", color: "text-blue-700",   bg: "bg-blue-50",   border: "border-blue-200"   },
  expert:       { label: "고수", icon: "🔥", color: "text-yellow-700", bg: "bg-yellow-50", border: "border-yellow-200" },
};

const UNLOCK_MSG: Record<string, string> = {
  intermediate: "이제 중수 전용 아바타 아이템을 옷장에서 구매할 수 있어요! 🎭",
  expert:       "이제 고수 전용 프리미엄 아바타를 옷장에서 구매할 수 있어요! 👑",
};

// ── 금가루 파티클 ─────────────────────────────────────────────────
const GOLD_COLORS = ["#FFD700", "#FFC200", "#FFE066", "#FFAA00", "#FFF3A3", "#F5C518"];

function GoldParticle({ x, delay, size, color, angle }: {
  x: number; delay: number; size: number; color: string; angle: number;
}) {
  const dist = 160 + Math.random() * 120;
  const endX = Math.cos(angle) * dist;
  const endY = -(Math.sin(angle) * dist + 80);

  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{ width: size, height: size, background: color, left: `calc(50% + ${x}px)`, top: "30%" }}
      initial={{ opacity: 1, scale: 1, x: 0, y: 0, rotate: 0 }}
      animate={{
        opacity: [1, 1, 0],
        scale: [1, 1.2, 0.3],
        x: endX,
        y: endY,
        rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
      }}
      transition={{ duration: 1.4 + Math.random() * 0.6, delay, ease: [0.2, 0, 0.4, 1] }}
    />
  );
}

function GoldConfetti() {
  const particles = useMemo(() =>
    Array.from({ length: 36 }, (_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 60,
      delay: Math.random() * 0.3,
      size: 5 + Math.random() * 8,
      color: GOLD_COLORS[i % GOLD_COLORS.length],
      angle: (Math.PI * (0.3 + (i / 36) * 0.4 * Math.PI)) + (Math.random() - 0.5) * 0.4,
    })), []
  );

  return (
    <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
      {particles.map((p) => (
        <GoldParticle key={p.id} {...p} />
      ))}
    </div>
  );
}

// ── 승급/강등 모달 ─────────────────────────────────────────────────
function DifficultyNotifModal({
  type, newDifficulty, onClose,
}: { type: NotifType; newDifficulty: string; onClose: () => void }) {
  if (!type) return null;
  const isPromotion = type === "promoted";
  const meta = DIFFICULTY_META[newDifficulty as keyof typeof DIFFICULTY_META];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.82, y: 35 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: "spring", damping: 18, stiffness: 280 }}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center overflow-hidden"
      >
        {/* 금가루 파티클 (승급 시만) */}
        {isPromotion && <GoldConfetti />}

        {/* 이모지 아이콘 */}
        <div className={`relative z-10 w-24 h-24 rounded-full mx-auto flex items-center justify-center mb-5 ${isPromotion ? "bg-gradient-to-br from-yellow-100 to-orange-100" : "bg-gradient-to-br from-red-100 to-rose-100"}`}>
          <span className="text-5xl">{isPromotion ? "🎉" : "😱"}</span>
        </div>

        <h2 className={`relative z-10 text-2xl font-extrabold mb-2 ${isPromotion ? "text-yellow-600" : "text-red-600"}`}>
          {isPromotion ? "🎊 축하합니다! 승급!" : "⚠️ 강등 알림"}
        </h2>

        <p className="relative z-10 text-muted-foreground font-medium mb-4 leading-relaxed text-sm whitespace-pre-line">
          {isPromotion
            ? "뛰어난 투자 실력을 인정받았습니다!\n새로운 등급에서 더 큰 도전에 나서세요."
            : "수익률이 -20% 이하로 떨어졌습니다.\n마음을 다잡고 재기에 도전하세요! 💪"}
        </p>

        {/* 등급 뱃지 */}
        <div className={`relative z-10 inline-flex items-center gap-3 px-5 py-3 rounded-2xl border-2 mb-4 ${meta?.bg} ${meta?.border}`}>
          <span className="text-3xl">{meta?.icon}</span>
          <div className="text-left">
            <p className="text-[11px] font-semibold text-muted-foreground">{isPromotion ? "승급된 등급" : "강등된 등급"}</p>
            <p className={`text-xl font-extrabold ${meta?.color}`}>{meta?.label}</p>
          </div>
        </div>

        {/* 신규 잠금해제 메시지 (승급 시만) */}
        {isPromotion && UNLOCK_MSG[newDifficulty] && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="relative z-10 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mb-5 text-left"
          >
            <span className="text-lg flex-shrink-0">🔓</span>
            <p className="text-xs font-semibold text-amber-800 leading-relaxed">
              {UNLOCK_MSG[newDifficulty]}
            </p>
          </motion.div>
        )}

        <button
          onClick={onClose}
          className={`relative z-10 w-full py-4 rounded-2xl font-extrabold text-white text-lg transition-all hover:opacity-90 active:scale-95 ${isPromotion ? "bg-gradient-to-r from-yellow-500 to-orange-500" : "bg-gradient-to-r from-red-500 to-red-600"}`}
        >
          {isPromotion ? "계속 투자하기 🚀" : "다시 도전하기 💪"}
        </button>
      </motion.div>
    </motion.div>
  );
}

function Router() {
  const { userId, login, logout } = useAuth();
  const qc = useQueryClient();
  const { data: user, error: userError } = useGetUser(userId ?? 0, { query: { enabled: !!userId } });
  const { data: portfolio } = useGetUserPortfolio(userId ?? 0, {
    query: { enabled: !!userId, refetchInterval: 20000 },
  });

  // 유저가 DB에서 삭제된 경우 자동 로그아웃
  useEffect(() => {
    if (userError && (userError as any)?.status === 404) {
      logout();
    }
  }, [userError]);

  const [notif, setNotif] = useState<{ type: NotifType; newDifficulty: string } | null>(null);

  useEffect(() => {
    if (!portfolio) return;
    if (portfolio.promoted && portfolio.newDifficulty && !notif) {
      setNotif({ type: "promoted", newDifficulty: portfolio.newDifficulty });
      qc.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
    } else if (portfolio.demoted && portfolio.newDifficulty && !notif) {
      setNotif({ type: "demoted", newDifficulty: portfolio.newDifficulty });
      qc.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
    }
  }, [portfolio?.promoted, portfolio?.demoted, portfolio?.newDifficulty]);

  if (!userId) return <DifficultyScreen onComplete={login} />;

  const difficulty = (user?.difficulty as "beginner" | "intermediate" | "expert") ?? "beginner";
  const avatarId = user?.avatar ?? "balanced_m";

  return (
    <>
      <Layout userId={userId}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/stock/:ticker">{() => <StockDetail userId={userId} />}</Route>
          <Route path="/rankings" component={Rankings} />
          <Route path="/profile/:userId" component={InvestorProfile} />
          <Route path="/news" component={News} />
          <Route path="/watchlist" component={Watchlist} />
          <Route path="/wardrobe">{() => <Wardrobe userId={userId} userDifficulty={difficulty} avatarId={avatarId} />}</Route>
          <Route path="/missions">{() => <DailyMissions userId={userId} />}</Route>
          <Route path="/tips" component={Tips} />
          <Route path="/guide" component={Guide} />
          <Route path="/ipo" component={Ipo} />
          <Route path="/my-info">{() => <MyInfo userId={userId} logout={logout} />}</Route>
          <Route component={NotFound} />
        </Switch>
      </Layout>

      <AnimatePresence>
        {notif && (
          <DifficultyNotifModal
            type={notif.type}
            newDifficulty={notif.newDifficulty}
            onClose={() => {
              setNotif(null);
              qc.invalidateQueries({ queryKey: [`/api/users/${userId}/portfolio`] });
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
