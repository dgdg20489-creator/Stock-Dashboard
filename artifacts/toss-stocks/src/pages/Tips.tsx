import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, TrendingUp, BarChart2, DollarSign, ShieldCheck,
  Brain, Building2, GraduationCap, CheckCircle2, XCircle,
  ChevronRight, Search, PlayCircle, ArrowLeft, RotateCcw,
  Activity, Cpu, Globe, HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMissions } from "@/hooks/use-missions";
import { Link, useSearch } from "wouter";
import GuideContent from "@/pages/Guide";

type TabType = "tips" | "quiz" | "guide";

/* ─────────────────────────────────────────────────
   주식 용어 데이터 (주식용어DB.xlsx 기반 253개)
───────────────────────────────────────────────── */
interface TipItem {
  id: string;
  category: string;
  categoryColor: string;
  title: string;
  body: string;
}

const TIPS_DATA: TipItem[] = [
  {
    id: "t1",
    category: "시장기초",
    categoryColor: "bg-blue-500/10 text-blue-600",
    title: "코스피(KOSPI)",
    body: "대기업 중심의 유가증권시장 — \"코스피 3,000 돌파\"는 국가 전체 경제가 좋다는 신호로 해석함",
  },
  {
    id: "t2",
    category: "시장기초",
    categoryColor: "bg-blue-500/10 text-blue-600",
    title: "코스닥(KOSDAQ)",
    body: "중소/벤처기업 중심의 시장 — \"코스닥 강세\"는 IT, 바이오 등 성장주로 돈이 몰리고 있다는 뜻",
  },
  {
    id: "t3",
    category: "시장기초",
    categoryColor: "bg-blue-500/10 text-blue-600",
    title: "상장",
    body: "거래소에 주식을 등록하는 것 — 상장 소식은 기업의 자금 조달력이 커진다는 호재로 읽힘",
  },
  {
    id: "t4",
    category: "시장기초",
    categoryColor: "bg-blue-500/10 text-blue-600",
    title: "종목코드",
    body: "주식 고유 번호 (6자리) — 신문에서 숫자 6자리만 나오면 해당 기업의 코드로 이해하면 됨",
  },
  {
    id: "t5",
    category: "시장기초",
    categoryColor: "bg-blue-500/10 text-blue-600",
    title: "시가총액",
    body: "기업의 실질적인 규모(가치). — 시총 순위 변화는 산업의 주도권이 어디로 가는지 보여줌",
  },
  {
    id: "t6",
    category: "거래용어",
    categoryColor: "bg-green-500/10 text-green-600",
    title: "매수",
    body: "주식을 사는 것 — \"외인 순매수\" 기사는 외국인이 한국 시장을 긍정적으로 본다는 증거",
  },
  {
    id: "t7",
    category: "거래용어",
    categoryColor: "bg-green-500/10 text-green-600",
    title: "매도",
    body: "주식을 파는 것 — \"기관 매도세\"가 강하면 대형주 주가가 누를 가능성이 높음",
  },
  {
    id: "t8",
    category: "거래용어",
    categoryColor: "bg-green-500/10 text-green-600",
    title: "시가",
    body: "장 시작 가격 — 전날 밤 미국 증시가 좋았다면 시가가 높게 형성(갭상승)됨",
  },
  {
    id: "t9",
    category: "거래용어",
    categoryColor: "bg-green-500/10 text-green-600",
    title: "종가",
    body: "장 마감 가격 — \"종가 관리\"라는 말은 내일 장을 위해 세력이 가격을 맞췄다는 뜻",
  },
  {
    id: "t10",
    category: "거래용어",
    categoryColor: "bg-green-500/10 text-green-600",
    title: "고가",
    body: "장중 최고가 — 고가 대비 종가가 너무 낮으면 위꼬리가 길어져 하락 신호로 봄",
  },
  {
    id: "t11",
    category: "거래용어",
    categoryColor: "bg-green-500/10 text-green-600",
    title: "저가",
    body: "장중 최저가 — 저가에서 반등했다면 해당 가격대에 강력한 지지선이 있다는 뜻",
  },
  {
    id: "t12",
    category: "거래용어",
    categoryColor: "bg-green-500/10 text-green-600",
    title: "호가",
    body: "사고팔려는 가격 제시 — \"호가 공백\"은 거래가 없어서 작은 주문에도 주가가 튈 수 있음을 경고",
  },
  {
    id: "t13",
    category: "거래용어",
    categoryColor: "bg-green-500/10 text-green-600",
    title: "체결",
    body: "거래 성사 — \"대량 체결\" 뉴스는 큰손들이 움직였다는 결정적 증거",
  },
  {
    id: "t14",
    category: "거래용어",
    categoryColor: "bg-green-500/10 text-green-600",
    title: "예수금",
    body: "계좌 내 대기 자금 — \"예수금 역대 최대\"는 상승장을 위한 총알이 충전되었다는 호재",
  },
  {
    id: "t15",
    category: "거래용어",
    categoryColor: "bg-green-500/10 text-green-600",
    title: "증거금",
    body: "주식 주문용 계약금 — 증거금률이 높으면 우량주, 낮으면 위험주로 분류되기도 함",
  },
  {
    id: "t16",
    category: "거래용어",
    categoryColor: "bg-green-500/10 text-green-600",
    title: "미수금",
    body: "외상으로 산 주식 대금 — 미수금이 늘어나면 빚내서 투자하는 과열 상태로 해석",
  },
  {
    id: "t17",
    category: "거래용어",
    categoryColor: "bg-green-500/10 text-green-600",
    title: "반대매매",
    body: "증권사의 강제 주식 매도 — \"반대매매 공포\" 기사는 주가 폭락의 가속 페달이 될 수 있음",
  },
  {
    id: "t18",
    category: "거래용어",
    categoryColor: "bg-green-500/10 text-green-600",
    title: "손절매",
    body: "손해 보고 팔기 — \"기관의 손절 물량\"은 하락이 멈추기 전 마지막 투매일 때가 많음",
  },
  {
    id: "t19",
    category: "거래용어",
    categoryColor: "bg-green-500/10 text-green-600",
    title: "익절",
    body: "수익 확정 매도 — \"차익 실현 매물\"이라는 단어는 주가가 올라서 사람들이 팔고 있다는 뜻",
  },
  {
    id: "t20",
    category: "거래용어",
    categoryColor: "bg-green-500/10 text-green-600",
    title: "물타기",
    body: "평단가 낮추기 추가 매수 — \"개미들 물타기 지속\"은 하락장에서도 희망을 버리지 않았다는 의미",
  },
  {
    id: "t21",
    category: "차트기초",
    categoryColor: "bg-orange-500/10 text-orange-600",
    title: "양봉",
    body: "시작보다 오른 봉 (빨강) — 장대양봉은 강력한 상승 의지를 나타내며 매수 신호로 읽음",
  },
  {
    id: "t22",
    category: "차트기초",
    categoryColor: "bg-orange-500/10 text-orange-600",
    title: "음봉",
    body: "시작보다 내린 봉 (파랑) — 장대음봉은 악재가 터졌거나 세력이 이탈했다는 위험 신호",
  },
  {
    id: "t23",
    category: "차트기초",
    categoryColor: "bg-orange-500/10 text-orange-600",
    title: "일봉",
    body: "하루의 성적표 — \"일봉상 추세 전환\"은 며칠간의 흐름이 상승으로 바뀌었다는 뜻",
  },
  {
    id: "t24",
    category: "차트기초",
    categoryColor: "bg-orange-500/10 text-orange-600",
    title: "주봉",
    body: "일주일의 흐름 — 단기 변동성보다 큰 흐름을 볼 때 주봉 뉴스를 확인해야 함",
  },
  {
    id: "t25",
    category: "차트기초",
    categoryColor: "bg-orange-500/10 text-orange-600",
    title: "분봉",
    body: "짧은 시간의 흐름 — \"분봉상 급등\"은 단타 투자자들이 몰리고 있다는 실시간 신호",
  },
  {
    id: "t26",
    category: "차트기초",
    categoryColor: "bg-orange-500/10 text-orange-600",
    title: "이동평균선",
    body: "주가 평균 선 — \"5일선 이탈\"은 단기적인 상승세가 꺾였다는 기술적 해석",
  },
  {
    id: "t27",
    category: "차트기초",
    categoryColor: "bg-orange-500/10 text-orange-600",
    title: "골든크로스",
    body: "단기가 장기를 돌파 (상승) — 신문에서 \"기술적 반등 성공\"의 근거로 가장 많이 쓰임",
  },
  {
    id: "t28",
    category: "차트기초",
    categoryColor: "bg-orange-500/10 text-orange-600",
    title: "데드크로스",
    body: "단기가 장기를 하향 (하락) — 하락 추세의 시작을 알리는 경고 신호로 해석함",
  },
  {
    id: "t29",
    category: "차트기초",
    categoryColor: "bg-orange-500/10 text-orange-600",
    title: "거래량",
    body: "매매 수량 — \"거래량 실린 상승\"은 진짜 상승, 거래량 없는 상승은 가짜일 확률이 높음",
  },
  {
    id: "t30",
    category: "차트기초",
    categoryColor: "bg-orange-500/10 text-orange-600",
    title: "지지선",
    body: "하락을 막는 바닥 — \"지지선 붕괴\" 뉴스는 추가 폭락의 신호탄이 될 수 있음",
  },
  {
    id: "t31",
    category: "차트기초",
    categoryColor: "bg-orange-500/10 text-orange-600",
    title: "저항선",
    body: "상승을 막는 천장 — \"전고점 돌파\"는 저항선을 뚫었다는 뜻으로 강한 상승을 예고",
  },
  {
    id: "t32",
    category: "재무용어",
    categoryColor: "bg-purple-500/10 text-purple-600",
    title: "배당",
    body: "주주에게 이익 나눔 — 고배당주 기사는 주로 연말에 주가 방어력이 높다는 뜻으로 나옴",
  },
  {
    id: "t33",
    category: "재무용어",
    categoryColor: "bg-purple-500/10 text-purple-600",
    title: "배당수익률",
    body: "가격 대비 배당 비율 — 은행 이자보다 높으면 안정적인 투자처로 각광받음",
  },
  {
    id: "t34",
    category: "재무용어",
    categoryColor: "bg-purple-500/10 text-purple-600",
    title: "PER(이익대비주가)",
    body: "주가를 주당순이익으로 나눈값. 현재 주가가 기업이 벌어들이는 이익에 비해 얼마나 비싼지를 나타냄 — PER이 낮을수록 저평가 가능성. 성장성이 낮거나 실적 부진일 수도 있으니 주의",
  },
  {
    id: "t35",
    category: "재무용어",
    categoryColor: "bg-purple-500/10 text-purple-600",
    title: "PBR(주가순자산비율)",
    body: "기업의 시가총액을 순자산으로 나눈값. 기업의 실제 가치 대비 주가 수준 — PBR 1 미만은 자산만큼도 평가받지 못하는 상태. 코리아 디스카운트의 핵심 지표",
  },
  {
    id: "t36",
    category: "재무용어",
    categoryColor: "bg-purple-500/10 text-purple-600",
    title: "ROE(자기자본이익률)",
    body: "주주가 투자한 돈으로 기업이 얼마나 순이익을 냈는지 나타내는 비율 — ROE 20% 이상은 알짜 기업. 보통 10~15% 이상이면 우량 기업으로 평가",
  },
  {
    id: "t37",
    category: "재무용어",
    categoryColor: "bg-purple-500/10 text-purple-600",
    title: "EPS(주당 순이익)",
    body: "기업이 벌어들인 순이익을 발행된 주식수로 나눈값 — EPS가 높을수록 주주에게 더 많은 이익을 돌려줄 수 있는 능력이 있음",
  },
  {
    id: "t38",
    category: "재무용어",
    categoryColor: "bg-purple-500/10 text-purple-600",
    title: "재무제표",
    body: "기업의 성적표 — \"감사의견 거절\" 기사가 뜨면 상장폐지 위험이 있으니 즉시 피해야 함",
  },
  {
    id: "t39",
    category: "재무용어",
    categoryColor: "bg-purple-500/10 text-purple-600",
    title: "영업이익",
    body: "장사로 번 돈 — \"영업이익 흑자 전환\"은 주가 반등의 가장 강력한 호재 뉴스",
  },
  {
    id: "t40",
    category: "재무용어",
    categoryColor: "bg-purple-500/10 text-purple-600",
    title: "당기순이익",
    body: "최종 남은 이익 — 일시적인 이익(땅 매각 등)인지 실제 장사 이익인지 구분해야 함",
  },
  {
    id: "t41",
    category: "공시/이슈",
    categoryColor: "bg-red-500/10 text-red-600",
    title: "IPO",
    body: "첫 주식 공개 판매 — \"공모주 청약 열기\"는 시장에 돈이 많고 투자 심리가 뜨겁다는 증거",
  },
  {
    id: "t42",
    category: "공시/이슈",
    categoryColor: "bg-red-500/10 text-red-600",
    title: "유상증자",
    body: "주주에게 돈 받고 주식 발행 — \"운영자금 조달 목적\"은 악재, \"시설투자 목적\"은 미래 호재로 해석",
  },
  {
    id: "t43",
    category: "공시/이슈",
    categoryColor: "bg-red-500/10 text-red-600",
    title: "무상증자",
    body: "공짜 주식 배정 — 주식 수가 늘어나 거래가 활발해지는 단기 호재로 읽힘",
  },
  {
    id: "t44",
    category: "공시/이슈",
    categoryColor: "bg-red-500/10 text-red-600",
    title: "액면분할",
    body: "주식 쪼개기 — \"국민주 등극\" 뉴스처럼 소액 투자자들이 들어오기 좋아지는 호재",
  },
  {
    id: "t45",
    category: "공시/이슈",
    categoryColor: "bg-red-500/10 text-red-600",
    title: "액면병합",
    body: "주식 합치기 — 주식 수가 너무 많아 가벼워 보일 때 관리 차원에서 진행함",
  },
  {
    id: "t46",
    category: "공시/이슈",
    categoryColor: "bg-red-500/10 text-red-600",
    title: "상장폐지",
    body: "시장 퇴출 — \"정리매매 시작\" 뉴스는 마지막 탈출 기회이므로 절대 새로 사면 안 됨",
  },
  {
    id: "t47",
    category: "공시/이슈",
    categoryColor: "bg-red-500/10 text-red-600",
    title: "어닝 서프라이즈",
    body: "예상 뛰어넘는 실적 — 주가를 한 단계 점프시키는 가장 확실한 상승 기폭제",
  },
  {
    id: "t48",
    category: "공시/이슈",
    categoryColor: "bg-red-500/10 text-red-600",
    title: "어닝 쇼크",
    body: "실망스러운 실적 — \"컨센서스 하회\"라는 말과 함께 나오면 주가 급락의 전주곡",
  },
  {
    id: "t49",
    category: "공시/이슈",
    categoryColor: "bg-red-500/10 text-red-600",
    title: "서킷브레이커",
    body: "시장 급락 시 거래 중단 — 코스피/코스닥이 8% 이상 하락 시 발동하는 안전장치",
  },
  {
    id: "t50",
    category: "공시/이슈",
    categoryColor: "bg-red-500/10 text-red-600",
    title: "사이드카",
    body: "선물 급등락 시 현물 주문 5분 중단 — 프로그램 매매를 일시 중단하는 쿨다운 장치",
  },
  {
    id: "t51",
    category: "투자전략",
    categoryColor: "bg-cyan-500/10 text-cyan-600",
    title: "가치투자",
    body: "저평가 우량주 장기 보유 — 버핏의 핵심 전략. 단기 소음을 무시하고 기업 본질에 집중",
  },
  {
    id: "t52",
    category: "투자전략",
    categoryColor: "bg-cyan-500/10 text-cyan-600",
    title: "성장투자",
    body: "고성장 기업 베팅 — PER이 높아도 미래 성장성이 담보된다면 프리미엄을 줌",
  },
  {
    id: "t53",
    category: "투자전략",
    categoryColor: "bg-cyan-500/10 text-cyan-600",
    title: "분산투자",
    body: "여러 종목/섹터로 리스크 분산 — 한 바구니에 달걀을 몰아담지 말라는 황금 원칙",
  },
  {
    id: "t54",
    category: "투자전략",
    categoryColor: "bg-cyan-500/10 text-cyan-600",
    title: "적립식 투자(DCA)",
    body: "정기적 소액 분할 매수 — 고점에 몰빵하는 리스크를 자동으로 줄여주는 전략",
  },
  {
    id: "t55",
    category: "투자전략",
    categoryColor: "bg-cyan-500/10 text-cyan-600",
    title: "손절선 설정",
    body: "매수가 -8% 하락 시 손절 원칙 — 감정을 배제하고 원칙을 지키는 것이 큰 손실을 막는 핵심",
  },
  {
    id: "t56",
    category: "투자전략",
    categoryColor: "bg-cyan-500/10 text-cyan-600",
    title: "모멘텀 투자",
    body: "오르는 종목을 따라 사는 전략 — \"추세는 친구\"라는 말처럼 강한 모멘텀 종목에 올라타기",
  },
  {
    id: "t57",
    category: "투자전략",
    categoryColor: "bg-cyan-500/10 text-cyan-600",
    title: "역발상 투자",
    body: "남들이 팔 때 사는 전략 — \"공포에 사서 탐욕에 팔아라\" 버핏 格言의 실전 적용",
  },
  {
    id: "t58",
    category: "투자전략",
    categoryColor: "bg-cyan-500/10 text-cyan-600",
    title: "배당 투자",
    body: "배당금을 목적으로 한 투자 — 배당수익률이 예금 금리보다 높은 주식을 찾는 전략",
  },
  {
    id: "t59",
    category: "투자전략",
    categoryColor: "bg-cyan-500/10 text-cyan-600",
    title: "ETF 투자",
    body: "인덱스 추종으로 시장 평균 수익 추구 — 저비용·분산의 장점. 개별 종목 리스크 없음",
  },
  {
    id: "t60",
    category: "투자전략",
    categoryColor: "bg-cyan-500/10 text-cyan-600",
    title: "공매도 활용",
    body: "주가 하락으로 수익을 추구하는 전략 — 기관·외인의 공매도 증가 시 해당 종목 경계",
  },
  {
    id: "t61",
    category: "심리/태도",
    categoryColor: "bg-yellow-500/10 text-yellow-600",
    title: "FOMO(Fear Of Missing Out)",
    body: "놓칠까봐 두려운 심리 — \"나만 못 벌까봐\" 급등 후 추격 매수로 이어지는 함정",
  },
  {
    id: "t62",
    category: "심리/태도",
    categoryColor: "bg-yellow-500/10 text-yellow-600",
    title: "손실 회피 편향",
    body: "이익보다 손실을 2.5배 크게 느끼는 심리 — 손절 못 하고 존버하다 큰 손실 입는 원인",
  },
  {
    id: "t63",
    category: "심리/태도",
    categoryColor: "bg-yellow-500/10 text-yellow-600",
    title: "확증 편향",
    body: "내 믿음에 유리한 정보만 보는 심리 — 보유 종목의 나쁜 뉴스를 외면하게 만드는 함정",
  },
  {
    id: "t64",
    category: "심리/태도",
    categoryColor: "bg-yellow-500/10 text-yellow-600",
    title: "군중 심리",
    body: "대중을 따라가는 심리 — 버블과 폭락 모두 군중 심리가 만들어내는 과잉 현상",
  },
  {
    id: "t65",
    category: "심리/태도",
    categoryColor: "bg-yellow-500/10 text-yellow-600",
    title: "과신 편향",
    body: "자신의 실력을 과대평가하는 심리 — 초보 때 운으로 번 돈을 실력으로 착각하는 위험",
  },
  {
    id: "t66",
    category: "심리/태도",
    categoryColor: "bg-yellow-500/10 text-yellow-600",
    title: "매몰비용 오류",
    body: "이미 쓴 돈이 아까워 더 투자하는 심리 — \"더 오를거야\"는 논리가 아닌 집착임을 인식해야",
  },
  {
    id: "t67",
    category: "심리/태도",
    categoryColor: "bg-yellow-500/10 text-yellow-600",
    title: "존버 심리",
    body: "끝까지 버티면 오른다는 믿음 — 우량주에는 유효하지만 불량주에 적용하면 파산 지름길",
  },
  {
    id: "t68",
    category: "심리/태도",
    categoryColor: "bg-yellow-500/10 text-yellow-600",
    title: "앵커링 효과",
    body: "최초 접한 가격에 집착하는 심리 — \"예전에 2만원이었으니 지금 1만원은 저렴\"이라는 오류",
  },
  {
    id: "t69",
    category: "심리/태도",
    categoryColor: "bg-yellow-500/10 text-yellow-600",
    title: "처분 효과",
    body: "이익 난 주식은 빨리 팔고, 손실 난 주식은 계속 보유하는 심리 — 수익을 줄이고 손실을 키우는 최악의 패턴",
  },
  {
    id: "t70",
    category: "심리/태도",
    categoryColor: "bg-yellow-500/10 text-yellow-600",
    title: "투자 일지 작성",
    body: "매매 근거와 결과를 기록하는 습관 — 자신의 패턴을 파악하고 실수를 반복하지 않는 최강의 훈련법",
  },
  {
    id: "t71",
    category: "기관투자자",
    categoryColor: "bg-indigo-500/10 text-indigo-600",
    title: "외국인 투자자",
    body: "국내 증시의 큰손 — \"외인 매수\" 뉴스는 코스피 상승의 가장 확실한 연료 역할",
  },
  {
    id: "t72",
    category: "기관투자자",
    categoryColor: "bg-indigo-500/10 text-indigo-600",
    title: "기관투자자",
    body: "연기금·보험사·은행·증권사 등 큰돈 굴리는 집단 — 기관 매수 종목은 안정성이 검증된 신호",
  },
  {
    id: "t73",
    category: "기관투자자",
    categoryColor: "bg-indigo-500/10 text-indigo-600",
    title: "연기금",
    body: "국민연금 등 장기 자금 운용 기관 — 연기금 매수 지속은 장기 우량주 판단의 강력한 근거",
  },
  {
    id: "t74",
    category: "기관투자자",
    categoryColor: "bg-indigo-500/10 text-indigo-600",
    title: "개인투자자(개미)",
    body: "정보 열위에 있는 일반 투자자 — 기관·외인 대비 정보력 부족. 역발상으로 대응하는 지혜 필요",
  },
  {
    id: "t75",
    category: "기관투자자",
    categoryColor: "bg-indigo-500/10 text-indigo-600",
    title: "세력",
    body: "특정 종목을 인위적으로 움직이는 집단 — 거래량 급증 + 주가 급등 패턴에 주의",
  },
  {
    id: "t76",
    category: "기관투자자",
    categoryColor: "bg-indigo-500/10 text-indigo-600",
    title: "프로그램 매매",
    body: "컴퓨터 알고리즘 대량 매매 — 서킷브레이커 발동 원인이 되기도 하는 시장 교란 요소",
  },
  {
    id: "t77",
    category: "기관투자자",
    categoryColor: "bg-indigo-500/10 text-indigo-600",
    title: "공매도",
    body: "빌려서 팔고 나중에 갚는 투자법 — 공매도 잔고 증가는 해당 종목 하락 베팅이 늘었다는 신호",
  },
  {
    id: "t78",
    category: "기관투자자",
    categoryColor: "bg-indigo-500/10 text-indigo-600",
    title: "수급",
    body: "주식 매수·매도 주체의 수요와 공급 — 외인+기관 동반 매수는 가장 강력한 상승 신호",
  },
  {
    id: "t79",
    category: "기관투자자",
    categoryColor: "bg-indigo-500/10 text-indigo-600",
    title: "블록딜",
    body: "대량 지분 일괄 매각 — \"오버행 해소\" 기사는 대주주 지분 매각 압박이 끝났다는 뜻",
  },
  {
    id: "t80",
    category: "기관투자자",
    categoryColor: "bg-indigo-500/10 text-indigo-600",
    title: "오버행",
    body: "잠재적 매도 물량 부담 — 대주주 보호예수 해제 시기에 주가가 눌리는 이유",
  },
  {
    id: "t81",
    category: "공시/이슈",
    categoryColor: "bg-red-500/10 text-red-600",
    title: "상한가",
    body: "하루 최대 30% 상승 — 연속 상한가는 테마·이슈·세력의 3박자가 맞아떨어진 신호",
  },
  {
    id: "t82",
    category: "공시/이슈",
    categoryColor: "bg-red-500/10 text-red-600",
    title: "하한가",
    body: "하루 최대 30% 하락 — 하한가 이후 반등이 없으면 상장폐지 위험을 의심해야 함",
  },
  {
    id: "t83",
    category: "공시/이슈",
    categoryColor: "bg-red-500/10 text-red-600",
    title: "배당락",
    body: "배당 권리가 소멸되는 날 — 배당락일 이후 주가는 배당금만큼 하락하는 것이 일반적",
  },
  {
    id: "t84",
    category: "공시/이슈",
    categoryColor: "bg-red-500/10 text-red-600",
    title: "주주환원",
    body: "배당·자사주 매입 등으로 주주에게 이익 돌려주기 — 적극적 주주환원 기업은 장기 우량주 특징",
  },
  {
    id: "t85",
    category: "공시/이슈",
    categoryColor: "bg-red-500/10 text-red-600",
    title: "자사주 매입",
    body: "기업이 자기 주식을 시장에서 사들이는 것 — 주가 부양 신호로 읽히며 단기 호재",
  },
  {
    id: "t86",
    category: "재무용어",
    categoryColor: "bg-purple-500/10 text-purple-600",
    title: "부채비율",
    body: "총부채 ÷ 자기자본 × 100 — 200% 이상이면 재무구조가 불안하다는 경고 신호",
  },
  {
    id: "t87",
    category: "재무용어",
    categoryColor: "bg-purple-500/10 text-purple-600",
    title: "유동비율",
    body: "단기 부채 상환 능력 — 100% 미만이면 단기 자금 경색 위험이 있음",
  },
  {
    id: "t88",
    category: "재무용어",
    categoryColor: "bg-purple-500/10 text-purple-600",
    title: "현금흐름",
    body: "기업의 실제 현금 유출입 — 영업이익이 좋아도 현금흐름이 마이너스면 위험 신호",
  },
  {
    id: "t89",
    category: "재무용어",
    categoryColor: "bg-purple-500/10 text-purple-600",
    title: "EBITDA",
    body: "이자·세금·감가상각 전 이익 — 기업의 실제 영업 현금 창출력을 보는 글로벌 지표",
  },
  {
    id: "t90",
    category: "재무용어",
    categoryColor: "bg-purple-500/10 text-purple-600",
    title: "순자산(BPS)",
    body: "주당 순자산 — PBR 계산의 분모. 기업 청산 시 주주가 받을 수 있는 이론적 금액",
  },
  {
    id: "t91",
    category: "시장기초",
    categoryColor: "bg-blue-500/10 text-blue-600",
    title: "강세장(Bull Market)",
    body: "주가가 전반적으로 오르는 장 — 소가 뿔을 위로 치켜드는 모습에서 유래한 용어",
  },
  {
    id: "t92",
    category: "시장기초",
    categoryColor: "bg-blue-500/10 text-blue-600",
    title: "약세장(Bear Market)",
    body: "주가가 전반적으로 내리는 장 — 곰이 발톱을 아래로 내리찍는 모습에서 유래",
  },
  {
    id: "t93",
    category: "시장기초",
    categoryColor: "bg-blue-500/10 text-blue-600",
    title: "조정",
    body: "상승 중 일시적 하락 (10~20%) — 상승장에서 과열을 식히는 건강한 숨 고르기",
  },
  {
    id: "t94",
    category: "시장기초",
    categoryColor: "bg-blue-500/10 text-blue-600",
    title: "섹터 로테이션",
    body: "경기 사이클에 따라 주도 업종이 바뀌는 현상 — IT→금융→소비재→에너지 순환 흐름 파악이 핵심",
  },
  {
    id: "t95",
    category: "시장기초",
    categoryColor: "bg-blue-500/10 text-blue-600",
    title: "블루칩",
    body: "재무가 탄탄한 대형 우량주 — 포커에서 가장 가치 있는 파란 칩에서 유래",
  },
  {
    id: "t96",
    category: "차트기초",
    categoryColor: "bg-orange-500/10 text-orange-600",
    title: "RSI(상대강도지수)",
    body: "과매수·과매도 판단 지표 — 70 이상은 과매수, 30 이하는 과매도 신호",
  },
  {
    id: "t97",
    category: "차트기초",
    categoryColor: "bg-orange-500/10 text-orange-600",
    title: "볼린저밴드",
    body: "이동평균 ± 2 표준편차로 구성한 밴드 — 밴드 이탈 시 추세 전환 또는 강한 돌파 신호",
  },
  {
    id: "t98",
    category: "차트기초",
    categoryColor: "bg-orange-500/10 text-orange-600",
    title: "MACD",
    body: "단기-장기 이동평균 차이를 이용한 추세 지표 — 시그널선 돌파 시 매수·매도 신호 발생",
  },
  {
    id: "t99",
    category: "차트기초",
    categoryColor: "bg-orange-500/10 text-orange-600",
    title: "피보나치 되돌림",
    body: "38.2%, 50%, 61.8% 되돌림 지지·저항 — 급등 후 조정이 어디서 멈출지 예측에 활용",
  },
  {
    id: "t100",
    category: "차트기초",
    categoryColor: "bg-orange-500/10 text-orange-600",
    title: "헤드앤숄더",
    body: "세 봉우리를 가진 반전 패턴 — 목선 붕괴 시 강한 하락 추세 전환 신호로 해석",
  },
  {
    id: "t101",
    category: "투자전략",
    categoryColor: "bg-cyan-500/10 text-cyan-600",
    title: "포트폴리오 리밸런싱",
    body: "목표 비중 유지를 위한 주기적 조정 — 오른 자산 팔고 내린 자산 사서 균형 맞추기",
  },
  {
    id: "t102",
    category: "투자전략",
    categoryColor: "bg-cyan-500/10 text-cyan-600",
    title: "코어-새틀라이트 전략",
    body: "안전 자산 70%+성장 자산 30% 구조 — 안정성과 수익성을 동시에 추구하는 황금 배분",
  },
  {
    id: "t103",
    category: "투자전략",
    categoryColor: "bg-cyan-500/10 text-cyan-600",
    title: "섹터 집중 투자",
    body: "특정 산업에 집중하는 전략 — IT·바이오 등 성장 섹터 집중 시 큰 수익 가능하나 리스크도 큼",
  },
  {
    id: "t104",
    category: "투자전략",
    categoryColor: "bg-cyan-500/10 text-cyan-600",
    title: "퀀트 투자",
    body: "데이터·수학 모델로 투자 결정 — PER·PBR·ROE 등 수치 조합으로 종목을 자동 선별",
  },
  {
    id: "t105",
    category: "투자전략",
    categoryColor: "bg-cyan-500/10 text-cyan-600",
    title: "테마주 투자",
    body: "특정 이슈·트렌드 수혜 종목 — 단기 수익 기회이나 이슈 소멸 시 급락 위험 존재",
  },
  {
    id: "t106",
    category: "심리/태도",
    categoryColor: "bg-yellow-500/10 text-yellow-600",
    title: "인내와 규율",
    body: "성공 투자의 핵심 덕목 — 시장의 단기 소음에 흔들리지 않고 원칙을 지키는 힘",
  },
  {
    id: "t107",
    category: "심리/태도",
    categoryColor: "bg-yellow-500/10 text-yellow-600",
    title: "본전 심리",
    body: "원금 회복에 집착하는 심리 오류 — 매몰비용 개념으로 접근해야. 현재 가치만을 기준으로 판단",
  },
  {
    id: "t108",
    category: "시장기초",
    categoryColor: "bg-blue-500/10 text-blue-600",
    title: "시장지수",
    body: "KOSPI·KOSDAQ·S&P500·나스닥 등 시장 전체를 나타내는 지표 — 지수 흐름이 개별 종목 방향을 결정하는 큰 흐름",
  },
  {
    id: "t109",
    category: "재무용어",
    categoryColor: "bg-purple-500/10 text-purple-600",
    title: "컨센서스",
    body: "증권사 애널리스트들의 평균 전망치 — 실적이 컨센서스를 웃돌면 어닝 서프라이즈, 밑돌면 어닝 쇼크",
  },
  {
    id: "t110",
    category: "공시/이슈",
    categoryColor: "bg-red-500/10 text-red-600",
    title: "테이퍼링",
    body: "중앙은행의 자산매입 규모 축소 — 시장 유동성 감소 신호로 주식·채권 동반 하락 압력",
  },
  {
    id: "t111",
    category: "공시/이슈",
    categoryColor: "bg-red-500/10 text-red-600",
    title: "박스권",
    body: "주가가 일정 범위 내에서 등락을 반복하는 구간 — 박스권 돌파 시 강한 방향성 발생. 단기 매매에 유리한 구간",
  },
  {
    id: "t112",
    category: "거래용어",
    categoryColor: "bg-green-500/10 text-green-600",
    title: "신용융자",
    body: "증권사에서 돈을 빌려 주식을 매수하는 것. — 증권사에서 돈을 빌려 투자하는 방식으로, 수익을 극대화할 수 있지만 손실도 커지는 양날의 검입니다.",
  },
  {
    id: "t113",
    category: "거래용어",
    categoryColor: "bg-green-500/10 text-green-600",
    title: "대주거래",
    body: "주식을 빌려 팔고 나중에 갚는 공매도의 일종. — 주가가 내려갈 것을 예상하고 주식을 빌려 먼저 팔았다가 가격이 내리면 다시 사서 갚아 차익을 남기는 전략입니다.",
  },
  {
    id: "t114",
    category: "거래용어",
    categoryColor: "bg-green-500/10 text-green-600",
    title: "추가 증거금(Margin Call)",
    body: "신용 거래 손실 시 증권사가 요구하는 추가 담보금. — 빌린 돈으로 투자한 주가가 떨어지면 추가로 돈을 내야 하는 공포의 통보입니다.",
  },
  {
    id: "t115",
    category: "거래용어",
    categoryColor: "bg-green-500/10 text-green-600",
    title: "동시호가",
    body: "장 개시/종료 직전 단일 가격으로 모아 체결하는 시간. — 모든 주문을 모아 하나의 가격으로 체결하는 시간으로, 시장이 열리고 닫히는 중요한 신호탄입니다.",
  },
  {
    id: "t116",
    category: "거래용어",
    categoryColor: "bg-green-500/10 text-green-600",
    title: "시간외 단일가",
    body: "정규장 마감 후 시간외로 거래하는 방식. — 정규장 마감 후에도 시간외로 주식을 사고팔 수 있어, 저녁에 나온 중요한 뉴스에 대응할 수 있습니다.",
  },
  {
    id: "t117",
    category: "공시/이슈",
    categoryColor: "bg-red-500/10 text-red-600",
    title: "M&A(인수합병)",
    body: "기업이 다른 기업을 사거나 합치는 것. — 사는 쪽은 시너지를 기대하고, 팔리는 쪽은 대주주가 프리미엄을 챙기는 구조로, 주가에 큰 영향을 미칩니다.",
  },
  {
    id: "t118",
    category: "공시/이슈",
    categoryColor: "bg-red-500/10 text-red-600",
    title: "지주회사",
    body: "자회사들의 주식을 보유하며 지배하는 모회사. — 계열사들을 거느린 대장 회사로, 자회사 가치 합산보다 낮게 거래되는 '지주사 할인'이 발생하기도 합니다.",
  },
  {
    id: "t119",
    category: "공시/이슈",
    categoryColor: "bg-red-500/10 text-red-600",
    title: "자회사",
    body: "모회사(지주회사)의 지배를 받는 기업. — 모회사가 지분을 가지고 있어 모회사의 경영 전략에 따라 주가가 함께 흔들리는 경향이 있습니다.",
  },
  {
    id: "t120",
    category: "공시/이슈",
    categoryColor: "bg-red-500/10 text-red-600",
    title: "스핀오프(인적분할)",
    body: "회사가 특정 사업부를 분리해 독립 회사로 만드는 것. — 분리된 회사의 주식을 기존 주주들도 나눠 받아 각 사업부의 가치를 별도로 평가받는 구조입니다.",
  },
  {
    id: "t121",
    category: "공시/이슈",
    categoryColor: "bg-red-500/10 text-red-600",
    title: "물적분할",
    body: "사업 부문을 자회사로 분리하여 모회사만 주식을 받는 것. — 기존 주주는 새 자회사 주식을 받지 못해 주가 하락의 빌미가 되는 경우가 많습니다.",
  },
  {
    id: "t122",
    category: "공시/이슈",
    categoryColor: "bg-red-500/10 text-red-600",
    title: "CB(전환사채)",
    body: "일정 조건하에 주식으로 전환 가능한 채권. — 나중에 주식으로 바꿀 수 있는 채권으로, 대규모 전환 시 주식 수가 늘어나 기존 주주의 지분가치가 희석될 수 있습니다.",
  },
  {
    id: "t123",
    category: "공시/이슈",
    categoryColor: "bg-red-500/10 text-red-600",
    title: "BW(신주인수권부사채)",
    body: "채권과 신주 인수권(새 주식을 살 권리)이 결합된 상품. — 채권 투자자에게 미래에 정해진 가격으로 주식을 살 권리도 함께 주는 상품입니다.",
  },
  {
    id: "t124",
    category: "공시/이슈",
    categoryColor: "bg-red-500/10 text-red-600",
    title: "제3자 배정 유상증자",
    body: "특정 투자자에게만 새 주식을 발행하여 자금을 조달하는 것. — 주로 대주주 지분을 높이거나 전략적 투자자를 유치할 때 사용되며, 기존 주주 입장에서는 지분이 희석되는 악재입니다.",
  },
  {
    id: "t125",
    category: "공시/이슈",
    categoryColor: "bg-red-500/10 text-red-600",
    title: "공동 경영",
    body: "두 개 이상의 기업이나 주주가 함께 기업을 경영하는 것. — 서로의 이해관계가 맞아야 하므로, 갈등이 생길 경우 경영권 분쟁으로 이어져 주가가 크게 흔들릴 수 있습니다.",
  },
  {
    id: "t126",
    category: "공시/이슈",
    categoryColor: "bg-red-500/10 text-red-600",
    title: "경영권 분쟁",
    body: "기업의 지배권을 두고 벌이는 다툼. — 대주주들의 싸움이 일어나면 단기적으로 주가가 급등하는 경우가 많아 투기적 매매가 몰립니다.",
  },
  {
    id: "t127",
    category: "공시/이슈",
    categoryColor: "bg-red-500/10 text-red-600",
    title: "ESG 경영",
    body: "환경(E), 사회(S), 지배구조(G)를 고려한 경영 방식. — 장기적 관점에서 지속가능한 기업인지를 평가하는 잣대로, 글로벌 기관투자자들의 투자 기준이 됩니다.",
  },
  {
    id: "t128",
    category: "공시/이슈",
    categoryColor: "bg-red-500/10 text-red-600",
    title: "사외이사",
    body: "회사 경영진에서 독립된 외부 이사. — 경영진을 견제하는 감시자 역할로, 독립성이 높을수록 지배구조가 우수한 기업으로 평가받습니다.",
  },
  {
    id: "t129",
    category: "공시/이슈",
    categoryColor: "bg-red-500/10 text-red-600",
    title: "자사주 소각",
    body: "기업이 자사주를 매입하여 없애버리는 것. — 시중의 주식 수를 줄여 남은 주주의 주식 가치를 높여주는, 주주를 위한 최고의 선물입니다.",
  },
  {
    id: "t130",
    category: "재무용어",
    categoryColor: "bg-orange-500/10 text-orange-600",
    title: "배당성향",
    body: "당기순이익 중 배당금으로 지급하는 비율. — 기업이 벌어들인 이익 중 주주에게 배당금으로 얼마나 돌려주는지를 보여주는 비율입니다.",
  },
  {
    id: "t131",
    category: "재무용어",
    categoryColor: "bg-orange-500/10 text-orange-600",
    title: "중간배당",
    body: "회계연도 중간에 배당을 실시하는 것. — 회계연도 중간에 주주들에게 이익을 나눠주는 것으로, 주주를 중시한다는 긍정적인 신호로 봅니다.",
  },
  {
    id: "t132",
    category: "공시/이슈",
    categoryColor: "bg-red-500/10 text-red-600",
    title: "지분공시(5% 룰)",
    body: "상장사 지분 5% 이상 보유 시 내역을 신고하는 제도. — '누가 이 회사를 대량으로 샀나?'를 보고 고수들의 움직임을 추적합니다.",
  },
  {
    id: "t133",
    category: "공시/이슈",
    categoryColor: "bg-red-500/10 text-red-600",
    title: "주주제안",
    body: "소액주주들이 경영진에게 특정 안건을 요구하는 것. — 주주들이 목소리를 높여 배당이나 경영 개선을 요구하는 변화의 시작입니다.",
  },
  {
    id: "t134",
    category: "공시/이슈",
    categoryColor: "bg-red-500/10 text-red-600",
    title: "공개매수",
    body: "경영권 확보 등을 위해 시장 밖에서 특정 가격으로 주식을 대량 매집하는 것. — 회사가 일정 가격에 주식을 다 사겠다고 선언한 것이라 그 가격이 목표가가 됩니다.",
  },
  {
    id: "t135",
    category: "공시/이슈",
    categoryColor: "bg-red-500/10 text-red-600",
    title: "워크아웃",
    body: "재무 구조 개선을 위해 채권단과 협의하는 기업 회생 절차. — 회사가 망하기 직전 심폐소생술을 받는 단계이므로 투자에 극히 유의해야 합니다.",
  },
  {
    id: "t136",
    category: "기타용어",
    categoryColor: "bg-gray-500/10 text-gray-600",
    title: "ETF(상장지수펀드)",
    body: "특정 지수를 추종하며 주식처럼 거래되는 펀드. — 주식처럼 시장에서 편하게 사고팔 수 있는 펀드로, 여러 종목에 분산 투자하여 위험을 낮추는 도구입니다.",
  },
  {
    id: "t137",
    category: "기타용어",
    categoryColor: "bg-gray-500/10 text-gray-600",
    title: "ETN(상장지수증권)",
    body: "증권사가 발행하여 지수 수익률을 보장하는 상품. — 증권사가 발행한 상품으로 원자재나 특정 지수에 쉽게 투자할 수 있게 해주며, 발행사의 신용을 함께 확인해야 합니다.",
  },
  {
    id: "t138",
    category: "기타용어",
    categoryColor: "bg-gray-500/10 text-gray-600",
    title: "레버리지 ETF",
    body: "지수 등락 폭의 2배, 3배 수익을 추구하는 상품. — '두 배 수익'을 노리는 위험하고 화끈한 투자입니다.",
  },
  {
    id: "t139",
    category: "기타용어",
    categoryColor: "bg-gray-500/10 text-gray-600",
    title: "인버스 ETF",
    body: "지수가 하락할 때 수익이 나는 상품. — '하락 시 수익'을 노리는 위험하고 화끈한 투자입니다.",
  },
  {
    id: "t140",
    category: "기타용어",
    categoryColor: "bg-gray-500/10 text-gray-600",
    title: "리츠(REITs)",
    body: "부동산에 투자하고 임대 수익을 배당하는 상품. — 건물주 대신 투자하고 월세처럼 배당을 받는 안정적인 투자 상품입니다.",
  },
  {
    id: "t141",
    category: "파생/선물",
    categoryColor: "bg-violet-500/10 text-violet-600",
    title: "선물(Futures)",
    body: "미래 특정 시점에 정해진 가격으로 자산을 사거나 파는 계약. — 미래 가격을 미리 정해 사고파는 것으로, 시장의 앞날을 미리 보는 거울입니다.",
  },
  {
    id: "t142",
    category: "파생/선물",
    categoryColor: "bg-violet-500/10 text-violet-600",
    title: "네 마녀의 날",
    body: "선물/옵션 만기일이 겹치는 날 (변동성 극대화). — 주가지수와 개별 주식의 선물/옵션 만기가 겹쳐 주가가 미친 듯이 출렁거립니다.",
  },
  {
    id: "t143",
    category: "파생/선물",
    categoryColor: "bg-violet-500/10 text-violet-600",
    title: "변동성 지수(VIX)",
    body: "시장의 공포감을 나타내는 지수. — 수치가 높을수록 투자자들이 공포에 떨고 있다는 뜻입니다.",
  },
  {
    id: "t144",
    category: "파생/선물",
    categoryColor: "bg-violet-500/10 text-violet-600",
    title: "LP(유동성 공급자)",
    body: "거래가 원활하도록 호가를 대주는 증권사. — 내가 주식을 팔고 싶을 때 바로 팔 수 있게 호가를 채워주는 고마운 존재입니다.",
  },
  {
    id: "t145",
    category: "파생/선물",
    categoryColor: "bg-violet-500/10 text-violet-600",
    title: "베이시스",
    body: "선물 가격과 현물 가격의 차이. — 이 수치의 변화를 통해 향후 대량의 프로그램 매물이 쏟아질지 미리 예측하는 척도가 됩니다.",
  },
  {
    id: "t146",
    category: "파생/선물",
    categoryColor: "bg-violet-500/10 text-violet-600",
    title: "콘탱고",
    body: "선물 가격이 현물 가격보다 높은 정상 시장. — 시장 참여자들이 향후 주가가 더 오를 것이라고 낙관하고 있다는 신호입니다.",
  },
  {
    id: "t147",
    category: "파생/선물",
    categoryColor: "bg-violet-500/10 text-violet-600",
    title: "백워데이션",
    body: "현물 가격이 선물 가격보다 높은 비정상 시장. — 현재 시장이 매우 불안하거나 주식을 당장 팔려는 심리가 강할 때 나타납니다.",
  },
  {
    id: "t148",
    category: "파생/선물",
    categoryColor: "bg-violet-500/10 text-violet-600",
    title: "프로그램 매매",
    body: "컴퓨터가 미리 정한 조건에 따라 대량 매매하는 것. — 시장의 전체적인 방향성과 급등락을 결정짓는 가장 큰 손입니다.",
  },
  {
    id: "t149",
    category: "파생/선물",
    categoryColor: "bg-violet-500/10 text-violet-600",
    title: "비차익거래",
    body: "선물과 무관하게 한꺼번에 여러 종목을 사는 프로그램 매매. — 외국인과 기관의 '진짜 시장 전망'을 보여주는 지표입니다.",
  },
  {
    id: "t150",
    category: "파생/선물",
    categoryColor: "bg-violet-500/10 text-violet-600",
    title: "사이드카",
    body: "선물 시장 급등락 시 현물 시장 영향을 최소화하려 프로그램 매매를 제한하는 제도. — 주가가 미친 듯이 널뛰면 잠시 쉬어가라고 강제로 멈추는 비상 브레이크입니다.",
  },
  {
    id: "t151",
    category: "기관투자자",
    categoryColor: "bg-slate-500/10 text-slate-600",
    title: "KRX(한국거래소)",
    body: "한국의 주식 시장을 운영하는 기관. — 공정한 거래가 이루어지도록 규칙을 정하고 감시하는 시장의 파수꾼입니다.",
  },
  {
    id: "t152",
    category: "기관투자자",
    categoryColor: "bg-slate-500/10 text-slate-600",
    title: "금융투자협회",
    body: "증권사, 자산운용사 등이 모인 이익단체 및 자율규제기관. — 투자자 보호를 위한 제도를 만들고 금융 종사자들의 전문성을 관리하는 단체입니다.",
  },
  {
    id: "t153",
    category: "산업/테마",
    categoryColor: "bg-teal-500/10 text-teal-600",
    title: "소부장",
    body: "소재, 부품, 장비 산업의 줄임말. — 반도체나 디스플레이 제조의 기초가 되는 소재, 부품, 장비 기업들을 일컬으며 제조업의 근간을 나타냅니다.",
  },
  {
    id: "t154",
    category: "산업/테마",
    categoryColor: "bg-teal-500/10 text-teal-600",
    title: "팹리스",
    body: "반도체 설계만 전문으로 하는 기업. — 공장 없이 반도체 설계만 전문으로 하는 회사로, 높은 기술력과 지식 재산권이 핵심 가치입니다.",
  },
  {
    id: "t155",
    category: "산업/테마",
    categoryColor: "bg-teal-500/10 text-teal-600",
    title: "파운드리",
    body: "반도체 위탁 생산을 전문으로 하는 기업. — 설계도를 받아 반도체를 대신 만들어주는 위탁 생산 공장으로, 공장의 생산 능력과 수율이 주가에 큰 영향을 줍니다.",
  },
  {
    id: "t156",
    category: "산업/테마",
    categoryColor: "bg-teal-500/10 text-teal-600",
    title: "OSAT",
    body: "반도체 후공정(패키징 및 테스트) 전문 기업. — 반도체 제조의 마지막 단계인 패키징과 검사를 담당하며, 반도체의 최종 성능을 결정짓는 후공정 기업들입니다.",
  },
  {
    id: "t157",
    category: "산업/테마",
    categoryColor: "bg-teal-500/10 text-teal-600",
    title: "HBM(고대역폭 메모리)",
    body: "AI 연산에 필수적인 고성능 메모리 반도체. — 인공지능 시대에 가장 잘 팔리는 고성능 반도체라 보시면 됩니다.",
  },
  {
    id: "t158",
    category: "산업/테마",
    categoryColor: "bg-teal-500/10 text-teal-600",
    title: "양극재",
    body: "배터리의 4대 핵심 소재 중 하나로 용량과 전압 결정. — 전기차 배터리의 용량과 수명을 결정하는 핵심 재료로, 2차전지 산업의 수익성을 가늠하는 지표입니다.",
  },
  {
    id: "t159",
    category: "산업/테마",
    categoryColor: "bg-teal-500/10 text-teal-600",
    title: "전고체 배터리",
    body: "액체 전해질 대신 고체를 사용하는 차세대 안전 배터리. — 화재 위험이 낮고 성능이 우수한 차세대 배터리로, 상용화 시 시장 판도를 바꿀 핵심 기술입니다.",
  },
  {
    id: "t160",
    category: "경제지표",
    categoryColor: "bg-yellow-600/10 text-yellow-700",
    title: "IRA(인플레이션 감축법)",
    body: "미국의 친환경 에너지 보조금 정책. — 미국 내에서 제품을 만들어야 보조금을 주는 법안으로, 우리 기업의 미국 시장 진출 성과를 판단하는 기준이 됩니다.",
  },
  {
    id: "t161",
    category: "경제지표",
    categoryColor: "bg-yellow-600/10 text-yellow-700",
    title: "RE100",
    body: "기업 사용 전력 100%를 재생에너지로 충당하겠다는 캠페인. — 사용하는 전력의 100%를 재생에너지로 충당하겠다는 약속으로, 수출 기업이 갖춰야 할 필수 생존 요건입니다.",
  },
  {
    id: "t162",
    category: "경제지표",
    categoryColor: "bg-yellow-600/10 text-yellow-700",
    title: "탄소배출권",
    body: "기업이 온실가스를 배출할 수 있는 권리 (거래 가능). — 탄소를 많이 내뿜으면 돈을 내야 하므로, 친환경 기업일수록 유리해집니다.",
  },
  {
    id: "t163",
    category: "산업/테마",
    categoryColor: "bg-teal-500/10 text-teal-600",
    title: "바이오시밀러",
    body: "바이오 의약품의 복제약. — 오리지널 의약품과 효능은 비슷하면서 가격은 저렴한 복제약으로, 특허 만료 이후 얼마나 빠르게 시장 점유율을 확보하는지가 핵심입니다.",
  },
  {
    id: "t164",
    category: "산업/테마",
    categoryColor: "bg-teal-500/10 text-teal-600",
    title: "임상 3상",
    body: "신약 시판 전 마지막 단계의 대규모 환자 테스트. — 신약의 안전성과 효능을 최종 검증하는 마지막 관문이며, 통과 시 시판 허가로 이어지는 강력한 호재가 되지만 실패 리스크도 매우 큰 단계입니다.",
  },
  {
    id: "t165",
    category: "산업/테마",
    categoryColor: "bg-teal-500/10 text-teal-600",
    title: "메타버스",
    body: "가상과 현실이 융합된 3차원 가상 세계. — 가상 세계에서 이용자들이 얼마나 활발하게 소통하고 소비하는지를 통해 미래 성장성을 판단합니다.",
  },
  {
    id: "t166",
    category: "산업/테마",
    categoryColor: "bg-teal-500/10 text-teal-600",
    title: "OTT",
    body: "인터넷을 통해 동영상을 제공하는 서비스. — 인터넷 기반 동영상 서비스로, 얼마나 강력한 독점 콘텐츠를 확보해 유료 가입자를 모으는지가 관건입니다.",
  },
  {
    id: "t167",
    category: "산업/테마",
    categoryColor: "bg-teal-500/10 text-teal-600",
    title: "희토류",
    body: "첨단 산업에 필수적인 희귀한 광물 자원. — 첨단 산업에 꼭 필요한 희귀 금속으로, 국가 간의 무역 싸움에서 전략적 무기로 활용되는 자원 테마입니다.",
  },
  {
    id: "t168",
    category: "산업/테마",
    categoryColor: "bg-teal-500/10 text-teal-600",
    title: "셰일가스",
    body: "암석층 사이에 갇힌 천연가스. — 바위층에서 추출하는 천연가스로, 글로벌 에너지 가격과 물가 흐름에 큰 영향을 미치는 요인입니다.",
  },
  {
    id: "t169",
    category: "산업/테마",
    categoryColor: "bg-teal-500/10 text-teal-600",
    title: "플랫폼 기업",
    body: "이용자들 사이의 상거래나 소통을 중개하는 기업. — 많은 사람이 모이는 장을 제공하는 기업으로, 사용자가 늘어날수록 독점적 가치가 커지는 구조를 가집니다.",
  },
  {
    id: "t170",
    category: "산업/테마",
    categoryColor: "bg-teal-500/10 text-teal-600",
    title: "구독 경제",
    body: "일정액을 내고 상품이나 서비스를 정기적으로 받는 경제 모델. — 정기적으로 돈을 내고 서비스를 이용하는 방식으로, 기업 입장에서는 매달 들어오는 안정적인 고정 수익이 됩니다.",
  },
  {
    id: "t171",
    category: "기타용어",
    categoryColor: "bg-gray-500/10 text-gray-600",
    title: "SaaS",
    body: "클라우드를 통해 소프트웨어를 서비스 형태로 제공하는 것. — 소프트웨어를 클라우드로 빌려주는 서비스로, 사용자가 한 번 가입하면 다른 서비스로 옮기기 힘든 특징이 있습니다.",
  },
  {
    id: "t172",
    category: "기타용어",
    categoryColor: "bg-gray-500/10 text-gray-600",
    title: "핀테크",
    body: "금융(Finance)과 기술(Technology)의 결합. — 금융에 IT 기술을 접목한 서비스로, 기존 금융보다 얼마나 더 편리하고 효율적인 사용자 경험을 주는지를 봅니다.",
  },
  {
    id: "t173",
    category: "기타용어",
    categoryColor: "bg-gray-500/10 text-gray-600",
    title: "MSCI 지수",
    body: "모건스탠리 캐피털 인터내셔널이 발표하는 글로벌 주가지수. — 전 세계 투자자들이 참고하는 표준 지수로, 여기에 포함되면 대규모 해외 자금이 유입되는 호재로 작용합니다.",
  },
  {
    id: "t174",
    category: "기타용어",
    categoryColor: "bg-gray-500/10 text-gray-600",
    title: "FTSE 지수",
    body: "영국 파이낸셜 타임스에서 산출하는 주가지수. — 유럽계 자금의 흐름을 결정짓는 중요한 나침반 역할을 합니다.",
  },
  {
    id: "t175",
    category: "투자전략",
    categoryColor: "bg-emerald-500/10 text-emerald-600",
    title: "편입/편출",
    body: "특정 지수에 종목이 들어가거나 나가는 것. — 특정 지수(MSCI 등)에 새로 포함되거나 제외되는 것을 의미하며, 편입 시에는 대규모 투자금 유입에 따른 주가 상승을, 편출 시에는 자금 유출에 따른 주가 하락을 예상할 수 있습니다.",
  },
  {
    id: "t176",
    category: "투자전략",
    categoryColor: "bg-emerald-500/10 text-emerald-600",
    title: "ADR(미국예탁증서)",
    body: "외국 주식을 미국 시장에서 거래할 수 있게 만든 증서. — 한국 주식을 미국 시장에서도 살 수 있게 만든 증서로, 밤사이 미국 반응을 체크합니다.",
  },
  {
    id: "t177",
    category: "투자전략",
    categoryColor: "bg-emerald-500/10 text-emerald-600",
    title: "서학개미",
    body: "해외 주식(특히 미국)에 직접 투자하는 한국 개인 투자자. — 나 같은 개인들이 미국 주식을 얼마나 열심히 사고 있는지 보여주는 지표입니다.",
  },
  {
    id: "t178",
    category: "투자전략",
    categoryColor: "bg-emerald-500/10 text-emerald-600",
    title: "산타 랠리",
    body: "연말에 주가가 상승하는 경향. — 연말 보너스와 소비 증가로 크리스마스 전후에 주가가 오르는 기분 좋은 계절적 현상입니다.",
  },
  {
    id: "t179",
    category: "차트기초",
    categoryColor: "bg-purple-500/10 text-purple-600",
    title: "1월 효과",
    body: "새해 기대감으로 1월에 주가가 오르는 경향. — 새해에 대한 낙관적인 전망으로 인해 1월의 주가 상승률이 다른 달보다 높게 나타나는 경향을 의미합니다.",
  },
  {
    id: "t180",
    category: "차트기초",
    categoryColor: "bg-purple-500/10 text-purple-600",
    title: "윈도우 드레싱",
    body: "기관 투자자가 실적을 좋아 보이게 하려고 연말에 주식을 대량 매수하는 것. — 기관들이 분기 말에 성적표를 예쁘게 보이려고 주가를 관리하는 현상입니다.",
  },
  {
    id: "t181",
    category: "차트기초",
    categoryColor: "bg-purple-500/10 text-purple-600",
    title: "RSI(상대강도지수)",
    body: "주가의 과매수/과매도 상태를 나타내는 지표. — 70 이상이면 '과매수(비쌈)'로 판단해 매도를 고려하고, 30 이하면 '과매도(쌈)'로 판단해 매수를 검토합니다.",
  },
  {
    id: "t182",
    category: "차트기초",
    categoryColor: "bg-purple-500/10 text-purple-600",
    title: "MACD",
    body: "단기 이동평균선과 장기 이동평균선의 수렴과 확산을 나타내는 지표. — 단기 이동평균선이 장기선을 뚫고 올라가는 '골든크로스' 시점을 추세 전환의 매수 신호로 봅니다.",
  },
  {
    id: "t183",
    category: "차트기초",
    categoryColor: "bg-purple-500/10 text-purple-600",
    title: "볼린저 밴드",
    body: "주가의 변동 범위를 표준편차를 이용해 밴드로 표시한 지표. — 주가가 상단선에 닿으면 과열된 상태로 보며, 밴드의 폭이 좁아지면 조만간 주가가 위나 아래로 크게 움직일 것을 대비합니다.",
  },
  {
    id: "t184",
    category: "차트기초",
    categoryColor: "bg-purple-500/10 text-purple-600",
    title: "스토캐스틱(Stochastic)",
    body: "현재 주가가 특정 기간의 가격 범위 중 어느 정도 위치에 있는지 수치화한 지표. — 현재 가격이 최근 변동폭 중 어느 위치에 있는지 확인하여 단기적인 매매 타이밍을 잡는 데 활용합니다.",
  },
  {
    id: "t185",
    category: "차트기초",
    categoryColor: "bg-purple-500/10 text-purple-600",
    title: "피보나치 조정대",
    body: "주가 상승 후 하락 시 지지선을 예측하는 황금비율 도구. — 주가가 조정을 받을 때 과거 상승폭의 일정 비율(38.2%, 61.8% 등) 지점에서 지지가 나올 가능성을 예측합니다.",
  },
  {
    id: "t186",
    category: "차트기초",
    categoryColor: "bg-purple-500/10 text-purple-600",
    title: "일목균형표",
    body: "주가의 흐름과 시간 개념을 결합하여 추세를 예측하는 일본식 지표. — 구름대 위에 주가가 있으면 상승 추세, 구름대 아래에 있으면 하락 추세로 보며 미래의 지지·저항 구간을 가늠합니다.",
  },
  {
    id: "t187",
    category: "차트기초",
    categoryColor: "bg-purple-500/10 text-purple-600",
    title: "이격도",
    body: "주가와 이동평균선 사이의 거리를 나타내는 지표. — 주가가 이동평균선과 너무 멀어지면 다시 평균으로 되돌아오려는 성질을 이용해 매매 시점을 판단합니다.",
  },
  {
    id: "t188",
    category: "차트기초",
    categoryColor: "bg-purple-500/10 text-purple-600",
    title: "DMI(방향성 이동지수)",
    body: "추세의 방향과 강도를 파악하는 지표. — 상승 힘(+DI)과 하락 힘(-DI) 중 어느 쪽이 우위에 있는지 분석하여 현재 시장의 주도권을 확인합니다.",
  },
  {
    id: "t189",
    category: "차트기초",
    categoryColor: "bg-purple-500/10 text-purple-600",
    title: "ADX(평균 방향성 지수)",
    body: "현재 추세의 강도가 얼마나 강한지 나타내는 지표. — 현재 주가가 상승이든 하락이든 추세의 에너지 자체가 얼마나 강력하게 형성되어 있는지를 측정합니다.",
  },
  {
    id: "t190",
    category: "차트기초",
    categoryColor: "bg-purple-500/10 text-purple-600",
    title: "OBV",
    body: "거래량을 누적하여 주가의 에너지를 분석하는 지표. — 주가가 오를 때 거래량이 함께 실리는지를 확인하여 매집 세력의 유입이나 이탈 여부를 포착합니다.",
  },
  {
    id: "t191",
    category: "차트기초",
    categoryColor: "bg-purple-500/10 text-purple-600",
    title: "파라볼릭 SAR",
    body: "추세가 반전되는 지점을 점 형태로 표시하는 지표. — 점의 위치가 주가 아래에서 위로 바뀌면 매도 신호, 위에서 아래로 바뀌면 매수 신호로 보는 추세 추종 지표입니다.",
  },
  {
    id: "t192",
    category: "차트기초",
    categoryColor: "bg-purple-500/10 text-purple-600",
    title: "거래대금",
    body: "일정 시간 동안 거래된 주식의 가격과 수량을 곱한 총액. — 거래량보다 실제 유입된 돈의 규모가 중요하며, 주가 상승 시 거래대금이 동반되어야 상승의 신뢰도가 높습니다.",
  },
  {
    id: "t193",
    category: "차트기초",
    categoryColor: "bg-purple-500/10 text-purple-600",
    title: "매물대",
    body: "특정 가격대에서 거래가 집중된 구간. — 주가 상승 시에는 뚫기 힘든 저항선, 하락 시에는 버텨주는 지지선 역할을 합니다.",
  },
  {
    id: "t194",
    category: "차트기초",
    categoryColor: "bg-purple-500/10 text-purple-600",
    title: "캔들 꼬리(Shadow)",
    body: "시가/종가 대비 당일 움직였던 최저/최고가 흔적. — 윗꼬리는 매도세의 저항을, 아랫꼬리는 저가 매수세의 유입을 의미하며 추세가 바뀔 수 있다는 신호입니다.",
  },
  {
    id: "t195",
    category: "차트기초",
    categoryColor: "bg-purple-500/10 text-purple-600",
    title: "추세선",
    body: "주가의 고점과 고점, 저점과 저점을 연결한 선. — 이 선을 돌파하거나 이탈할 때가 가장 중요한 매매 시점이 됩니다.",
  },
  {
    id: "t196",
    category: "차트기초",
    categoryColor: "bg-purple-500/10 text-purple-600",
    title: "헤드 앤 숄더",
    body: "주가의 고점 패턴 중 하나로 추세 반전 신호. — 머리와 두 어깨 모양의 패턴으로, 고점에서 나타나면 주가가 강력하게 하락세로 반전될 것임을 암시합니다.",
  },
  {
    id: "t197",
    category: "차트기초",
    categoryColor: "bg-purple-500/10 text-purple-600",
    title: "쌍바닥(Double Bottom)",
    body: "하락 추세에서 저점을 두 번 다지고 상승하는 패턴. — 바닥권을 다지고 본격적인 상승으로 돌아설 가능성이 큽니다.",
  },
  {
    id: "t198",
    category: "차트기초",
    categoryColor: "bg-purple-500/10 text-purple-600",
    title: "박스권 탈출",
    body: "장기간 횡보하던 주가가 상단 저항선을 돌파하는 현상. — 일정한 가격대에 갇혀있던 주가가 상단 저항선을 강력하게 뚫고 올라갈 때 큰 시세 분출의 시작으로 봅니다.",
  },
  {
    id: "t199",
    category: "차트기초",
    categoryColor: "bg-purple-500/10 text-purple-600",
    title: "갭 상승/하락",
    body: "전일 종가와 금일 시가 사이에 빈 공간이 생기는 현상. — 어제의 종가와 오늘의 시가 사이에 빈 공간이 생기는 현상으로, 시장의 강력한 심리 변화를 보여줍니다.",
  },
  {
    id: "t200",
    category: "재무용어",
    categoryColor: "bg-orange-500/10 text-orange-600",
    title: "EV/EBITDA",
    body: "기업 가치를 영업이익으로 나눈 값 (투자 원금 회수 기간). — 투자 원금을 회수하는 데 걸리는 시간을 뜻하는 저평가 지표입니다.",
  },
  {
    id: "t201",
    category: "재무용어",
    categoryColor: "bg-orange-500/10 text-orange-600",
    title: "PSR(주가매출비율)",
    body: "주가를 주당 매출액으로 나눈 값 (성장주 분석 시 사용). — 아직 이익이 나지 않는 초기 성장주의 가치를 평가할 때 유용합니다.",
  },
  {
    id: "t202",
    category: "재무용어",
    categoryColor: "bg-orange-500/10 text-orange-600",
    title: "PEG(주가이익증가비율)",
    body: "PER을 이익성장률로 나눈 값 (성장성 대비 저평가 판단). — 기업의 성장성 대비 주가가 적정한 수준인지 판단하는 잣대가 됩니다.",
  },
  {
    id: "t203",
    category: "재무용어",
    categoryColor: "bg-orange-500/10 text-orange-600",
    title: "BPS(주당순자산)",
    body: "총 순자산을 발행 주식 수로 나눈 값. — 기업이 지금 당장 문을 닫는다면 주주 한 명이 받을 수 있는 금액으로, PBR 계산의 기초가 됩니다.",
  },
  {
    id: "t204",
    category: "재무용어",
    categoryColor: "bg-orange-500/10 text-orange-600",
    title: "부채비율",
    body: "총부채를 자기자본으로 나눈 비율. — 기업이 자기 돈 대비 빌린 돈이 얼마나 많은지를 보여주는 재무 건전성의 핵심 지표입니다.",
  },
  {
    id: "t205",
    category: "재무용어",
    categoryColor: "bg-orange-500/10 text-orange-600",
    title: "유보율",
    body: "기업이 이익을 쌓아두는 비율 (사내 유보금/납입자본금). — 기업이 그동안 번 돈을 얼마나 쌓아뒀는지를 나타내며, 유보율이 높은 기업은 자사주 매입이나 배당 확대 여력이 큽니다.",
  },
  {
    id: "t206",
    category: "재무용어",
    categoryColor: "bg-orange-500/10 text-orange-600",
    title: "영업이익률",
    body: "매출액에서 영업이익이 차지하는 비율. — 기업이 물건을 팔아서 실제로 남기는 돈의 비율로, 높을수록 경쟁력 있는 기업입니다.",
  },
  {
    id: "t207",
    category: "재무용어",
    categoryColor: "bg-orange-500/10 text-orange-600",
    title: "자기자본비율",
    body: "총자산에서 자기자본이 차지하는 비율. — 빌린 돈 없이 자기 돈으로 자산을 구성한 비율로, 높을수록 재무적으로 안정된 기업입니다.",
  },
  {
    id: "t208",
    category: "재무용어",
    categoryColor: "bg-orange-500/10 text-orange-600",
    title: "유동비율",
    body: "유동자산을 유동부채로 나눈 값 (단기 채무 상환 능력). — 1년 안에 현금화할 수 있는 자산이 1년 안에 갚아야 할 빚보다 얼마나 많은지를 보여주는 단기 안전성 지표입니다.",
  },
  {
    id: "t209",
    category: "재무용어",
    categoryColor: "bg-orange-500/10 text-orange-600",
    title: "당좌비율",
    body: "재고자산을 제외한 유동자산으로 단기 부채 상환 능력을 측정. — 재고 등 당장 현금화하기 어려운 자산을 뺀 더 엄격한 기준의 단기 지급 능력 지표입니다.",
  },
  {
    id: "t210",
    category: "재무용어",
    categoryColor: "bg-orange-500/10 text-orange-600",
    title: "운전자본",
    body: "유동자산에서 유동부채를 뺀 값 (사업 운영 자금). — 기업이 일상적인 영업 활동을 위해 당장 쓸 수 있는 여윳돈의 규모를 나타냅니다.",
  },
  {
    id: "t211",
    category: "재무용어",
    categoryColor: "bg-orange-500/10 text-orange-600",
    title: "잉여현금흐름(FCF)",
    body: "영업 활동 현금에서 설비 투자를 뺀 실제 여유 현금. — 기업이 사업을 하고 설비에 투자한 후에 진짜로 손에 쥔 돈으로, 배당·자사주 매입 등의 재원이 됩니다.",
  },
  {
    id: "t212",
    category: "재무용어",
    categoryColor: "bg-orange-500/10 text-orange-600",
    title: "가산금리(Spread)",
    body: "기준 금리에 덧붙이는 위험 프리미엄 금리. — 신용도가 낮을수록 가산금리가 높아져 자금 조달 비용이 늘어납니다.",
  },
  {
    id: "t213",
    category: "재무용어",
    categoryColor: "bg-orange-500/10 text-orange-600",
    title: "무형자산",
    body: "특허권, 브랜드 가치 등 눈에 보이지 않는 자산. — 특허, 브랜드, 소프트웨어 등 눈에 보이지 않는 자산으로, 기술·플랫폼 기업의 가치를 평가할 때 중요한 요소입니다.",
  },
  {
    id: "t214",
    category: "재무용어",
    categoryColor: "bg-orange-500/10 text-orange-600",
    title: "영업권(Goodwill)",
    body: "M&A 시 지불한 금액에서 피인수 기업 순자산을 초과한 부분. — 기업을 살 때 장부가치보다 비싸게 산 이유, 즉 브랜드나 고객 관계 등 보이지 않는 가치에 대한 프리미엄입니다.",
  },
  {
    id: "t215",
    category: "재무용어",
    categoryColor: "bg-orange-500/10 text-orange-600",
    title: "감가상각",
    body: "유형자산의 가치 감소를 비용으로 처리하는 것. — 설비나 기계의 수명을 고려해 매년 비용으로 나누어 처리하는 회계 방식으로, 실제 현금이 나가지 않는 비용입니다.",
  },
  {
    id: "t216",
    category: "재무용어",
    categoryColor: "bg-orange-500/10 text-orange-600",
    title: "지배주주 순이익",
    body: "연결재무제표에서 모회사 주주에게 귀속되는 이익. — 자회사 이익 중 지분율에 해당하는 부분만 반영한 값으로, EPS를 계산할 때 사용하는 이익입니다.",
  },
  {
    id: "t217",
    category: "재무용어",
    categoryColor: "bg-orange-500/10 text-orange-600",
    title: "현금흐름표",
    body: "기업의 현금 유입·유출을 기록한 재무제표. — 손익계산서의 이익이 아닌 실제 현금 흐름을 보여줘, 기업의 진짜 돈 벌이 능력을 파악할 수 있습니다.",
  },
  {
    id: "t218",
    category: "재무용어",
    categoryColor: "bg-orange-500/10 text-orange-600",
    title: "자산총계",
    body: "기업이 보유한 모든 자산의 합계. — 부채와 자기자본을 합친 기업의 전체 규모를 나타내며, 동종 업계와의 규모 비교에 활용됩니다.",
  },
  {
    id: "t219",
    category: "재무용어",
    categoryColor: "bg-orange-500/10 text-orange-600",
    title: "매출채권",
    body: "물건을 팔았지만 아직 받지 못한 돈. — 팔았지만 아직 받지 못한 돈으로, 이 금액이 매출 대비 너무 크면 현금 흐름 위험 신호일 수 있습니다.",
  },
  {
    id: "t220",
    category: "경제지표",
    categoryColor: "bg-yellow-600/10 text-yellow-700",
    title: "GDP(국내총생산)",
    body: "한 나라 안에서 일정 기간 생산된 모든 재화·서비스의 총가치. — 나라 경제가 얼마나 컸는지 보여주는 성적표로, 성장률 둔화는 기업 실적 악화의 전조가 됩니다.",
  },
  {
    id: "t221",
    category: "경제지표",
    categoryColor: "bg-yellow-600/10 text-yellow-700",
    title: "CPI(소비자물가지수)",
    body: "소비자가 구입하는 상품·서비스 가격의 변동을 나타내는 지수. — 인플레이션의 대표 지표로, 수치가 높으면 중앙은행의 금리 인상 가능성이 높아집니다.",
  },
  {
    id: "t222",
    category: "경제지표",
    categoryColor: "bg-yellow-600/10 text-yellow-700",
    title: "PPI(생산자물가지수)",
    body: "기업 간 거래 상품의 가격 변동 지수 (CPI의 선행 지표). — 물가 상승이 소비자에게 전가되기 전 기업 단계에서 먼저 나타나는 선행 지표입니다.",
  },
  {
    id: "t223",
    category: "경제지표",
    categoryColor: "bg-yellow-600/10 text-yellow-700",
    title: "FOMC",
    body: "미국 연준의 기준금리를 결정하는 위원회. — 세계에서 가장 중요한 금리 회의로, 결과에 따라 글로벌 자산 시장 전체가 출렁입니다.",
  },
  {
    id: "t224",
    category: "경제지표",
    categoryColor: "bg-yellow-600/10 text-yellow-700",
    title: "기준금리",
    body: "중앙은행이 설정하는 금융 시장의 기준이 되는 금리. — 금리가 오르면 기업 이자 부담이 늘어 주가에 압력이 되고, 내리면 반대로 작용합니다.",
  },
  {
    id: "t225",
    category: "경제지표",
    categoryColor: "bg-yellow-600/10 text-yellow-700",
    title: "양적완화(QE)",
    body: "중앙은행이 돈을 풀어 경기를 부양하는 정책. — 시중에 돈이 풀리면 자산 가격을 밀어 올리는 원동력이 됩니다.",
  },
  {
    id: "t226",
    category: "경제지표",
    categoryColor: "bg-yellow-600/10 text-yellow-700",
    title: "테이퍼링",
    body: "양적완화 규모를 점진적으로 줄이는 것. — 시중의 돈줄을 죄기 시작하겠다는 예고 신호입니다.",
  },
  {
    id: "t227",
    category: "경제지표",
    categoryColor: "bg-yellow-600/10 text-yellow-700",
    title: "양적긴축(QT)",
    body: "중앙은행이 시중의 돈을 거둬들이는 정책. — 중앙은행이 보유한 자산을 팔아 시중의 돈을 직접 회수하는 정책으로, 자산 시장에는 강력한 하방 압력이 됩니다.",
  },
  {
    id: "t228",
    category: "경제지표",
    categoryColor: "bg-yellow-600/10 text-yellow-700",
    title: "베이비스텝",
    body: "금리를 0.25%포인트 인상하는 것. — 빅스텝, 자이언트스텝으로 갈수록 시장의 충격과 경기 위축 우려가 커집니다.",
  },
  {
    id: "t229",
    category: "경제지표",
    categoryColor: "bg-yellow-600/10 text-yellow-700",
    title: "빅스텝",
    body: "금리를 0.5%포인트 인상하는 것. — 베이비스텝(0.25%)보다 두 배 큰 인상으로, 강력한 긴축 의지를 나타냅니다.",
  },
  {
    id: "t230",
    category: "경제지표",
    categoryColor: "bg-yellow-600/10 text-yellow-700",
    title: "자이언트스텝",
    body: "금리를 0.75%포인트 인상하는 것. — 가장 강력한 인상 수준으로, 인플레이션을 잡기 위한 비상 조치입니다.",
  },
  {
    id: "t231",
    category: "경제지표",
    categoryColor: "bg-yellow-600/10 text-yellow-700",
    title: "장단기 금리 역전",
    body: "장기 금리가 단기 금리보다 낮아지는 현상 (경기 침체 신호). — 향후 경기 침체가 올 수 있다는 가장 강력한 경고 신호 중 하나입니다.",
  },
  {
    id: "t232",
    category: "경제지표",
    categoryColor: "bg-yellow-600/10 text-yellow-700",
    title: "환율 스프레드",
    body: "환전 시 사는 가격과 파는 가격의 차이. — 시장의 불안감이 커질수록 스프레드 폭이 벌어지는 경향이 있습니다.",
  },
  {
    id: "t233",
    category: "경제지표",
    categoryColor: "bg-yellow-600/10 text-yellow-700",
    title: "엔저 현상",
    body: "일본 엔화 가치가 낮아지는 현상. — 수출 경쟁국인 한국 기업들에게는 가격 경쟁력이 밀리는 악재로 작용할 수 있습니다.",
  },
  {
    id: "t234",
    category: "경제지표",
    categoryColor: "bg-yellow-600/10 text-yellow-700",
    title: "달러 인덱스",
    body: "주요 6개국 통화 대비 달러의 가치를 나타낸 지수. — 달러가 강해지면 상대적으로 주식과 같은 위험 자산은 약세를 보입니다.",
  },
  {
    id: "t235",
    category: "경제지표",
    categoryColor: "bg-yellow-600/10 text-yellow-700",
    title: "안전자산",
    body: "달러, 금, 국채 등 위험이 낮은 자산. — 시장이 불안할 때 투자자들이 도피처로 삼습니다.",
  },
  {
    id: "t236",
    category: "투자전략",
    categoryColor: "bg-emerald-500/10 text-emerald-600",
    title: "위험자산",
    body: "주식, 비트코인 등 수익은 높지만 위험도 큰 자산. — 경기가 회복될 때 투자자들이 선호합니다.",
  },
  {
    id: "t237",
    category: "투자전략",
    categoryColor: "bg-emerald-500/10 text-emerald-600",
    title: "경기 선행지수",
    body: "실제 경기 변동보다 앞서 움직이는 지표. — 실제 경기보다 3~6개월 앞서 움직이므로 주식시장의 방향을 미리 가늠하는 데 활용합니다.",
  },
  {
    id: "t238",
    category: "투자전략",
    categoryColor: "bg-emerald-500/10 text-emerald-600",
    title: "기저효과",
    body: "비교 대상인 이전 시점 수치가 너무 낮아 현재 수치가 좋아 보이는 현상. — 현재의 높은 성장률이 기업의 실력인지, 아니면 작년이 너무 못해서 생긴 반사 이익인지 구분해야 합니다.",
  },
  {
    id: "t239",
    category: "투자전략",
    categoryColor: "bg-emerald-500/10 text-emerald-600",
    title: "역기저효과",
    body: "이전 실적이 너무 좋아 현재 실적이 상대적으로 나빠 보이는 현상. — 실적이 마이너스 성장을 기록하더라도 작년의 기록적인 호황에 따른 정상화 과정인지 판단해야 합니다.",
  },
  {
    id: "t240",
    category: "투자전략",
    categoryColor: "bg-emerald-500/10 text-emerald-600",
    title: "스캘핑",
    body: "초 단위, 분 단위로 짧게 사고파는 초단타 매매. — 몇 초에서 몇 분 단위로 아주 짧게 사고팔아 작은 수익을 반복적으로 쌓아가는 초단타 매매 기법입니다.",
  },
  {
    id: "t241",
    category: "투자전략",
    categoryColor: "bg-emerald-500/10 text-emerald-600",
    title: "데이트레이딩",
    body: "당일 매수 후 당일 매도하여 포지션을 넘기지 않는 매매. — 매수한 주식을 당일 안에 모두 매도하여 하룻밤 사이의 예상치 못한 리스크를 피하는 전략입니다.",
  },
  {
    id: "t242",
    category: "투자전략",
    categoryColor: "bg-emerald-500/10 text-emerald-600",
    title: "스윙(Swing)",
    body: "며칠에서 몇 주간 보유하며 추세를 먹는 매매. — 며칠에서 몇 주 정도 추세를 타며 보유하는 매매로, 차트 흐름을 읽으며 수익을 극대화하는 방식입니다.",
  },
  {
    id: "t243",
    category: "투자전략",
    categoryColor: "bg-emerald-500/10 text-emerald-600",
    title: "추세매매",
    body: "상승장에서는 사고 하락장에서는 파는 전략. — 주가가 오르는 흐름에 올라타는 달리는 말 전략으로, 추세가 꺾이기 전까지 홀딩하여 수익을 키웁니다.",
  },
  {
    id: "t244",
    category: "투자전략",
    categoryColor: "bg-emerald-500/10 text-emerald-600",
    title: "역추세매매",
    body: "주가가 많이 떨어졌을 때 사고 올랐을 때 파는 전략. — 주가가 과도하게 하락했을 때 반등을 노리고 매수하는 낙주 매매 전략으로, 저점을 잡을 수 있지만 리스크도 큽니다.",
  },
  {
    id: "t245",
    category: "투자전략",
    categoryColor: "bg-emerald-500/10 text-emerald-600",
    title: "시장가 주문",
    body: "가격을 지정하지 않고 즉시 체결되는 가격으로 주문. — 가장 빠르게 매매하는 주문 방식입니다.",
  },
  {
    id: "t246",
    category: "투자전략",
    categoryColor: "bg-emerald-500/10 text-emerald-600",
    title: "지정가 주문",
    body: "원하는 가격을 지정하여 주문. — 내가 원하는 가격을 정해두고 주가가 그 가격에 도달했을 때만 체결되도록 기다리는 주문 방식입니다.",
  },
  {
    id: "t247",
    category: "투자전략",
    categoryColor: "bg-emerald-500/10 text-emerald-600",
    title: "LOC 주문",
    body: "장 마감 직전 종가 근처에서 체결되는 주문. — 장 마감 시점의 종가가 내가 정한 가격보다 유리할 때만 체결되도록 예약하는 합리적인 주문 방식입니다.",
  },
  {
    id: "t248",
    category: "투자전략",
    categoryColor: "bg-emerald-500/10 text-emerald-600",
    title: "VWAP(거래량 가중 평균가격)",
    body: "거래량을 고려한 평균 체결가. — 큰손들이 자신의 매수 단가가 시장 평균보다 유리한지 판단하는 기준이 됩니다.",
  },
  {
    id: "t249",
    category: "심리/태도",
    categoryColor: "bg-emerald-500/10 text-emerald-600",
    title: "슬리피지",
    body: "주문 가격과 실제 체결 가격의 차이로 발생하는 손실. — 거래량이 적은 종목을 한꺼번에 사고팔 때 발생하는 비용입니다.",
  },
  {
    id: "t250",
    category: "투자전략",
    categoryColor: "bg-emerald-500/10 text-emerald-600",
    title: "분할 매수/매도",
    body: "리스크 관리를 위해 나누어 사고파는 것. — 한 번에 다 사거나 팔지 않고 나누어 거래함으로써 평균 단가를 관리하고 심리적인 안정을 찾는 투자 기술입니다.",
  },
  {
    id: "t251",
    category: "투자전략",
    categoryColor: "bg-emerald-500/10 text-emerald-600",
    title: "손절(Stop Loss)",
    body: "손실을 끊기 위해 보유 주식을 파는 것. — 주가가 예상과 달리 하락할 때 더 큰 손실을 막기 위해 미리 정한 가격에서 기계적으로 매도하는 필수 전략입니다.",
  },
  {
    id: "t252",
    category: "투자전략",
    categoryColor: "bg-emerald-500/10 text-emerald-600",
    title: "익절(Take Profit)",
    body: "이익을 확정하기 위해 보유 주식을 파는 것. — 목표한 수익을 달성했을 때 이익을 확정 지어, 주가가 다시 내려가 수익이 사라지는 것을 방지하는 행위입니다.",
  },
  {
    id: "t253",
    category: "심리/태도",
    categoryColor: "bg-emerald-500/10 text-emerald-600",
    title: "뇌동매매",
    body: "자기 주관 없이 남을 따라 우발적으로 매매하는 것. — 나만의 원칙 없이 남들의 말이나 시장 분위기에 휩쓸려 충동적으로 매매하는, 투자자가 가장 경계해야 할 태도입니다.",
  },
];

