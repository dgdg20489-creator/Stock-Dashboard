// ── 게임 스타일 캐릭터 아바타 포트레이트 ──────────────────────────

export type AvatarId =
  | "warrior_m" | "mage_m" | "hunter_m" | "knight_m"
  | "warrior_f" | "mage_f" | "hunter_f" | "knight_f";

export interface AvatarDef {
  id: AvatarId;
  label: string;
  class: string;
  gender: "남" | "녀";
}

export const AVATAR_LIST: AvatarDef[] = [
  { id: "warrior_m", label: "검사", class: "⚔️", gender: "남" },
  { id: "mage_m",    label: "마법사", class: "🔮", gender: "남" },
  { id: "hunter_m",  label: "궁수",  class: "🏹", gender: "남" },
  { id: "knight_m",  label: "기사",  class: "🛡️", gender: "남" },
  { id: "warrior_f", label: "검사", class: "⚔️", gender: "녀" },
  { id: "mage_f",    label: "마법사", class: "🔮", gender: "녀" },
  { id: "hunter_f",  label: "궁수",  class: "🏹", gender: "녀" },
  { id: "knight_f",  label: "기사",  class: "🛡️", gender: "녀" },
];

export function getAvatarDef(id: string): AvatarDef {
  return AVATAR_LIST.find(a => a.id === id)
    ?? (id === "female" ? AVATAR_LIST[4] : AVATAR_LIST[0]);
}

// ── 포트레이트 SVG ────────────────────────────────────────────────
function WarriorM() {
  return (
    <svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bg_wm" cx="50%" cy="100%" r="90%">
          <stop offset="0%" stopColor="#8B0000"/>
          <stop offset="60%" stopColor="#1A0A0A"/>
          <stop offset="100%" stopColor="#0A0505"/>
        </radialGradient>
        <radialGradient id="skin_wm" cx="45%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#F4C89A"/>
          <stop offset="100%" stopColor="#D4956A"/>
        </radialGradient>
        <radialGradient id="armor_wm" cx="50%" cy="0%" r="100%">
          <stop offset="0%" stopColor="#8B2020"/>
          <stop offset="100%" stopColor="#3A0808"/>
        </radialGradient>
      </defs>
      <rect width="100" height="120" fill="url(#bg_wm)" rx="0"/>
      {/* Armor/shoulders */}
      <path d="M0 120 L0 85 C10 75, 22 70, 32 72 L38 78 L50 76 L62 78 L68 72 C78 70, 90 75, 100 85 L100 120Z" fill="url(#armor_wm)"/>
      <path d="M0 90 C10 80, 22 76, 32 78" stroke="#C04040" strokeWidth="1.5" fill="none" opacity="0.6"/>
      <path d="M100 90 C90 80, 78 76, 68 78" stroke="#C04040" strokeWidth="1.5" fill="none" opacity="0.6"/>
      {/* Gold trim */}
      <path d="M38 78 Q50 74, 62 78" stroke="#D4A020" strokeWidth="1" fill="none"/>
      {/* Hair (dark, short, spiky) */}
      <ellipse cx="50" cy="35" rx="28" ry="24" fill="#0F0F1E"/>
      <path d="M22 32 L14 18 L24 28 L18 12 L30 24 L26 14 L38 22" fill="#0F0F1E"/>
      <path d="M78 32 L86 18 L76 28 L82 12 L70 24 L74 14 L62 22" fill="#0F0F1E"/>
      <path d="M50 12 L45 4 L50 15 L55 4 L50 12Z" fill="#0F0F1E"/>
      {/* Face */}
      <ellipse cx="50" cy="58" rx="22" ry="26" fill="url(#skin_wm)"/>
      {/* Shadow under chin */}
      <ellipse cx="50" cy="78" rx="14" ry="6" fill="#C07040" opacity="0.3"/>
      {/* Eyebrows (stern, thick) */}
      <path d="M31 48 Q37 45, 43 48" stroke="#2A1A0A" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <path d="M57 48 Q63 45, 69 48" stroke="#2A1A0A" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      {/* Eyes */}
      <ellipse cx="37" cy="54" rx="6" ry="5" fill="#C8D8E8"/>
      <ellipse cx="63" cy="54" rx="6" ry="5" fill="#C8D8E8"/>
      <ellipse cx="37" cy="54" rx="4" ry="4" fill="#3060A0"/>
      <ellipse cx="63" cy="54" rx="4" ry="4" fill="#3060A0"/>
      <ellipse cx="37" cy="54" rx="2" ry="2" fill="#050810"/>
      <ellipse cx="63" cy="54" rx="2" ry="2" fill="#050810"/>
      <circle cx="38.5" cy="52.5" r="1" fill="white" opacity="0.9"/>
      <circle cx="64.5" cy="52.5" r="1" fill="white" opacity="0.9"/>
      {/* Nose */}
      <path d="M48 62 Q50 66, 52 62" stroke="#C07040" strokeWidth="1" fill="none" opacity="0.5"/>
      {/* Mouth (stern) */}
      <path d="M43 70 Q50 73, 57 70" stroke="#A06040" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      {/* Scar */}
      <line x1="60" y1="48" x2="67" y2="58" stroke="#C07070" strokeWidth="1" opacity="0.6"/>
    </svg>
  );
}

