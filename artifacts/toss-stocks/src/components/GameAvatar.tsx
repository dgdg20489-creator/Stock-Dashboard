// ── 투자 성향 기반 캐릭터 아바타 포트레이트 ────────────────────────

export type AvatarId =
  | "aggressive_m" | "balanced_m" | "defensive_m" | "analytical_m" | "growth_m"
  | "aggressive_f" | "balanced_f" | "defensive_f" | "analytical_f" | "growth_f";

export type InvestType = "aggressive" | "balanced" | "defensive" | "analytical" | "growth";

export interface AvatarDef {
  id: AvatarId;
  label: string;
  type: InvestType;
  emoji: string;
  tagline: string;
  desc: string;
  gender: "남" | "녀";
  themeColor: string;
  bgFrom: string;
  bgTo: string;
}

export const INVEST_TYPES: { type: InvestType; label: string; emoji: string; tagline: string; desc: string; themeColor: string; bgFrom: string; bgTo: string }[] = [
  {
    type: "aggressive",
    label: "공격형",
    emoji: "🔥",
    tagline: "고수익 고위험",
    desc: "과감한 베팅으로 최대 수익을 노리는 타입. 급등주·테마주 중심 투자.",
    themeColor: "#FF4020",
    bgFrom: "#8B0000",
    bgTo: "#0A0505",
  },
  {
    type: "balanced",
    label: "균형형",
    emoji: "⚖️",
    tagline: "안정적 성장",
    desc: "리스크와 수익의 균형을 추구. 대형주+ETF 혼합 포트폴리오 선호.",
    themeColor: "#2060CC",
    bgFrom: "#0A2050",
    bgTo: "#050810",
  },
  {
    type: "defensive",
    label: "안정형",
    emoji: "🛡️",
    tagline: "원금 보전 우선",
    desc: "손실 최소화가 최우선. 배당주·채권ETF·금 중심의 보수적 투자.",
    themeColor: "#208050",
    bgFrom: "#083020",
    bgTo: "#030E08",
  },
  {
    type: "analytical",
    label: "분석형",
    emoji: "💡",
    tagline: "데이터 기반 투자",
    desc: "재무제표·차트 분석을 통해 논리적으로 종목을 선별하는 퀀트형.",
    themeColor: "#7030D0",
    bgFrom: "#2A0850",
    bgTo: "#080315",
  },
  {
    type: "growth",
    label: "성장형",
    emoji: "🚀",
    tagline: "미래 산업 베팅",
    desc: "AI·반도체·바이오 등 미래 성장 산업에 집중 투자하는 낙관론자.",
    themeColor: "#C08000",
    bgFrom: "#4A2C00",
    bgTo: "#0C0700",
  },
];

export const AVATAR_LIST: AvatarDef[] = [
  ...INVEST_TYPES.map((t) => ({
    id: `${t.type}_m` as AvatarId,
    label: t.label,
    type: t.type,
    emoji: t.emoji,
    tagline: t.tagline,
    desc: t.desc,
    gender: "남" as const,
    themeColor: t.themeColor,
    bgFrom: t.bgFrom,
    bgTo: t.bgTo,
  })),
  ...INVEST_TYPES.map((t) => ({
    id: `${t.type}_f` as AvatarId,
    label: t.label,
    type: t.type,
    emoji: t.emoji,
    tagline: t.tagline,
    desc: t.desc,
    gender: "녀" as const,
    themeColor: t.themeColor,
    bgFrom: t.bgFrom,
    bgTo: t.bgTo,
  })),
];

const LEGACY_MAP: Record<string, AvatarId> = {
  warrior_m: "aggressive_m",
  mage_m:    "analytical_m",
  hunter_m:  "growth_m",
  knight_m:  "balanced_m",
  warrior_f: "aggressive_f",
  mage_f:    "analytical_f",
  hunter_f:  "growth_f",
  knight_f:  "balanced_f",
  male:      "balanced_m",
  female:    "balanced_f",
};

export function getAvatarDef(id: string): AvatarDef {
  const resolved = (LEGACY_MAP[id] ?? id) as AvatarId;
  return AVATAR_LIST.find((a) => a.id === resolved) ?? AVATAR_LIST[1];
}

export function getGenderFromAvatarId(id: string): "male" | "female" {
  const resolved = LEGACY_MAP[id] ?? id;
  return resolved.endsWith("_f") ? "female" : "male";
}

export function getInvestType(id: string): InvestType {
  const parts = id.split("_");
  return (parts[0] as InvestType) ?? "balanced";
}

// ── SVG 포트레이트 ────────────────────────────────────────────────

