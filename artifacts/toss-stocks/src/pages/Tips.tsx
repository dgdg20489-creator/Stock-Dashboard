import { motion } from "framer-motion";
import { BookOpen, TrendingUp, BarChart2, DollarSign, ShieldCheck, Clock } from "lucide-react";

const tipCategories = [
  { icon: TrendingUp, title: "주식 기초", desc: "주식이란 무엇인지, 어떻게 투자하는지 알아봅니다.", color: "text-primary bg-primary/10" },
  { icon: BarChart2, title: "차트 읽기", desc: "캔들차트, 이동평균선, 거래량 분석법을 배웁니다.", color: "text-blue-500 bg-blue-500/10" },
  { icon: DollarSign, title: "투자 전략", desc: "가치투자, 성장주 투자 등 다양한 전략을 소개합니다.", color: "text-green-500 bg-green-500/10" },
  { icon: ShieldCheck, title: "리스크 관리", desc: "분산투자와 손절 전략으로 자산을 지키는 방법을 알아봅니다.", color: "text-orange-500 bg-orange-500/10" },
  { icon: Clock, title: "시장 타이밍", desc: "언제 사고 팔아야 할지, 시장 사이클을 이해합니다.", color: "text-purple-500 bg-purple-500/10" },
  { icon: BookOpen, title: "주식 용어집", desc: "PER, PBR, EPS 등 필수 투자 용어를 쉽게 정리합니다.", color: "text-cyan-500 bg-cyan-500/10" },
];

export default function Tips() {
  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="px-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">주식 팁</h1>
        <p className="text-muted-foreground font-medium mt-2">투자 실력을 키워주는 알짜 콘텐츠를 준비 중입니다.</p>
      </div>

      {/* 준비 중 배너 */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-3xl p-8 border border-border/50 shadow-sm text-center"
      >
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-5">
          <BookOpen className="w-9 h-9 text-primary" />
        </div>
        <h2 className="text-2xl font-extrabold text-foreground mb-2">콘텐츠 준비 중입니다</h2>
        <p className="text-muted-foreground font-medium max-w-sm mx-auto leading-relaxed">
          전문가가 엄선한 투자 가이드와 주식 용어 해설이 곧 업데이트됩니다.
          아래 카테고리를 미리 확인해 보세요.
        </p>
        <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-bold">
          <Clock className="w-4 h-4" />
          업데이트 예정
        </div>
      </motion.div>

      {/* 예정 카테고리 카드들 */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-4 px-1">준비 중인 카테고리</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {tipCategories.map((cat, i) => (
            <motion.div
              key={cat.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="bg-card rounded-2xl p-5 border border-border/50 shadow-sm flex items-start gap-4 opacity-70 cursor-not-allowed"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cat.color}`}>
                <cat.icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-foreground mb-0.5">{cat.title}</h3>
                <p className="text-sm text-muted-foreground font-medium leading-relaxed">{cat.desc}</p>
              </div>
              <span className="ml-auto text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full flex-shrink-0">준비 중</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
