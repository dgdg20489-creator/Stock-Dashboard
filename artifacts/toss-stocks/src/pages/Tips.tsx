import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, TrendingUp, BarChart2, DollarSign, ShieldCheck,
  Brain, Building2, GraduationCap, CheckCircle2, XCircle,
  ChevronRight, Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMissions } from "@/hooks/use-missions";

type TabType = "tips" | "quiz";

/* ─────────────────────────────────────────────────
   주식 용어 데이터 (주식용어DB.xlsx 기반 111개)
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
  const [finished, setFinished] = useState(() => localStorage.getItem(doneKey) === "1");
  const [rewardGiven, setRewardGiven] = useState(false);

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
              "flex items-center gap-3 rounded-2xl px-5 py-3.5 border",
              rewardGiven || correctCount >= 2
                ? "bg-green-50 border-green-200"
                : "bg-amber-50 border-amber-200"
            )}
          >
            <CheckCircle2 className={cn(
              "w-5 h-5 flex-shrink-0",
              rewardGiven || correctCount >= 2 ? "text-green-500" : "text-amber-500"
            )} />
            <div>
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
            {phase !== "question" && (
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
                        <p className="font-extrabold text-green-700">
                          정답! {isLast && results.filter(Boolean).length + (phase === "correct" ? 0 : 0) >= 2 ? "+40P 획득" : ""}
                        </p>
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
  const [tab, setTab] = useState<TabType>("tips");
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
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">팁 &amp; 퀴즈</h1>
        <p className="text-muted-foreground font-medium mt-1">주식 용어 {TIPS_DATA.length}개 · 일일 퀴즈 3문제</p>
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
          투자 퀴즈
          {missions.quiz ? (
            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-green-100 text-green-600">완료</span>
          ) : (
            <span className={cn(
              "text-[10px] font-extrabold px-1.5 py-0.5 rounded-full",
              tab === "quiz" ? "bg-blue-100 text-blue-600" : "bg-background/60 text-muted-foreground"
            )}>+40P</span>
          )}
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
        ) : (
          <motion.div
            key="quiz"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.18 }}
          >
            <QuizSection />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
