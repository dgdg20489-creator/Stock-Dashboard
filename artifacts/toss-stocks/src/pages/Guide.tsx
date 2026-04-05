import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PlayCircle, ExternalLink, GraduationCap, BookOpen, TrendingUp, Zap, Star, Play } from "lucide-react";
import { cn } from "@/lib/utils";

type Level = "basic" | "mid" | "advanced" | "bonus";

interface VideoCard {
  title: string;
  channel: string;
  channelBadge: string;
  description: string;
  duration: string;
  tags: string[];
  url: string;
  color: string;
  videoId?: string;
  views?: string;
}

const LEVELS: { id: Level; label: string; emoji: string; subtitle: string; color: string; bg: string; border: string; icon: typeof BookOpen }[] = [
  {
    id: "basic",
    label: "1단계 · 초보",
    emoji: "🌱",
    subtitle: "주식이 뭔지조차 모른다면 여기서 시작!",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    icon: BookOpen,
  },
  {
    id: "mid",
    label: "2단계 · 중급",
    emoji: "📊",
    subtitle: "기초는 알지만 종목 선정이 막막한 분께",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    icon: TrendingUp,
  },
  {
    id: "advanced",
    label: "3단계 · 상급",
    emoji: "🔥",
    subtitle: "심화 전략과 거시경제까지 마스터하기",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    icon: GraduationCap,
  },
  {
    id: "bonus",
    label: "번외 · 머니코믹스",
    emoji: "🎬",
    subtitle: "슈카월드 서브채널 — 재미있게 배우는 경제",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    icon: Star,
  },
];

