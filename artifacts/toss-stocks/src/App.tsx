import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { useAuth } from "./hooks/use-auth";
import { useGetUser } from "@workspace/api-client-react";
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

function Router() {
  const { userId, login } = useAuth();
  const { data: user } = useGetUser(userId ?? 0, { query: { enabled: !!userId } });

  if (!userId) {
    return <DifficultyScreen onComplete={login} />;
  }

  const difficulty = (user?.difficulty as "beginner" | "intermediate" | "expert") ?? "beginner";
  const avatar = (user?.avatar as "male" | "female") ?? "male";

  return (
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
          {() => <MyInfo userId={userId} />}
        </Route>
        <Route component={NotFound} />
      </Switch>
    </Layout>
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
