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
  if (!id) return undefined;
  return WARDROBE_ITEMS.find((i) => i.id === id);
}

// ── 배경 그라디언트 쿼드 ──────────────────────────────────────────
function BackgroundGrad() {
  return (
    <mesh position={[0, 0.5, -4]}>
      <planeGeometry args={[14, 12]} />
      <meshBasicMaterial color="#1c1432" />
    </mesh>
  );
}

// ── 머리카락 ─────────────────────────────────────────────────────
function Hair({ avatar }: { avatar: "male" | "female" }) {
  const dark = "#1a0d00";
  const mid  = "#2d1600";

  if (avatar === "male") {
    return (
      <group>
        {/* 헤어 캡 */}
        <mesh position={[0, 2.18, 0]}>
          <sphereGeometry args={[0.315, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
          <meshStandardMaterial color={dark} roughness={0.75} />
        </mesh>
        {/* 앞머리 스파이크 */}
        {([-0.16, -0.06, 0.06, 0.16] as const).map((x, i) => (
          <mesh key={i} position={[x, 2.3 + (i % 2 === 0 ? 0.04 : 0), 0.22]} rotation={[0.35, 0, x * 0.5]}>
            <coneGeometry args={[0.045, 0.18, 6]} />
            <meshStandardMaterial color={mid} roughness={0.7} />
          </mesh>
        ))}
        {/* 옆머리 */}
        <mesh position={[-0.285, 2.04, 0.05]}>
          <boxGeometry args={[0.09, 0.28, 0.2]} />
          <meshStandardMaterial color={dark} />
        </mesh>
        <mesh position={[0.285, 2.04, 0.05]}>
          <boxGeometry args={[0.09, 0.28, 0.2]} />
          <meshStandardMaterial color={dark} />
        </mesh>
      </group>
    );
  }

  return (
    <group>
      {/* 헤어 캡 */}
      <mesh position={[0, 2.18, 0]}>
        <sphereGeometry args={[0.318, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
        <meshStandardMaterial color={dark} roughness={0.65} />
      </mesh>
      {/* 앞머리 */}
      <mesh position={[-0.11, 2.3, 0.22]} rotation={[0.3, 0, 0.15]}>
        <boxGeometry args={[0.14, 0.1, 0.07]} />
        <meshStandardMaterial color={mid} />
      </mesh>
      <mesh position={[0.11, 2.3, 0.22]} rotation={[0.3, 0, -0.15]}>
        <boxGeometry args={[0.14, 0.1, 0.07]} />
        <meshStandardMaterial color={mid} />
      </mesh>
      {/* 긴 옆머리 */}
      <mesh position={[-0.27, 1.88, 0.04]}>
        <boxGeometry args={[0.1, 0.62, 0.18]} />
        <meshStandardMaterial color={dark} />
      </mesh>
      <mesh position={[0.27, 1.88, 0.04]}>
        <boxGeometry args={[0.1, 0.62, 0.18]} />
        <meshStandardMaterial color={dark} />
      </mesh>
      {/* 뒷머리 */}
      <mesh position={[0, 1.8, -0.22]}>
        <boxGeometry args={[0.52, 0.7, 0.12]} />
        <meshStandardMaterial color={dark} />
      </mesh>
    </group>
  );
}

// ── 얼굴 (눈·코·입·눈썹) ─────────────────────────────────────────
// 모든 좌표는 body group (position [0,-1.1,0]) 기준
function FaceFeatures({ avatar, skinColor }: { avatar: "male" | "female"; skinColor: string }) {
  const lEyeRef  = useRef<THREE.Group>(null!);
  const rEyeRef  = useRef<THREE.Group>(null!);
  const blinkT   = useRef(0);
  const blinking = useRef(false);
  // 눈 색 (남=파랑, 여=보라)
  const irisColor = avatar === "male" ? "#2251a3" : "#6b21a8";
  // 코 색 (피부보다 살짝 어둡게)
  const noseColor = avatar === "male" ? "#e0a882" : "#edb99a";

  useFrame((_, dt) => {
    blinkT.current += dt;
    if (!blinking.current && blinkT.current > 3 + Math.random() * 2.5) {
      blinking.current = true;
      blinkT.current   = 0;
    }
    const scaleY = blinking.current
      ? blinkT.current < 0.07 ? Math.max(0.05, 1 - blinkT.current / 0.07)
        : blinkT.current < 0.13 ? Math.max(0.05, (blinkT.current - 0.07) / 0.06)
        : 1
      : 1;
    if (lEyeRef.current)  lEyeRef.current.scale.y  = scaleY;
    if (rEyeRef.current)  rEyeRef.current.scale.y  = scaleY;
    if (blinking.current && blinkT.current > 0.16) blinking.current = false;
  });

  // 눈 하나를 그리는 헬퍼 (x좌표만 다름)
  const Eye = ({ x }: { x: number }) => (
    <group position={[x, 2.22, 0]}>
      {/* 흰자 — 약간 눌린 타원형 */}
      <mesh scale={[1, 0.8, 0.75]} position={[0, 0, 0.265]}>
        <sphereGeometry args={[0.068, 18, 18]} />
        <meshStandardMaterial color="#f8f8f8" roughness={0.1} />
      </mesh>
      {/* 홍채 — 흰자 앞쪽에 돌출 */}
      <mesh position={[0, 0, 0.298]}>
        <sphereGeometry args={[0.044, 14, 14]} />
        <meshStandardMaterial color={irisColor} roughness={0.2} metalness={0.1} />
      </mesh>
      {/* 동공 */}
      <mesh position={[0, 0, 0.319]}>
        <sphereGeometry args={[0.024, 12, 12]} />
        <meshStandardMaterial color="#090909" roughness={0.0} />
      </mesh>
      {/* 하이라이트 */}
      <mesh position={[0.018, 0.018, 0.33]}>
        <sphereGeometry args={[0.012, 8, 8]} />
        <meshStandardMaterial color="#ffffff" roughness={0} />
      </mesh>
      <mesh position={[-0.014, -0.01, 0.328]}>
        <sphereGeometry args={[0.007, 6, 6]} />
        <meshStandardMaterial color="#ddeeff" roughness={0} />
      </mesh>
      {/* 아이라인 (위 눈꺼풀 느낌) */}
      <mesh position={[0, 0.054, 0.287]} rotation={[0.15, 0, 0]}>
        <boxGeometry args={[0.115, 0.018, 0.012]} />
        <meshStandardMaterial color="#0d0d0d" />
      </mesh>
    </group>
  );

  return (
    <group>
      {/* ── 눈썹 ── */}
      <mesh position={[-0.115, 2.305, 0.268]} rotation={[0, 0, avatar === "male" ? 0.12 : 0.08]}>
        <boxGeometry args={[0.1, 0.018, 0.015]} />
        <meshStandardMaterial color="#160900" />
      </mesh>
      <mesh position={[0.115, 2.305, 0.268]} rotation={[0, 0, avatar === "male" ? -0.12 : -0.08]}>
        <boxGeometry args={[0.1, 0.018, 0.015]} />
        <meshStandardMaterial color="#160900" />
      </mesh>

      {/* ── 눈 (깜빡임 그룹) ── */}
      <group ref={lEyeRef}><Eye x={-0.115} /></group>
      <group ref={rEyeRef}><Eye x={ 0.115} /></group>

      {/* ── 코 ── */}
      {/* 코 기둥 (아주 살짝 튀어나온 타원) */}
      <mesh position={[0, 2.1, 0.295]} scale={[0.7, 1, 0.55]}>
        <sphereGeometry args={[0.032, 10, 10]} />
        <meshStandardMaterial color={noseColor} roughness={0.8} />
      </mesh>
      {/* 콧망울 힌트 */}
      <mesh position={[-0.028, 2.09, 0.286]}>
        <sphereGeometry args={[0.018, 8, 8]} />
        <meshStandardMaterial color={noseColor} roughness={0.8} />
      </mesh>
      <mesh position={[0.028, 2.09, 0.286]}>
        <sphereGeometry args={[0.018, 8, 8]} />
        <meshStandardMaterial color={noseColor} roughness={0.8} />
      </mesh>

      {/* ── 입 ── */}
      {/* 윗입술 */}
      <mesh position={[0, 1.985, 0.284]}>
        <boxGeometry args={[0.1, 0.022, 0.014]} />
        <meshStandardMaterial color="#c05060" roughness={0.5} />
      </mesh>
      {/* 아랫입술 (더 두툼) */}
      <mesh position={[0, 1.963, 0.287]} scale={[1, 0.85, 1]}>
        <sphereGeometry args={[0.038, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        <meshStandardMaterial color="#d06070" roughness={0.4} />
      </mesh>
      {/* 입꼬리 (미소 힌트) */}
      <mesh position={[-0.054, 1.978, 0.279]} rotation={[0, 0, 0.55]}>
        <boxGeometry args={[0.028, 0.014, 0.01]} />
        <meshStandardMaterial color="#b04055" />
      </mesh>
      <mesh position={[0.054, 1.978, 0.279]} rotation={[0, 0, -0.55]}>
        <boxGeometry args={[0.028, 0.014, 0.01]} />
        <meshStandardMaterial color="#b04055" />
      </mesh>
    </group>
  );
}

// ── 귀 ─────────────────────────────────────────────────────────
function Ears({ skinColor }: { skinColor: string }) {
  return (
    <>
      <mesh position={[-0.305, 2.12, 0]}>
        <sphereGeometry args={[0.076, 10, 10]} />
        <meshStandardMaterial color={skinColor} roughness={0.7} />
      </mesh>
      <mesh position={[0.305, 2.12, 0]}>
        <sphereGeometry args={[0.076, 10, 10]} />
        <meshStandardMaterial color={skinColor} roughness={0.7} />
      </mesh>
    </>
  );
}

// ── 모자 ──────────────────────────────────────────────────────────
function Hat({ item }: { item?: WardrobeItem }) {
  if (!item) return null;
  const c = new THREE.Color(item.color);
  const a = item.accentColor ? new THREE.Color(item.accentColor) : c;

  if (item.id === "hat_crown") {
    return (
      <group position={[0, 2.52, 0]}>
        <mesh>
          <torusGeometry args={[0.26, 0.058, 8, 28]} />
          <meshStandardMaterial color={c} metalness={0.9} roughness={0.1} />
        </mesh>
        {[0, 72, 144, 216, 288].map((deg, i) => {
          const angle = (deg * Math.PI) / 180;
          return (
            <mesh key={i} position={[Math.sin(angle) * 0.21, 0.17, Math.cos(angle) * 0.21]}>
              <cylinderGeometry args={[0.022, 0.03, 0.22, 5]} />
              <meshStandardMaterial color={a} metalness={0.9} roughness={0.1} />
            </mesh>
          );
        })}
      </group>
    );
  }
  if (item.id === "hat_silk") {
    return (
      <group position={[0, 2.48, 0]}>
        <mesh><cylinderGeometry args={[0.26, 0.26, 0.04, 28]} /><meshStandardMaterial color={a} /></mesh>
        <mesh position={[0, 0.24, 0]}><cylinderGeometry args={[0.22, 0.22, 0.42, 28]} /><meshStandardMaterial color={c} /></mesh>
      </group>
    );
  }
  if (item.id === "hat_fedora") {
    return (
      <group position={[0, 2.48, 0]}>
        <mesh><cylinderGeometry args={[0.31, 0.31, 0.04, 28]} /><meshStandardMaterial color={c} /></mesh>
        <mesh position={[0, 0.18, 0]}><cylinderGeometry args={[0.22, 0.25, 0.3, 24]} /><meshStandardMaterial color={c} /></mesh>
      </group>
    );
  }
  if (item.id === "hat_hunting") {
    return (
      <group position={[0, 2.46, 0]}>
        <mesh><sphereGeometry args={[0.27, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color={c} /></mesh>
        <mesh position={[0, -0.02, 0.19]}><boxGeometry args={[0.24, 0.04, 0.15]} /><meshStandardMaterial color={c} /></mesh>
      </group>
    );
  }
  if (item.id === "hat_bungeo") {
    return (
      <group position={[0, 2.44, 0]}>
        <mesh><cylinderGeometry args={[0.29, 0.29, 0.04, 24]} /><meshStandardMaterial color={c} /></mesh>
        <mesh position={[0, 0.14, 0]}><sphereGeometry args={[0.25, 16, 8, 0, Math.PI * 2, 0, Math.PI / 1.3]} /><meshStandardMaterial color={c} /></mesh>
      </group>
    );
  }
  return (
    <group position={[0, 2.48, 0]}>
      <mesh><cylinderGeometry args={[0.31, 0.31, 0.04, 24]} /><meshStandardMaterial color={c} /></mesh>
      <mesh position={[0, 0.14, 0.04]}><sphereGeometry args={[0.25, 16, 10, 0, Math.PI * 2, 0, Math.PI / 1.5]} /><meshStandardMaterial color={c} /></mesh>
    </group>
  );
}

// ── 목걸이/시계/신발 ─────────────────────────────────────────────
function Scarf({ item }: { item?: WardrobeItem }) {
  if (!item) return null;
  const c = new THREE.Color(item.color);
  const a = item.accentColor ? new THREE.Color(item.accentColor) : c;

  if (item.id === "scarf_smartwatch" || item.id === "scarf_gold_watch") {
    return (
      <group position={[-0.45, 1.44, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.07, 0.02, 8, 20]} />
          <meshStandardMaterial color={c} metalness={0.8} roughness={0.15} />
        </mesh>
        <mesh><boxGeometry args={[0.07, 0.07, 0.022]} /><meshStandardMaterial color={item.id === "scarf_smartwatch" ? "#10B981" : "#F6C90E"} /></mesh>
      </group>
    );
  }
  if (item.id === "scarf_canvas_shoes") {
    return (
      <group>
        {[-0.16, 0.16].map((x, i) => (
          <mesh key={i} position={[x, 0.06, 0.14]}>
            <boxGeometry args={[0.14, 0.1, 0.28]} />
            <meshStandardMaterial color={c} />
          </mesh>
        ))}
      </group>
    );
  }
  return (
    <group position={[0, 1.92, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.17, 0.052, 8, 24]} />
        <meshStandardMaterial color={c} />
      </mesh>
      <mesh position={[0.06, -0.14, 0.13]}>
        <boxGeometry args={[0.07, 0.24, 0.065]} />
        <meshStandardMaterial color={a} />
      </mesh>
    </group>
  );
}

// ── 메인 아바타 캐릭터 ─────────────────────────────────────────────
function HumanoidAvatar({ equipped, avatar }: AvatarProps) {
  const bodyRef      = useRef<THREE.Group>(null!);
  const leftArmRef   = useRef<THREE.Group>(null!);
  const rightArmRef  = useRef<THREE.Group>(null!);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    // 부드러운 부유 / 호흡 애니메이션
    if (bodyRef.current) {
      bodyRef.current.position.y = -1.1 + Math.sin(t * 1.2) * 0.038;
      bodyRef.current.rotation.y = Math.sin(t * 0.4) * 0.04;
    }
    // 팔 미세 흔들기
    if (leftArmRef.current)  leftArmRef.current.rotation.z  =  0.16 + Math.sin(t * 1.2 + Math.PI) * 0.05;
    if (rightArmRef.current) rightArmRef.current.rotation.z = -0.16 + Math.sin(t * 1.2) * 0.05;
  });

  const hatItem    = getItem(equipped.hat);
  const topItem    = getItem(equipped.top);
  const bottomItem = getItem(equipped.bottom);
  const scarfItem  = getItem(equipped.scarf);

  const skinColor   = avatar === "male" ? "#F5C9A0" : "#FBDAC6";
  const topColor    = topItem    ? topItem.color    : avatar === "male" ? "#3b4f7c" : "#7c3aed";
  const bottomColor = bottomItem ? bottomItem.color : avatar === "male" ? "#1e3a5f" : "#5b21b6";
  // 신발: 진한 갈색 (검정 제거)
  const shoeColor   = "#5a3010";
  const soleColor   = "#7a4a20";

  return (
    <group ref={bodyRef} position={[0, -1.1, 0]}>

      {/* ═══ 머리 ═══ */}
      <mesh position={[0, 2.14, 0]}>
        <sphereGeometry args={[0.305, 28, 28]} />
        <meshStandardMaterial color={skinColor} roughness={0.55} />
      </mesh>

      <Ears skinColor={skinColor} />
      <FaceFeatures avatar={avatar} skinColor={skinColor} />
      <Hair avatar={avatar} />

      {/* ═══ 목 ═══ */}
      <mesh position={[0, 1.84, 0]}>
        <cylinderGeometry args={[0.105, 0.1, 0.22, 14]} />
        <meshStandardMaterial color={skinColor} roughness={0.6} />
      </mesh>

      {/* ═══ 어깨 패드 (로스트아크 느낌) ═══ */}
      <mesh position={[-0.38, 1.72, 0]}>
        <sphereGeometry args={[0.13, 12, 10]} />
        <meshStandardMaterial color={topColor} roughness={0.5} metalness={0.25} />
      </mesh>
      <mesh position={[0.38, 1.72, 0]}>
        <sphereGeometry args={[0.13, 12, 10]} />
        <meshStandardMaterial color={topColor} roughness={0.5} metalness={0.25} />
      </mesh>

      {/* ═══ 몸통 ═══ */}
      <mesh position={[0, 1.38, 0]}>
        <boxGeometry args={[0.56, 0.68, 0.27]} />
        <meshStandardMaterial color={topColor} roughness={0.6} />
      </mesh>
      {/* 몸통 앞 디테일 라인 */}
      <mesh position={[0, 1.38, 0.137]}>
        <boxGeometry args={[0.08, 0.6, 0.008]} />
        <meshStandardMaterial color={topColor} roughness={0.3} metalness={0.4} />
      </mesh>

      {/* ═══ 왼팔 ═══ */}
      <group ref={leftArmRef} position={[-0.39, 1.55, 0]}>
        {/* 위팔 */}
        <mesh><cylinderGeometry args={[0.09, 0.08, 0.44, 12]} /><meshStandardMaterial color={topColor} roughness={0.6} /></mesh>
        {/* 아래팔 */}
        <mesh position={[0, -0.42, 0]}><cylinderGeometry args={[0.078, 0.072, 0.36, 12]} /><meshStandardMaterial color={skinColor} roughness={0.6} /></mesh>
        {/* 손 */}
        <mesh position={[0, -0.64, 0]}><sphereGeometry args={[0.088, 12, 12]} /><meshStandardMaterial color={skinColor} roughness={0.5} /></mesh>
      </group>

      {/* ═══ 오른팔 ═══ */}
      <group ref={rightArmRef} position={[0.39, 1.55, 0]}>
        <mesh><cylinderGeometry args={[0.09, 0.08, 0.44, 12]} /><meshStandardMaterial color={topColor} roughness={0.6} /></mesh>
        <mesh position={[0, -0.42, 0]}><cylinderGeometry args={[0.078, 0.072, 0.36, 12]} /><meshStandardMaterial color={skinColor} roughness={0.6} /></mesh>
        <mesh position={[0, -0.64, 0]}><sphereGeometry args={[0.088, 12, 12]} /><meshStandardMaterial color={skinColor} roughness={0.5} /></mesh>
      </group>

      {/* ═══ 허리띠 ═══ */}
      <mesh position={[0, 1.03, 0]}>
        <boxGeometry args={[0.58, 0.1, 0.29]} />
        <meshStandardMaterial color="#2a1a08" roughness={0.4} metalness={0.3} />
      </mesh>
      {/* 버클 */}
      <mesh position={[0, 1.03, 0.148]}>
        <boxGeometry args={[0.1, 0.08, 0.01]} />
        <meshStandardMaterial color="#c9a227" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* ═══ 힙 ═══ */}
      <mesh position={[0, 0.94, 0]}>
        <boxGeometry args={[0.52, 0.22, 0.26]} />
        <meshStandardMaterial color={bottomColor} roughness={0.65} />
      </mesh>

      {/* ═══ 다리 ═══ */}
      {([-0.16, 0.16] as const).map((x, idx) => (
        <group key={idx} position={[x, 0, 0]}>
          {/* 위 다리 */}
          <mesh position={[0, 0.64, 0]}><cylinderGeometry args={[0.115, 0.105, 0.48, 14]} /><meshStandardMaterial color={bottomColor} roughness={0.6} /></mesh>
          {/* 무릎 패드 */}
          <mesh position={[0, 0.41, 0.1]}><sphereGeometry args={[0.07, 8, 8]} /><meshStandardMaterial color={bottomColor} roughness={0.3} metalness={0.3} /></mesh>
          {/* 아래 다리 */}
          <mesh position={[0, 0.25, 0]}><cylinderGeometry args={[0.095, 0.085, 0.36, 14]} /><meshStandardMaterial color={bottomColor} roughness={0.6} /></mesh>
          {/* 신발 (갈색) */}
          <mesh position={[0, 0.05, 0.1]}>
            <boxGeometry args={[0.15, 0.12, 0.3]} />
            <meshStandardMaterial color={shoeColor} roughness={0.5} />
          </mesh>
          {/* 신발 밑창 (더 밝은 갈색) */}
          <mesh position={[0, -0.01, 0.1]}>
            <boxGeometry args={[0.155, 0.04, 0.31]} />
            <meshStandardMaterial color={soleColor} roughness={0.7} />
          </mesh>
        </group>
      ))}

      {/* ═══ 아이템 ═══ */}
      <Hat item={hatItem} />
      <Scarf item={scarfItem} />
    </group>
  );
}

// ── 씬 ────────────────────────────────────────────────────────────
function Scene({ equipped, avatar, difficulty = "beginner" }: AvatarProps) {
  const diffuseColor =
    difficulty === "beginner"     ? "#34d399"
    : difficulty === "intermediate" ? "#60a5fa"
    : "#fbbf24";

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0.55, 3.5]} fov={50} />

      {/* 조명: 로스트아크 스타일 — 밝고 드라마틱 */}
      <ambientLight intensity={0.7} />
      <directionalLight position={[2.5, 5, 4]} intensity={2.2} color="#fff8f0" />
      <directionalLight position={[-2.5, 2, -3]} intensity={0.6} color="#b8d4ff" />
      {/* 캐릭터 아래서 올라오는 난이도 색 반사 */}
      <pointLight position={[0, -0.5, 1.5]} intensity={1.0} color={diffuseColor} distance={4} />
      {/* 림라이트 */}
      <directionalLight position={[0, 1, -5]} intensity={0.5} color="#c4b5fd" />

      <BackgroundGrad />
      <HumanoidAvatar equipped={equipped} avatar={avatar} />

      <OrbitControls
        target={[0, 0.6, 0]}
        enablePan={false}
        minDistance={2}
        maxDistance={5.5}
        maxPolarAngle={Math.PI / 1.65}
        minPolarAngle={Math.PI / 6}
      />
    </>
  );
}

// ── 외부 컴포넌트 ─────────────────────────────────────────────────
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
      style={{
        background: "linear-gradient(170deg, #0d0a1f 0%, #1c1432 45%, #0f2040 100%)",
      }}
    >
      <Canvas>
        <Suspense fallback={null}>
          <Scene equipped={equipped} avatar={avatar} difficulty={difficulty} />
        </Suspense>
      </Canvas>
    </div>
  );
}