/* ─────────────────────────────────────────────────
   퀴즈 데이터 (주식퀴즈_100문제.docx 기반 70문제)
───────────────────────────────────────────────── */
interface QuizItem {
  id: string;
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  difficulty: "쉬움" | "보통" | "어려움";
  category: string;
}

const QUIZ_DATA: QuizItem[] = [
  {
    id: "q1",
    question: "강세장을 뜻하는 용어는?",
    options: ["불 마켓", "베어 마켓", "사이드웨이", "블루칩"],
    answerIndex: 0,
    explanation: "소가 뿔을 위로 치받는 모습 유래",
    difficulty: "쉬움",
    category: "시장 기초",
  },
  {
    id: "q2",
    question: "이익을 주주에게 나누어 주는 것은?",
    options: ["증자", "배당", "감자", "분할"],
    answerIndex: 1,
    explanation: "기업 이익의 주주 환원",
    difficulty: "쉬움",
    category: "시장 기초",
  },
  {
    id: "q3",
    question: "주가수익비율을 뜻하는 지표는?",
    options: ["PBR", "PER", "ROE", "EPS"],
    answerIndex: 1,
    explanation: "이익 대비 주가 수준",
    difficulty: "쉬움",
    category: "시장 기초",
  },
  {
    id: "q4",
    question: "기업이 처음 주식을 공개하는 것은?",
    options: ["M&A", "IPO", "LBO", "MBO"],
    answerIndex: 1,
    explanation: "Initial Public Offering",
    difficulty: "쉬움",
    category: "시장 기초",
  },
  {
    id: "q5",
    question: "주식수 x 현재가는?",
    options: ["자본금", "시가총액", "매출액", "영업이익"],
    answerIndex: 1,
    explanation: "기업의 전체 가치",
    difficulty: "쉬움",
    category: "시장 기초",
  },
  {
    id: "q6",
    question: "지수 추종 상장 펀드는?",
    options: ["MMF", "ETF", "사모펀드", "CMA"],
    answerIndex: 1,
    explanation: "상장지수펀드",
    difficulty: "쉬움",
    category: "시장 기초",
  },
  {
    id: "q7",
    question: "매매 일시 정지 제도는?",
    options: ["공매도", "서킷브레이커", "손절매", "미수"],
    answerIndex: 1,
    explanation: "시장 과열 방지 안전장치",
    difficulty: "쉬움",
    category: "시장 기초",
  },
  {
    id: "q8",
    question: "국내 대형주 중심 지수는?",
    options: ["코스닥", "코스피", "나스닥", "다우"],
    answerIndex: 1,
    explanation: "KOSPI",
    difficulty: "쉬움",
    category: "시장 기초",
  },
  {
    id: "q9",
    question: "빌려 팔고 나중에 갚는 기법은?",
    options: ["공매도", "단타", "스윙", "장기투자"],
    answerIndex: 0,
    explanation: "주가 하락 시 수익 발생",
    difficulty: "쉬움",
    category: "시장 기초",
  },
  {
    id: "q10",
    question: "우량주를 뜻하는 용어는?",
    options: ["블루칩", "옐로우칩", "테마주", "잡주"],
    answerIndex: 0,
    explanation: "포커의 고가치 칩 유래",
    difficulty: "쉬움",
    category: "시장 기초",
  },
  {
    id: "q11",
    question: "주가 하락장을 뜻하는 용어는?",
    options: ["불마켓", "베어마켓", "랠리", "조정"],
    answerIndex: 1,
    explanation: "곰이 발톱을 내리찍는 모습",
    difficulty: "쉬움",
    category: "거래 용어",
  },
  {
    id: "q12",
    question: "주주 명부 등록 기준 날짜는?",
    options: ["배당락일", "배당기준일", "지급일", "종료일"],
    answerIndex: 1,
    explanation: "배당 권리 확정일",
    difficulty: "쉬움",
    category: "거래 용어",
  },
  {
    id: "q13",
    question: "거래 정산 소요 시간은?",
    options: ["T일", "T+1일", "T+2일", "T+3일"],
    answerIndex: 2,
    explanation: "영업일 기준 2일 뒤 정산",
    difficulty: "쉬움",
    category: "거래 용어",
  },
  {
    id: "q14",
    question: "주식을 쪼개 가격을 낮추는 것은?",
    options: ["액면분할", "액면병합", "감자", "증자"],
    answerIndex: 0,
    explanation: "거래 활성화를 위해 실시",
    difficulty: "쉬움",
    category: "거래 용어",
  },
  {
    id: "q15",
    question: "하루 최대 상승폭 제한은?",
    options: ["15%", "20%", "30%", "50%"],
    answerIndex: 2,
    explanation: "국내 시장 상한가 기준",
    difficulty: "쉬움",
    category: "거래 용어",
  },
  {
    id: "q16",
    question: "매도 시 내는 세금 명칭은?",
    options: ["소득세", "증권거래세", "취득세", "재산세"],
    answerIndex: 1,
    explanation: "주식 매도 시 부과",
    difficulty: "쉬움",
    category: "거래 용어",
  },
  {
    id: "q17",
    question: "기업 정보를 공식 발표하는 것은?",
    options: ["공시", "뉴스", "소문", "공고"],
    answerIndex: 0,
    explanation: "투명한 정보 공개 의무",
    difficulty: "쉬움",
    category: "거래 용어",
  },
  {
    id: "q18",
    question: "미국 기술주 중심 시장은?",
    options: ["NYSE", "NASDAQ", "AMEX", "VIX"],
    answerIndex: 1,
    explanation: "나스닥",
    difficulty: "쉬움",
    category: "거래 용어",
  },
  {
    id: "q19",
    question: "리스크 관리를 위한 투자법은?",
    options: ["몰빵", "분산투자", "미수", "단타"],
    answerIndex: 1,
    explanation: "자산 배분 원칙",
    difficulty: "쉬움",
    category: "거래 용어",
  },
  {
    id: "q20",
    question: "손실을 감수하고 파는 것은?",
    options: ["익절", "손절", "물타기", "존버"],
    answerIndex: 1,
    explanation: "Stop Loss 전술",
    difficulty: "쉬움",
    category: "거래 용어",
  },
  {
    id: "q21",
    question: "주가 평균치를 연결한 선은?",
    options: ["캔들", "이동평균선", "볼린저밴드", "RSI"],
    answerIndex: 1,
    explanation: "추세 파악의 기본",
    difficulty: "쉬움",
    category: "차트 기초",
  },
  {
    id: "q22",
    question: "단기선이 장기선을 뚫고 오르는 것은?",
    options: ["데드크로스", "골든크로스", "횡보", "박스권"],
    answerIndex: 1,
    explanation: "강력한 매수 신호",
    difficulty: "쉬움",
    category: "차트 기초",
  },
  {
    id: "q23",
    question: "거래량이 급증하며 주가 상승 시?",
    options: ["매집", "분산", "투매", "관망"],
    answerIndex: 0,
    explanation: "신규 세력 유입 가능성",
    difficulty: "쉬움",
    category: "차트 기초",
  },
  {
    id: "q24",
    question: "차트에서 시가보다 종가가 낮으면?",
    options: ["양봉", "음봉", "도지", "망치"],
    answerIndex: 1,
    explanation: "파란색 막대 형성",
    difficulty: "쉬움",
    category: "차트 기초",
  },
  {
    id: "q25",
    question: "과매수/과매도 판단 지표는?",
    options: ["PER", "RSI", "PBR", "ROE"],
    answerIndex: 1,
    explanation: "상대강도지수",
    difficulty: "쉬움",
    category: "차트 기초",
  },
  {
    id: "q26",
    question: "주가 변동폭을 상하한선으로 표시한 것은?",
    options: ["볼린저밴드", "일목균형표", "엔벨로프", "그물차트"],
    answerIndex: 0,
    explanation: "변동성 지표",
    difficulty: "쉬움",
    category: "차트 기초",
  },
  {
    id: "q27",
    question: "추세 반전 시 나타나는 V자 형태는?",
    options: ["쌍바닥", "헤드앤숄더", "V자반등", "원형바닥"],
    answerIndex: 2,
    explanation: "급격한 추세 전환",
    difficulty: "쉬움",
    category: "차트 기초",
  },
  {
    id: "q28",
    question: "차트의 꼬리가 아래로 길게 달리면?",
    options: ["매수세강함", "매도세강함", "거래절벽", "상장폐지"],
    answerIndex: 0,
    explanation: "저점 매수세 유입",
    difficulty: "쉬움",
    category: "차트 기초",
  },
  {
    id: "q29",
    question: "일정 범위 내에서 주가가 움직이면?",
    options: ["추세장", "박스권", "폭등장", "폭락장"],
    answerIndex: 1,
    explanation: "횡보 장세",
    difficulty: "쉬움",
    category: "차트 기초",
  },
  {
    id: "q30",
    question: "캔들 중 시가와 종가가 같은 모양은?",
    options: ["장대양봉", "장대음봉", "도지(Doji)", "망치형"],
    answerIndex: 2,
    explanation: "추세 전환의 신호",
    difficulty: "쉬움",
    category: "차트 기초",
  },
  {
    id: "q41",
    question: "자산 가치 대비 주가 수준 지표는?",
    options: ["PER", "PBR", "ROE", "EV"],
    answerIndex: 1,
    explanation: "주가순자산비율",
    difficulty: "보통",
    category: "재무 지표",
  },
  {
    id: "q42",
    question: "주당 순이익을 의미하는 약자는?",
    options: ["ROA", "EV", "EPS", "BPS"],
    answerIndex: 2,
    explanation: "Earnings Per Share",
    difficulty: "보통",
    category: "재무 지표",
  },
  {
    id: "q43",
    question: "자기자본 대비 수익성 지표는?",
    options: ["ROE", "ROA", "EBITDA", "P/S"],
    answerIndex: 0,
    explanation: "Return On Equity",
    difficulty: "보통",
    category: "재무 지표",
  },
  {
    id: "q44",
    question: "기업 가치를 EBITDA로 나눈 배수는?",
    options: ["PER", "EV/EBITDA", "PBR", "PCR"],
    answerIndex: 1,
    explanation: "글로벌 M&A 밸류에이션 기준",
    difficulty: "보통",
    category: "재무 지표",
  },
  {
    id: "q45",
    question: "배당 대비 주가 수익률 지표는?",
    options: ["배당수익률", "배당성향", "배당락", "배당기준일"],
    answerIndex: 0,
    explanation: "현재가 대비 배당금 비율",
    difficulty: "보통",
    category: "재무 지표",
  },
  {
    id: "q46",
    question: "영업이익에서 이자비용·세금 전 이익은?",
    options: ["당기순이익", "EBITDA", "매출총이익", "영업현금흐름"],
    answerIndex: 1,
    explanation: "Earnings Before Interest, Tax, D&A",
    difficulty: "보통",
    category: "재무 지표",
  },
  {
    id: "q47",
    question: "부채가 자기자본보다 많을 때 비율은?",
    options: ["부채비율 100% 미만", "부채비율 100% 이상", "유동비율 높음", "당좌비율 높음"],
    answerIndex: 1,
    explanation: "부채 > 자기자본이면 100% 초과",
    difficulty: "보통",
    category: "재무 지표",
  },
  {
    id: "q48",
    question: "기업의 실제 현금 창출 능력을 보는 것은?",
    options: ["영업이익", "영업현금흐름", "당기순이익", "매출액"],
    answerIndex: 1,
    explanation: "회계 이익보다 현금흐름이 중요",
    difficulty: "보통",
    category: "재무 지표",
  },
  {
    id: "q49",
    question: "단기 부채 상환 능력을 보는 지표는?",
    options: ["부채비율", "유동비율", "ROE", "EPS"],
    answerIndex: 1,
    explanation: "유동자산 ÷ 유동부채 × 100",
    difficulty: "보통",
    category: "재무 지표",
  },
  {
    id: "q50",
    question: "매출 대비 영업이익 비율은?",
    options: ["영업이익률", "순이익률", "ROE", "ROA"],
    answerIndex: 0,
    explanation: "본업의 수익성 지표",
    difficulty: "보통",
    category: "재무 지표",
  },
  {
    id: "q51",
    question: "기업의 성장성을 가장 잘 보여주는 지표는?",
    options: ["배당수익률", "매출 성장률", "부채비율", "유동비율"],
    answerIndex: 1,
    explanation: "전년 대비 매출 증가율",
    difficulty: "보통",
    category: "투자 전략",
  },
  {
    id: "q52",
    question: "주식 매수 후 장기 보유하는 전략은?",
    options: ["단타", "바이앤홀드", "스캘핑", "공매도"],
    answerIndex: 1,
    explanation: "Buy & Hold 전략",
    difficulty: "보통",
    category: "투자 전략",
  },
  {
    id: "q53",
    question: "일정 금액을 정기적으로 적립 매수하는 것은?",
    options: ["DCA", "레버리지", "공매도", "스윙"],
    answerIndex: 0,
    explanation: "Dollar Cost Averaging",
    difficulty: "보통",
    category: "투자 전략",
  },
  {
    id: "q54",
    question: "주가 모멘텀이 강할 때 추격 매수하는 전략은?",
    options: ["역발상 투자", "모멘텀 투자", "가치투자", "배당투자"],
    answerIndex: 1,
    explanation: "추세 추종 전략",
    difficulty: "보통",
    category: "투자 전략",
  },
  {
    id: "q55",
    question: "남들이 공포에 팔 때 매수하는 전략은?",
    options: ["FOMO", "역발상 투자", "모멘텀 투자", "단타"],
    answerIndex: 1,
    explanation: "버핏의 \"공포에 사라\" 격언",
    difficulty: "보통",
    category: "투자 전략",
  },
  {
    id: "q56",
    question: "포트폴리오 목표 비중을 유지하는 행위는?",
    options: ["리밸런싱", "물타기", "손절", "분할매도"],
    answerIndex: 0,
    explanation: "Rebalancing — 정기적 자산 재배분",
    difficulty: "보통",
    category: "투자 전략",
  },
  {
    id: "q57",
    question: "데이터와 수학 모델로만 투자하는 방법은?",
    options: ["가치투자", "퀀트투자", "테마투자", "배당투자"],
    answerIndex: 1,
    explanation: "Quantitative Investing",
    difficulty: "보통",
    category: "투자 전략",
  },
  {
    id: "q58",
    question: "특정 산업·이슈 수혜 종목에 집중 투자는?",
    options: ["ETF 투자", "테마주 투자", "분산투자", "인덱스 투자"],
    answerIndex: 1,
    explanation: "단기 수익 기회이나 급락 리스크 존재",
    difficulty: "보통",
    category: "투자 전략",
  },
  {
    id: "q59",
    question: "코어·새틀라이트 전략에서 코어 비중은?",
    options: ["30%", "50%", "70%", "90%"],
    answerIndex: 2,
    explanation: "안전 자산 70% + 위성 자산 30% 구조",
    difficulty: "보통",
    category: "투자 전략",
  },
  {
    id: "q60",
    question: "외국인·기관 동반 매수 시 의미는?",
    options: ["하락 신호", "중립", "강한 상승 신호", "상장폐지 위험"],
    answerIndex: 2,
    explanation: "수급의 황금 조합",
    difficulty: "보통",
    category: "투자 전략",
  },
  {
    id: "q61",
    question: "놓칠까봐 급등 후 추격 매수하는 심리는?",
    options: ["손실 회피", "FOMO", "앵커링", "처분 효과"],
    answerIndex: 1,
    explanation: "Fear Of Missing Out",
    difficulty: "보통",
    category: "투자 전략",
  },
  {
    id: "q62",
    question: "이익 난 주식을 너무 빨리 파는 심리는?",
    options: ["FOMO", "처분 효과", "군중 심리", "확증 편향"],
    answerIndex: 1,
    explanation: "이익 실현 서두름 — 손실 주식은 오래 보유",
    difficulty: "보통",
    category: "투자 전략",
  },
  {
    id: "q63",
    question: "내 생각에 유리한 정보만 찾는 심리는?",
    options: ["앵커링", "확증 편향", "과신", "매몰비용"],
    answerIndex: 1,
    explanation: "Confirmation Bias",
    difficulty: "보통",
    category: "투자 전략",
  },
  {
    id: "q64",
    question: "이미 쓴 돈이 아까워 더 투자하는 오류는?",
    options: ["앵커링", "손실 회피", "매몰비용 오류", "처분 효과"],
    answerIndex: 2,
    explanation: "Sunk Cost Fallacy",
    difficulty: "보통",
    category: "투자 전략",
  },
  {
    id: "q65",
    question: "처음 접한 가격에 집착하는 심리는?",
    options: ["확증 편향", "앵커링 효과", "FOMO", "군중 심리"],
    answerIndex: 1,
    explanation: "최초 정보에 과도한 의존",
    difficulty: "보통",
    category: "투자 전략",
  },
  {
    id: "q66",
    question: "주가가 20% 이상 하락하는 장세는?",
    options: ["조정장", "횡보장", "베어마켓", "랠리"],
    answerIndex: 2,
    explanation: "Bear Market 진입 기준",
    difficulty: "어려움",
    category: "심화",
  },
  {
    id: "q67",
    question: "기업가치(EV) 계산 공식은?",
    options: ["시총 + 순현금", "시총 + 순부채", "PER × EPS", "PBR × BPS"],
    answerIndex: 1,
    explanation: "Enterprise Value = 시가총액 + 순부채",
    difficulty: "어려움",
    category: "심화",
  },
  {
    id: "q68",
    question: "DCF 분석에서 할인율로 사용하는 것은?",
    options: ["PER", "WACC", "ROE", "EPS"],
    answerIndex: 1,
    explanation: "가중평균자본비용(Weighted Average Cost of Capital)",
    difficulty: "어려움",
    category: "심화",
  },
  {
    id: "q69",
    question: "옵션에서 기초자산 살 권리는?",
    options: ["풋옵션", "콜옵션", "선물", "스왑"],
    answerIndex: 1,
    explanation: "Call Option — 살 권리",
    difficulty: "어려움",
    category: "심화",
  },
  {
    id: "q70",
    question: "채권 금리와 주가의 관계는?",
    options: ["비례", "반비례", "무관", "동일"],
    answerIndex: 1,
    explanation: "금리 상승 → 할인율 상승 → 주가 하락",
    difficulty: "어려움",
    category: "심화",
  },
  {
    id: "q71",
    question: "인플레이션이 심할 때 유리한 자산은?",
    options: ["채권", "현금", "실물자산(부동산·원자재)", "예금"],
    answerIndex: 2,
    explanation: "실물자산은 인플레 헤지 수단",
    difficulty: "어려움",
    category: "심화",
  },
  {
    id: "q72",
    question: "연방준비제도의 기준금리 결정 기구는?",
    options: ["SEC", "FOMC", "IMF", "WTO"],
    answerIndex: 1,
    explanation: "Federal Open Market Committee",
    difficulty: "어려움",
    category: "심화",
  },
  {
    id: "q73",
    question: "주가가 장기 추세선을 이탈할 때 의미는?",
    options: ["매수 신호", "추세 전환 가능성", "횡보 지속", "무관"],
    answerIndex: 1,
    explanation: "지지선 붕괴 = 추세 전환 경고",
    difficulty: "어려움",
    category: "심화",
  },
  {
    id: "q74",
    question: "레버리지 ETF의 특성은?",
    options: ["수익률 1배", "지수 2~3배 수익률 추구", "채권 추종", "배당 지급"],
    answerIndex: 1,
    explanation: "변동성 크고 장기 보유 시 손실 누적 위험",
    difficulty: "어려움",
    category: "심화",
  },
  {
    id: "q75",
    question: "헤지펀드의 주요 전략 중 주가 하락에 베팅하는 것은?",
    options: ["롱온리", "롱숏", "퀀트", "액티브"],
    answerIndex: 1,
    explanation: "Long-Short 전략으로 상승·하락 동시 포지션",
    difficulty: "어려움",
    category: "심화",
  },
  {
    id: "q76",
    question: "M&A 시 인수 기업이 제시하는 프리미엄이란?",
    options: ["배당금", "시장가 대비 추가 지불 금액", "공모가 할인", "자사주 취득금"],
    answerIndex: 1,
    explanation: "경영권 프리미엄 — 통상 20~30% 수준",
    difficulty: "어려움",
    category: "심화",
  },
  {
    id: "q77",
    question: "채권 신용등급 AAA 의미는?",
    options: ["최고 위험", "최고 안전", "투기 등급", "부도 임박"],
    answerIndex: 1,
    explanation: "최고 신용등급 — 부도 위험 최저",
    difficulty: "어려움",
    category: "심화",
  },
  {
    id: "q78",
    question: "공모주 청약 경쟁률이 1000:1이면?",
    options: ["전부 배정", "1/1000 확률 배정", "청약 취소", "추첨 없음"],
    answerIndex: 1,
    explanation: "경쟁률이 높을수록 배정 확률 낮아짐",
    difficulty: "어려움",
    category: "심화",
  },
  {
    id: "q79",
    question: "ESG 투자에서 G는 무엇을 뜻하나?",
    options: ["성장(Growth)", "지배구조(Governance)", "그린(Green)", "글로벌"],
    answerIndex: 1,
    explanation: "Environmental, Social, Governance",
    difficulty: "어려움",
    category: "심화",
  },
  {
    id: "q80",
    question: "양적완화(QE)의 효과는?",
    options: ["시중 유동성 축소", "시중 유동성 확대", "금리 인상", "환율 하락"],
    answerIndex: 1,
    explanation: "중앙은행 자산 매입 → 시중 돈 풀기",
    difficulty: "어려움",
    category: "심화",
  },
  {
    id: "q81",
    question: "분기 어닝 시즌이 시작되는 시기는?",
    options: ["1월·4월·7월·10월 초", "2월·5월·8월·11월 초", "3월·6월·9월·12월 초", "연 1회"],
    answerIndex: 0,
    explanation: "분기 종료 후 약 1개월 뒤 실적 발표",
    difficulty: "어려움",
    category: "심화",
  },
  {
    id: "q82",
    question: "기업의 미래 실적 예측치를 부르는 말은?",
    options: ["어닝 서프라이즈", "컨센서스", "가이던스", "공시"],
    answerIndex: 2,
    explanation: "Guidance — 기업 자체 전망치 제시",
    difficulty: "어려움",
    category: "심화",
  },
  {
    id: "q83",
    question: "공매도 잔고가 급증할 때 의미는?",
    options: ["강한 매수 신호", "하락 베팅 증가", "배당락 임박", "상장 예정"],
    answerIndex: 1,
    explanation: "기관·외인이 주가 하락에 베팅",
    difficulty: "어려움",
    category: "심화",
  },
  {
    id: "q84",
    question: "인버스 ETF가 오르는 조건은?",
    options: ["지수 상승", "지수 하락", "금리 하락", "원화 강세"],
    answerIndex: 1,
    explanation: "지수 반대 방향으로 움직이는 상품",
    difficulty: "어려움",
    category: "심화",
  },
  {
    id: "q85",
    question: "VIX지수가 30 이상이면?",
    options: ["시장 안정", "공포 구간", "횡보 구간", "강세장"],
    answerIndex: 1,
    explanation: "Fear & Greed Index 공포 신호",
    difficulty: "어려움",
    category: "심화",
  },
  {
    id: "q86",
    question: "기업이 자사주를 소각하면?",
    options: ["주식 수 증가", "EPS 하락", "주식 수 감소로 EPS 상승", "배당 증가"],
    answerIndex: 2,
    explanation: "유통 주식 감소 → 주당 가치 상승",
    difficulty: "어려움",
    category: "심화",
  },
  {
    id: "q87",
    question: "피벗(Pivot)이란 무엇인가?",
    options: ["기준금리 인상 지속", "통화정책 방향 전환", "ETF 리밸런싱", "공모주 청약"],
    answerIndex: 1,
    explanation: "Fed의 금리 인상 → 동결·인하 전환 시점",
    difficulty: "어려움",
    category: "심화",
  },
  {
    id: "q88",
    question: "스태그플레이션이란?",
    options: ["고성장+저물가", "저성장+고물가", "고성장+고물가", "저성장+저물가"],
    answerIndex: 1,
    explanation: "경기 침체 + 인플레이션 동시 발생",
    difficulty: "어려움",
    category: "심화",
  },
  {
    id: "q89",
    question: "미국 국채 10년물 금리 상승이 주식에 미치는 영향은?",
    options: ["주가 상승 압력", "주가 하락 압력", "무관", "배당 증가"],
    answerIndex: 1,
    explanation: "할인율 상승 → 미래 현금흐름 현재가치 하락",
    difficulty: "어려움",
    category: "심화",
  },
  {
    id: "q90",
    question: "주식 시장의 계절성 격언 'Sell in May'의 의미는?",
    options: ["5월에 매수하라", "5월에 팔고 10월에 돌아오라", "5월은 강세장", "5월에 배당받아라"],
    answerIndex: 1,
    explanation: "여름 휴가 시즌 거래량 감소로 수익률 저하 경향",
    difficulty: "어려움",
    category: "심화",
  },
  {
    id: "q91",
    question: "워런 버핏이 강조하는 투자의 핵심 원칙은?",
    options: ["단기 모멘텀 추구", "안전마진 확보", "레버리지 극대화", "공매도 활용"],
    answerIndex: 1,
    explanation: "Margin of Safety — 저평가 종목의 여유 있는 매수",
    difficulty: "어려움",
    category: "심화",
  },
  {
    id: "q92",
    question: "SPAC이란 무엇인가?",
    options: ["일반 공모 펀드", "기업 인수 목적 상장 회사", "채권 ETF", "배당주 펀드"],
    answerIndex: 1,
    explanation: "Special Purpose Acquisition Company",
    difficulty: "어려움",
    category: "심화",
  },
  {
    id: "q93",
    question: "주식의 내재가치를 계산하는 대표 방법은?",
    options: ["기술적 분석", "DCF 분석", "RSI 분석", "거래량 분석"],
    answerIndex: 1,
    explanation: "Discounted Cash Flow — 미래 현금흐름 현재가치 합산",
    difficulty: "어려움",
    category: "심화",
  },
  {
    id: "q94",
    question: "주가가 내재가치보다 낮을 때를?",
    options: ["고평가", "저평가", "적정 가치", "과열"],
    answerIndex: 1,
    explanation: "매수 기회 — 가치투자의 핵심 포인트",
    difficulty: "어려움",
    category: "심화",
  },
  {
    id: "q95",
    question: "채권 금리와 채권 가격의 관계는?",
    options: ["비례", "반비례", "동일", "무관"],
    answerIndex: 1,
    explanation: "금리 오르면 채권 가격 하락 (역관계)",
    difficulty: "어려움",
    category: "심화",
  },
  {
    id: "q96",
    question: "환율이 오를 때 유리한 업종은?",
    options: ["내수 소비재", "수출 제조업", "건설·부동산", "유통"],
    answerIndex: 1,
    explanation: "원화 약세 → 수출 기업 실적 개선",
    difficulty: "어려움",
    category: "심화",
  },
  {
    id: "q97",
    question: "원자재 가격 급등이 제조업에 미치는 영향은?",
    options: ["원가 절감", "원가 상승으로 마진 압박", "매출 증가", "무관"],
    answerIndex: 1,
    explanation: "Input cost 상승 → 영업이익률 하락",
    difficulty: "어려움",
    category: "심화",
  },
  {
    id: "q98",
    question: "전업 투자자가 아닌 일반 투자자는?",
    options: ["기관", "개인(개미)", "외인", "세력"],
    answerIndex: 1,
    explanation: "정보 열위에 있는 집단",
    difficulty: "어려움",
    category: "심화",
  },
  {
    id: "q99",
    question: "원금 회복에 집착하는 심리 오류는?",
    options: ["본전생각", "매몰비용", "확증편향", "자신감"],
    answerIndex: 1,
    explanation: "비합리적 결정의 원인",
    difficulty: "어려움",
    category: "심화",
  },
  {
    id: "q100",
    question: "투자 원칙을 지키는 가장 큰 힘은?",
    options: ["운", "지능", "인내와규율", "자본"],
    answerIndex: 2,
    explanation: "성공 투자의 핵심",
    difficulty: "어려움",
    category: "심화",
  },
  /* ── 추가 문제 (퀴즈모음·주식용어DB 기반) ── */
  {
    id: "q101",
    question: "국내 주식시장 정규 거래 시간은?",
    options: ["08:30~15:00", "09:00~15:30", "09:30~16:00", "08:00~14:30"],
    answerIndex: 1,
    explanation: "오전 9시 개장, 오후 3시 30분 장 마감 (6.5시간 운영)",
    difficulty: "쉬움",
    category: "시장 기초",
  },
  {
    id: "q102",
    question: "KOSPI의 정식 한국어 명칭은?",
    options: ["한국주식거래소지수", "한국종합주가지수", "코스닥종합지수", "한국대형주지수"],
    answerIndex: 1,
    explanation: "KOrea composite Stock Price Index — 유가증권시장 전체 상장 종목 시가총액 지수",
    difficulty: "쉬움",
    category: "시장 기초",
  },
  {
    id: "q103",
    question: "장 시작 전후 주문을 모아 한꺼번에 체결하는 제도는?",
    options: ["시간외 단일가", "동시호가", "지정가 주문", "최유리 주문"],
    answerIndex: 1,
    explanation: "08:30~09:00 / 15:20~15:30에 접수된 주문을 한 가격으로 일괄 체결",
    difficulty: "쉬움",
    category: "거래 용어",
  },
  {
    id: "q104",
    question: "20일 이동평균선이 '심리선'으로 불리는 이유는?",
    options: ["20일이 한 달 영업일 기준", "20이 행운의 숫자", "외국인이 주로 사용", "증권사 공식 지표"],
    answerIndex: 0,
    explanation: "약 1개월(20 영업일) 단기 추세를 반영해 투자 심리를 나타내는 지표로 활용",
    difficulty: "보통",
    category: "차트 분석",
  },
  {
    id: "q105",
    question: "기업을 사들이거나 다른 기업과 합치는 행위는?",
    options: ["IPO", "유상증자", "M&A", "스핀오프"],
    answerIndex: 2,
    explanation: "Mergers & Acquisitions — 경영권 획득·시너지 창출을 목적으로 기업을 인수하거나 합병",
    difficulty: "보통",
    category: "공시/이슈",
  },
  {
    id: "q106",
    question: "다른 회사 주식을 소유해 경영을 지배하는 회사는?",
    options: ["자회사", "지주회사", "관계회사", "합작사"],
    answerIndex: 1,
    explanation: "Holding Company — 사업 영위보다 계열사 지분 소유를 통해 그룹 전체를 통제",
    difficulty: "보통",
    category: "공시/이슈",
  },
  {
    id: "q107",
    question: "증권사에서 자금을 빌려 주식을 매수하는 것은?",
    options: ["대주거래", "신용융자", "미수거래", "공매도"],
    answerIndex: 1,
    explanation: "일명 '빚투' — 레버리지 효과로 수익·손실이 모두 확대되는 위험성 있음",
    difficulty: "보통",
    category: "거래 용어",
  },
  {
    id: "q108",
    question: "정규장 마감 후 별도 시간대에 단일 가격으로 거래하는 방식은?",
    options: ["동시호가", "시간외 단일가", "시간외 종가", "야간 선물"],
    answerIndex: 1,
    explanation: "15:40~18:00에 10분 단위로 체결 — 장 마감 후 뉴스에 반응하는 수요/공급 반영",
    difficulty: "보통",
    category: "거래 용어",
  },
  {
    id: "q109",
    question: "선물 가격이 현물(spot) 가격보다 높은 상태를 뜻하는 용어는?",
    options: ["백워데이션", "콘탱고", "프리미엄 붕괴", "스프레드 반전"],
    answerIndex: 1,
    explanation: "Contango — 보유비용(이자·보관료) 반영으로 일반적인 정상 시장 상태",
    difficulty: "어려움",
    category: "파생/심화",
  },
  {
    id: "q110",
    question: "주가지수선물·옵션·개별주식선물·옵션 만기일이 겹치는 날은?",
    options: ["트리플 위칭데이", "네 마녀의 날", "블랙프라이데이", "FOMC 데이"],
    answerIndex: 1,
    explanation: "쿼드러플 위칭데이 — 변동성이 크게 확대되며 주로 3·6·9·12월 셋째 금요일",
    difficulty: "어려움",
    category: "파생/심화",
  },
  {
    id: "q111",
    question: "공매도 과열 종목 지정 시 핵심 요건 두 가지는?",
    options: ["거래량·시총", "공매도 비중 및 주가 하락률", "외국인 비중·PER", "신용잔고·유통주식수"],
    answerIndex: 1,
    explanation: "공매도 비중이 일정 수준을 초과하고 주가가 일정 % 이상 하락할 때 지정",
    difficulty: "어려움",
    category: "공시/이슈",
  },
  {
    id: "q112",
    question: "UAM(도심 항공 모빌리티)의 대표 기체 유형은?",
    options: ["드론택시(멀티콥터)", "eVTOL", "헬기", "수소비행기"],
    answerIndex: 1,
    explanation: "eVTOL(Electric Vertical Take-Off and Landing) — 전기 수직 이착륙기로 도심 내 이동 수단",
    difficulty: "어려움",
    category: "심화",
  },
  {
    id: "q113",
    question: "사업부를 분리할 때 신설법인 지분을 모회사가 100% 소유하는 방식은?",
    options: ["인적분할(스핀오프)", "물적분할", "합병", "지주회사 전환"],
    answerIndex: 1,
    explanation: "물적분할 — 기존 주주는 신설 법인 지분을 받지 못해 주주 가치 희석 논란 발생",
    difficulty: "어려움",
    category: "공시/이슈",
  },
  {
    id: "q114",
    question: "개인 투자자가 주식을 빌려 먼저 매도하는 방식은?",
    options: ["신용융자", "대주거래", "공매도(기관)", "미수거래"],
    answerIndex: 1,
    explanation: "대주거래 — 개인이 증권사로부터 주식을 빌려 공매도, 하락 시 차익 실현",
    difficulty: "어려움",
    category: "거래 용어",
  },
  {
    id: "q115",
    question: "증거금이 유지 기준 아래로 떨어질 때 추가 납부를 요구받는 것은?",
    options: ["반대매매", "마진콜", "신용경고", "담보부족"],
    answerIndex: 1,
    explanation: "Margin Call — 미납 시 증권사가 강제로 반대매매 실행",
    difficulty: "어려움",
    category: "거래 용어",
  },
];

