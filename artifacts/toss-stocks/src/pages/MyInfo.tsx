import { useState, useMemo } from "react";
import { useGetUser, useGetUserPortfolio, useGetUserTrades } from "@workspace/api-client-react";
import { formatCurrency, formatPercent, getColorClass, cn } from "@/lib/utils";
import { format } from "date-fns";
import { StockLogo } from "@/components/StockLogo";
import { GameAvatar } from "@/components/GameAvatar";
import { ko } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { Wallet, PieChart, ClipboardList, ChevronRight, Zap, Shirt, LogOut, AlertTriangle, Pencil, Trash2, X, Check } from "lucide-react";
import { useMissions } from "@/hooks/use-missions";
import { AiAdvisor } from "@/components/AiAdvisor";
import { useQueryClient } from "@tanstack/react-query";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface MyInfoProps {
  userId: number;
  logout: () => void;
}

function StatCard({ label, value, sub, subColor }: { label: string; value: string; sub?: string; subColor?: string }) {
  return (
    <div className="bg-muted/60 rounded-2xl p-4">
      <p className="text-xs font-semibold text-muted-foreground mb-1">{label}</p>
      <p className="text-lg font-extrabold text-foreground">{value}</p>
      {sub && <p className={cn("text-xs font-bold mt-0.5", subColor ?? "text-muted-foreground")}>{sub}</p>}
    </div>
  );
}

function LogoutConfirmModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: "spring", damping: 22, stiffness: 320 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl p-8 max-w-xs w-full text-center"
      >
        <div className="w-16 h-16 bg-red-50 rounded-full mx-auto flex items-center justify-center mb-4">
          <LogOut className="w-7 h-7 text-red-500" />
        </div>
        <h3 className="text-xl font-extrabold text-foreground mb-2">로그아웃</h3>
        <p className="text-sm text-muted-foreground font-medium mb-6 leading-relaxed">
          로그아웃 하시겠습니까?<br />
          <span className="text-xs text-muted-foreground/70">투자 기록과 자산 내역은 유지됩니다.</span>
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-2xl bg-muted font-bold text-muted-foreground hover:bg-muted/70 transition-colors"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors"
          >
            로그아웃
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function WithdrawConfirmModal({ username, onConfirm, onCancel, isLoading }: {
  username: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [confirm, setConfirm] = useState("");
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: "spring", damping: 22, stiffness: 320 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl p-8 max-w-xs w-full text-center"
      >
        <div className="w-16 h-16 bg-red-100 rounded-full mx-auto flex items-center justify-center mb-4">
          <Trash2 className="w-7 h-7 text-red-600" />
        </div>
        <h3 className="text-xl font-extrabold text-foreground mb-2">회원 탈퇴</h3>
        <p className="text-sm text-muted-foreground font-medium mb-2 leading-relaxed">
          탈퇴하면 <span className="font-extrabold text-foreground">{username}</span> 계정의<br />
          모든 투자 기록과 자산이 <span className="text-red-600 font-extrabold">영구 삭제</span>됩니다.
        </p>
        <p className="text-xs text-muted-foreground mb-3">확인하려면 아래에 <strong>탈퇴합니다</strong> 를 입력하세요.</p>
        <input
          type="text"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="탈퇴합니다"
          className="w-full border-2 border-border rounded-2xl px-4 py-2.5 text-sm font-semibold text-center mb-5 outline-none focus:border-red-400 transition-colors"
        />
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-2xl bg-muted font-bold text-muted-foreground hover:bg-muted/70 transition-colors"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            disabled={confirm !== "탈퇴합니다" || isLoading}
            className="flex-1 py-3 rounded-2xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isLoading ? "처리 중..." : "탈퇴하기"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function MyInfo({ userId, logout }: MyInfoProps) {
  const queryClient = useQueryClient();
  const { data: user, isLoading: userLoading } = useGetUser(userId);
  const { data: portfolio, isLoading: portLoading } = useGetUserPortfolio(userId, {
    query: { refetchInterval: 2000, staleTime: 0 },
  });
  const { data: trades, isLoading: tradesLoading } = useGetUserTrades(userId);
  const { missions, coins } = useMissions();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  const [editingNick, setEditingNick] = useState(false);
  const [nickValue, setNickValue] = useState("");
  const [nickLoading, setNickLoading] = useState(false);
  const [nickError, setNickError] = useState("");

  const realizedPnL = useMemo(() => {
    if (!trades || trades.length === 0) return 0;
    const sorted = [...trades].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    const basis: Record<string, { shares: number; totalCost: number }> = {};
    let realized = 0;
    for (const t of sorted) {
      if (!basis[t.ticker]) basis[t.ticker] = { shares: 0, totalCost: 0 };
      if (t.type === "buy") {
        basis[t.ticker].shares += t.shares;
        basis[t.ticker].totalCost += t.totalAmount;
      } else {
        const avgCost =
          basis[t.ticker].shares > 0
            ? basis[t.ticker].totalCost / basis[t.ticker].shares
            : 0;
        realized += (t.price - avgCost) * t.shares;
        const remaining = Math.max(0, basis[t.ticker].shares - t.shares);
        basis[t.ticker] = { shares: remaining, totalCost: remaining * avgCost };
      }
    }
    return realized;
  }, [trades]);

  const handleNickSave = async () => {
    if (!nickValue.trim() || nickValue.trim().length < 2) {
      setNickError("닉네임은 2자 이상이어야 합니다.");
      return;
    }
    setNickLoading(true);
    setNickError("");
    try {
      const res = await fetch(`${API_BASE}/api/users/${userId}/username`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: nickValue.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        setNickError(err.message ?? "변경 실패");
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ["users", userId] });
      setEditingNick(false);
    } catch {
      setNickError("서버 오류가 발생했습니다.");
    } finally {
      setNickLoading(false);
    }
  };

  const handleWithdraw = async () => {
    setWithdrawLoading(true);
    try {
      await fetch(`${API_BASE}/api/users/${userId}`, { method: "DELETE" });
      logout();
    } catch {
      setWithdrawLoading(false);
    }
  };

  if (userLoading || portLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !portfolio) return null;

  const stockValue = portfolio.totalAssets - portfolio.cashBalance;
  const isProfit = portfolio.totalReturn >= 0;

  const holdingCostBasis = portfolio.holdings.reduce(
    (sum, h) => sum + h.avgPrice * h.shares, 0
  );
  const holdingReturnPct = holdingCostBasis > 0
    ? ((stockValue - holdingCostBasis) / holdingCostBasis) * 100
    : 0;

  const difficultyLabel =
    user.difficulty === "beginner" ? "🌱 초보" :
    user.difficulty === "intermediate" ? "🌿 중수" : "🔥 고수";

  const promoteThreshold =
    user.difficulty === "beginner" ? 20 :
    user.difficulty === "intermediate" ? 50 : null;

  const demoteThreshold = user.difficulty !== "beginner" ? -20 : null;

  const isAtDemoteRisk = demoteThreshold !== null && portfolio.totalReturnPercent < -15;
  const isAtDemotion = demoteThreshold !== null && portfolio.totalReturnPercent <= -20;

  const progressPct = promoteThreshold
    ? Math.min(100, Math.max(0, (portfolio.totalReturnPercent / promoteThreshold) * 100))
    : 100;

  const missionsCompleted = [missions.attendance, missions.quiz, missions.trade].filter(Boolean).length;

  return (
    <div className="max-w-2xl mx-auto space-y-3 animate-in fade-in duration-500">
      <div className="flex items-start justify-between px-1">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">내 정보</h1>
          <p className="text-muted-foreground font-medium mt-0.5 text-sm">자산 현황과 투자 기록을 확인하세요.</p>
        </div>
        <button
          onClick={() => setShowLogoutModal(true)}
          className="flex items-center gap-2 mt-1 px-4 py-2 bg-red-50 text-red-500 rounded-2xl border border-red-100 font-bold text-sm hover:bg-red-100 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          로그아웃
        </button>
      </div>

      <AnimatePresence>
        {isAtDemoteRisk && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={cn(
              "flex items-center gap-3 px-5 py-4 rounded-2xl border",
              isAtDemotion
                ? "bg-red-50 border-red-200"
                : "bg-orange-50 border-orange-200"
            )}
          >
            <AlertTriangle className={cn("w-5 h-5 flex-shrink-0", isAtDemotion ? "text-red-500" : "text-orange-500")} />
            <div>
              <p className={cn("text-sm font-extrabold", isAtDemotion ? "text-red-600" : "text-orange-600")}>
                {isAtDemotion ? "강등 처리됩니다!" : "⚠️ 강등 위험 구간!"}
              </p>
              <p className="text-xs text-muted-foreground font-medium">
                현재 수익률 {portfolio.totalReturnPercent.toFixed(1)}% · 수익률 -20% 이하 시 강등
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 프로필 카드 */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-3xl p-4 border border-border/50 shadow-sm"
      >
        <div className="flex items-center gap-4">
          <GameAvatar avatarId={user.avatar} size={64} rounded="rounded-2xl" className="shadow-inner flex-shrink-0" />
          <div className="flex-1 min-w-0">
            {editingNick ? (
              <div className="flex items-center gap-2 mb-1">
                <input
                  autoFocus
                  type="text"
                  value={nickValue}
                  onChange={(e) => { setNickValue(e.target.value); setNickError(""); }}
                  onKeyDown={(e) => { if (e.key === "Enter") handleNickSave(); if (e.key === "Escape") setEditingNick(false); }}
                  maxLength={16}
                  className="text-lg font-extrabold border-b-2 border-primary outline-none bg-transparent w-full"
                  placeholder="새 닉네임 입력"
                />
                <button
                  onClick={handleNickSave}
                  disabled={nickLoading}
                  className="p-1.5 rounded-xl bg-primary text-white hover:bg-primary/80 transition-colors disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { setEditingNick(false); setNickError(""); }}
                  className="p-1.5 rounded-xl bg-muted text-muted-foreground hover:bg-muted/70 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-0.5">
                <h2 className="text-2xl font-extrabold text-foreground">{user.username}</h2>
                <button
                  onClick={() => { setNickValue(user.username); setEditingNick(true); setNickError(""); }}
                  className="p-1 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                  title="닉네임 변경"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            {nickError && <p className="text-xs text-red-500 font-semibold mb-1">{nickError}</p>}
            <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-bold bg-red-50 text-red-600 mt-1">
              {difficultyLabel}
            </span>

            {promoteThreshold && (
              <div className="mt-3">
                <div className="flex justify-between text-xs font-semibold text-muted-foreground mb-1">
                  <span>다음 단계까지</span>
                  <span className={getColorClass(portfolio.totalReturnPercent)}>
                    {portfolio.totalReturnPercent.toFixed(1)}%
                    <span className="text-muted-foreground ml-1">/ {promoteThreshold}%</span>
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.abs(progressPct)}%`,
                      background: portfolio.totalReturnPercent >= 0
                        ? "linear-gradient(90deg, #F04452, #ff6b7a)"
                        : "linear-gradient(90deg, #3182F6, #60a5fa)",
                    }}
                  />
                </div>
              </div>
            )}

            {demoteThreshold !== null && (
              <div className="mt-2">
                <div className="flex justify-between text-[11px] font-semibold text-muted-foreground mb-1">
                  <span className="text-muted-foreground/60">강등 기준</span>
                  <span className="text-muted-foreground/60">-20%까지 {(20 + portfolio.totalReturnPercent).toFixed(1)}%p 여유</span>
                </div>
              </div>
            )}

            {!promoteThreshold && (
              <p className="text-xs font-semibold text-red-500 mt-2">최고 등급 달성! 🎉</p>
            )}
          </div>
        </div>
      </motion.div>

      {/* 일일 미션 & 옷장 바로가기 */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-2 gap-4"
      >
        <Link href="/missions">
          <div className="bg-gradient-to-br from-red-600 to-red-500 rounded-3xl p-4 text-white cursor-pointer hover:shadow-lg hover:shadow-red-500/20 hover:-translate-y-0.5 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-red-100" />
              <span className="font-bold text-sm text-red-100">일일 미션</span>
            </div>
            <p className="text-2xl font-extrabold">{missions.points}<span className="text-base text-red-200">P</span></p>
            <div className="mt-2 h-1.5 bg-red-400/40 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all" style={{ width: `${Math.min(100, missions.points)}%` }} />
            </div>
            <p className="text-xs text-red-200 font-semibold mt-1.5">{missionsCompleted}/3 미션 완료</p>
          </div>
        </Link>

        <Link href="/wardrobe">
          <div className="bg-gradient-to-br from-blue-600 to-blue-500 rounded-3xl p-4 text-white cursor-pointer hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-0.5 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <Shirt className="w-4 h-4 text-blue-100" />
              <span className="font-bold text-sm text-blue-100">아바타 옷장</span>
            </div>
            <p className="text-2xl font-extrabold">🪙 {coins}</p>
            <p className="text-xs text-blue-200 font-semibold mt-2">보유 아바타 코인</p>
            <p className="text-xs text-blue-200 font-medium mt-0.5">아이템 잠금 해제 가능</p>
          </div>
        </Link>
      </motion.div>

      <AiAdvisor userId={userId} />

      {/* 자산 현황 */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="bg-card rounded-3xl p-4 border border-border/50 shadow-sm"
      >
        <div className="flex items-center gap-2 mb-3">
          <Wallet className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-extrabold text-foreground">자산 현황</h3>
        </div>

        <div className="bg-gradient-to-r from-red-50 to-blue-50 rounded-2xl p-4 mb-3 border border-border/30">
          <p className="text-sm font-semibold text-muted-foreground mb-1">전체 평가 금액</p>
          <p className="text-2xl font-extrabold text-foreground">{formatCurrency(portfolio.totalAssets)}</p>
          <div className={cn("flex items-center gap-1.5 mt-1.5 font-bold", getColorClass(portfolio.totalReturn))}>
            <span>{isProfit ? "▲" : "▼"}</span>
            <span>{formatCurrency(Math.abs(portfolio.totalReturn))}</span>
            <span className="text-sm">({formatPercent(portfolio.totalReturnPercent)})</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <StatCard label="보유 현금 (예수금)" value={formatCurrency(portfolio.cashBalance)} sub="주문가능 금액" />
        </div>
      </motion.div>

      {/* 보유 주식 */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.14 }}
        className="bg-card rounded-3xl p-4 border border-border/50 shadow-sm"
      >
        <div className="flex items-center gap-2 mb-3">
          <PieChart className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-extrabold text-foreground">보유 주식</h3>
          <span className="ml-auto text-sm font-semibold text-muted-foreground">내 투자</span>
          <span className="text-sm font-bold text-foreground">{formatCurrency(stockValue)}</span>
          <span className={cn("text-xs font-bold", getColorClass(holdingReturnPct))}>
            ({formatPercent(holdingReturnPct)})
          </span>
        </div>

        {portfolio.holdings.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <PieChart className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">보유한 주식이 없습니다.</p>
            <Link href="/" className="mt-2 inline-block text-primary font-bold text-sm hover:underline">
              주식 보러 가기 →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {portfolio.holdings.map((holding) => (
              <Link
                key={holding.ticker}
                href={`/stock/${holding.ticker}`}
                className="flex items-center justify-between py-4 group"
              >
                <div className="flex items-center gap-3">
                  <div className="group-hover:scale-105 transition-transform">
                    <StockLogo ticker={holding.ticker} name={holding.name} size="md" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground group-hover:text-primary transition-colors">{holding.name}</p>
                    <p className="text-xs font-semibold text-muted-foreground">{holding.shares}주 · 평균 {formatCurrency(holding.avgPrice)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-extrabold text-foreground">{formatCurrency(holding.currentPrice * holding.shares)}</p>
                  <p className={cn("text-xs font-bold", getColorClass(holding.profitLoss))}>
                    {holding.profitLoss >= 0 ? "+" : ""}{formatCurrency(Math.abs(holding.profitLoss))} ({formatPercent(holding.profitLossPercent)})
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground ml-2 opacity-50 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>
        )}
      </motion.div>

      {/* 매매 기록 */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card rounded-3xl p-4 border border-border/50 shadow-sm"
      >
        <div className="flex items-center gap-2 mb-3">
          <ClipboardList className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-extrabold text-foreground">매매 기록</h3>
          {trades && <span className="ml-auto text-sm font-semibold text-muted-foreground">총 {trades.length}건</span>}
        </div>

        <div className="flex items-center justify-between bg-muted/40 rounded-2xl px-4 py-3 mb-4 border border-border/40">
          <span className="text-sm font-semibold text-muted-foreground">총 수익 (실현)</span>
          <span className={cn("text-base font-extrabold", getColorClass(realizedPnL))}>
            {realizedPnL >= 0 ? "+" : ""}{formatCurrency(realizedPnL)}
          </span>
        </div>

        {tradesLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : !trades || trades.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">거래 내역이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-0 divide-y divide-border/50">
            {trades.map((trade) => (
              <div key={trade.id} className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center text-xs font-extrabold flex-shrink-0",
                    trade.type === "buy" ? "bg-up-light text-up" : "bg-down-light text-down"
                  )}>
                    {trade.type === "buy" ? "매수" : "매도"}
                  </span>
                  <div>
                    <p className="font-bold text-foreground text-sm">{trade.stockName}</p>
                    <p className="text-xs text-muted-foreground font-medium">
                      {trade.shares}주 · {formatCurrency(trade.price)} ·{" "}
                      {format(new Date(trade.createdAt), "M월 d일 HH:mm", { locale: ko })}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-extrabold text-sm text-foreground">
                    {trade.type === "buy" ? "-" : "+"}{formatCurrency(trade.totalAmount)}
                  </p>
                  <p className="text-xs text-muted-foreground font-medium">
                    {trade.type === "buy" ? "매수금액" : "매도금액"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* 계정 관리 */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22 }}
        className="bg-card rounded-3xl p-4 border border-border/50 shadow-sm"
      >
        <h3 className="text-base font-extrabold text-foreground mb-3">계정 관리</h3>
        <div className="space-y-2">
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-border/50 hover:bg-muted/50 transition-colors text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
              <LogOut className="w-4 h-4 text-orange-500" />
            </div>
            <div>
              <p className="font-bold text-foreground text-sm">로그아웃</p>
              <p className="text-xs text-muted-foreground">투자 기록과 자산은 유지됩니다.</p>
            </div>
          </button>
          <button
            onClick={() => setShowWithdrawModal(true)}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-red-100 hover:bg-red-50 transition-colors text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
              <Trash2 className="w-4 h-4 text-red-500" />
            </div>
            <div>
              <p className="font-bold text-red-600 text-sm">회원 탈퇴</p>
              <p className="text-xs text-muted-foreground">계정과 모든 데이터가 영구 삭제됩니다.</p>
            </div>
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {showLogoutModal && (
          <LogoutConfirmModal
            onConfirm={() => { setShowLogoutModal(false); logout(); }}
            onCancel={() => setShowLogoutModal(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showWithdrawModal && (
          <WithdrawConfirmModal
            username={user.username}
            onConfirm={handleWithdraw}
            onCancel={() => setShowWithdrawModal(false)}
            isLoading={withdrawLoading}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