const VIDEOS: Record<Level, VideoCard[]> = {
  basic: [
    {
      title: "ETF 하나면 충분합니다 (1편)",
      channel: "박곰희TV",
      channelBadge: "🐻",
      description: "전직 PB 출신 박곰희가 초보자도 이해할 수 있게 ETF를 처음부터 설명합니다. 분산투자의 핵심, 실제 매수 방법까지 10분 내외로 정리.",
      duration: "약 10분",
      tags: ["ETF", "분산투자", "초보 필수", "54만 조회"],
      url: "https://www.youtube.com/watch?v=okrUVN8l3zk",
      videoId: "okrUVN8l3zk",
      views: "54만 조회",
      color: "from-emerald-500/20 to-teal-500/10",
    },
    {
      title: "IRP가 노후준비용으로 최강인 이유 (vs.연금저축펀드)",
      channel: "박곰희TV",
      channelBadge: "🐻",
      description: "IRP와 연금저축펀드의 차이, 세액공제 혜택, 어디에 넣어야 할지 — 100만 뷰가 증명하는 인기 강의.",
      duration: "약 15분",
      tags: ["IRP", "연금저축", "세액공제", "100만 조회"],
      url: "https://www.youtube.com/watch?v=xqXD9R_3TOI",
      videoId: "xqXD9R_3TOI",
      views: "100만 조회",
      color: "from-teal-500/20 to-green-500/10",
    },
    {
      title: "지금은 어떤 투자를 해야 하는가",
      channel: "슈카월드",
      channelBadge: "📈",
      description: "311만 구독자 슈카가 현 시장 상황에서 어떤 투자 선택을 해야 하는지 거시경제 관점으로 쉽게 풀어냅니다.",
      duration: "약 20분",
      tags: ["투자전략", "거시경제", "시장분석"],
      url: "https://www.youtube.com/watch?v=rt-RI-uQeGg",
      videoId: "rt-RI-uQeGg",
      color: "from-blue-500/20 to-cyan-500/10",
    },
    {
      title: "미국주식·ETF 입문 채널",
      channel: "소수몽키",
      channelBadge: "🐵",
      description: "평범한 직장인 눈높이로 미국주식·ETF 투자를 설명하는 소수몽키 채널. S&P500·나스닥·배당 ETF 핵심 콘텐츠 추천.",
      duration: "영상별 상이",
      tags: ["미국주식", "ETF", "S&P500", "채널 이동"],
      url: "https://www.youtube.com/@sosumonkey",
      color: "from-yellow-500/20 to-amber-500/10",
    },
  ],
  mid: [
    {
      title: "주식 차트의 악랄함",
      channel: "슈카월드",
      channelBadge: "📈",
      description: "차트를 믿으면 안 되는 이유와, 그럼에도 불구하고 기술적 분석을 어떻게 활용해야 하는지 슈카 특유의 날카로운 시각으로 분석합니다.",
      duration: "약 20분",
      tags: ["기술적분석", "차트", "심리", "함정"],
      url: "https://www.youtube.com/watch?v=Zs0Fpq51LF8",
      videoId: "Zs0Fpq51LF8",
      color: "from-blue-500/20 to-indigo-500/10",
    },
    {
      title: "재무제표·PER·ROE 읽는 법",
      channel: "박곰희TV",
      channelBadge: "🐻",
      description: "PER·PBR·ROE·부채비율을 한눈에 파악하는 방법. 좋은 기업 고르는 기준을 수치로 배웁니다.",
      duration: "약 15분",
      tags: ["재무제표", "PER", "ROE", "기업분석"],
      url: "https://www.youtube.com/@gomhee",
      color: "from-purple-500/20 to-violet-500/10",
    },
    {
      title: "배당주 투자 전략 — 월세처럼 받는 배당금",
      channel: "소수몽키",
      channelBadge: "🐵",
      description: "배당주·배당ETF로 현금 흐름 만드는 법. '잠든 사이 월급 버는' 배당 투자 철학을 담은 핵심 시리즈.",
      duration: "약 15분",
      tags: ["배당주", "현금흐름", "장기투자", "배당ETF"],
      url: "https://www.youtube.com/watch?v=1OYVKsyrpGc",
      videoId: "1OYVKsyrpGc",
      color: "from-green-500/20 to-emerald-500/10",
    },
    {
      title: "경제 기초 — 금리·환율·물가 완전정복",
      channel: "삼프로TV",
      channelBadge: "3️⃣",
      description: "대한민국 대표 경제 전문 채널 삼프로TV. 미국 금리가 왜 한국 주식에 영향을 주는지, 거시경제의 연결고리를 이해하는 핵심 채널.",
      duration: "영상별 상이",
      tags: ["거시경제", "금리", "환율", "채널 이동"],
      url: "https://www.youtube.com/@3protv",
      color: "from-red-500/20 to-orange-500/10",
    },
  ],
  advanced: [
    {
      title: "주식 시장을 충격에 빠트린 '터보 퀀트'는 무엇인가",
      channel: "슈카월드",
      channelBadge: "📈",
      description: "알고리즘 트레이딩과 퀀트 투자가 시장에 미치는 영향. 개인투자자가 퀀트의 시대에 살아남는 방법을 분석합니다.",
      duration: "약 25분",
      tags: ["퀀트", "알고리즘", "시장구조", "시스템매매"],
      url: "https://www.youtube.com/watch?v=nMjBFs6Uoc8",
      videoId: "nMjBFs6Uoc8",
      color: "from-orange-500/20 to-red-500/10",
    },
    {
      title: "공매도 완전 정복 — 개념부터 활용까지",
      channel: "슈카월드",
      channelBadge: "📉",
      description: "개인투자자가 반드시 알아야 할 공매도 메커니즘. 시장에 미치는 영향과 대응 전략을 분석합니다.",
      duration: "약 20분",
      tags: ["공매도", "시장구조", "리스크관리"],
      url: "https://www.youtube.com/@syukaworld",
      color: "from-red-500/20 to-rose-500/10",
    },
    {
      title: "퀀트 투자 전략 — 데이터로 돈 버는 법",
      channel: "강환국 · 할수있다알고투자",
      channelBadge: "🤖",
      description: "감이 아닌 데이터로 투자하는 퀀트 전략. 모멘텀·저PBR·고배당 팩터 투자 방법을 체계적으로 배웁니다.",
      duration: "25~40분",
      tags: ["퀀트", "팩터투자", "데이터분석", "시스템매매"],
      url: "https://www.youtube.com/c/할수있다알고투자",
      color: "from-violet-500/20 to-purple-500/10",
    },
    {
      title: "포트폴리오 자산배분 — 올웨더·리밸런싱",
      channel: "박곰희TV",
      channelBadge: "🐻",
      description: "주식·채권·금·현금의 최적 비율 설정. 리밸런싱 전략과 올웨더 포트폴리오 구성법을 다룹니다.",
      duration: "약 20분",
      tags: ["자산배분", "리밸런싱", "올웨더", "포트폴리오"],
      url: "https://www.youtube.com/@gomhee",
      color: "from-indigo-500/20 to-blue-500/10",
    },
  ],
  bonus: [
    {
      title: "주식은 지금 — 매주 월요일 시장 분석",
      channel: "머니코믹스",
      channelBadge: "💰",
      description: "알상무·니니와 함께 이번 주 주목해야 할 종목과 시장 흐름을 예능 형식으로 풀어냅니다. 매주 월요일 라이브.",
      duration: "1~2시간 (라이브)",
      tags: ["시장분석", "라이브", "월요일"],
      url: "https://www.youtube.com/@moneycomics",
      color: "from-purple-500/20 to-pink-500/10",
    },
    {
      title: "개미는 지금 — 화요일 개인투자자 특집",
      channel: "머니코믹스",
      channelBadge: "🐜",
      description: "개인투자자 관점에서 시장을 바라보는 시리즈. 실전 매매 경험과 투자 전략을 솔직하게 공유합니다.",
      duration: "1~2시간 (라이브)",
      tags: ["개인투자", "실전매매", "화요일"],
      url: "https://www.youtube.com/@moneycomics",
      color: "from-pink-500/20 to-rose-500/10",
    },
    {
      title: "미장은 지금 — 수요일 미국 시장 심층 분석",
      channel: "머니코믹스",
      channelBadge: "🇺🇸",
      description: "미국 나스닥·S&P500 주요 이슈와 빅테크 분석. 글로벌 시장 흐름을 빠르게 파악할 수 있습니다.",
      duration: "1~2시간 (라이브)",
      tags: ["미국주식", "나스닥", "빅테크", "수요일"],
      url: "https://www.youtube.com/@moneycomics",
      color: "from-blue-500/20 to-cyan-500/10",
    },
    {
      title: "해피떨스데이 — 목요일 공개 토론",
      channel: "머니코믹스",
      channelBadge: "🎉",
      description: "시청자와 함께하는 공개 투자 토론. 다양한 투자 시각과 시장 해석을 들을 수 있는 코너입니다.",
      duration: "1~2시간 (라이브)",
      tags: ["공개토론", "시청자참여", "목요일"],
      url: "https://www.youtube.com/@moneycomics",
      color: "from-amber-500/20 to-yellow-500/10",
    },
  ],
};