/* ─────────────────────────────────────────────────
   카테고리 아이콘 매핑
───────────────────────────────────────────────── */
const CATEGORY_ICONS: Record<string, typeof TrendingUp> = {
  "시장기초": TrendingUp,
  "거래용어": DollarSign,
  "차트기초": BarChart2,
  "재무용어": BookOpen,
  "공시/이슈": ShieldCheck,
  "투자전략": Brain,
  "심리/태도": Brain,
  "기관투자자": Building2,
  "파생/선물": Activity,
  "산업/테마": Cpu,
  "경제지표": Globe,
  "기타용어": HelpCircle,
};

const ALL_CATEGORIES = Array.from(new Set(TIPS_DATA.map((t) => t.category)));

/* ─────────────────────────────────────────────────
   TipCard 컴포넌트
───────────────────────────────────────────────── */
function TipCard({ tip, index }: { tip: TipItem; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = CATEGORY_ICONS[tip.category] ?? BookOpen;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.02, 0.3) }}
      className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden"
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-4 p-4 text-left hover:bg-muted/20 transition-colors"
      >
        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0", tip.categoryColor)}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", tip.categoryColor)}>
            {tip.category}
          </span>
          <p className="font-bold text-foreground text-sm leading-snug mt-0.5">{tip.title}</p>
        </div>
        <ChevronRight
          className={cn(
            "w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform duration-200",
            expanded && "rotate-90"
          )}
        />
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0">
              <div className="h-px bg-border/40 mb-3" />
              <p className="text-sm text-muted-foreground leading-relaxed font-medium">{tip.body}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────
   QuizSection 컴포넌트 — 일일 랜덤 3문제