function MageM() {
  return (
    <svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bg_mm" cx="50%" cy="60%" r="80%">
          <stop offset="0%" stopColor="#2A0A4A"/>
          <stop offset="50%" stopColor="#100820"/>
          <stop offset="100%" stopColor="#050210"/>
        </radialGradient>
        <radialGradient id="skin_mm" cx="45%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#E8D0C0"/>
          <stop offset="100%" stopColor="#C8A890"/>
        </radialGradient>
        <radialGradient id="armor_mm" cx="50%" cy="0%" r="100%">
          <stop offset="0%" stopColor="#2A1A5A"/>
          <stop offset="100%" stopColor="#0A0520"/>
        </radialGradient>
        <radialGradient id="glow_mm" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#8040FF" stopOpacity="0.4"/>
          <stop offset="100%" stopColor="#8040FF" stopOpacity="0"/>
        </radialGradient>
      </defs>
      <rect width="100" height="120" fill="url(#bg_mm)" rx="0"/>
      <ellipse cx="50" cy="100" rx="45" ry="30" fill="url(#glow_mm)"/>
      {/* Robe/armor */}
      <path d="M0 120 L0 82 C15 72, 30 70, 40 74 L50 72 L60 74 C70 70, 85 72, 100 82 L100 120Z" fill="url(#armor_mm)"/>
      <path d="M35 74 Q50 70, 65 74" stroke="#6030C0" strokeWidth="1.5" fill="none"/>
      {/* Crystal orb hint */}
      <circle cx="50" cy="78" r="5" fill="#4020A0" stroke="#8050FF" strokeWidth="1" opacity="0.8"/>
      <circle cx="50" cy="78" r="3" fill="#8060FF" opacity="0.6"/>
      {/* Silver/white hair (swept, long at top) */}
      <ellipse cx="50" cy="30" rx="30" ry="26" fill="#D8E0F0"/>
      <path d="M20 28 C10 20, 8 38, 15 50 C12 40, 14 28, 20 28Z" fill="#C8D8E8"/>
      <path d="M80 28 C90 20, 92 38, 85 50 C88 40, 86 28, 80 28Z" fill="#C8D8E8"/>
      {/* Long strands */}
      <path d="M28 50 C22 60, 20 72, 22 80" stroke="#C8D8E8" strokeWidth="3" fill="none"/>
      <path d="M72 50 C78 60, 80 72, 78 80" stroke="#C8D8E8" strokeWidth="3" fill="none"/>
      <path d="M20 30 L12 10 L22 22 L18 5 L28 18" fill="#D0D8E8"/>
      <path d="M80 30 L88 10 L78 22 L82 5 L72 18" fill="#D0D8E8"/>
      {/* Face */}
      <ellipse cx="50" cy="56" rx="22" ry="25" fill="url(#skin_mm)"/>
      {/* Eyebrows */}
      <path d="M32 46 Q38 43, 43 46" stroke="#706080" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M57 46 Q62 43, 68 46" stroke="#706080" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      {/* Eyes (purple, mystical) */}
      <ellipse cx="37" cy="52" rx="6" ry="5.5" fill="#E0D0F0"/>
      <ellipse cx="63" cy="52" rx="6" ry="5.5" fill="#E0D0F0"/>
      <ellipse cx="37" cy="52" rx="4" ry="4" fill="#7030C0"/>
      <ellipse cx="63" cy="52" rx="4" ry="4" fill="#7030C0"/>
      <ellipse cx="37" cy="52" rx="2" ry="2" fill="#100820"/>
      <ellipse cx="63" cy="52" rx="2" ry="2" fill="#100820"/>
      <circle cx="38.5" cy="50.5" r="1" fill="white" opacity="0.9"/>
      <circle cx="64.5" cy="50.5" r="1" fill="white" opacity="0.9"/>
      {/* Glowing eye effect */}
      <ellipse cx="37" cy="52" rx="5" ry="4.5" fill="#8040FF" opacity="0.2"/>
      <ellipse cx="63" cy="52" rx="5" ry="4.5" fill="#8040FF" opacity="0.2"/>
      {/* Nose */}
      <path d="M48 61 Q50 64, 52 61" stroke="#A08090" strokeWidth="0.8" fill="none" opacity="0.5"/>
      {/* Mouth */}
      <path d="M43 70 Q50 74, 57 70" stroke="#9070A0" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

function HunterM() {
  return (
    <svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bg_hm" cx="50%" cy="80%" r="80%">
          <stop offset="0%" stopColor="#1A3010"/>
          <stop offset="60%" stopColor="#0A1808"/>
          <stop offset="100%" stopColor="#050A04"/>
        </radialGradient>
        <radialGradient id="skin_hm" cx="45%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#E8B888"/>
          <stop offset="100%" stopColor="#C08858"/>
        </radialGradient>
      </defs>
      <rect width="100" height="120" fill="url(#bg_hm)" rx="0"/>
      {/* Cloak/armor */}
      <path d="M0 120 L0 80 C12 68, 28 65, 38 70 L50 68 L62 70 C72 65, 88 68, 100 80 L100 120Z" fill="#2A4018"/>
      <path d="M30 70 Q50 65, 70 70" stroke="#4A7030" strokeWidth="1" fill="none"/>
      {/* Brown messy hair */}
      <ellipse cx="50" cy="32" rx="27" ry="23" fill="#5C3010"/>
      <path d="M23 30 L15 15 L26 25 L20 10 L32 22" fill="#5C3010"/>
      <path d="M77 30 L85 15 L74 25 L80 10 L68 22" fill="#5C3010"/>
      <path d="M50 12 Q45 6 40 10 Q48 8 50 12Z" fill="#6C3818"/>
      <path d="M50 12 Q55 6 60 10 Q52 8 50 12Z" fill="#6C3818"/>
      {/* Loose strand over forehead */}
      <path d="M38 26 Q44 30, 40 36" stroke="#7C4820" strokeWidth="2.5" fill="none"/>
      {/* Face */}
      <ellipse cx="50" cy="56" rx="21" ry="25" fill="url(#skin_hm)"/>
      {/* Tan skin accent */}
      <ellipse cx="50" cy="50" rx="18" ry="8" fill="#D09868" opacity="0.2"/>
      {/* Eyebrows (raised, energetic) */}
      <path d="M32 45 Q37 42, 42 45" stroke="#3A1A08" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M58 45 Q63 42, 68 45" stroke="#3A1A08" strokeWidth="2" fill="none" strokeLinecap="round"/>
      {/* Eyes (bright green) */}
      <ellipse cx="37" cy="51" rx="6" ry="5" fill="#C8E0C0"/>
      <ellipse cx="63" cy="51" rx="6" ry="5" fill="#C8E0C0"/>
      <ellipse cx="37" cy="51" rx="4" ry="4" fill="#2A8040"/>
      <ellipse cx="63" cy="51" rx="4" ry="4" fill="#2A8040"/>
      <ellipse cx="37" cy="51" rx="2" ry="2" fill="#0A1808"/>
      <ellipse cx="63" cy="51" rx="2" ry="2" fill="#0A1808"/>
      <circle cx="38.5" cy="49.5" r="1" fill="white" opacity="0.9"/>
      <circle cx="64.5" cy="49.5" r="1" fill="white" opacity="0.9"/>
      {/* Nose */}
      <path d="M48 60 Q50 63, 52 60" stroke="#A07848" strokeWidth="0.8" fill="none" opacity="0.5"/>
      {/* Mouth (slight grin) */}
      <path d="M43 69 Q50 74, 57 70" stroke="#906040" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      {/* Stubble hint */}
      <ellipse cx="50" cy="73" rx="12" ry="4" fill="#5C3010" opacity="0.12"/>
    </svg>
  );
}

function KnightM() {
  return (
    <svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bg_km" cx="50%" cy="80%" r="80%">
          <stop offset="0%" stopColor="#1A2840"/>
          <stop offset="60%" stopColor="#0A1020"/>
          <stop offset="100%" stopColor="#050810"/>
        </radialGradient>
        <radialGradient id="skin_km" cx="45%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#F8D8B0"/>
          <stop offset="100%" stopColor="#E0B888"/>
        </radialGradient>
        <radialGradient id="armor_km" cx="50%" cy="0%" r="100%">
          <stop offset="0%" stopColor="#D4A020"/>
          <stop offset="100%" stopColor="#806010"/>
        </radialGradient>
      </defs>
      <rect width="100" height="120" fill="url(#bg_km)" rx="0"/>
      {/* Gold armor */}
      <path d="M0 120 L0 78 C12 65, 28 62, 38 67 L50 65 L62 67 C72 62, 88 65, 100 78 L100 120Z" fill="url(#armor_km)"/>
      <path d="M0 90 C12 80, 28 77, 38 80" stroke="#F0C030" strokeWidth="1.5" fill="none"/>
      <path d="M100 90 C88 80, 72 77, 62 80" stroke="#F0C030" strokeWidth="1.5" fill="none"/>
      <path d="M38 67 Q50 63, 62 67" stroke="#F8D840" strokeWidth="1.5" fill="none"/>
      {/* Blonde neat hair */}
      <ellipse cx="50" cy="30" rx="27" ry="22" fill="#C8A020"/>
      <ellipse cx="50" cy="22" rx="22" ry="14" fill="#D8B030"/>
      <path d="M23 30 C18 22, 16 35, 18 48" stroke="#C8A020" strokeWidth="4" fill="none"/>
      <path d="M77 30 C82 22, 84 35, 82 48" stroke="#C8A020" strokeWidth="4" fill="none"/>
      {/* Neat swept front */}
      <path d="M36 28 Q50 24, 64 28" stroke="#D8B030" strokeWidth="3" fill="none"/>
      {/* Face */}
      <ellipse cx="50" cy="56" rx="22" ry="26" fill="url(#skin_km)"/>
      {/* Eyebrows (noble, defined) */}
      <path d="M32 46 Q38 43, 44 46" stroke="#806030" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M56 46 Q62 43, 68 46" stroke="#806030" strokeWidth="2" fill="none" strokeLinecap="round"/>
      {/* Eyes (amber, warm) */}
      <ellipse cx="37" cy="52" rx="6" ry="5" fill="#F0E0B0"/>
      <ellipse cx="63" cy="52" rx="6" ry="5" fill="#F0E0B0"/>
      <ellipse cx="37" cy="52" rx="4" ry="4" fill="#B07820"/>
      <ellipse cx="63" cy="52" rx="4" ry="4" fill="#B07820"/>
      <ellipse cx="37" cy="52" rx="2" ry="2" fill="#100805"/>
      <ellipse cx="63" cy="52" rx="2" ry="2" fill="#100805"/>
      <circle cx="38.5" cy="50.5" r="1" fill="white" opacity="0.9"/>
      <circle cx="64.5" cy="50.5" r="1" fill="white" opacity="0.9"/>
      {/* Nose */}
      <path d="M48 62 Q50 65, 52 62" stroke="#C09060" strokeWidth="0.8" fill="none" opacity="0.5"/>
      {/* Mouth (confident) */}
      <path d="M43 71 Q50 75, 57 71" stroke="#B07050" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

function WarriorF() {
  return (
    <svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bg_wf" cx="50%" cy="100%" r="90%">
          <stop offset="0%" stopColor="#6B0020"/>
          <stop offset="60%" stopColor="#180A10"/>
          <stop offset="100%" stopColor="#0A0508"/>
        </radialGradient>
        <radialGradient id="skin_wf" cx="45%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#F8D0B0"/>
          <stop offset="100%" stopColor="#E0A880"/>
        </radialGradient>
        <radialGradient id="armor_wf" cx="50%" cy="0%" r="100%">
          <stop offset="0%" stopColor="#500010"/>
          <stop offset="100%" stopColor="#200008"/>
        </radialGradient>
      </defs>
      <rect width="100" height="120" fill="url(#bg_wf)" rx="0"/>
      {/* Black armor with red accents */}
      <path d="M0 120 L0 80 C12 70, 27 67, 37 72 L50 70 L63 72 C73 67, 88 70, 100 80 L100 120Z" fill="url(#armor_wf)"/>
      <path d="M0 88 C12 80, 27 77, 37 80" stroke="#CC2020" strokeWidth="1.5" fill="none"/>
      <path d="M100 88 C88 80, 73 77, 63 80" stroke="#CC2020" strokeWidth="1.5" fill="none"/>
      <path d="M37 72 Q50 68, 63 72" stroke="#FF3030" strokeWidth="1" fill="none"/>
      {/* Black short bob hair */}
      <ellipse cx="50" cy="32" rx="27" ry="22" fill="#0A0A18"/>
      <path d="M23 32 C16 28, 14 42, 16 52 C14 42, 16 30, 23 32Z" fill="#0A0A18"/>
      <path d="M77 32 C84 28, 86 42, 84 52 C86 42, 84 30, 77 32Z" fill="#0A0A18"/>
      {/* Bob cut - straight ends */}
      <rect x="14" y="48" width="6" height="12" rx="2" fill="#0A0A18"/>
      <rect x="80" y="48" width="6" height="12" rx="2" fill="#0A0A18"/>
      {/* Red streak */}
      <path d="M58 16 Q64 26, 68 42" stroke="#CC2020" strokeWidth="2.5" fill="none"/>
      {/* Face (slightly sharper jaw) */}
      <ellipse cx="50" cy="56" rx="21" ry="24" fill="url(#skin_wf)"/>
      {/* Eyebrows (sharp) */}
      <path d="M32 47 Q37 44, 43 46" stroke="#0A0A18" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <path d="M57 46 Q63 44, 68 47" stroke="#0A0A18" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      {/* Eyes (red/crimson, fierce) */}
      <ellipse cx="37" cy="53" rx="6" ry="5" fill="#E0B0B0"/>
      <ellipse cx="63" cy="53" rx="6" ry="5" fill="#E0B0B0"/>
      <ellipse cx="37" cy="53" rx="4" ry="4" fill="#CC2020"/>
      <ellipse cx="63" cy="53" rx="4" ry="4" fill="#CC2020"/>
      <ellipse cx="37" cy="53" rx="2" ry="2" fill="#080508"/>
      <ellipse cx="63" cy="53" rx="2" ry="2" fill="#080508"/>
      <circle cx="38.5" cy="51.5" r="1" fill="white" opacity="0.9"/>
      <circle cx="64.5" cy="51.5" r="1" fill="white" opacity="0.9"/>
      {/* Nose */}
      <path d="M48 61 Q50 64, 52 61" stroke="#C08060" strokeWidth="0.8" fill="none" opacity="0.4"/>
      {/* Mouth (determined) */}
      <path d="M44 70 L56 70" stroke="#B06050" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      {/* Long eyelashes */}
      <path d="M31 49 L29 47" stroke="#0A0A18" strokeWidth="1" fill="none"/>
      <path d="M33 48 L31 46" stroke="#0A0A18" strokeWidth="1" fill="none"/>
      <path d="M43 49 L45 47" stroke="#0A0A18" strokeWidth="1" fill="none"/>
      <path d="M57 49 L55 47" stroke="#0A0A18" strokeWidth="1" fill="none"/>
      <path d="M67 49 L69 47" stroke="#0A0A18" strokeWidth="1" fill="none"/>
    </svg>
  );
}

function MageF() {
  return (
    <svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bg_mf" cx="50%" cy="60%" r="85%">
          <stop offset="0%" stopColor="#380A60"/>
          <stop offset="55%" stopColor="#140520"/>
          <stop offset="100%" stopColor="#080210"/>
        </radialGradient>
        <radialGradient id="skin_mf" cx="45%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#F0D8E8"/>
          <stop offset="100%" stopColor="#D0A8C8"/>
        </radialGradient>
        <radialGradient id="robe_mf" cx="50%" cy="0%" r="100%">
          <stop offset="0%" stopColor="#501880"/>
          <stop offset="100%" stopColor="#200830"/>
        </radialGradient>
        <radialGradient id="aura_mf" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#C060FF" stopOpacity="0.35"/>
          <stop offset="100%" stopColor="#C060FF" stopOpacity="0"/>
        </radialGradient>
      </defs>
      <rect width="100" height="120" fill="url(#bg_mf)" rx="0"/>
      <ellipse cx="50" cy="110" rx="50" ry="28" fill="url(#aura_mf)"/>
      {/* Violet robe */}
      <path d="M0 120 L0 78 C14 66, 30 62, 40 67 L50 65 L60 67 C70 62, 86 66, 100 78 L100 120Z" fill="url(#robe_mf)"/>
      <path d="M35 67 Q50 63, 65 67" stroke="#9040D0" strokeWidth="1.5" fill="none"/>
      {/* Star gem */}
      <circle cx="50" cy="75" r="4" fill="#5010A0" stroke="#C060FF" strokeWidth="1"/>
      <circle cx="50" cy="75" r="2" fill="#C060FF" opacity="0.8"/>
      {/* Long violet hair (flowing) */}
      <ellipse cx="50" cy="28" rx="30" ry="24" fill="#5C1080"/>
      {/* Long strands down sides */}
      <path d="M20 36 C14 50, 12 68, 14 82" stroke="#5C1080" strokeWidth="8" fill="none" strokeLinecap="round"/>
      <path d="M80 36 C86 50, 88 68, 86 82" stroke="#5C1080" strokeWidth="8" fill="none" strokeLinecap="round"/>
      {/* Highlights */}
      <path d="M18 40 C14 52, 13 68, 15 80" stroke="#8020C0" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.6"/>
      <path d="M82 40 C86 52, 87 68, 85 80" stroke="#8020C0" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.6"/>
      {/* Top hair */}
      <path d="M30 20 L22 6 L34 16 L28 2 L40 14" fill="#5C1080"/>
      <path d="M70 20 L78 6 L66 16 L72 2 L60 14" fill="#5C1080"/>
      <ellipse cx="50" cy="18" rx="20" ry="12" fill="#6A1A90"/>
      {/* Hair highlight */}
      <path d="M42 12 Q50 8, 58 12" stroke="#9040C0" strokeWidth="2" fill="none" opacity="0.6"/>
      {/* Face */}
      <ellipse cx="50" cy="54" rx="21" ry="25" fill="url(#skin_mf)"/>
      {/* Delicate eyebrows */}
      <path d="M33 44 Q39 41, 44 44" stroke="#500080" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M56 44 Q61 41, 67 44" stroke="#500080" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      {/* Eyes (deep indigo, long lashes) */}
      <ellipse cx="38" cy="50" rx="6.5" ry="5.5" fill="#E0C8F0"/>
      <ellipse cx="62" cy="50" rx="6.5" ry="5.5" fill="#E0C8F0"/>
      <ellipse cx="38" cy="50" rx="4.5" ry="4" fill="#5010A0"/>
      <ellipse cx="62" cy="50" rx="4.5" ry="4" fill="#5010A0"/>
      <ellipse cx="38" cy="50" rx="2.5" ry="2.5" fill="#0A0515"/>
      <ellipse cx="62" cy="50" rx="2.5" ry="2.5" fill="#0A0515"/>
      <circle cx="39.5" cy="48.5" r="1.2" fill="white" opacity="0.95"/>
      <circle cx="63.5" cy="48.5" r="1.2" fill="white" opacity="0.95"/>
      {/* Glow */}
      <ellipse cx="38" cy="50" rx="5.5" ry="5" fill="#C060FF" opacity="0.15"/>
      <ellipse cx="62" cy="50" rx="5.5" ry="5" fill="#C060FF" opacity="0.15"/>
      {/* Eyelashes */}
      <path d="M32 47 L30 45" stroke="#500080" strokeWidth="1" fill="none"/>
      <path d="M34 46 L33 44" stroke="#500080" strokeWidth="1" fill="none"/>
      <path d="M44 47 L46 45" stroke="#500080" strokeWidth="1" fill="none"/>
      <path d="M56 47 L54 45" stroke="#500080" strokeWidth="1" fill="none"/>
      <path d="M66 47 L68 45" stroke="#500080" strokeWidth="1" fill="none"/>
      <path d="M68 48 L70 46" stroke="#500080" strokeWidth="1" fill="none"/>
      {/* Nose */}
      <path d="M48 59 Q50 62, 52 59" stroke="#C090C0" strokeWidth="0.8" fill="none" opacity="0.4"/>
      {/* Mouth (elegant) */}
      <path d="M43 67 Q50 72, 57 67" stroke="#C060A0" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

function HunterF() {
  return (
    <svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bg_hf" cx="50%" cy="80%" r="80%">
          <stop offset="0%" stopColor="#103830"/>
          <stop offset="60%" stopColor="#071A15"/>
          <stop offset="100%" stopColor="#030C0A"/>
        </radialGradient>
        <radialGradient id="skin_hf" cx="45%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#FCDAB0"/>
          <stop offset="100%" stopColor="#DCAA80"/>
        </radialGradient>
        <radialGradient id="leather_hf" cx="50%" cy="0%" r="100%">
          <stop offset="0%" stopColor="#2A5A40"/>
          <stop offset="100%" stopColor="#0A2018"/>
        </radialGradient>
      </defs>
      <rect width="100" height="120" fill="url(#bg_hf)" rx="0"/>
      {/* Leather armor */}
      <path d="M0 120 L0 78 C14 67, 28 64, 38 69 L50 67 L62 69 C72 64, 86 67, 100 78 L100 120Z" fill="url(#leather_hf)"/>
      <path d="M35 69 Q50 65, 65 69" stroke="#40A060" strokeWidth="1.5" fill="none"/>
      {/* Auburn ponytail hair */}
      <ellipse cx="50" cy="30" rx="27" ry="21" fill="#8B3010"/>
      {/* Side strands */}
      <path d="M23 35 C18 45, 16 58, 18 68" stroke="#8B3010" strokeWidth="5" fill="none" strokeLinecap="round"/>
      <path d="M77 35 C82 45, 84 58, 82 68" stroke="#8B3010" strokeWidth="5" fill="none" strokeLinecap="round"/>
      {/* Ponytail going to the side */}
      <path d="M72 24 C82 20, 92 22, 96 30 C92 28, 84 26, 78 30 C88 28, 94 35, 92 42" stroke="#9B4018" strokeWidth="6" fill="none" strokeLinecap="round"/>
      {/* Highlights */}
      <path d="M36 22 Q50 18, 62 22" stroke="#C06030" strokeWidth="2" fill="none" opacity="0.5"/>
      {/* Face */}
      <ellipse cx="50" cy="55" rx="21" ry="24" fill="url(#skin_hf)"/>
      {/* Eyebrows */}
      <path d="M33 46 Q38 43, 43 46" stroke="#5C2008" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      <path d="M57 46 Q62 43, 67 46" stroke="#5C2008" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      {/* Eyes (teal, bright) */}
      <ellipse cx="37" cy="52" rx="6" ry="5" fill="#B0E0E0"/>
      <ellipse cx="63" cy="52" rx="6" ry="5" fill="#B0E0E0"/>
      <ellipse cx="37" cy="52" rx="4" ry="4" fill="#107080"/>
      <ellipse cx="63" cy="52" rx="4" ry="4" fill="#107080"/>
      <ellipse cx="37" cy="52" rx="2" ry="2" fill="#050F10"/>
      <ellipse cx="63" cy="52" rx="2" ry="2" fill="#050F10"/>
      <circle cx="38.5" cy="50.5" r="1" fill="white" opacity="0.9"/>
      <circle cx="64.5" cy="50.5" r="1" fill="white" opacity="0.9"/>
      {/* Freckles */}
      <circle cx="42" cy="58" r="0.8" fill="#A06040" opacity="0.5"/>
      <circle cx="45" cy="60" r="0.8" fill="#A06040" opacity="0.5"/>
      <circle cx="55" cy="60" r="0.8" fill="#A06040" opacity="0.5"/>
      <circle cx="58" cy="58" r="0.8" fill="#A06040" opacity="0.5"/>
      {/* Nose */}
      <path d="M48 60 Q50 63, 52 60" stroke="#B07848" strokeWidth="0.8" fill="none" opacity="0.5"/>
      {/* Mouth (cheerful) */}
      <path d="M43 68 Q50 74, 57 68" stroke="#A06040" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

function KnightF() {
  return (
    <svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bg_kf" cx="50%" cy="70%" r="85%">
          <stop offset="0%" stopColor="#102040"/>
          <stop offset="55%" stopColor="#081020"/>
          <stop offset="100%" stopColor="#040810"/>
        </radialGradient>
        <radialGradient id="skin_kf" cx="45%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#FAE0C8"/>
          <stop offset="100%" stopColor="#E0C0A0"/>
        </radialGradient>
        <radialGradient id="silver_kf" cx="50%" cy="0%" r="100%">
          <stop offset="0%" stopColor="#B0C0D0"/>
          <stop offset="100%" stopColor="#5A6A7A"/>
        </radialGradient>
        <radialGradient id="glow_kf" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#80C0FF" stopOpacity="0.3"/>
          <stop offset="100%" stopColor="#80C0FF" stopOpacity="0"/>
        </radialGradient>
      </defs>
      <rect width="100" height="120" fill="url(#bg_kf)" rx="0"/>
      <ellipse cx="50" cy="115" rx="50" ry="25" fill="url(#glow_kf)"/>
      {/* Silver armor */}
      <path d="M0 120 L0 76 C14 64, 28 61, 38 66 L50 64 L62 66 C72 61, 86 64, 100 76 L100 120Z" fill="url(#silver_kf)"/>
      <path d="M0 84 C14 75, 28 72, 38 75" stroke="#D8E8F0" strokeWidth="1.5" fill="none" opacity="0.7"/>
      <path d="M100 84 C86 75, 72 72, 62 75" stroke="#D8E8F0" strokeWidth="1.5" fill="none" opacity="0.7"/>
      <path d="M38 66 Q50 62, 62 66" stroke="#E8F0F8" strokeWidth="1.5" fill="none"/>
      {/* Gold trim */}
      <path d="M35 70 Q50 66, 65 70" stroke="#D4A030" strokeWidth="0.8" fill="none" opacity="0.6"/>
      {/* Silver/white elegant hair (half-up) */}
      <ellipse cx="50" cy="28" rx="28" ry="22" fill="#C8D4E0"/>
      {/* Side waves */}
      <path d="M22 34 C16 44, 14 58, 16 72" stroke="#C8D4E0" strokeWidth="7" fill="none" strokeLinecap="round"/>
      <path d="M78 34 C84 44, 86 58, 84 72" stroke="#C8D4E0" strokeWidth="7" fill="none" strokeLinecap="round"/>
      {/* Highlights */}
      <path d="M20 38 C15 48, 13 60, 15 70" stroke="#E8F0F8" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.6"/>
      <path d="M80 38 C85 48, 87 60, 85 70" stroke="#E8F0F8" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.6"/>
      {/* Top hair & tiara */}
      <ellipse cx="50" cy="18" rx="20" ry="12" fill="#C8D4E0"/>
      <path d="M38 14 L36 6 L40 12 L38 4 L44 12 L42 5 L48 12" fill="#D4A030"/>
      <path d="M62 14 L64 6 L60 12 L62 4 L56 12 L58 5 L52 12" fill="#D4A030"/>
      {/* Tiara gem */}
      <circle cx="50" cy="14" r="3" fill="#4080C0" stroke="#D4A030" strokeWidth="1"/>
      <circle cx="50" cy="14" r="1.5" fill="#80C0FF"/>
      {/* Hair highlight */}
      <path d="M40 12 Q50 8, 60 12" stroke="#E8F0F8" strokeWidth="2" fill="none" opacity="0.8"/>
      {/* Face */}
      <ellipse cx="50" cy="54" rx="21" ry="25" fill="url(#skin_kf)"/>
      {/* Delicate eyebrows */}
      <path d="M33 44 Q39 41, 44 43" stroke="#8090A0" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M56 43 Q61 41, 67 44" stroke="#8090A0" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      {/* Eyes (blue, serene) */}
      <ellipse cx="37" cy="50" rx="6.5" ry="5.5" fill="#D8E8F8"/>
      <ellipse cx="63" cy="50" rx="6.5" ry="5.5" fill="#D8E8F8"/>
      <ellipse cx="37" cy="50" rx="4.5" ry="4" fill="#2060A0"/>
      <ellipse cx="63" cy="50" rx="4.5" ry="4" fill="#2060A0"/>
      <ellipse cx="37" cy="50" rx="2.5" ry="2.5" fill="#05101A"/>
      <ellipse cx="63" cy="50" rx="2.5" ry="2.5" fill="#05101A"/>
      <circle cx="39" cy="48.5" r="1.2" fill="white" opacity="0.95"/>
      <circle cx="65" cy="48.5" r="1.2" fill="white" opacity="0.95"/>
      {/* Eye shimmer */}
      <ellipse cx="37" cy="50" rx="5.5" ry="5" fill="#80C0FF" opacity="0.12"/>
      <ellipse cx="63" cy="50" rx="5.5" ry="5" fill="#80C0FF" opacity="0.12"/>
      {/* Eyelashes */}
      <path d="M31 47 L29 45" stroke="#5070A0" strokeWidth="1" fill="none"/>
      <path d="M33 46 L32 44" stroke="#5070A0" strokeWidth="1" fill="none"/>
      <path d="M44 47 L46 45" stroke="#5070A0" strokeWidth="1" fill="none"/>
      <path d="M56 47 L54 45" stroke="#5070A0" strokeWidth="1" fill="none"/>
      <path d="M67 47 L69 45" stroke="#5070A0" strokeWidth="1" fill="none"/>
      {/* Nose */}
      <path d="M48 59 Q50 62, 52 59" stroke="#C0A080" strokeWidth="0.8" fill="none" opacity="0.4"/>
      {/* Mouth (graceful smile) */}
      <path d="M43 67 Q50 72, 57 67" stroke="#C08070" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

// ── 아바타 맵 ──────────────────────────────────────────────────────
const AVATAR_COMPONENTS: Record<AvatarId, () => JSX.Element> = {
  warrior_m: WarriorM,
  mage_m:    MageM,
  hunter_m:  HunterM,
  knight_m:  KnightM,
  warrior_f: WarriorF,
  mage_f:    MageF,
  hunter_f:  HunterF,
  knight_f:  KnightF,
};

// ── 공개 컴포넌트 ─────────────────────────────────────────────────
interface GameAvatarProps {
  avatarId: string;
  size?: number;
  className?: string;
  rounded?: string;
}

export function GameAvatar({ avatarId, size = 64, className = "", rounded = "rounded-2xl" }: GameAvatarProps) {
  const id = (avatarId === "male" ? "warrior_m" : avatarId === "female" ? "warrior_f" : avatarId) as AvatarId;
  const Component = AVATAR_COMPONENTS[id] ?? WarriorM;
  return (
    <div
      className={`overflow-hidden flex-shrink-0 ${rounded} ${className}`}
      style={{ width: size, height: size }}
    >
      <Component />
    </div>
  );
}
