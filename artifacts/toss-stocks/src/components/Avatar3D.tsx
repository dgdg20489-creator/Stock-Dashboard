import { useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import type { EquippedItems } from "@/hooks/use-equipped";
import { WARDROBE_ITEMS, type WardrobeItem } from "@/data/wardrobe-items";

type Difficulty = "beginner" | "intermediate" | "expert";
interface AvatarProps {
  equipped: EquippedItems;
  avatar: "male" | "female";
  difficulty?: Difficulty;
}
function getItem(id?: string): WardrobeItem | undefined {
  return id ? WARDROBE_ITEMS.find((i) => i.id === id) : undefined;
}

// ─────────────────────────────────────────────────────────────────
// 머리카락 — 크라운 캡을 위·뒤로 옮겨서 눈을 절대 가리지 않게
// ─────────────────────────────────────────────────────────────────
function Hair({ avatar }: { avatar: "male" | "female" }) {
  const dark = "#1c0f02";
  const mid  = "#301805";

  // 공통: 크라운 캡은 head center(0,2.12,0) 기준으로 위(+y)·뒤(-z)로 이동
  // → 앞면 z 최댓값 = centerZ(-0.12) + radius(0.29) = 0.17 < 눈 z(0.23+)
  const CrownCap = () => (
    <mesh position={[0, 2.26, -0.12]}>
      <sphereGeometry args={[0.29, 26, 26, 0, Math.PI * 2, 0, Math.PI * 0.58]} />
      <meshStandardMaterial color={dark} roughness={0.7} />
    </mesh>
  );

  if (avatar === "male") {
    // 어른 남성 — 짧게 자른 옆머리 + 윗머리
    return (
      <group>
        <CrownCap />
        {/* 앞이마 라인 (이마 위쪽만 살짝, 눈 위 y>2.30) */}
        <mesh position={[0, 2.355, 0.14]} rotation={[0.6, 0, 0]}>
          <boxGeometry args={[0.42, 0.1, 0.07]} />
          <meshStandardMaterial color={dark} roughness={0.7} />
        </mesh>
        {/* 양 옆머리 (짧게) */}
        <mesh position={[-0.268, 2.06, -0.02]}>
          <boxGeometry args={[0.08, 0.3, 0.24]} />
          <meshStandardMaterial color={dark} />
        </mesh>
        <mesh position={[0.268, 2.06, -0.02]}>
          <boxGeometry args={[0.08, 0.3, 0.24]} />
          <meshStandardMaterial color={dark} />
        </mesh>
        {/* 뒷머리 */}
        <mesh position={[0, 2.01, -0.25]}>
          <boxGeometry args={[0.5, 0.44, 0.1]} />
          <meshStandardMaterial color={dark} />
        </mesh>
      </group>
    );
  }

  // 어른 여성 — 부드러운 긴 머리
  return (
    <group>
      <CrownCap />
      {/* 앞이마 (눈 훨씬 위쪽) */}
      <mesh position={[0, 2.38, 0.13]} rotation={[0.55, 0, 0]}>
        <boxGeometry args={[0.44, 0.09, 0.07]} />
        <meshStandardMaterial color={dark} roughness={0.65} />
      </mesh>
      {/* 옆으로 흘러내리는 긴 머리 */}
      <mesh position={[-0.26, 1.72, -0.04]}>
        <boxGeometry args={[0.11, 0.88, 0.2]} />
        <meshStandardMaterial color={dark} roughness={0.6} />
      </mesh>
      <mesh position={[0.26, 1.72, -0.04]}>
        <boxGeometry args={[0.11, 0.88, 0.2]} />
        <meshStandardMaterial color={dark} roughness={0.6} />
      </mesh>
      {/* 아랫부분 자연스럽게 모아짐 */}
      <mesh position={[-0.2, 1.28, -0.06]}>
        <boxGeometry args={[0.1, 0.3, 0.18]} />
        <meshStandardMaterial color={dark} />
      </mesh>
      <mesh position={[0.2, 1.28, -0.06]}>
        <boxGeometry args={[0.1, 0.3, 0.18]} />
        <meshStandardMaterial color={dark} />
      </mesh>
      {/* 뒷머리 */}
      <mesh position={[0, 1.9, -0.24]}>
        <boxGeometry args={[0.54, 0.9, 0.11]} />
        <meshStandardMaterial color={dark} roughness={0.6} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────
// 얼굴 — 어른 비율: 눈 작게, 코·입 자연스럽게
// 모든 좌표: body group [0, -1.1, 0] 기준 (head center = [0, 2.12, 0])
// head radius 0.26, scale [0.88, 1.02, 0.90] → 앞면 z ≈ 0.234
// ─────────────────────────────────────────────────────────────────
function FaceFeatures({ avatar, skinColor }: { avatar: "male" | "female"; skinColor: string }) {
  const lEyeRef  = useRef<THREE.Group>(null!);
  const rEyeRef  = useRef<THREE.Group>(null!);
  const blinkT   = useRef(0);
  const blinking = useRef(false);

  const irisColor  = avatar === "male" ? "#1e3a70" : "#5b1a8a";
  const noseColor  = avatar === "male" ? "#dda07a" : "#e8b499";

  useFrame((_, dt) => {
    blinkT.current += dt;
    if (!blinking.current && blinkT.current > 3.5 + Math.random() * 2) {
      blinking.current = true;
      blinkT.current   = 0;
    }
    const s = blinking.current
      ? blinkT.current < 0.07  ? Math.max(0.05, 1 - blinkT.current / 0.07)
        : blinkT.current < 0.13 ? Math.max(0.05, (blinkT.current - 0.07) / 0.06)
        : 1
      : 1;
    if (lEyeRef.current) lEyeRef.current.scale.y = s;
    if (rEyeRef.current) rEyeRef.current.scale.y = s;
    if (blinking.current && blinkT.current > 0.18) blinking.current = false;
  });

  // 눈 — 흰자 z=0.22 기준, 홍채·동공·하이라이트 차례로 더 앞
  const Eye = ({ x }: { x: number }) => (
    <group position={[x, 2.18, 0]}>
      {/* 흰자 */}
      <mesh scale={[1, 0.78, 0.72]} position={[0, 0, 0.222]}>
        <sphereGeometry args={[0.058, 18, 18]} />
        <meshStandardMaterial color="#f4f4f4" roughness={0.05} />
      </mesh>
      {/* 홍채 */}
      <mesh position={[0, 0, 0.253]}>
        <sphereGeometry args={[0.036, 14, 14]} />
        <meshStandardMaterial color={irisColor} roughness={0.15} metalness={0.15} />
      </mesh>
      {/* 동공 */}
      <mesh position={[0, 0, 0.272]}>
        <sphereGeometry args={[0.019, 10, 10]} />
        <meshStandardMaterial color="#080808" />
      </mesh>
      {/* 하이라이트 */}
      <mesh position={[0.014, 0.014, 0.282]}>
        <sphereGeometry args={[0.01, 8, 8]} />
        <meshStandardMaterial color="#ffffff" roughness={0} />
      </mesh>
      {/* 위 눈꺼풀 라인 */}
      <mesh position={[0, 0.044, 0.244]} rotation={[0.12, 0, 0]}>
        <boxGeometry args={[0.1, 0.016, 0.01]} />
        <meshStandardMaterial color="#0a0a0a" />
      </mesh>
    </group>
  );

  return (
    <group>
      {/* 눈썹 — 어른스럽게 날카롭게 */}
      <mesh
        position={[-0.108, 2.255, 0.22]}
        rotation={[0, 0, avatar === "male" ? 0.08 : 0.05]}
      >
        <boxGeometry args={[0.095, 0.014, 0.013]} />
        <meshStandardMaterial color="#130800" />
      </mesh>
      <mesh
        position={[0.108, 2.255, 0.22]}
        rotation={[0, 0, avatar === "male" ? -0.08 : -0.05]}
      >
        <boxGeometry args={[0.095, 0.014, 0.013]} />
        <meshStandardMaterial color="#130800" />
      </mesh>

      {/* 눈 */}
      <group ref={lEyeRef}><Eye x={-0.108} /></group>
      <group ref={rEyeRef}><Eye x={ 0.108} /></group>

      {/* 코 — 자연스러운 어른 코 */}
      <mesh position={[0, 2.088, 0.242]} scale={[0.65, 1, 0.5]}>
        <sphereGeometry args={[0.028, 10, 10]} />
        <meshStandardMaterial color={noseColor} roughness={0.75} />
      </mesh>
      <mesh position={[-0.022, 2.078, 0.234]}>
        <sphereGeometry args={[0.014, 8, 8]} />
        <meshStandardMaterial color={noseColor} roughness={0.8} />
      </mesh>
      <mesh position={[0.022, 2.078, 0.234]}>
        <sphereGeometry args={[0.014, 8, 8]} />
        <meshStandardMaterial color={noseColor} roughness={0.8} />
      </mesh>

      {/* 입 — 성숙한 자연스러운 입술 */}
      <mesh position={[0, 2.022, 0.235]}>
        <boxGeometry args={[0.088, 0.019, 0.012]} />
        <meshStandardMaterial color="#b84858" roughness={0.4} />
      </mesh>
      <mesh position={[0, 2.003, 0.238]} scale={[1, 0.75, 1]}>
        <sphereGeometry args={[0.032, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
        <meshStandardMaterial color="#c85060" roughness={0.35} />
      </mesh>
      {/* 입꼬리 */}
      <mesh position={[-0.048, 2.016, 0.232]} rotation={[0, 0, 0.45]}>
        <boxGeometry args={[0.024, 0.012, 0.009]} />
        <meshStandardMaterial color="#9e3545" />
      </mesh>
      <mesh position={[0.048, 2.016, 0.232]} rotation={[0, 0, -0.45]}>
        <boxGeometry args={[0.024, 0.012, 0.009]} />
        <meshStandardMaterial color="#9e3545" />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────
// 모자·장신구 — 위치 머리 크기에 맞게 조정
// ─────────────────────────────────────────────────────────────────
function Hat({ item }: { item?: WardrobeItem }) {
  if (!item) return null;
  const c = new THREE.Color(item.color);
  const a = item.accentColor ? new THREE.Color(item.accentColor) : c;
  if (item.id === "hat_crown") {
    return (
      <group position={[0, 2.53, 0]}>
        <mesh><torusGeometry args={[0.24, 0.055, 8, 28]} /><meshStandardMaterial color={c} metalness={0.9} roughness={0.1} /></mesh>
        {[0,72,144,216,288].map((deg,i)=>{
          const ang=(deg*Math.PI)/180;
          return <mesh key={i} position={[Math.sin(ang)*0.19,0.16,Math.cos(ang)*0.19]}><cylinderGeometry args={[0.02,0.028,0.22,5]} /><meshStandardMaterial color={a} metalness={0.9} roughness={0.1} /></mesh>;
        })}
      </group>
    );
  }
  if (item.id === "hat_silk") return (
    <group position={[0,2.5,0]}>
      <mesh><cylinderGeometry args={[0.24,0.24,0.04,28]} /><meshStandardMaterial color={a} /></mesh>
      <mesh position={[0,0.23,0]}><cylinderGeometry args={[0.21,0.21,0.4,28]} /><meshStandardMaterial color={c} /></mesh>
    </group>
  );
  if (item.id === "hat_fedora") return (
    <group position={[0,2.5,0]}>
      <mesh><cylinderGeometry args={[0.29,0.29,0.04,28]} /><meshStandardMaterial color={c} /></mesh>
      <mesh position={[0,0.17,0]}><cylinderGeometry args={[0.21,0.23,0.28,24]} /><meshStandardMaterial color={c} /></mesh>
    </group>
  );
  if (item.id === "hat_hunting") return (
    <group position={[0,2.48,0]}>
      <mesh><sphereGeometry args={[0.25,16,8,0,Math.PI*2,0,Math.PI/2]} /><meshStandardMaterial color={c} /></mesh>
      <mesh position={[0,-0.02,0.18]}><boxGeometry args={[0.22,0.04,0.14]} /><meshStandardMaterial color={c} /></mesh>
    </group>
  );
  if (item.id === "hat_bungeo") return (
    <group position={[0,2.46,0]}>
      <mesh><cylinderGeometry args={[0.27,0.27,0.04,24]} /><meshStandardMaterial color={c} /></mesh>
      <mesh position={[0,0.13,0]}><sphereGeometry args={[0.23,16,8,0,Math.PI*2,0,Math.PI/1.3]} /><meshStandardMaterial color={c} /></mesh>
    </group>
  );
  return (
    <group position={[0,2.5,0]}>
      <mesh><cylinderGeometry args={[0.29,0.29,0.04,24]} /><meshStandardMaterial color={c} /></mesh>
      <mesh position={[0,0.13,0.03]}><sphereGeometry args={[0.23,16,10,0,Math.PI*2,0,Math.PI/1.5]} /><meshStandardMaterial color={c} /></mesh>
    </group>
  );
}

function Scarf({ item }: { item?: WardrobeItem }) {
  if (!item) return null;
  const c = new THREE.Color(item.color);
  const a = item.accentColor ? new THREE.Color(item.accentColor) : c;
  if (item.id === "scarf_smartwatch" || item.id === "scarf_gold_watch") {
    return (
      <group position={[-0.44,1.44,0]}>
        <mesh rotation={[Math.PI/2,0,0]}><torusGeometry args={[0.07,0.02,8,20]} /><meshStandardMaterial color={c} metalness={0.8} roughness={0.15} /></mesh>
        <mesh><boxGeometry args={[0.07,0.07,0.022]} /><meshStandardMaterial color={item.id==="scarf_smartwatch"?"#10B981":"#F6C90E"} /></mesh>
      </group>
    );
  }
  if (item.id === "scarf_canvas_shoes") {
    return (
      <group>
        {[-0.16,0.16].map((x,i)=>(
          <mesh key={i} position={[x,0.06,0.14]}><boxGeometry args={[0.14,0.1,0.28]} /><meshStandardMaterial color={c} /></mesh>
        ))}
      </group>
    );
  }
  return (
    <group position={[0,1.9,0]}>
      <mesh rotation={[Math.PI/2,0,0]}><torusGeometry args={[0.16,0.05,8,24]} /><meshStandardMaterial color={c} /></mesh>
      <mesh position={[0.05,-0.13,0.12]}><boxGeometry args={[0.07,0.22,0.06]} /><meshStandardMaterial color={a} /></mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────
// 상의 아이템별 3D 디테일 오버레이
// ─────────────────────────────────────────────────────────────────
function TopDetail({ item, topColor }: { item?: WardrobeItem; topColor: string }) {
  if (!item) return null;
  const c = new THREE.Color(topColor);
  const darker = new THREE.Color(topColor).multiplyScalar(0.78);
  const ac = item.accentColor ? new THREE.Color(item.accentColor) : c;

  if (item.id === "top_hoodie") return (
    <group>
      {/* 후드 — 목 뒤에 둥글게 */}
      <mesh position={[0, 2.02, -0.19]} rotation={[-0.18, 0, 0]}>
        <sphereGeometry args={[0.23, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
        <meshStandardMaterial color={c} roughness={0.65} />
      </mesh>
      {/* 후드 앞 테두리 */}
      <mesh position={[0, 1.9, 0.06]} rotation={[0.35, 0, 0]}>
        <torusGeometry args={[0.14, 0.025, 6, 18, Math.PI]} />
        <meshStandardMaterial color={darker} roughness={0.7} />
      </mesh>
      {/* 캥거루 주머니 */}
      <mesh position={[0, 1.18, 0.133]}>
        <boxGeometry args={[0.24, 0.13, 0.008]} />
        <meshStandardMaterial color={darker} roughness={0.7} />
      </mesh>
    </group>
  );

  if (item.id === "top_shirt_tie") return (
    <group>
      {/* 왼쪽 칼라 */}
      <mesh position={[-0.055, 1.77, 0.118]} rotation={[0.15, 0.25, 0.1]}>
        <boxGeometry args={[0.08, 0.1, 0.009]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.3} />
      </mesh>
      {/* 오른쪽 칼라 */}
      <mesh position={[0.055, 1.77, 0.118]} rotation={[0.15, -0.25, -0.1]}>
        <boxGeometry args={[0.08, 0.1, 0.009]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.3} />
      </mesh>
      {/* 넥타이 매듭 */}
      <mesh position={[0, 1.71, 0.128]}>
        <boxGeometry args={[0.058, 0.065, 0.016]} />
        <meshStandardMaterial color={ac} roughness={0.35} />
      </mesh>
      {/* 넥타이 몸통 */}
      <mesh position={[0, 1.44, 0.133]}>
        <boxGeometry args={[0.052, 0.52, 0.009]} />
        <meshStandardMaterial color={ac} roughness={0.4} />
      </mesh>
      {/* 넥타이 끝 */}
      <mesh position={[0, 1.17, 0.133]}>
        <boxGeometry args={[0.044, 0.065, 0.009]} />
        <meshStandardMaterial color={ac} roughness={0.4} />
      </mesh>
    </group>
  );

  if (item.id === "top_suit") return (
    <group>
      {/* 왼쪽 라펠 */}
      <mesh position={[-0.1, 1.56, 0.126]} rotation={[0, 0, 0.32]}>
        <boxGeometry args={[0.09, 0.24, 0.01]} />
        <meshStandardMaterial color="#111" roughness={0.45} />
      </mesh>
      {/* 오른쪽 라펠 */}
      <mesh position={[0.1, 1.56, 0.126]} rotation={[0, 0, -0.32]}>
        <boxGeometry args={[0.09, 0.24, 0.01]} />
        <meshStandardMaterial color="#111" roughness={0.45} />
      </mesh>
      {/* 포켓치프 */}
      <mesh position={[-0.2, 1.62, 0.13]}>
        <boxGeometry args={[0.038, 0.042, 0.006]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.3} />
      </mesh>
      {/* 버튼 3개 */}
      {[1.42, 1.3, 1.18].map((y, i) => (
        <mesh key={i} position={[0, y, 0.133]}>
          <cylinderGeometry args={[0.013, 0.013, 0.009, 8]} />
          <meshStandardMaterial color="#333" metalness={0.5} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );

  if (item.id === "top_cardigan") return (
    <group>
      {/* V넥 왼쪽 패널 */}
      <mesh position={[-0.042, 1.64, 0.126]} rotation={[0, 0, 0.16]}>
        <boxGeometry args={[0.055, 0.22, 0.009]} />
        <meshStandardMaterial color={c} roughness={0.55} />
      </mesh>
      {/* V넥 오른쪽 패널 */}
      <mesh position={[0.042, 1.64, 0.126]} rotation={[0, 0, -0.16]}>
        <boxGeometry args={[0.055, 0.22, 0.009]} />
        <meshStandardMaterial color={c} roughness={0.55} />
      </mesh>
      {/* 버튼 */}
      {[1.52, 1.38, 1.24].map((y, i) => (
        <mesh key={i} position={[0, y, 0.128]}>
          <sphereGeometry args={[0.013, 8, 6]} />
          <meshStandardMaterial color="#a07878" roughness={0.35} />
        </mesh>
      ))}
    </group>
  );

  if (item.id === "top_blouson") return (
    <group>
      {/* 밑단 립 밴드 */}
      <mesh position={[0, 1.04, 0]}>
        <boxGeometry args={[0.535, 0.09, 0.262]} />
        <meshStandardMaterial color={darker} roughness={0.75} />
      </mesh>
      {/* 지퍼 선 */}
      <mesh position={[0, 1.5, 0.126]}>
        <boxGeometry args={[0.016, 0.52, 0.007]} />
        <meshStandardMaterial color="#888" metalness={0.7} roughness={0.2} />
      </mesh>
      {/* 지퍼 풀 */}
      <mesh position={[0, 1.4, 0.128]}>
        <boxGeometry args={[0.022, 0.034, 0.009]} />
        <meshStandardMaterial color="#bbb" metalness={0.85} roughness={0.15} />
      </mesh>
    </group>
  );

  if (item.id === "top_luxury_coat") return (
    <group>
      {/* 코트 스커트 (허리 아래 연장) */}
      <mesh position={[0, 0.72, 0]}>
        <boxGeometry args={[0.55, 0.52, 0.27]} />
        <meshStandardMaterial color={c} roughness={0.5} />
      </mesh>
      {/* 벨트+버클 가리기 */}
      <mesh position={[0, 0.98, 0]}>
        <boxGeometry args={[0.555, 0.12, 0.275]} />
        <meshStandardMaterial color={c} roughness={0.5} />
      </mesh>
      {/* 왼쪽 라펠 */}
      <mesh position={[-0.09, 1.6, 0.127]} rotation={[0, 0, 0.28]}>
        <boxGeometry args={[0.09, 0.28, 0.01]} />
        <meshStandardMaterial color={darker} roughness={0.48} />
      </mesh>
      {/* 오른쪽 라펠 */}
      <mesh position={[0.09, 1.6, 0.127]} rotation={[0, 0, -0.28]}>
        <boxGeometry args={[0.09, 0.28, 0.01]} />
        <meshStandardMaterial color={darker} roughness={0.48} />
      </mesh>
      {/* 큰 버튼 4개 */}
      {[1.48, 1.3, 1.1, 0.88].map((y, i) => (
        <mesh key={i} position={[0, y, 0.135]}>
          <cylinderGeometry args={[0.018, 0.018, 0.01, 10]} />
          <meshStandardMaterial color="#C19A6B" metalness={0.45} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );

  if (item.id === "top_fur") return (
    <group>
      {/* 퍼 칼라 — 목 주변 구슬들 */}
      {Array.from({ length: 14 }, (_, i) => {
        const ang = (i / 14) * Math.PI * 2;
        const r = 0.19;
        return (
          <mesh key={i} position={[Math.sin(ang) * r, 1.76, Math.cos(ang) * 0.11 + 0.02]}>
            <sphereGeometry args={[0.052, 8, 6]} />
            <meshStandardMaterial color={c} roughness={0.92} />
          </mesh>
        );
      })}
      {/* 소매 끝 퍼 — 왼팔 */}
      {Array.from({ length: 8 }, (_, i) => {
        const ang = (i / 8) * Math.PI * 2;
        return (
          <mesh key={i} position={[-0.35 + Math.sin(ang) * 0.09, 1.31, Math.cos(ang) * 0.09]}>
            <sphereGeometry args={[0.042, 7, 5]} />
            <meshStandardMaterial color={c} roughness={0.92} />
          </mesh>
        );
      })}
      {/* 소매 끝 퍼 — 오른팔 */}
      {Array.from({ length: 8 }, (_, i) => {
        const ang = (i / 8) * Math.PI * 2;
        return (
          <mesh key={i} position={[0.35 + Math.sin(ang) * 0.09, 1.31, Math.cos(ang) * 0.09]}>
            <sphereGeometry args={[0.042, 7, 5]} />
            <meshStandardMaterial color={c} roughness={0.92} />
          </mesh>
        );
      })}
    </group>
  );

  if (item.id === "top_sweatshirt") return (
    <mesh position={[0, 1.19, 0.132]}>
      <boxGeometry args={[0.25, 0.14, 0.008]} />
      <meshStandardMaterial color={darker} roughness={0.68} />
    </mesh>
  );

  return null;
}

// ─────────────────────────────────────────────────────────────────
// 하의 아이템별 3D 디테일 오버레이
// ─────────────────────────────────────────────────────────────────
function BottomDetail({ item, btmColor, skinColor }: { item?: WardrobeItem; btmColor: string; skinColor: string }) {
  if (!item) return null;

  if (item.id === "bottom_shorts") return (
    <group>
      {([-0.15, 0.15] as const).map((x, i) => (
        <group key={i} position={[x, 0, 0]}>
          {/* 아랫다리 피부색으로 덮기 */}
          <mesh position={[0, 0.22, 0]}>
            <cylinderGeometry args={[0.087, 0.081, 0.46, 14]} />
            <meshStandardMaterial color={skinColor} roughness={0.55} />
          </mesh>
          {/* 반바지 밑단 */}
          <mesh position={[0, 0.51, 0]}>
            <cylinderGeometry args={[0.103, 0.103, 0.024, 14]} />
            <meshStandardMaterial color={new THREE.Color(btmColor).multiplyScalar(0.82)} roughness={0.68} />
          </mesh>
        </group>
      ))}
    </group>
  );

  if (item.id === "bottom_jeans") return (
    <group>
      {/* 앞 주머니 스티칭 */}
      {([-0.15, 0.15] as const).map((x, i) => (
        <mesh key={i} position={[x, 0.75, 0.116]}>
          <boxGeometry args={[0.09, 0.09, 0.005]} />
          <meshStandardMaterial color={new THREE.Color(btmColor).multiplyScalar(0.76)} roughness={0.72} />
        </mesh>
      ))}
    </group>
  );

  if (item.id === "bottom_leather") return (
    <group>
      {([-0.15, 0.15] as const).map((x, i) => (
        <mesh key={i} position={[x, 0.42, 0.105]}>
          <boxGeometry args={[0.011, 0.64, 0.006]} />
          <meshStandardMaterial color={new THREE.Color(btmColor).addScalar(0.14)} roughness={0.25} metalness={0.25} />
        </mesh>
      ))}
    </group>
  );

  if (item.id === "bottom_chino" || item.id === "bottom_slacks") return (
    <group>
      {([-0.15, 0.15] as const).map((x, i) => (
        <mesh key={i} position={[x, 0.42, 0.104]}>
          <boxGeometry args={[0.007, 0.74, 0.005]} />
          <meshStandardMaterial color={new THREE.Color(btmColor).addScalar(0.07)} roughness={0.62} />
        </mesh>
      ))}
    </group>
  );

  if (item.id === "bottom_formal") return (
    <group>
      {([-0.15, 0.15] as const).map((x, i) => (
        <group key={i}>
          <mesh position={[x, 0.42, 0.104]}>
            <boxGeometry args={[0.007, 0.78, 0.005]} />
            <meshStandardMaterial color="#555" roughness={0.5} />
          </mesh>
          {/* 밑단 커프 */}
          <mesh position={[x, 0.01, 0]}>
            <cylinderGeometry args={[0.096, 0.096, 0.022, 14]} />
            <meshStandardMaterial color="#111827" roughness={0.5} />
          </mesh>
        </group>
      ))}
    </group>
  );

  if (item.id === "bottom_luxury_jeans") return (
    <group>
      {([-0.15, 0.15] as const).map((x, i) => (
        <group key={i}>
          {/* 측면 솔기 */}
          <mesh position={[x, 0.38, 0.108]}>
            <boxGeometry args={[0.007, 0.7, 0.005]} />
            <meshStandardMaterial color={new THREE.Color(btmColor).addScalar(0.08)} roughness={0.55} />
          </mesh>
        </group>
      ))}
    </group>
  );

  return null;
}

// ─────────────────────────────────────────────────────────────────
// 메인 아바타 — 어른스러운 비율 (머리 작게, 다리 길게)
// ─────────────────────────────────────────────────────────────────
function HumanoidAvatar({ equipped, avatar }: AvatarProps) {
  const bodyRef     = useRef<THREE.Group>(null!);
  const lArmRef     = useRef<THREE.Group>(null!);
  const rArmRef     = useRef<THREE.Group>(null!);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (bodyRef.current) {
      bodyRef.current.position.y = -1.1 + Math.sin(t * 1.1) * 0.032;
      bodyRef.current.rotation.y = Math.sin(t * 0.35) * 0.03;
    }
    if (lArmRef.current) lArmRef.current.rotation.z =  0.14 + Math.sin(t * 1.1 + Math.PI) * 0.045;
    if (rArmRef.current) rArmRef.current.rotation.z = -0.14 + Math.sin(t * 1.1) * 0.045;
  });

  const hatItem     = getItem(equipped.hat);
  const topItem     = getItem(equipped.top);
  const bottomItem  = getItem(equipped.bottom);
  const scarfItem   = getItem(equipped.scarf);

  const skinColor   = avatar === "male" ? "#F0C090" : "#F8D4B8";
  const topColor    = topItem    ? topItem.color    : avatar === "male" ? "#1a4d2e" : "#6d2899";
  const btmColor    = bottomItem ? bottomItem.color : avatar === "male" ? "#14391f" : "#4a1880";
  const shoeColor   = "#4a2808";
  const soleColor   = "#6b3c12";

  return (
    <group ref={bodyRef} position={[0, -1.1, 0]}>

      {/* ══ 머리 — 어른: 약간 갸름하게 scale ══ */}
      <mesh position={[0, 2.12, 0]} scale={[0.88, 1.02, 0.90]}>
        <sphereGeometry args={[0.26, 30, 30]} />
        <meshStandardMaterial color={skinColor} roughness={0.5} />
      </mesh>

      {/* 귀 */}
      <mesh position={[-0.254, 2.1, 0]}>
        <sphereGeometry args={[0.065, 10, 10]} />
        <meshStandardMaterial color={skinColor} roughness={0.65} />
      </mesh>
      <mesh position={[0.254, 2.1, 0]}>
        <sphereGeometry args={[0.065, 10, 10]} />
        <meshStandardMaterial color={skinColor} roughness={0.65} />
      </mesh>

      {/* 얼굴 피처 */}
      <FaceFeatures avatar={avatar} skinColor={skinColor} />

      {/* 머리카락 (눈 위로만) */}
      <Hair avatar={avatar} />

      {/* ══ 목 — 길게 ══ */}
      <mesh position={[0, 1.86, 0]}>
        <cylinderGeometry args={[0.092, 0.088, 0.3, 14]} />
        <meshStandardMaterial color={skinColor} roughness={0.55} />
      </mesh>

      {/* ══ 몸통 — 어른: 슬림하고 길게 ══ */}
      <mesh position={[0, 1.38, 0]}>
        <boxGeometry args={[0.52, 0.74, 0.25]} />
        <meshStandardMaterial color={topColor} roughness={0.58} />
      </mesh>
      {/* 몸통 앞 디테일 */}
      <mesh position={[0, 1.38, 0.128]}>
        <boxGeometry args={[0.07, 0.66, 0.007]} />
        <meshStandardMaterial color={topColor} roughness={0.2} metalness={0.45} />
      </mesh>

      {/* ══ 왼팔 ══ */}
      <group ref={lArmRef} position={[-0.35, 1.58, 0]}>
        <mesh><cylinderGeometry args={[0.082, 0.074, 0.46, 12]} /><meshStandardMaterial color={topColor} roughness={0.6} /></mesh>
        <mesh position={[0, -0.44, 0]}><cylinderGeometry args={[0.068, 0.062, 0.38, 12]} /><meshStandardMaterial color={skinColor} roughness={0.55} /></mesh>
        <mesh position={[0, -0.66, 0]}><sphereGeometry args={[0.075, 12, 12]} /><meshStandardMaterial color={skinColor} roughness={0.5} /></mesh>
      </group>

      {/* ══ 오른팔 ══ */}
      <group ref={rArmRef} position={[0.35, 1.58, 0]}>
        <mesh><cylinderGeometry args={[0.082, 0.074, 0.46, 12]} /><meshStandardMaterial color={topColor} roughness={0.6} /></mesh>
        <mesh position={[0, -0.44, 0]}><cylinderGeometry args={[0.068, 0.062, 0.38, 12]} /><meshStandardMaterial color={skinColor} roughness={0.55} /></mesh>
        <mesh position={[0, -0.66, 0]}><sphereGeometry args={[0.075, 12, 12]} /><meshStandardMaterial color={skinColor} roughness={0.5} /></mesh>
      </group>

      {/* ══ 허리띠 ══ */}
      <mesh position={[0, 0.98, 0]}>
        <boxGeometry args={[0.54, 0.09, 0.27]} />
        <meshStandardMaterial color="#271205" roughness={0.35} metalness={0.35} />
      </mesh>
      <mesh position={[0, 0.98, 0.138]}>
        <boxGeometry args={[0.09, 0.075, 0.009]} />
        <meshStandardMaterial color="#d4a017" metalness={0.92} roughness={0.08} />
      </mesh>

      {/* ══ 힙 ══ */}
      <mesh position={[0, 0.9, 0]}>
        <boxGeometry args={[0.48, 0.2, 0.24]} />
        <meshStandardMaterial color={btmColor} roughness={0.62} />
      </mesh>

      {/* ══ 다리 — 길고 날씬하게 ══ */}
      {([-0.15, 0.15] as const).map((x, i) => (
        <group key={i} position={[x, 0, 0]}>
          <mesh position={[0, 0.6, 0]}><cylinderGeometry args={[0.1, 0.092, 0.52, 14]} /><meshStandardMaterial color={btmColor} roughness={0.62} /></mesh>
          <mesh position={[0, 0.22, 0]}><cylinderGeometry args={[0.085, 0.078, 0.44, 14]} /><meshStandardMaterial color={btmColor} roughness={0.62} /></mesh>
          {/* 신발 (갈색 가죽) */}
          <mesh position={[0, 0.04, 0.1]}>
            <boxGeometry args={[0.14, 0.12, 0.3]} />
            <meshStandardMaterial color={shoeColor} roughness={0.48} />
          </mesh>
          <mesh position={[0, -0.015, 0.1]}>
            <boxGeometry args={[0.145, 0.036, 0.31]} />
            <meshStandardMaterial color={soleColor} roughness={0.7} />
          </mesh>
        </group>
      ))}

      {/* ══ 아이템 ══ */}
      <Hat item={hatItem} />
      <Scarf item={scarfItem} />
      <TopDetail item={topItem} topColor={topColor} />
      <BottomDetail item={bottomItem} btmColor={btmColor} skinColor={skinColor} />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────
// 씬
// ─────────────────────────────────────────────────────────────────
function Scene({ equipped, avatar, difficulty = "beginner" }: AvatarProps) {
  const accentColor =
    difficulty === "beginner"       ? "#22c55e"
    : difficulty === "intermediate" ? "#3b82f6"
    :                                 "#f59e0b";

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0.6, 3.6]} fov={48} />

      <ambientLight intensity={0.75} />
      <directionalLight position={[2.5, 5.5, 4]} intensity={2.4} color="#f0fff4" />
      <directionalLight position={[-2, 2.5, -3]} intensity={0.55} color="#a8d5b8" />
      <pointLight position={[0, -0.2, 1.8]} intensity={0.9} color={accentColor} distance={4.5} />
      <directionalLight position={[0, 0.5, -5]} intensity={0.4} color="#b8dfc8" />

      {/* 배경 */}
      <mesh position={[0, 0.5, -4.2]}>
        <planeGeometry args={[16, 14]} />
        <meshBasicMaterial color="#071a10" />
      </mesh>

      <HumanoidAvatar equipped={equipped} avatar={avatar} />

      <OrbitControls
        target={[0, 0.7, 0]}
        enablePan={false}
        minDistance={2}
        maxDistance={5.5}
        maxPolarAngle={Math.PI / 1.65}
        minPolarAngle={Math.PI / 6}
      />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────
// 외부 컴포넌트
// ─────────────────────────────────────────────────────────────────
interface Avatar3DProps {
  equipped:    EquippedItems;
  avatar?:     "male" | "female";
  difficulty?: Difficulty;
  className?:  string;
}

export function Avatar3D({ equipped, avatar = "male", difficulty = "beginner", className }: Avatar3DProps) {
  return (
    <div
      className={className ?? "w-full h-full"}
      style={{ background: "linear-gradient(170deg, #071a10 0%, #0d2b1a 45%, #071a10 100%)" }}
    >
      <Canvas>
        <Suspense fallback={null}>
          <Scene equipped={equipped} avatar={avatar} difficulty={difficulty} />
        </Suspense>
      </Canvas>
    </div>
  );
}