───────────────────────────────────────────────── */
type QuizPhase = "question" | "correct" | "wrong";

/** 날짜 문자열(YYYY-MM-DD)을 시드로 Seeded PRNG로 QUIZ_DATA 인덱스 3개 뽑기 */
function getDailyQuizSet(): QuizItem[] {
  const today = new Date().toISOString().split("T")[0]; // "2026-04-04"
  // 이전에 사용한 ID 목록 (최근 N일 겹치지 않도록)
  const historyKey = "daily_quiz_history";
  const rawHistory: string[] = JSON.parse(localStorage.getItem(historyKey) || "[]");

  // Simple seeded pseudo-random (mulberry32)
  let seed = today.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const rand = () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };

  // 최근 사용된 ID를 제외하고 후보 추리기 (단, 전체가 너무 적으면 필터 해제)
  const usedIds = new Set(rawHistory.slice(-30));
  let pool = QUIZ_DATA.filter(q => !usedIds.has(q.id));
  if (pool.length < 3) pool = [...QUIZ_DATA];

  // 시드 기반으로 3문제 선택 (shuffle 후 앞 3개)
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const selected = shuffled.slice(0, 3);

  // 오늘 날짜와 선택된 ID 저장
  const newHistory = [...rawHistory, ...selected.map(q => q.id)];
  localStorage.setItem(historyKey, JSON.stringify(newHistory.slice(-60)));

  return selected;
}