export default function Guide() {
  const [activeLevel, setActiveLevel] = useState<Level>("basic");
  const level = LEVELS.find((l) => l.id === activeLevel)!;
  const videos = VIDEOS[activeLevel];

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24 md:pb-8 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
          <PlayCircle className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">주식 가이드</h1>
          <p className="text-xs text-muted-foreground">단계별 유튜브 추천 강의 모음</p>
        </div>
      </div>

      {/* 레벨 탭 */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {LEVELS.map((lv) => {
          const active = activeLevel === lv.id;
          return (
            <button
              key={lv.id}
              onClick={() => setActiveLevel(lv.id)}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-center transition-all duration-150",
                active
                  ? cn(lv.bg, lv.border, lv.color, "shadow-sm")
                  : "border-border bg-card text-muted-foreground hover:bg-muted/40"
              )}
            >
              <div className="text-xl leading-none">{lv.emoji}</div>
              <div className={cn("text-[11px] font-bold leading-tight", active ? lv.color : "")}>
                {lv.label}
              </div>
            </button>
          );
        })}
      </div>

      {/* 레벨 설명 배너 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeLevel}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className={cn("rounded-xl border px-4 py-3 flex items-center gap-3", level.bg, level.border)}
        >
          <span className="text-2xl">{level.emoji}</span>
          <div>
            <p className={cn("text-sm font-bold", level.color)}>{level.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{level.subtitle}</p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* 영상 카드 그리드 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeLevel + "-cards"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-3"
        >
          {videos.map((v, i) => (
            <motion.a
              key={v.title}
              href={v.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="block rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors overflow-hidden group"
            >
              {/* 상단 그라디언트 띠 */}
              <div className={cn("h-1 w-full bg-gradient-to-r", v.color)} />

              <div className="flex items-start gap-3 px-4 py-4">
                {/* 썸네일 또는 채널 아이콘 */}
                {v.videoId ? (
                  <div className="relative w-24 h-[54px] rounded-lg overflow-hidden flex-shrink-0 bg-black/40">
                    <img
                      src={`https://img.youtube.com/vi/${v.videoId}/mqdefault.jpg`}
                      alt={v.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition-colors">
                      <div className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center shadow-lg">
                        <Play className="w-3 h-3 text-white fill-white ml-0.5" />
                      </div>
                    </div>
                    {v.views && (
                      <div className="absolute bottom-0.5 right-0.5 bg-black/70 rounded px-1 py-0.5 text-[9px] text-white font-medium">
                        {v.views}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center text-2xl",
                    "bg-gradient-to-br", v.color
                  )}>
                    {v.channelBadge}
                  </div>
                )}

                {/* 내용 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-blue-400 transition-colors">
                      {v.title}
                    </h3>
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0 mt-0.5 group-hover:text-blue-400 transition-colors" />
                  </div>

                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-medium text-muted-foreground">{v.channel}</span>
                    <span className="text-muted-foreground/30">·</span>
                    <span className="text-xs text-muted-foreground">{v.duration}</span>
                  </div>

                  <p className="text-xs text-muted-foreground/80 mt-1 leading-relaxed line-clamp-2">
                    {v.description}
                  </p>

                  {/* 태그 */}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {v.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-muted/60 text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.a>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* 안내 배너 */}
      <div className="rounded-xl border border-border bg-muted/20 px-4 py-3 text-center">
        <p className="text-xs text-muted-foreground">
          💡 카드를 탭하면 유튜브로 이동합니다 · 새 탭에서 열립니다
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          영상 내용은 해당 크리에이터의 견해이며, 투자 결정은 본인 판단에 따릅니다
        </p>
      </div>

      {/* Zap CTA */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 px-5 py-4 flex items-center gap-4"
      >
        <div className="w-10 h-10 rounded-full bg-blue-500/15 flex items-center justify-center flex-shrink-0">
          <Zap className="w-5 h-5 text-blue-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">배운 내용을 실전에 적용해보세요!</p>
          <p className="text-xs text-muted-foreground mt-0.5">원광증권 모의거래로 연습하면 실력이 더 빠르게 늡니다 🚀</p>
        </div>
      </motion.div>
    </div>
  );
}
