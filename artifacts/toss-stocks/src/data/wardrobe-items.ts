export type Difficulty = "beginner" | "intermediate" | "expert";
export type ItemCategory = "hat" | "top" | "bottom" | "scarf";

export interface WardrobeItem {
  id: string;
  name: string;
  category: ItemCategory;
  difficulty: Difficulty;
  color: string;
  accentColor?: string;
  description: string;
}

export const WARDROBE_ITEMS: WardrobeItem[] = [
  // ─── 모자 (hat) ───
  { id: "hat_cap", name: "기본 캡 모자", category: "hat", difficulty: "beginner", color: "#e53e3e", description: "어디서나 잘 어울리는 레드 캡" },
  { id: "hat_bungeo", name: "벙거지", category: "hat", difficulty: "beginner", color: "#8B6914", description: "브론즈 갈색 버킷 햇" },
  { id: "hat_fedora", name: "페도라", category: "hat", difficulty: "intermediate", color: "#374151", description: "신사적인 다크 그레이 페도라" },
  { id: "hat_hunting", name: "헌팅캡", category: "hat", difficulty: "intermediate", color: "#6B7280", description: "스마트한 실버 헌팅캡" },
  { id: "hat_crown", name: "금색 왕관", category: "hat", difficulty: "expert", color: "#F6C90E", accentColor: "#D4A017", description: "투자 고수의 황금 왕관" },
  { id: "hat_silk", name: "실크 햇", category: "hat", difficulty: "expert", color: "#111827", accentColor: "#F6C90E", description: "클래식 탑 햇 실크 소재" },

  // ─── 상의 (top) ───
  { id: "top_tshirt", name: "면 티셔츠", category: "top", difficulty: "beginner", color: "#E5E7EB", description: "편안한 화이트 면 티셔츠" },
  { id: "top_hoodie", name: "후드티", category: "top", difficulty: "beginner", color: "#1E3A5F", description: "편안한 네이비 후드티" },
  { id: "top_sweatshirt", name: "맨투맨", category: "top", difficulty: "beginner", color: "#6B7280", description: "캐주얼 그레이 맨투맨" },
  { id: "top_shirt_tie", name: "셔츠 & 넥타이", category: "top", difficulty: "intermediate", color: "#FFFFFF", accentColor: "#C0392B", description: "화이트 셔츠에 레드 넥타이" },
  { id: "top_cardigan", name: "가디건", category: "top", difficulty: "intermediate", color: "#D4A5A5", description: "포근한 베이지 핑크 가디건" },
  { id: "top_blouson", name: "블루종", category: "top", difficulty: "intermediate", color: "#4A5240", description: "실용적인 올리브 블루종" },
  { id: "top_suit", name: "테일러드 수트", category: "top", difficulty: "expert", color: "#1F2937", description: "고급 차콜 테일러드 수트" },
  { id: "top_luxury_coat", name: "럭셔리 코트", category: "top", difficulty: "expert", color: "#C19A6B", description: "고급 캐멀 럭셔리 코트" },
  { id: "top_fur", name: "퍼 자켓", category: "top", difficulty: "expert", color: "#F5F0E8", description: "화이트 퍼 자켓" },

  // ─── 하의 (bottom) ───
  { id: "bottom_jeans", name: "청바지", category: "bottom", difficulty: "beginner", color: "#2563EB", description: "데일리 블루 청바지" },
  { id: "bottom_jogger", name: "조거 팬츠", category: "bottom", difficulty: "beginner", color: "#9CA3AF", description: "편안한 그레이 조거 팬츠" },
  { id: "bottom_shorts", name: "반바지", category: "bottom", difficulty: "beginner", color: "#D4A96A", description: "캐주얼 카키 반바지" },
  { id: "bottom_slacks", name: "슬랙스", category: "bottom", difficulty: "intermediate", color: "#374151", description: "비즈니스 차콜 슬랙스" },
  { id: "bottom_chino", name: "치노 팬츠", category: "bottom", difficulty: "intermediate", color: "#C8A96E", description: "깔끔한 베이지 치노 팬츠" },
  { id: "bottom_cotton", name: "면바지", category: "bottom", difficulty: "intermediate", color: "#1E3A5F", description: "편안한 네이비 면바지" },
  { id: "bottom_formal", name: "정장 바지", category: "bottom", difficulty: "expert", color: "#111827", description: "고급 블랙 정장 바지" },
  { id: "bottom_leather", name: "가죽 팬츠", category: "bottom", difficulty: "expert", color: "#1C1C1C", accentColor: "#4B4B4B", description: "럭셔리 블랙 레더 팬츠" },
  { id: "bottom_luxury_jeans", name: "명품 진", category: "bottom", difficulty: "expert", color: "#1E2B5E", description: "다크 인디고 명품 진" },

  // ─── 머플러/액세서리 (scarf) ───
  { id: "scarf_check", name: "체크 면 머플러", category: "scarf", difficulty: "beginner", color: "#DC2626", accentColor: "#FFFFFF", description: "레드 체크 면 머플러" },
  { id: "scarf_canvas_shoes", name: "캔버스화", category: "scarf", difficulty: "beginner", color: "#F9FAFB", accentColor: "#9CA3AF", description: "화이트 캔버스화 (발목 장식)" },
  { id: "scarf_cashmere", name: "캐시미어 머플러", category: "scarf", difficulty: "intermediate", color: "#C0C0C0", description: "실버 캐시미어 머플러" },
  { id: "scarf_smartwatch", name: "스마트 워치", category: "scarf", difficulty: "intermediate", color: "#374151", accentColor: "#10B981", description: "블랙 스마트 워치" },
  { id: "scarf_silk", name: "실크 스카프", category: "scarf", difficulty: "expert", color: "#7C3AED", accentColor: "#DDD6FE", description: "퍼플 실크 스카프" },
  { id: "scarf_gold_watch", name: "금시계", category: "scarf", difficulty: "expert", color: "#F6C90E", accentColor: "#D4A017", description: "고급 골드 시계" },
];

export const CATEGORIES: { id: ItemCategory; label: string }[] = [
  { id: "hat", label: "모자" },
  { id: "top", label: "상의" },
  { id: "bottom", label: "하의" },
  { id: "scarf", label: "머플러" },
];

export const DIFFICULTY_CONFIG = {
  beginner: { label: "초보", color: "#CD7F32", bgColor: "bg-amber-700/10", textColor: "text-amber-700", borderColor: "border-amber-700/30" },
  intermediate: { label: "중수", color: "#C0C0C0", bgColor: "bg-slate-400/10", textColor: "text-slate-500", borderColor: "border-slate-400/30" },
  expert: { label: "고수", color: "#FFD700", bgColor: "bg-yellow-400/10", textColor: "text-yellow-600", borderColor: "border-yellow-400/30" },
};