const DAILY_QUIZ_STORAGE_KEY = "daily_quiz_done_";

function QuizSection() {
  const { missions, completeQuiz } = useMissions();

  // 오늘 날짜 기반 일일 퀴즈 세트 (mount 시 한 번만 생성)
  const [dailyQuizzes] = useState<QuizItem[]>(() => getDailyQuizSet());
  const DAILY_COUNT = dailyQuizzes.length; // 3

  const today = new Date().toISOString().split("T")[0];
  const doneKey = DAILY_QUIZ_STORAGE_KEY + today;

  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [phase, setPhase] = useState<QuizPhase>("question");
  const [results, setResults] = useState<boolean[]>([]); // 각 문제 정오표
  const [selectedHistory, setSelectedHistory] = useState<number[]>([]); // 선택 기록
  const [finished, setFinished] = useState(() => localStorage.getItem(doneKey) === "1");
  const [rewardGiven, setRewardGiven] = useState(false);
  const [showReview, setShowReview] = useState(false);

  const quiz = dailyQuizzes[currentIdx];
  const isLast = currentIdx === DAILY_COUNT - 1;
  const alreadyDone = missions.quiz || finished;

  const handleSelect = (idx: number) => {
    if (phase !== "question") return;
    setSelected(idx);
    const correct = idx === quiz.answerIndex;
    setPhase(correct ? "correct" : "wrong");
    const newResults = [...results, correct];
    setResults(newResults);
    setSelectedHistory((prev) => [...prev, idx]);

    // 마지막 문제 완료 시
    if (isLast) {
      const correctCount = newResults.filter(Boolean).length;
      if (correctCount >= 2 && !alreadyDone) {
        completeQuiz(); // +40P 지급
        setRewardGiven(true);
      }
      localStorage.setItem(doneKey, "1");
      setFinished(true);
    }
  };

  const handleNext = () => {
    if (!isLast) {
      setCurrentIdx((i) => i + 1);
      setSelected(null);
      setPhase("question");
    }
  };

  const handleRetry = () => {
    setSelected(null);
    setPhase("question");
  };

  const difficultyColor = {
    "쉬움": "bg-green-50 text-green-600 border-green-200",
    "보통": "bg-yellow-50 text-yellow-600 border-yellow-200",
    "어려움": "bg-red-50 text-red-600 border-red-200",
  };

  const correctCount = results.filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* 일일 퀴즈 진행 헤더 */}
      <div className="flex items-center justify-between px-1">
        <div>
          <p className="text-sm font-bold text-foreground">오늘의 퀴즈</p>
          <p className="text-xs text-muted-foreground">랜덤 3문제 · 2개 이상 정답 시 +40P</p>
        </div>
        <div className="flex gap-1.5">
          {dailyQuizzes.map((_, i) => (
            <div key={i} className={cn(
              "w-7 h-2 rounded-full transition-colors",
              i < results.length
                ? results[i] ? "bg-green-400" : "bg-red-400"
                : i === currentIdx ? "bg-primary/60" : "bg-muted"
            )} />
          ))}
        </div>
      </div>

      <AnimatePresence>
        {(alreadyDone || finished) && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "rounded-2xl px-5 py-3.5 border",
              rewardGiven || correctCount >= 2
                ? "bg-green-50 border-green-200"
                : "bg-amber-50 border-amber-200"
            )}
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className={cn(
                "w-5 h-5 flex-shrink-0",
                rewardGiven || correctCount >= 2 ? "text-green-500" : "text-amber-500"
              )} />
              <div className="flex-1">
                {rewardGiven || (finished && correctCount >= 2) ? (
                  <>
                    <p className="font-bold text-green-700 text-sm">오늘의 퀴즈 미션 완료! +40P 획득 🎉</p>
                    <p className="text-xs text-green-600 font-medium">{correctCount}/{DAILY_COUNT}문제 정답 · 내일 새로운 퀴즈가 준비됩니다.</p>
                  </>
                ) : alreadyDone && !finished ? (
                  <>
                    <p className="font-bold text-green-700 text-sm">이미 완료한 퀴즈입니다!</p>
                    <p className="text-xs text-green-600 font-medium">내일 새로운 퀴즈가 준비됩니다.</p>
                  </>
                ) : (
                  <>
                    <p className="font-bold text-amber-700 text-sm">오늘 퀴즈 완료 — {correctCount}/{DAILY_COUNT}문제 정답</p>
                    <p className="text-xs text-amber-600 font-medium">2개 이상 정답 시 포인트 지급 · 내일 다시 도전해보세요!</p>
                  </>
                )}
              </div>
              {finished && selectedHistory.length > 0 && (
                <button
                  onClick={() => setShowReview((v) => !v)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex-shrink-0",
                    showReview
                      ? "bg-primary text-white"
                      : "bg-white border border-border text-foreground hover:bg-muted/50"
                  )}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  {showReview ? "닫기" : "문제 보기"}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 퀴즈 복습 패널 ── */}
      <AnimatePresence>
        {showReview && finished && selectedHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 pt-1">
              <p className="text-xs font-bold text-muted-foreground px-1">오늘 푼 문제 복습</p>
              {dailyQuizzes.map((q, qi) => {
                const userSelected = selectedHistory[qi];
                const isCorrect = results[qi];
                return (
                  <div
                    key={q.id}
                    className={cn(
                      "rounded-2xl border-2 overflow-hidden",
                      isCorrect ? "border-green-200 bg-green-50/50" : "border-red-200 bg-red-50/50"
                    )}
                  >
                    {/* 문제 헤더 */}
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-border/30">
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0",
                        isCorrect ? "bg-green-500" : "bg-red-400"
                      )}>
                        {isCorrect
                          ? <CheckCircle2 className="w-4 h-4 text-white" />
                          : <XCircle className="w-4 h-4 text-white" />}
                      </div>
                      <span className="text-xs font-bold text-muted-foreground">{qi + 1}번</span>
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full border ml-auto",
                        q.difficulty === "쉬움" ? "bg-green-50 text-green-600 border-green-200"
                          : q.difficulty === "보통" ? "bg-yellow-50 text-yellow-600 border-yellow-200"
                          : "bg-red-50 text-red-600 border-red-200"
                      )}>
                        {q.difficulty}
                      </span>
                    </div>
                    {/* 질문 */}
                    <div className="px-4 pt-3 pb-2">
                      <p className="text-sm font-bold text-foreground">{q.question}</p>
                    </div>
                    {/* 보기 */}
                    <div className="px-4 pb-3 space-y-1.5">
                      {q.options.map((opt, oi) => {
                        const isAnswer = oi === q.answerIndex;
                        const isUser = oi === userSelected;
                        let cls = "border-border/40 bg-white/50 text-muted-foreground";
                        if (isAnswer) cls = "border-green-400 bg-green-50 text-green-700 font-bold";
                        else if (isUser && !isAnswer) cls = "border-red-300 bg-red-50 text-red-600";
                        return (
                          <div key={oi} className={cn(
                            "flex items-center gap-2.5 px-3 py-2 rounded-xl border text-sm",
                            cls
                          )}>
                            <span className={cn(
                              "w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 border",
                              isAnswer ? "bg-green-500 text-white border-green-500"
                                : isUser ? "bg-red-400 text-white border-red-400"
                                : "border-current"
                            )}>
                              {String.fromCharCode(65 + oi)}
                            </span>
                            <span className="flex-1">{opt}</span>
                            {isAnswer && <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />}
                            {isUser && !isAnswer && <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
                          </div>
                        );
                      })}
                    </div>
                    {/* 해설 */}
                    <div className={cn(
                      "px-4 py-3 border-t border-border/30",
                      isCorrect ? "bg-green-50" : "bg-red-50"
                    )}>
                      <p className="text-xs text-muted-foreground font-semibold">
                        💡 {q.explanation}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!alreadyDone && (
        <motion.div
          key={currentIdx}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-card rounded-3xl border border-border/50 shadow-sm overflow-hidden"
        >
          <div className="px-6 pt-6 pb-4">
            <div className="flex items-center gap-2 mb-3">
              <span className={cn("text-[11px] font-bold px-2.5 py-1 rounded-full border", difficultyColor[quiz.difficulty])}>
                {quiz.difficulty}
              </span>
              <span className="text-[11px] font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                {quiz.category}
              </span>
              <span className="ml-auto text-xs font-bold text-muted-foreground">
                {currentIdx + 1} / {DAILY_COUNT}
              </span>
            </div>
            <p className="text-base font-bold text-foreground leading-snug">{quiz.question}</p>
          </div>

          <div className="px-6 pb-4 space-y-2.5">
            {quiz.options.map((opt, i) => {
              const isAnswer = i === quiz.answerIndex;
              const isSelected = i === selected;
              let style = "border-border/60 bg-muted/30 text-foreground hover:border-primary/40 hover:bg-primary/5";
              if (phase !== "question") {
                if (isAnswer) style = "border-green-400 bg-green-50 text-green-700";
                else if (isSelected && !isAnswer) style = "border-red-300 bg-red-50 text-red-600";
                else style = "border-border/30 bg-muted/20 text-muted-foreground";
              }
              return (
                <button
                  key={i}
                  onClick={() => handleSelect(i)}
                  disabled={phase !== "question"}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 text-left text-sm font-semibold transition-all duration-150",
                    style,
                    phase === "question" && "cursor-pointer active:scale-[0.99]",
                    phase !== "question" && "cursor-default"
                  )}
                >
                  <span className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 border",
                    phase !== "question" && isAnswer ? "bg-green-500 text-white border-green-500" :
                    phase !== "question" && isSelected ? "bg-red-400 text-white border-red-400" :
                    "border-current"
                  )}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  {opt}
                  {phase !== "question" && isAnswer && (
                    <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto flex-shrink-0" />
                  )}
                  {phase !== "question" && isSelected && !isAnswer && (
                    <XCircle className="w-4 h-4 text-red-400 ml-auto flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          <AnimatePresence>
            {/* 마지막 문제 오답 시 피드백 없이 즉시 완료 처리 */}
            {phase !== "question" && !(isLast && phase === "wrong") && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className={cn(
                  "mx-6 mb-6 p-4 rounded-2xl border",
                  phase === "correct" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                )}>
                  <div className="flex items-center gap-2 mb-2">
                    {phase === "correct" ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <p className="font-extrabold text-green-700">정답!</p>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                        <p className="font-extrabold text-red-600">오답</p>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground font-medium leading-relaxed">{quiz.explanation}</p>

                  <div className="flex gap-2 mt-3">
                    {phase === "wrong" && !isLast && (
                      <button
                        onClick={handleRetry}
                        className="flex-1 py-2.5 rounded-xl bg-white border border-red-200 text-red-600 font-bold text-sm hover:bg-red-50 transition-colors"
                      >
                        다시 풀기
                      </button>
                    )}
                    {!isLast && (
                      <button
                        onClick={handleNext}
                        className="flex-1 py-2.5 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-1"
                      >
                        다음 문제 <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────
   메인 Tips 페이지
───────────────────────────────────────────────── */
export default function Tips() {
  const searchStr = useSearch();
  const params = new URLSearchParams(searchStr);
  const initTab = (params.get("tab") as TabType) ?? "tips";
  const [tab, setTab] = useState<TabType>(initTab);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const { missions } = useMissions();

  const filteredTips = TIPS_DATA.filter((tip) => {
    const matchCat = !selectedCategory || tip.category === selectedCategory;
    const matchSearch = !search || tip.title.includes(search) || tip.body.includes(search);
    return matchCat && matchSearch;
  });

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-in fade-in duration-500">
      <div className="px-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">학습 센터</h1>
        <p className="text-muted-foreground font-medium mt-1">주식 용어 {TIPS_DATA.length}개 · 일일 퀴즈 · 가이드 영상</p>
      </div>

      {/* 탭 */}
      <div className="flex gap-1 bg-muted p-1.5 rounded-2xl">
        <button
          onClick={() => setTab("tips")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all duration-200",
            tab === "tips" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <BookOpen className="w-4 h-4" />
          주식 용어
          <span className={cn(
            "text-[10px] font-extrabold px-1.5 py-0.5 rounded-full",
            tab === "tips" ? "bg-primary/10 text-primary" : "bg-background/60"
          )}>
            {TIPS_DATA.length}
          </span>
        </button>
        <button
          onClick={() => setTab("quiz")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all duration-200",
            tab === "quiz" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <GraduationCap className="w-4 h-4" />
          퀴즈
          {missions.quiz ? (
            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-green-100 text-green-600">완료</span>
          ) : (
            <span className={cn(
              "text-[10px] font-extrabold px-1.5 py-0.5 rounded-full",
              tab === "quiz" ? "bg-blue-100 text-blue-600" : "bg-background/60 text-muted-foreground"
            )}>+40P</span>
          )}
        </button>
        <button
          onClick={() => setTab("guide")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all duration-200",
            tab === "guide" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <PlayCircle className="w-4 h-4" />
          가이드
        </button>
      </div>

      {/* 탭 콘텐츠 */}
      <AnimatePresence mode="wait">
        {tab === "tips" ? (
          <motion.div
            key="tips"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ duration: 0.18 }}
            className="space-y-4"
          >
            {/* 검색창 */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="용어 검색..."
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-border/60 bg-card text-sm font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {/* 카테고리 필터 */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setSelectedCategory(null)}
                className={cn(
                  "flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-full border transition-colors",
                  !selectedCategory
                    ? "bg-primary text-white border-primary"
                    : "bg-card border-border/60 text-muted-foreground hover:border-primary/40"
                )}
              >
                전체
              </button>
              {ALL_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                  className={cn(
                    "flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-full border transition-colors",
                    selectedCategory === cat
                      ? "bg-primary text-white border-primary"
                      : "bg-card border-border/60 text-muted-foreground hover:border-primary/40"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* 결과 수 */}
            <p className="text-xs text-muted-foreground font-medium px-1">
              {filteredTips.length}개 용어
            </p>

            {/* 용어 카드 목록 */}
            {filteredTips.length > 0 ? (
              filteredTips.map((tip, i) => (
                <TipCard key={tip.id} tip={tip} index={i} />
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground font-medium">
                검색 결과가 없습니다
              </div>
            )}
          </motion.div>
        ) : tab === "quiz" ? (
          <motion.div
            key="quiz"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.18 }}
            className="space-y-4"
          >
            <QuizSection />
            <Link href="/missions">
              <button className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-border/60 bg-card text-sm font-bold text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4" />
                일일 미션으로 돌아가기
              </button>
            </Link>
          </motion.div>
        ) : (
          <motion.div
            key="guide"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.18 }}
          >
            <GuideContent />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
