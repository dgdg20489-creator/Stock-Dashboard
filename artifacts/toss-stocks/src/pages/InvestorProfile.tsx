import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { GameAvatar } from "@/components/GameAvatar";
import { getColorClass, formatPercent } from "@/lib/utils";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface PublicHolding {
  ticker: string;
  name: string;
  shares: number;
  returnPercent: number;
}

interface PublicTrade {
  id: number;
  type: "buy" | "sell";
  ticker: string;
  stockName: string;
  shares: number;
  createdAt: string;
}

interface PublicProfile {
  userId: number;
  username: string;
  avatar: string;
  difficulty: string;
  totalReturnPercent: number;
  holdings: PublicHolding[];
  recentTrades: PublicTrade[];
}

const DIFF_LABEL: Record<string, { label: string; color: string }> = {
  beginner:     { label: "초보",  color: "bg-emerald-100 text-emerald-700" },
  intermediate: { label: "중수",  color: "bg-blue-100 text-blue-700" },
  expert:       { label: "고수",  color: "bg-red-100 text-red-700" },
};

function maskShares(shares: number): string {
  if (shares < 10) return `${shares}주`;
  const masked = shares.toString().replace(/\d(?=\d{1}$)/g, "*");
  return `${masked}주`;
}

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "방금";
  if (min < 60) return `${min}분 전`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

export default function InvestorProfile() {
  const [, params] = useRoute("/profile/:userId");
  const [, setLocation] = useLocation();
  const userId = params?.userId ? parseInt(params.userId) : null;

  const { data: profile, isLoading, isError } = useQuery<PublicProfile>({
    queryKey: [`/api/users/${userId}/public-profile`],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/users/${userId}/public-profile`);
      if (!res.ok) throw new Error("프로필을 불러올 수 없습니다.");
      return res.json();
    },
    enabled: !!userId,
  });

  if (!userId) return null;

  const diffInfo = profile ? (DIFF_LABEL[profile.difficulty] ?? { label: profile.difficulty, color: "bg-muted text-muted-foreground" }) : null;

  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-in fade-in duration-400">
      {/* Back button */}
      <button
        onClick={() => setLocation("/rankings")}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        랭킹으로 돌아가기
      </button>

      {isLoading && (
        <div className="flex flex-col items-center gap-3 py-20">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">프로필 불러오는 중...</span>
        </div>
      )}

      {isError && (
        <div className="bg-card rounded-3xl p-10 text-center border border-border/50">
          <p className="text-muted-foreground">프로필을 불러올 수 없습니다.</p>
        </div>
      )}

      {profile && (
        <>
          {/* ── 유저 헤더 카드 ── */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-3xl border border-border/50 shadow-sm overflow-hidden"
          >
            <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-6 pt-6 pb-4">
              <div className="flex items-center gap-4">
                <GameAvatar avatarId={profile.avatar} size={64} rounded="rounded-2xl" className="shadow-md ring-2 ring-primary/20" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl font-black text-foreground truncate">{profile.username}</h1>
                    {diffInfo && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${diffInfo.color}`}>
                        {diffInfo.label}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">투자 프로필</p>
                </div>
              </div>
            </div>

            {/* 총 수익률 */}
            <div className="px-6 py-4 flex items-center justify-between border-t border-border/40">
              <div className="text-sm text-muted-foreground font-medium">총 수익률</div>
              <div className={`text-2xl font-black ${getColorClass(profile.totalReturnPercent)}`}>
                {formatPercent(profile.totalReturnPercent)}
              </div>
            </div>

            {/* 보유 종목 수 + 거래 횟수 */}
            <div className="grid grid-cols-2 divide-x divide-border/40 border-t border-border/40">
              <div className="px-6 py-3 text-center">
                <div className="text-2xl font-black text-foreground">{profile.holdings.length}</div>
                <div className="text-xs text-muted-foreground mt-0.5">보유 종목</div>
              </div>
              <div className="px-6 py-3 text-center">
                <div className="text-2xl font-black text-foreground">{profile.recentTrades.length}+</div>
                <div className="text-xs text-muted-foreground mt-0.5">최근 거래</div>
              </div>
            </div>
          </motion.div>

          {/* ── 포트폴리오 ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="bg-card rounded-3xl border border-border/50 shadow-sm overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-border/40">
              <h2 className="font-bold text-base text-foreground">보유 종목</h2>
              <p className="text-xs text-muted-foreground mt-0.5">개인정보 보호를 위해 금액은 비공개입니다</p>
            </div>

            {profile.holdings.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                현재 보유 중인 종목이 없습니다.
              </div>
            ) : (
              <div className="divide-y divide-border/30">
                {profile.holdings.map((h, i) => (
                  <motion.div
                    key={h.ticker}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.04 }}
                    className="flex items-center px-5 py-3.5 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-foreground truncate">{h.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                        <span>{h.ticker}</span>
                        <span className="text-border">·</span>
                        <span className="font-medium text-foreground/60">
                          {maskShares(h.shares)}
                          <span className="text-muted-foreground/60 ml-1">(수량 비공개)</span>
                        </span>
                      </div>
                    </div>
                    <div className="text-right ml-3">
                      <div className={`font-bold text-base ${getColorClass(h.returnPercent)}`}>
                        {formatPercent(h.returnPercent)}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">수익률</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* ── 최근 거래 내역 ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="bg-card rounded-3xl border border-border/50 shadow-sm overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-border/40">
              <h2 className="font-bold text-base text-foreground">최근 매매 내역</h2>
              <p className="text-xs text-muted-foreground mt-0.5">금액 정보는 비공개 · 종목·방향·수량만 표시</p>
            </div>

            {profile.recentTrades.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                최근 거래 내역이 없습니다.
              </div>
            ) : (
              <div className="divide-y divide-border/30">
                {profile.recentTrades.map((t, i) => (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.18 + i * 0.03 }}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors"
                  >
                    {/* 매수/매도 뱃지 */}
                    <span className={`flex-shrink-0 text-xs font-black px-2 py-1 rounded-lg ${
                      t.type === "buy"
                        ? "bg-up/10 text-up"
                        : "bg-down/10 text-down"
                    }`}>
                      {t.type === "buy" ? "매수" : "매도"}
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-foreground truncate">{t.stockName}</div>
                      <div className="text-xs text-muted-foreground">{t.ticker}</div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-semibold text-foreground">
                        {t.shares}주
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        금액 <span className="font-bold tracking-widest">***</span>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 min-w-[48px]">
                      <div className="text-[10px] text-muted-foreground">{formatTimeAgo(t.createdAt)}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            <div className="px-5 py-3 border-t border-border/30 bg-muted/20">
              <p className="text-[10px] text-muted-foreground text-center">
                🔒 상세 금액은 개인정보 보호 정책에 따라 비공개입니다
              </p>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
