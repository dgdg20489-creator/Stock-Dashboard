import { useState, useEffect } from "react";
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
import Tips from "./pages/Tips";
import Watchlist from "./pages/Watchlist";
import Wardrobe from "./pages/Wardrobe";
import DailyMissions from "./pages/DailyMissions";
import NotFound from "./pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    },
  },
});

type NotifType = "promoted" | "demoted" | null;

const DIFFICULTY_META = {
  beginner:     { label: "초보", icon: "🌱", color: "text-green-700",  bg: "bg-green-50",  border: "border-green-200"  },
  intermediate: { label: "중수", icon: "🌿", color: "text-blue-700",   bg: "bg-blue-50",   border: "border-blue-200"   },
  expert:       { label: "고수", icon: "🔥", color: "text-yellow-700", bg: "bg-yellow-50", border: "border-yellow-200" },
};

function DifficultyNotifModal({
  type,
  newDifficulty,
  onClose,
}: {
  type: NotifType;
  newDifficulty: string;
  onClose: () => void;
}) {
  if (!type) return null;
  const isPromotion = type === "promoted";
  const meta = DIFFICULTY_META[newDifficulty as keyof typeof DIFFICULTY_META];

  return (
    <motion.div
      key="overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <motion.div
        key="modal"
        initial={{ opacity: 0, scale: 0.85, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center"
      >
        <div className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center mb-5 ${isPromotion ? "bg-gradient-to-br from-yellow-100 to-orange-100" : "bg-gradient-to-br from-red-100 to-rose-100"}`}>
          <span className="text-5xl">{isPromotion ? "🎉" : "😱"}</span>
        </div>

        <h2 className={`text-2xl font-extrabold mb-2 ${isPromotion ? "text-yellow-600" : "text-red-600"}`}>
          {isPromotion ? "🎊 축하합니다! 승급!" : "⚠️ 강등 알림"}
        </h2>

        <p className="text-muted-foreground font-medium mb-5 leading-relaxed text-sm">
          {isPromotion
            ? "뛰어난 투자 실력을 인정받았습니다.\n새로운 등급에서 더 큰 도전에 나서세요!"
            : "수익률이 -20% 이하로 떨어졌습니다.\n마음을 다잡고 재기에 도전하세요! 💪"}
        </p>

        <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-2xl border-2 mb-6 ${meta?.bg} ${meta?.border}`}>
          <span className="text-3xl">{meta?.icon}</span>
          <div className="text-left">
            <p className="text-[11px] font-semibold text-muted-foreground">{isPromotion ? "승급된 등급" : "강등된 등급"}</p>
            <p className={`text-xl font-extrabold ${meta?.color}`}>{meta?.label}</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className={`w-full py-4 rounded-2xl font-extrabold text-white text-lg transition-all hover:opacity-90 active:scale-95 ${isPromotion ? "bg-gradient-to-r from-yellow-500 to-orange-500" : "bg-gradient-to-r from-red-500 to-red-600"}`}
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
  const { data: user } = useGetUser(userId ?? 0, { query: { enabled: !!userId } });
  const { data: portfolio } = useGetUserPortfolio(userId ?? 0, {
    query: { enabled: !!userId, refetchInterval: 20000 },
  });

  const [notif, setNotif] = useState<{ type: NotifType; newDifficulty: string } | null>(null);

  // 승급·강등 감지 — 한 번만 실행되도록 의존성 배열 처리
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

  if (!userId) {
    return <DifficultyScreen onComplete={login} />;
  }

  const difficulty = (user?.difficulty as "beginner" | "intermediate" | "expert") ?? "beginner";
  const avatar = (user?.avatar as "male" | "female") ?? "male";

  return (
    <>
      <Layout userId={userId}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/stock/:ticker">
            {() => <StockDetail userId={userId} />}
          </Route>
          <Route path="/rankings" component={Rankings} />
          <Route path="/tips" component={Tips} />
          <Route path="/watchlist" component={Watchlist} />
          <Route path="/wardrobe">
            {() => <Wardrobe userId={userId} userDifficulty={difficulty} avatar={avatar} />}
          </Route>
          <Route path="/missions">
            {() => <DailyMissions userId={userId} />}
          </Route>
          <Route path="/my-info">
            {() => <MyInfo userId={userId} logout={logout} />}
          </Route>
          <Route component={NotFound} />
        </Switch>
      </Layout>

      {/* 승급·강등 알림 모달 */}
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
