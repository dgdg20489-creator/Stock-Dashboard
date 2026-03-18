import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { useAuth } from "./hooks/use-auth";
import { Layout } from "./components/Layout";
import DifficultyScreen from "./pages/DifficultyScreen";
import Home from "./pages/Home";
import StockDetail from "./pages/StockDetail";
import Rankings from "./pages/Rankings";
import NotFound from "./pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

function Router() {
  const { userId, login } = useAuth();

  if (!userId) {
    return <DifficultyScreen onComplete={login} />;
  }

  return (
    <Layout userId={userId}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/stock/:ticker">
          {() => <StockDetail userId={userId} />}
        </Route>
        <Route path="/rankings" component={Rankings} />
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