function AggressiveM() {
  return (
    <svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bg_agm" cx="50%" cy="100%" r="90%">
          <stop offset="0%" stopColor="#8B0000"/>
          <stop offset="100%" stopColor="#0A0505"/>
        </radialGradient>
        <radialGradient id="skin_agm" cx="45%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#F4C08A"/>
          <stop offset="100%" stopColor="#D08050"/>
        </radialGradient>
        <radialGradient id="suit_agm" cx="50%" cy="0%" r="100%">
          <stop offset="0%" stopColor="#700010"/>
          <stop offset="100%" stopColor="#1A0005"/>
        </radialGradient>
      </defs>
      <rect width="100" height="120" fill="url(#bg_agm)" rx="0"/>
      {/* Flames in background */}
      <path d="M5 120 Q15 90, 10 70 Q20 85, 15 65 Q25 80, 18 55" stroke="#FF6020" strokeWidth="2" fill="none" opacity="0.4"/>
      <path d="M85 120 Q80 88, 88 68 Q78 84, 84 62 Q74 78, 82 52" stroke="#FF8020" strokeWidth="2" fill="none" opacity="0.4"/>
      {/* Tactical jacket */}
      <path d="M0 120 L0 80 C12 70, 26 67, 36 72 L50 70 L64 72 C74 67, 88 70, 100 80 L100 120Z" fill="url(#suit_agm)"/>
      <path d="M36 72 Q50 68, 64 72" stroke="#FF3020" strokeWidth="1.5" fill="none"/>
      <line x1="50" y1="70" x2="50" y2="120" stroke="#FF3020" strokeWidth="0.8" opacity="0.5"/>
      {/* Dark spiky hair */}
      <ellipse cx="50" cy="33" rx="27" ry="22" fill="#0F0005"/>
      <path d="M24 30 L16 12 L26 24 L20 8 L32 22 L26 10 L38 22" fill="#0F0005"/>
      <path d="M76 30 L84 12 L74 24 L80 8 L68 22 L74 10 L62 22" fill="#0F0005"/>
      <path d="M50 12 L44 2 L50 14 L56 2 L50 12Z" fill="#0F0005"/>
      {/* Face */}
      <ellipse cx="50" cy="57" rx="22" ry="25" fill="url(#skin_agm)"/>
      {/* Intense eyebrows */}
      <path d="M30 47 Q36 43, 43 47" stroke="#1A0005" strokeWidth="3" fill="none" strokeLinecap="round"/>
      <path d="M57 47 Q64 43, 70 47" stroke="#1A0005" strokeWidth="3" fill="none" strokeLinecap="round"/>
      {/* Fiery eyes */}
      <ellipse cx="37" cy="53" rx="6.5" ry="5.5" fill="#E08060"/>
      <ellipse cx="63" cy="53" rx="6.5" ry="5.5" fill="#E08060"/>
      <ellipse cx="37" cy="53" rx="4.5" ry="4" fill="#CC3010"/>
      <ellipse cx="63" cy="53" rx="4.5" ry="4" fill="#CC3010"/>
      <ellipse cx="37" cy="53" rx="2" ry="2" fill="#080205"/>
      <ellipse cx="63" cy="53" rx="2" ry="2" fill="#080205"/>
      <circle cx="38.5" cy="51.5" r="1.2" fill="white" opacity="0.9"/>
      <circle cx="64.5" cy="51.5" r="1.2" fill="white" opacity="0.9"/>
      {/* Scar */}
      <line x1="60" y1="46" x2="67" y2="57" stroke="#CC3020" strokeWidth="1.2" opacity="0.7"/>
      {/* Nose */}
      <path d="M48 62 Q50 65, 52 62" stroke="#B06040" strokeWidth="1" fill="none" opacity="0.5"/>
      {/* Determined mouth */}
      <path d="M42 71 L58 71" stroke="#A05030" strokeWidth="2" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

function AggressiveF() {
  return (
    <svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bg_agf" cx="50%" cy="100%" r="90%">
          <stop offset="0%" stopColor="#7B0010"/>
          <stop offset="100%" stopColor="#0A0305"/>
        </radialGradient>
        <radialGradient id="skin_agf" cx="45%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#F8D0B0"/>
          <stop offset="100%" stopColor="#E0A880"/>
        </radialGradient>
        <radialGradient id="suit_agf" cx="50%" cy="0%" r="100%">
          <stop offset="0%" stopColor="#600010"/>
          <stop offset="100%" stopColor="#150005"/>
        </radialGradient>
      </defs>
      <rect width="100" height="120" fill="url(#bg_agf)" rx="0"/>
      <path d="M5 120 Q12 92, 8 72 Q16 86, 12 66" stroke="#FF5020" strokeWidth="2.5" fill="none" opacity="0.3"/>
      <path d="M88 120 Q82 90, 87 68 Q79 83, 83 62" stroke="#FF7020" strokeWidth="2" fill="none" opacity="0.3"/>
      {/* Jacket */}
      <path d="M0 120 L0 78 C12 68, 26 65, 36 70 L50 68 L64 70 C74 65, 88 68, 100 78 L100 120Z" fill="url(#suit_agf)"/>
      <path d="M36 70 Q50 66, 64 70" stroke="#FF4020" strokeWidth="1" fill="none"/>
      {/* Short dark hair with red streak */}
      <ellipse cx="50" cy="30" rx="27" ry="21" fill="#0F0008"/>
      <path d="M23 30 C16 25, 14 38, 16 48" stroke="#0F0008" strokeWidth="5" fill="none" strokeLinecap="round"/>
      <path d="M77 30 C84 25, 86 38, 84 48" stroke="#0F0008" strokeWidth="5" fill="none" strokeLinecap="round"/>
      <path d="M65 14 Q70 24, 74 42" stroke="#CC2010" strokeWidth="3" fill="none"/>
      {/* Face */}
      <ellipse cx="50" cy="53" rx="21" ry="23" fill="url(#skin_agf)"/>
      {/* Sharp eyebrows */}
      <path d="M31 44 Q37 41, 43 44" stroke="#0F0008" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <path d="M57 44 Q63 41, 69 44" stroke="#0F0008" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      {/* Fierce eyes */}
      <ellipse cx="37" cy="50" rx="6.5" ry="5" fill="#E8B0A0"/>
      <ellipse cx="63" cy="50" rx="6.5" ry="5" fill="#E8B0A0"/>
      <ellipse cx="37" cy="50" rx="4.5" ry="3.8" fill="#BB2010"/>
      <ellipse cx="63" cy="50" rx="4.5" ry="3.8" fill="#BB2010"/>
      <ellipse cx="37" cy="50" rx="2" ry="2" fill="#080205"/>
      <ellipse cx="63" cy="50" rx="2" ry="2" fill="#080205"/>
      <circle cx="38.5" cy="48.5" r="1.2" fill="white" opacity="0.9"/>
      <circle cx="64.5" cy="48.5" r="1.2" fill="white" opacity="0.9"/>
      {/* Eyelashes */}
      <path d="M31 47 L29 45" stroke="#0F0008" strokeWidth="1.2" fill="none"/>
      <path d="M33 46 L32 44" stroke="#0F0008" strokeWidth="1.2" fill="none"/>
      <path d="M44 47 L46 45" stroke="#0F0008" strokeWidth="1.2" fill="none"/>
      <path d="M57 47 L55 45" stroke="#0F0008" strokeWidth="1.2" fill="none"/>
      <path d="M67 47 L69 45" stroke="#0F0008" strokeWidth="1.2" fill="none"/>
      {/* Nose */}
      <path d="M48 58 Q50 61, 52 58" stroke="#B07050" strokeWidth="0.8" fill="none" opacity="0.5"/>
      {/* Stern mouth */}
      <path d="M42 67 L58 67" stroke="#A06040" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

function BalancedM() {
  return (
    <svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bg_balm" cx="50%" cy="80%" r="85%">
          <stop offset="0%" stopColor="#0A2050"/>
          <stop offset="100%" stopColor="#020510"/>
        </radialGradient>
        <radialGradient id="skin_balm" cx="45%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#F8D8B0"/>
          <stop offset="100%" stopColor="#E0B888"/>
        </radialGradient>
        <radialGradient id="suit_balm" cx="50%" cy="0%" r="100%">
          <stop offset="0%" stopColor="#1A3060"/>
          <stop offset="100%" stopColor="#050820"/>
        </radialGradient>
      </defs>
      <rect width="100" height="120" fill="url(#bg_balm)" rx="0"/>
      {/* Subtle blue glow */}
      <ellipse cx="50" cy="110" rx="45" ry="25" fill="#1040A0" opacity="0.15"/>
      {/* Business suit */}
      <path d="M0 120 L0 76 C12 64, 26 60, 36 65 L50 63 L64 65 C74 60, 88 64, 100 76 L100 120Z" fill="url(#suit_balm)"/>
      <path d="M36 65 Q50 61, 64 65" stroke="#4080D0" strokeWidth="1.5" fill="none"/>
      {/* Tie */}
      <path d="M50 65 L46 80 L50 78 L54 80 L50 65Z" fill="#2060C0"/>
      <path d="M47 65 L50 63 L53 65" stroke="#4080E0" strokeWidth="1" fill="none"/>
      {/* Neat dark hair */}
      <ellipse cx="50" cy="30" rx="27" ry="22" fill="#1A1025"/>
      <ellipse cx="50" cy="22" rx="22" ry="13" fill="#221530"/>
      <path d="M23 28 C18 20, 16 34, 18 46" stroke="#1A1025" strokeWidth="3" fill="none"/>
      <path d="M77 28 C82 20, 84 34, 82 46" stroke="#1A1025" strokeWidth="3" fill="none"/>
      <path d="M36 26 Q50 22, 64 26" stroke="#2A1A35" strokeWidth="3" fill="none"/>
      {/* Face */}
      <ellipse cx="50" cy="57" rx="22" ry="26" fill="url(#skin_balm)"/>
      {/* Confident eyebrows */}
      <path d="M31 46 Q37 43, 44 46" stroke="#4A2808" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M56 46 Q63 43, 69 46" stroke="#4A2808" strokeWidth="2" fill="none" strokeLinecap="round"/>
      {/* Steady blue eyes */}
      <ellipse cx="37" cy="52" rx="6.5" ry="5.5" fill="#C8DCF0"/>
      <ellipse cx="63" cy="52" rx="6.5" ry="5.5" fill="#C8DCF0"/>
      <ellipse cx="37" cy="52" rx="4.5" ry="4" fill="#2060C0"/>
      <ellipse cx="63" cy="52" rx="4.5" ry="4" fill="#2060C0"/>
      <ellipse cx="37" cy="52" rx="2" ry="2" fill="#050810"/>
      <ellipse cx="63" cy="52" rx="2" ry="2" fill="#050810"/>
      <circle cx="38.5" cy="50.5" r="1.2" fill="white" opacity="0.9"/>
      <circle cx="64.5" cy="50.5" r="1.2" fill="white" opacity="0.9"/>
      {/* Nose */}
      <path d="M48 62 Q50 65, 52 62" stroke="#C09060" strokeWidth="0.8" fill="none" opacity="0.5"/>
      {/* Confident smile */}
      <path d="M42 71 Q50 76, 58 71" stroke="#B07050" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

function BalancedF() {
  return (
    <svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bg_balf" cx="50%" cy="80%" r="85%">
          <stop offset="0%" stopColor="#081840"/>
          <stop offset="100%" stopColor="#020410"/>
        </radialGradient>
        <radialGradient id="skin_balf" cx="45%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#FCDCC0"/>
          <stop offset="100%" stopColor="#E0B890"/>
        </radialGradient>
        <radialGradient id="suit_balf" cx="50%" cy="0%" r="100%">
          <stop offset="0%" stopColor="#142850"/>
          <stop offset="100%" stopColor="#040618"/>
        </radialGradient>
      </defs>
      <rect width="100" height="120" fill="url(#bg_balf)" rx="0"/>
      <ellipse cx="50" cy="112" rx="45" ry="22" fill="#1040A0" opacity="0.12"/>
      {/* Blazer */}
      <path d="M0 120 L0 76 C12 65, 26 61, 36 66 L50 64 L64 66 C74 61, 88 65, 100 76 L100 120Z" fill="url(#suit_balf)"/>
      <path d="M36 66 Q50 62, 64 66" stroke="#3070C0" strokeWidth="1.5" fill="none"/>
      {/* Scarf/collar detail */}
      <path d="M44 64 Q50 68, 56 64 Q53 72, 50 74 Q47 72, 44 64Z" fill="#2050A0" opacity="0.7"/>
      {/* Professional dark hair in bun */}
      <ellipse cx="50" cy="28" rx="27" ry="21" fill="#1A1525"/>
      <path d="M23 32 C16 26, 14 40, 16 52" stroke="#1A1525" strokeWidth="5" fill="none" strokeLinecap="round"/>
      <path d="M77 32 C84 26, 86 40, 84 52" stroke="#1A1525" strokeWidth="5" fill="none" strokeLinecap="round"/>
      {/* Bun at top */}
      <ellipse cx="50" cy="18" rx="10" ry="8" fill="#221A30"/>
      <ellipse cx="50" cy="16" rx="7" ry="6" fill="#1A1228"/>
      {/* Hair highlight */}
      <path d="M42 22 Q50 18, 58 22" stroke="#3A2848" strokeWidth="2" fill="none" opacity="0.5"/>
      {/* Face */}
      <ellipse cx="50" cy="54" rx="21" ry="24" fill="url(#skin_balf)"/>
      {/* Eyebrows */}
      <path d="M32 45 Q38 42, 43 45" stroke="#3A2008" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      <path d="M57 45 Q62 42, 68 45" stroke="#3A2008" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      {/* Blue eyes */}
      <ellipse cx="37.5" cy="51" rx="6.5" ry="5.5" fill="#C0D8F0"/>
      <ellipse cx="62.5" cy="51" rx="6.5" ry="5.5" fill="#C0D8F0"/>
      <ellipse cx="37.5" cy="51" rx="4.5" ry="4" fill="#1858B8"/>
      <ellipse cx="62.5" cy="51" rx="4.5" ry="4" fill="#1858B8"/>
      <ellipse cx="37.5" cy="51" rx="2" ry="2" fill="#050810"/>
      <ellipse cx="62.5" cy="51" rx="2" ry="2" fill="#050810"/>
      <circle cx="39" cy="49.5" r="1.2" fill="white" opacity="0.9"/>
      <circle cx="64" cy="49.5" r="1.2" fill="white" opacity="0.9"/>
      {/* Eyelashes */}
      <path d="M31 48 L29 46" stroke="#1A1525" strokeWidth="1.2" fill="none"/>
      <path d="M34 47 L32 45" stroke="#1A1525" strokeWidth="1.2" fill="none"/>
      <path d="M44 48 L46 46" stroke="#1A1525" strokeWidth="1.2" fill="none"/>
      <path d="M56 48 L54 46" stroke="#1A1525" strokeWidth="1.2" fill="none"/>
      <path d="M66 48 L68 46" stroke="#1A1525" strokeWidth="1.2" fill="none"/>
      {/* Nose */}
      <path d="M48 59 Q50 62, 52 59" stroke="#C09070" strokeWidth="0.8" fill="none" opacity="0.4"/>
      {/* Warm smile */}
      <path d="M42 68 Q50 73, 58 68" stroke="#B07050" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

function DefensiveM() {
  return (
    <svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bg_defm" cx="50%" cy="80%" r="85%">
          <stop offset="0%" stopColor="#083020"/>
          <stop offset="100%" stopColor="#020A06"/>
        </radialGradient>
        <radialGradient id="skin_defm" cx="45%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#F8E0C8"/>
          <stop offset="100%" stopColor="#D8C0A0"/>
        </radialGradient>
        <radialGradient id="vest_defm" cx="50%" cy="0%" r="100%">
          <stop offset="0%" stopColor="#1A5030"/>
          <stop offset="100%" stopColor="#060F08"/>
        </radialGradient>
      </defs>
      <rect width="100" height="120" fill="url(#bg_defm)" rx="0"/>
      <ellipse cx="50" cy="110" rx="45" ry="25" fill="#208050" opacity="0.12"/>
      {/* Vest */}
      <path d="M0 120 L0 78 C12 66, 26 63, 36 68 L50 66 L64 68 C74 63, 88 66, 100 78 L100 120Z" fill="url(#vest_defm)"/>
      <path d="M36 68 Q50 64, 64 68" stroke="#40C080" strokeWidth="1.5" fill="none"/>
      {/* Buttons on vest */}
      <circle cx="50" cy="72" r="1.5" fill="#30A060"/>
      <circle cx="50" cy="78" r="1.5" fill="#30A060"/>
      <circle cx="50" cy="84" r="1.5" fill="#30A060"/>
      {/* Silver-gray hair (wise) */}
      <ellipse cx="50" cy="32" rx="27" ry="22" fill="#808898"/>
      <ellipse cx="50" cy="24" rx="22" ry="13" fill="#8890A0"/>
      <path d="M23 30 C18 22, 16 36, 18 48" stroke="#708090" strokeWidth="3" fill="none"/>
      <path d="M77 30 C82 22, 84 36, 82 48" stroke="#708090" strokeWidth="3" fill="none"/>
      {/* Neat part */}
      <path d="M36 26 Q50 22, 64 26" stroke="#9098A8" strokeWidth="2.5" fill="none"/>
      {/* Glasses */}
      <rect x="27" y="50" width="16" height="10" rx="5" fill="none" stroke="#A0B0B8" strokeWidth="1.5"/>
      <rect x="57" y="50" width="16" height="10" rx="5" fill="none" stroke="#A0B0B8" strokeWidth="1.5"/>
      <line x1="43" y1="55" x2="57" y2="55" stroke="#A0B0B8" strokeWidth="1.5"/>
      <line x1="27" y1="55" x2="20" y2="53" stroke="#A0B0B8" strokeWidth="1.5"/>
      <line x1="73" y1="55" x2="80" y2="53" stroke="#A0B0B8" strokeWidth="1.5"/>
      {/* Face */}
      <ellipse cx="50" cy="57" rx="22" ry="25" fill="url(#skin_defm)"/>
      {/* Eyebrows */}
      <path d="M32 46 Q38 43, 43 46" stroke="#505858" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M57 46 Q63 43, 69 46" stroke="#505858" strokeWidth="2" fill="none" strokeLinecap="round"/>
      {/* Warm green eyes */}
      <ellipse cx="35" cy="55" rx="5" ry="4.5" fill="#C8E0C8"/>
      <ellipse cx="65" cy="55" rx="5" ry="4.5" fill="#C8E0C8"/>
      <ellipse cx="35" cy="55" rx="3.5" ry="3.2" fill="#208050"/>
      <ellipse cx="65" cy="55" rx="3.5" ry="3.2" fill="#208050"/>
      <ellipse cx="35" cy="55" rx="1.8" ry="1.8" fill="#050A06"/>
      <ellipse cx="65" cy="55" rx="1.8" ry="1.8" fill="#050A06"/>
      <circle cx="36.2" cy="53.8" r="1" fill="white" opacity="0.9"/>
      <circle cx="66.2" cy="53.8" r="1" fill="white" opacity="0.9"/>
      {/* Nose */}
      <path d="M48 63 Q50 66, 52 63" stroke="#B0A080" strokeWidth="0.8" fill="none" opacity="0.5"/>
      {/* Warm wise smile */}
      <path d="M41 72 Q50 78, 59 72" stroke="#A08060" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      {/* Light wrinkle lines */}
      <path d="M29 50 C27 47, 26 44" stroke="#C0B090" strokeWidth="0.7" fill="none" opacity="0.4"/>
      <path d="M71 50 C73 47, 74 44" stroke="#C0B090" strokeWidth="0.7" fill="none" opacity="0.4"/>
    </svg>
  );
}

function DefensiveF() {
  return (
    <svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bg_deff" cx="50%" cy="80%" r="85%">
          <stop offset="0%" stopColor="#062818"/>
          <stop offset="100%" stopColor="#010806"/>
        </radialGradient>
        <radialGradient id="skin_deff" cx="45%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#FCE4CC"/>
          <stop offset="100%" stopColor="#D8C0A0"/>
        </radialGradient>
        <radialGradient id="cardigan_deff" cx="50%" cy="0%" r="100%">
          <stop offset="0%" stopColor="#1A5030"/>
          <stop offset="100%" stopColor="#060E08"/>
        </radialGradient>
      </defs>
      <rect width="100" height="120" fill="url(#bg_deff)" rx="0"/>
      {/* Cardigan */}
      <path d="M0 120 L0 76 C12 65, 26 61, 36 66 L50 64 L64 66 C74 61, 88 65, 100 76 L100 120Z" fill="url(#cardigan_deff)"/>
      <path d="M36 66 Q50 62, 64 66" stroke="#30A060" strokeWidth="1" fill="none"/>
      {/* Silver-gray bun */}
      <ellipse cx="50" cy="28" rx="27" ry="20" fill="#8090A0"/>
      <path d="M23 30 C16 24, 14 38, 16 52" stroke="#8090A0" strokeWidth="5" fill="none" strokeLinecap="round"/>
      <path d="M77 30 C84 24, 86 38, 84 52" stroke="#8090A0" strokeWidth="5" fill="none" strokeLinecap="round"/>
      {/* Soft bun */}
      <ellipse cx="50" cy="18" rx="11" ry="9" fill="#8898A8"/>
      <path d="M42 22 Q50 18, 58 22" stroke="#98A8B8" strokeWidth="2" fill="none" opacity="0.5"/>
      {/* Glasses */}
      <rect x="27" y="49" width="16" height="10" rx="5" fill="none" stroke="#98A8B8" strokeWidth="1.5"/>
      <rect x="57" y="49" width="16" height="10" rx="5" fill="none" stroke="#98A8B8" strokeWidth="1.5"/>
      <line x1="43" y1="54" x2="57" y2="54" stroke="#98A8B8" strokeWidth="1.5"/>
      <line x1="27" y1="54" x2="20" y2="52" stroke="#98A8B8" strokeWidth="1.5"/>
      <line x1="73" y1="54" x2="80" y2="52" stroke="#98A8B8" strokeWidth="1.5"/>
      {/* Face */}
      <ellipse cx="50" cy="52" rx="21" ry="23" fill="url(#skin_deff)"/>
      {/* Eyebrows */}
      <path d="M32 44 Q38 41, 43 44" stroke="#605050" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
      <path d="M57 44 Q62 41, 68 44" stroke="#605050" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
      {/* Warm eyes */}
      <ellipse cx="35" cy="53" rx="5" ry="4.5" fill="#D0E8D0"/>
      <ellipse cx="65" cy="53" rx="5" ry="4.5" fill="#D0E8D0"/>
      <ellipse cx="35" cy="53" rx="3.5" ry="3.2" fill="#188048"/>
      <ellipse cx="65" cy="53" rx="3.5" ry="3.2" fill="#188048"/>
      <ellipse cx="35" cy="53" rx="1.8" ry="1.8" fill="#050A06"/>
      <ellipse cx="65" cy="53" rx="1.8" ry="1.8" fill="#050A06"/>
      <circle cx="36.2" cy="51.8" r="1" fill="white" opacity="0.9"/>
      <circle cx="66.2" cy="51.8" r="1" fill="white" opacity="0.9"/>
      {/* Eyelashes */}
      <path d="M30 50 L28 48" stroke="#505050" strokeWidth="1" fill="none"/>
      <path d="M33 49 L31 47" stroke="#505050" strokeWidth="1" fill="none"/>
      <path d="M41 50 L43 48" stroke="#505050" strokeWidth="1" fill="none"/>
      <path d="M59 50 L57 48" stroke="#505050" strokeWidth="1" fill="none"/>
      <path d="M70 50 L72 48" stroke="#505050" strokeWidth="1" fill="none"/>
      {/* Nose */}
      <path d="M48 60 Q50 63, 52 60" stroke="#B0A080" strokeWidth="0.7" fill="none" opacity="0.4"/>
      {/* Kind warm smile */}
      <path d="M41 69 Q50 75, 59 69" stroke="#A08060" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      <path d="M30 48 C28 45, 26 42" stroke="#C0B090" strokeWidth="0.7" fill="none" opacity="0.35"/>
    </svg>
  );
}

function AnalyticalM() {
  return (
    <svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bg_anm" cx="50%" cy="80%" r="85%">
          <stop offset="0%" stopColor="#2A0850"/>
          <stop offset="100%" stopColor="#06021A"/>
        </radialGradient>
        <radialGradient id="skin_anm" cx="45%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#F4D0E0"/>
          <stop offset="100%" stopColor="#D0A8B8"/>
        </radialGradient>
        <radialGradient id="hoodie_anm" cx="50%" cy="0%" r="100%">
          <stop offset="0%" stopColor="#3A1060"/>
          <stop offset="100%" stopColor="#100420"/>
        </radialGradient>
        <radialGradient id="glow_anm" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#8040FF" stopOpacity="0.3"/>
          <stop offset="100%" stopColor="#8040FF" stopOpacity="0"/>
        </radialGradient>
      </defs>
      <rect width="100" height="120" fill="url(#bg_anm)" rx="0"/>
      <ellipse cx="50" cy="110" rx="45" ry="25" fill="url(#glow_anm)"/>
      {/* Circuit-like bg lines */}
      <path d="M10 100 L20 90 L20 80 L30 80" stroke="#6020C0" strokeWidth="0.7" fill="none" opacity="0.3"/>
      <path d="M90 100 L80 88 L80 78 L70 78" stroke="#6020C0" strokeWidth="0.7" fill="none" opacity="0.3"/>
      {/* Hoodie */}
      <path d="M0 120 L0 78 C12 66, 26 62, 36 67 L50 65 L64 67 C74 62, 88 66, 100 78 L100 120Z" fill="url(#hoodie_anm)"/>
      <path d="M36 67 Q50 63, 64 67" stroke="#9050FF" strokeWidth="1.5" fill="none"/>
      {/* Hood detail */}
      <path d="M30 70 Q50 65, 70 70" stroke="#5020A0" strokeWidth="2" fill="none"/>
      {/* Dark with hint of purple hair */}
      <ellipse cx="50" cy="30" rx="28" ry="22" fill="#15052A"/>
      <path d="M22 30 C16 22, 14 35, 16 48" stroke="#15052A" strokeWidth="3" fill="none"/>
      <path d="M78 30 C84 22, 86 35, 84 48" stroke="#15052A" strokeWidth="3" fill="none"/>
      <path d="M36 24 Q50 20, 64 24" stroke="#200840" strokeWidth="3" fill="none"/>
      {/* Purple streak */}
      <path d="M62 18 Q68 28, 72 44" stroke="#7030D0" strokeWidth="2.5" fill="none"/>
      {/* Face */}
      <ellipse cx="50" cy="57" rx="22" ry="26" fill="url(#skin_anm)"/>
      {/* Smart eyebrows */}
      <path d="M31 46 Q37 43, 44 45" stroke="#3A1060" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      <path d="M56 45 Q63 43, 69 46" stroke="#3A1060" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      {/* Violet analytical eyes */}
      <ellipse cx="37" cy="52" rx="6.5" ry="5.5" fill="#D8C0F0"/>
      <ellipse cx="63" cy="52" rx="6.5" ry="5.5" fill="#D8C0F0"/>
      <ellipse cx="37" cy="52" rx="4.5" ry="4" fill="#7030D0"/>
      <ellipse cx="63" cy="52" rx="4.5" ry="4" fill="#7030D0"/>
      <ellipse cx="37" cy="52" rx="2" ry="2" fill="#08021A"/>
      <ellipse cx="63" cy="52" rx="2" ry="2" fill="#08021A"/>
      <circle cx="38.5" cy="50.5" r="1.2" fill="white" opacity="0.95"/>
      <circle cx="64.5" cy="50.5" r="1.2" fill="white" opacity="0.95"/>
      {/* Glow effect */}
      <ellipse cx="37" cy="52" rx="5.5" ry="5" fill="#9050FF" opacity="0.18"/>
      <ellipse cx="63" cy="52" rx="5.5" ry="5" fill="#9050FF" opacity="0.18"/>
      {/* Nose */}
      <path d="M48 62 Q50 65, 52 62" stroke="#C090B0" strokeWidth="0.8" fill="none" opacity="0.5"/>
      {/* Focused slight smile */}
      <path d="M43 71 Q50 75, 57 71" stroke="#A07090" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

function AnalyticalF() {
  return (
    <svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bg_anf" cx="50%" cy="80%" r="85%">
          <stop offset="0%" stopColor="#200640"/>
          <stop offset="100%" stopColor="#060215"/>
        </radialGradient>
        <radialGradient id="skin_anf" cx="45%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#F8E0F0"/>
          <stop offset="100%" stopColor="#D8B0D0"/>
        </radialGradient>
        <radialGradient id="jacket_anf" cx="50%" cy="0%" r="100%">
          <stop offset="0%" stopColor="#3A0860"/>
          <stop offset="100%" stopColor="#0E0418"/>
        </radialGradient>
        <radialGradient id="glow_anf" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#C060FF" stopOpacity="0.25"/>
          <stop offset="100%" stopColor="#C060FF" stopOpacity="0"/>
        </radialGradient>
      </defs>
      <rect width="100" height="120" fill="url(#bg_anf)" rx="0"/>
      <ellipse cx="50" cy="110" rx="45" ry="25" fill="url(#glow_anf)"/>
      {/* Jacket */}
      <path d="M0 120 L0 76 C12 65, 26 61, 36 66 L50 64 L64 66 C74 61, 88 65, 100 76 L100 120Z" fill="url(#jacket_anf)"/>
      <path d="M36 66 Q50 62, 64 66" stroke="#A060FF" strokeWidth="1.5" fill="none"/>
      {/* Dark flowing hair with purple highlights */}
      <ellipse cx="50" cy="28" rx="29" ry="22" fill="#180528"/>
      <path d="M21 34 C14 48, 12 65, 14 78" stroke="#180528" strokeWidth="8" fill="none" strokeLinecap="round"/>
      <path d="M79 34 C86 48, 88 65, 86 78" stroke="#180528" strokeWidth="8" fill="none" strokeLinecap="round"/>
      <path d="M22 38 C16 52, 14 68, 16 80" stroke="#7030D0" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.6"/>
      <path d="M78 38 C84 52, 86 68, 84 80" stroke="#7030D0" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.6"/>
      <path d="M28 18 L20 4 L32 14 L26 1 L38 12" fill="#180528"/>
      <path d="M72 18 L80 4 L68 14 L74 1 L62 12" fill="#180528"/>
      <ellipse cx="50" cy="16" rx="20" ry="11" fill="#200838"/>
      {/* Face */}
      <ellipse cx="50" cy="52" rx="21" ry="24" fill="url(#skin_anf)"/>
      {/* Eyebrows */}
      <path d="M32 43 Q38 40, 44 43" stroke="#400060" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M56 43 Q62 40, 68 43" stroke="#400060" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      {/* Deep violet eyes */}
      <ellipse cx="38" cy="49" rx="6.5" ry="5.5" fill="#E0C0F8"/>
      <ellipse cx="62" cy="49" rx="6.5" ry="5.5" fill="#E0C0F8"/>
      <ellipse cx="38" cy="49" rx="4.5" ry="4" fill="#6020C0"/>
      <ellipse cx="62" cy="49" rx="4.5" ry="4" fill="#6020C0"/>
      <ellipse cx="38" cy="49" rx="2.5" ry="2.5" fill="#080215"/>
      <ellipse cx="62" cy="49" rx="2.5" ry="2.5" fill="#080215"/>
      <circle cx="39.5" cy="47.5" r="1.2" fill="white" opacity="0.95"/>
      <circle cx="63.5" cy="47.5" r="1.2" fill="white" opacity="0.95"/>
      <ellipse cx="38" cy="49" rx="5.5" ry="5" fill="#C060FF" opacity="0.15"/>
      <ellipse cx="62" cy="49" rx="5.5" ry="5" fill="#C060FF" opacity="0.15"/>
      {/* Eyelashes */}
      <path d="M32 46 L30 44" stroke="#400060" strokeWidth="1" fill="none"/>
      <path d="M35 45 L33 43" stroke="#400060" strokeWidth="1" fill="none"/>
      <path d="M45 46 L47 44" stroke="#400060" strokeWidth="1" fill="none"/>
      <path d="M55 46 L53 44" stroke="#400060" strokeWidth="1" fill="none"/>
      <path d="M66 46 L68 44" stroke="#400060" strokeWidth="1" fill="none"/>
      {/* Nose */}
      <path d="M48 57 Q50 60, 52 57" stroke="#C090C0" strokeWidth="0.8" fill="none" opacity="0.4"/>
      {/* Thoughtful slight smile */}
      <path d="M43 65 Q50 70, 57 65" stroke="#B070B0" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

function GrowthM() {
  return (
    <svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bg_grm" cx="50%" cy="80%" r="85%">
          <stop offset="0%" stopColor="#4A2C00"/>
          <stop offset="100%" stopColor="#0C0700"/>
        </radialGradient>
        <radialGradient id="skin_grm" cx="45%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#FCDCB0"/>
          <stop offset="100%" stopColor="#DEB880"/>
        </radialGradient>
        <radialGradient id="jacket_grm" cx="50%" cy="0%" r="100%">
          <stop offset="0%" stopColor="#503000"/>
          <stop offset="100%" stopColor="#0C0700"/>
        </radialGradient>
        <radialGradient id="glow_grm" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFD700" stopOpacity="0.3"/>
          <stop offset="100%" stopColor="#FFD700" stopOpacity="0"/>
        </radialGradient>
      </defs>
      <rect width="100" height="120" fill="url(#bg_grm)" rx="0"/>
      <ellipse cx="50" cy="110" rx="45" ry="28" fill="url(#glow_grm)"/>
      {/* Rising line bg accent */}
      <path d="M10 100 L30 80 L50 60 L70 70 L90 45" stroke="#C09010" strokeWidth="1.2" fill="none" opacity="0.25"/>
      {/* Casual jacket */}
      <path d="M0 120 L0 76 C12 64, 26 60, 36 65 L50 63 L64 65 C74 60, 88 64, 100 76 L100 120Z" fill="url(#jacket_grm)"/>
      <path d="M36 65 Q50 61, 64 65" stroke="#E0A010" strokeWidth="1.5" fill="none"/>
      <path d="M44 63 Q50 67, 56 63 Q53 74, 50 76 Q47 74, 44 63Z" fill="#C09010" opacity="0.6"/>
      {/* Golden-tipped dark hair (optimistic) */}
      <ellipse cx="50" cy="30" rx="27" ry="22" fill="#2A1805"/>
      <path d="M22 28 L14 12 L24 22 L18 8 L30 20 L24 10 L36 20" fill="#2A1805"/>
      <path d="M78 28 L86 12 L76 22 L82 8 L70 20 L76 10 L64 20" fill="#2A1805"/>
      <path d="M50 11 L44 2 L50 13 L56 2 L50 11Z" fill="#2A1805"/>
      {/* Gold tips */}
      <path d="M14 12 L16 16" stroke="#C09010" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M86 12 L84 16" stroke="#C09010" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M44 2 L46 6" stroke="#C09010" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M56 2 L54 6" stroke="#C09010" strokeWidth="2" fill="none" strokeLinecap="round"/>
      {/* Face */}
      <ellipse cx="50" cy="57" rx="22" ry="26" fill="url(#skin_grm)"/>
      {/* Energetic eyebrows (slightly raised) */}
      <path d="M31 46 Q37 42, 43 45" stroke="#302010" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M57 45 Q63 42, 69 46" stroke="#302010" strokeWidth="2" fill="none" strokeLinecap="round"/>
      {/* Bright golden-hazel eyes */}
      <ellipse cx="37" cy="52" rx="6.5" ry="5.5" fill="#F0E0A0"/>
      <ellipse cx="63" cy="52" rx="6.5" ry="5.5" fill="#F0E0A0"/>
      <ellipse cx="37" cy="52" rx="4.5" ry="4" fill="#C09010"/>
      <ellipse cx="63" cy="52" rx="4.5" ry="4" fill="#C09010"/>
      <ellipse cx="37" cy="52" rx="2" ry="2" fill="#0A0700"/>
      <ellipse cx="63" cy="52" rx="2" ry="2" fill="#0A0700"/>
      <circle cx="38.5" cy="50.5" r="1.2" fill="white" opacity="0.9"/>
      <circle cx="64.5" cy="50.5" r="1.2" fill="white" opacity="0.9"/>
      {/* Nose */}
      <path d="M48 62 Q50 65, 52 62" stroke="#C09860" strokeWidth="0.8" fill="none" opacity="0.5"/>
      {/* Big bright smile */}
      <path d="M40 71 Q50 79, 60 71" stroke="#B07840" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M42 72 Q50 78, 58 72" stroke="#D09050" strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.4"/>
    </svg>
  );
}

function GrowthF() {
  return (
    <svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bg_grf" cx="50%" cy="80%" r="85%">
          <stop offset="0%" stopColor="#3A2200"/>
          <stop offset="100%" stopColor="#0A0600"/>
        </radialGradient>
        <radialGradient id="skin_grf" cx="45%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#FCDEC0"/>
          <stop offset="100%" stopColor="#E0BA90"/>
        </radialGradient>
        <radialGradient id="jacket_grf" cx="50%" cy="0%" r="100%">
          <stop offset="0%" stopColor="#402800"/>
          <stop offset="100%" stopColor="#0A0600"/>
        </radialGradient>
        <radialGradient id="glow_grf" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFD000" stopOpacity="0.25"/>
          <stop offset="100%" stopColor="#FFD000" stopOpacity="0"/>
        </radialGradient>
      </defs>
      <rect width="100" height="120" fill="url(#bg_grf)" rx="0"/>
      <ellipse cx="50" cy="110" rx="45" ry="28" fill="url(#glow_grf)"/>
      <path d="M10 100 L30 78 L50 58 L72 68 L90 44" stroke="#B08010" strokeWidth="1.2" fill="none" opacity="0.2"/>
      {/* Casual jacket */}
      <path d="M0 120 L0 74 C12 62, 26 58, 36 63 L50 61 L64 63 C74 58, 88 62, 100 74 L100 120Z" fill="url(#jacket_grf)"/>
      <path d="M36 63 Q50 59, 64 63" stroke="#D0A010" strokeWidth="1.5" fill="none"/>
      {/* Golden flowing hair */}
      <ellipse cx="50" cy="28" rx="29" ry="22" fill="#2A1600"/>
      <path d="M21 32 C14 46, 12 62, 14 76" stroke="#2A1600" strokeWidth="9" fill="none" strokeLinecap="round"/>
      <path d="M79 32 C86 46, 88 62, 86 76" stroke="#2A1600" strokeWidth="9" fill="none" strokeLinecap="round"/>
      {/* Golden highlights */}
      <path d="M22 36 C16 50, 14 66, 16 78" stroke="#C09010" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.6"/>
      <path d="M78 36 C84 50, 86 66, 84 78" stroke="#C09010" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.6"/>
      <path d="M30 18 L24 4 L36 14 L30 2 L42 13" fill="#2A1600"/>
      <path d="M70 18 L76 4 L64 14 L70 2 L58 13" fill="#2A1600"/>
      <ellipse cx="50" cy="16" rx="20" ry="11" fill="#341E00"/>
      {/* Gold streak */}
      <path d="M64 12 Q68 22, 70 38" stroke="#D0A010" strokeWidth="3" fill="none"/>
      {/* Face */}
      <ellipse cx="50" cy="52" rx="21" ry="24" fill="url(#skin_grf)"/>
      {/* Eyebrows */}
      <path d="M32 43 Q38 40, 43 42" stroke="#2A1600" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      <path d="M57 42 Q62 40, 68 43" stroke="#2A1600" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      {/* Bright golden eyes */}
      <ellipse cx="37.5" cy="49" rx="6.5" ry="5.5" fill="#F8E8A0"/>
      <ellipse cx="62.5" cy="49" rx="6.5" ry="5.5" fill="#F8E8A0"/>
      <ellipse cx="37.5" cy="49" rx="4.5" ry="4" fill="#B88010"/>
      <ellipse cx="62.5" cy="49" rx="4.5" ry="4" fill="#B88010"/>
      <ellipse cx="37.5" cy="49" rx="2" ry="2" fill="#0A0700"/>
      <ellipse cx="62.5" cy="49" rx="2" ry="2" fill="#0A0700"/>
      <circle cx="39" cy="47.5" r="1.2" fill="white" opacity="0.9"/>
      <circle cx="64" cy="47.5" r="1.2" fill="white" opacity="0.9"/>
      {/* Eyelashes */}
      <path d="M31 46 L29 44" stroke="#2A1600" strokeWidth="1.2" fill="none"/>
      <path d="M34 45 L32 43" stroke="#2A1600" strokeWidth="1.2" fill="none"/>
      <path d="M44 46 L46 44" stroke="#2A1600" strokeWidth="1.2" fill="none"/>
      <path d="M56 46 L54 44" stroke="#2A1600" strokeWidth="1.2" fill="none"/>
      <path d="M67 46 L69 44" stroke="#2A1600" strokeWidth="1.2" fill="none"/>
      {/* Nose */}
      <path d="M48 57 Q50 60, 52 57" stroke="#C09860" strokeWidth="0.8" fill="none" opacity="0.4"/>
      {/* Big sunny smile */}
      <path d="M40 67 Q50 75, 60 67" stroke="#B07838" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M42 68 Q50 74, 58 68" stroke="#D09858" strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.4"/>
    </svg>
  );
}

// ── 컴포넌트 맵 ─────────────────────────────────────────────────
const PORTRAIT_MAP: Record<AvatarId, React.FC> = {
  aggressive_m: AggressiveM,
  aggressive_f: AggressiveF,
  balanced_m:   BalancedM,
  balanced_f:   BalancedF,
  defensive_m:  DefensiveM,
  defensive_f:  DefensiveF,
  analytical_m: AnalyticalM,
  analytical_f: AnalyticalF,
  growth_m:     GrowthM,
  growth_f:     GrowthF,
};

interface GameAvatarProps {
  avatarId: AvatarId | string;
  size?: number;
  rounded?: string;
  className?: string;
}

export function GameAvatar({ avatarId, size = 64, rounded = "rounded-xl", className }: GameAvatarProps) {
  const def = getAvatarDef(avatarId);
  const Portrait = PORTRAIT_MAP[def.id] ?? BalancedM;

  return (
    <div
      className={`flex-shrink-0 overflow-hidden ${rounded} ${className ?? ""}`}
      style={{ width: size, height: size }}
    >
      <Portrait />
    </div>
  );
}
