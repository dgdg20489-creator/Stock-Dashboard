import { useRef, Suspense, useEffect, useState } from "react";
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

// ── 스테이지 플랫폼 ─────────────────────────────────────────────
function StagePlatform({ difficulty = "beginner" }: { difficulty?: Difficulty }) {
  const ringRef = useRef<THREE.Mesh>(null!);
  const diskRef = useRef<THREE.Mesh>(null!);

  const COLORS = {
    beginner:     { ring: "#34d399", disk: "#10b981", light: "#6ee7b7" },
    intermediate: { ring: "#60a5fa", disk: "#3b82f6", light: "#93c5fd" },
    expert:       { ring: "#fbbf24", disk: "#f59e0b", light: "#fde68a" },
  };
  const col = COLORS[difficulty];

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ringRef.current) {
      const mat = ringRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.35 + Math.sin(t * 1.4) * 0.15;
      ringRef.current.scale.x = 1 + Math.sin(t * 0.8) * 0.025;
      ringRef.current.scale.y = 1 + Math.sin(t * 0.8) * 0.025;
    }
    if (diskRef.current) {
      const mat = diskRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.12 + Math.sin(t * 1.1 + 1) * 0.06;
    }
  });

  return (
    <group position={[0, -1.08, 0]}>
      {/* 플랫폼 본체 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <cylinderGeometry args={[0.92, 0.92, 0.09, 48]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* 상단 테두리 링 */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.048, 0]}>
        <ringGeometry args={[0.76, 0.92, 56]} />
        <meshBasicMaterial color={col.ring} transparent side={THREE.DoubleSide} />
      </mesh>
      {/* 안쪽 글로우 디스크 */}
      <mesh ref={diskRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.049, 0]}>
        <circleGeometry args={[0.76, 48]} />
        <meshBasicMaterial color={col.disk} transparent side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// ── 별/반짝이 배경 파티클 ──────────────────────────────────────
function BackgroundStars() {
  const starsRef = useRef<THREE.Points>(null!);

  const { positions, sizes } = (() => {
    const count = 80;
    const pos = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 8;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 7;
      pos[i * 3 + 2] = -2 - Math.random() * 3;
      sz[i] = 0.02 + Math.random() * 0.04;
    }
    return { positions: pos, sizes: sz };
  })();

  useFrame(({ clock }) => {
    if (starsRef.current) {
      const mat = starsRef.current.material as THREE.PointsMaterial;
      mat.opacity = 0.35 + Math.sin(clock.getElapsedTime() * 0.6) * 0.15;
    }
  });

  return (
    <points ref={starsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#ffffff" size={0.04} transparent opacity={0.4} sizeAttenuation />
    </points>
  );
}

// ── 머리카락 ─────────────────────────────────────────────────────
function Hair({ avatar }: { avatar: "male" | "female" }) {
  const hairColor = avatar === "male" ? "#2d1b00" : "#1a0a00";
  const hl = new THREE.Color(hairColor);

  if (avatar === "male") {
    return (
      <group position={[0, 2.13, 0]}>
        {/* 기본 헤어 캡 */}
        <mesh position={[0, 0.1, 0]}>
          <sphereGeometry args={[0.31, 20, 20, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
          <meshStandardMaterial color={hl} roughness={0.8} />
        </mesh>
        {/* 앞머리 블록들 */}
        {[-0.14, 0, 0.14].map((x, i) => (
          <mesh key={i} position={[x, 0.14, 0.22]}>
            <boxGeometry args={[0.1, 0.12, 0.08]} />
            <meshStandardMaterial color={hl} roughness={0.8} />
          </mesh>
        ))}
        {/* 옆머리 */}
        <mesh position={[-0.27, -0.04, 0.02]}>
          <boxGeometry args={[0.08, 0.2, 0.18]} />
          <meshStandardMaterial color={hl} roughness={0.8} />
        </mesh>
        <mesh position={[0.27, -0.04, 0.02]}>
          <boxGeometry args={[0.08, 0.2, 0.18]} />
          <meshStandardMaterial color={hl} roughness={0.8} />
        </mesh>
      </group>
    );
  }

  return (
    <group position={[0, 2.13, 0]}>
      {/* 헤어 캡 */}
      <mesh position={[0, 0.1, 0]}>
        <sphereGeometry args={[0.315, 20, 20, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        <meshStandardMaterial color={hl} roughness={0.7} />
      </mesh>
      {/* 긴 머리 (옆) */}
      <mesh position={[-0.24, -0.22, 0]}>
        <boxGeometry args={[0.1, 0.5, 0.18]} />
        <meshStandardMaterial color={hl} roughness={0.7} />
      </mesh>
      <mesh position={[0.24, -0.22, 0]}>
        <boxGeometry args={[0.1, 0.5, 0.18]} />
        <meshStandardMaterial color={hl} roughness={0.7} />
      </mesh>
      {/* 뒷머리 */}
      <mesh position={[0, -0.12, -0.18]}>
        <boxGeometry args={[0.46, 0.48, 0.12]} />
        <meshStandardMaterial color={hl} roughness={0.7} />
      </mesh>
      {/* 앞머리 */}
      <mesh position={[-0.1, 0.08, 0.24]} rotation={[0.2, 0, 0.1]}>
        <boxGeometry args={[0.12, 0.1, 0.06]} />
        <meshStandardMaterial color={hl} roughness={0.7} />
      </mesh>
      <mesh position={[0.1, 0.08, 0.24]} rotation={[0.2, 0, -0.1]}>
        <boxGeometry args={[0.12, 0.1, 0.06]} />
        <meshStandardMaterial color={hl} roughness={0.7} />
      </mesh>
    </group>
  );
}

// ── 얼굴 ──────────────────────────────────────────────────────────
function Face({ avatar, skinColor }: { avatar: "male" | "female"; skinColor: string }) {
  const leftEyeRef = useRef<THREE.Group>(null!);
  const rightEyeRef = useRef<THREE.Group>(null!);
  const blinkTimer = useRef(0);
  const isBlinking = useRef(false);

  useFrame((_, delta) => {
    blinkTimer.current += delta;
    if (!isBlinking.current && blinkTimer.current > 3.2 + Math.random() * 2) {
      isBlinking.current = true;
      blinkTimer.current = 0;
    }
    if (isBlinking.current) {
      const scaleY = blinkTimer.current < 0.06 ? 1 - blinkTimer.current / 0.06
        : blinkTimer.current < 0.12 ? blinkTimer.current / 0.06 - 1 : 1;
      const s = Math.max(0.05, Math.abs(scaleY));
      if (leftEyeRef.current) leftEyeRef.current.scale.y = s;
      if (rightEyeRef.current) rightEyeRef.current.scale.y = s;
      if (blinkTimer.current > 0.15) isBlinking.current = false;
    } else {
      if (leftEyeRef.current) leftEyeRef.current.scale.y = 1;
      if (rightEyeRef.current) rightEyeRef.current.scale.y = 1;
    }
  });

  const eyeColor = avatar === "male" ? "#1e3a5f" : "#4a1942";

  return (
    <group position={[0, 2.14, 0]}>
      {/* 왼쪽 눈 */}
      <group ref={leftEyeRef} position={[-0.115, 0.06, 0.275]}>
        {/* 흰자 */}
        <mesh>
          <sphereGeometry args={[0.055, 12, 12]} />
          <meshStandardMaterial color="#ffffff" roughness={0.1} />
        </mesh>
        {/* 홍채 */}
        <mesh position={[0, 0, 0.025]}>
          <circleGeometry args={[0.038, 16]} />
          <meshStandardMaterial color={eyeColor} />
        </mesh>
        {/* 동공 */}
        <mesh position={[0, 0, 0.03]}>
          <circleGeometry args={[0.02, 12]} />
          <meshStandardMaterial color="#0d0d0d" />
        </mesh>
        {/* 하이라이트 */}
        <mesh position={[0.016, 0.016, 0.036]}>
          <circleGeometry args={[0.01, 8]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      </group>

      {/* 오른쪽 눈 */}
      <group ref={rightEyeRef} position={[0.115, 0.06, 0.275]}>
        <mesh>
          <sphereGeometry args={[0.055, 12, 12]} />
          <meshStandardMaterial color="#ffffff" roughness={0.1} />
        </mesh>
        <mesh position={[0, 0, 0.025]}>
          <circleGeometry args={[0.038, 16]} />
          <meshStandardMaterial color={eyeColor} />
        </mesh>
        <mesh position={[0, 0, 0.03]}>
          <circleGeometry args={[0.02, 12]} />
          <meshStandardMaterial color="#0d0d0d" />
        </mesh>
        <mesh position={[0.016, 0.016, 0.036]}>
          <circleGeometry args={[0.01, 8]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      </group>

      {/* 왼쪽 눈썹 */}
      <mesh position={[-0.115, 0.135, 0.275]} rotation={[0, 0, 0.18]}>
        <boxGeometry args={[0.085, 0.016, 0.012]} />
        <meshStandardMaterial color={avatar === "male" ? "#1a0e00" : "#2d1500"} />
      </mesh>
      {/* 오른쪽 눈썹 */}
      <mesh position={[0.115, 0.135, 0.275]} rotation={[0, 0, -0.18]}>
        <boxGeometry args={[0.085, 0.016, 0.012]} />
        <meshStandardMaterial color={avatar === "male" ? "#1a0e00" : "#2d1500"} />
      </mesh>

      {/* 입 (미소) */}
      <mesh position={[-0.04, -0.06, 0.272]} rotation={[0, 0, 0.4]}>
        <boxGeometry args={[0.055, 0.015, 0.01]} />
        <meshStandardMaterial color="#c0645a" />
      </mesh>
      <mesh position={[0.04, -0.06, 0.272]} rotation={[0, 0, -0.4]}>
        <boxGeometry args={[0.055, 0.015, 0.01]} />
        <meshStandardMaterial color="#c0645a" />
      </mesh>

      {/* 볼터치 (블러시) */}
      <mesh position={[-0.205, -0.02, 0.245]} rotation={[0, 0.3, 0]}>
        <circleGeometry args={[0.054, 16]} />
        <meshBasicMaterial color="#ffb8b8" transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0.205, -0.02, 0.245]} rotation={[0, -0.3, 0]}>
        <circleGeometry args={[0.054, 16]} />
        <meshBasicMaterial color="#ffb8b8" transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
    </group>
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
          <torusGeometry args={[0.25, 0.055, 8, 24]} />
          <meshStandardMaterial color={c} metalness={0.9} roughness={0.1} />
        </mesh>
        {[0, 72, 144, 216, 288].map((deg, i) => {
          const angle = (deg * Math.PI) / 180;
          return (
            <mesh key={i} position={[Math.sin(angle) * 0.2, 0.16, Math.cos(angle) * 0.2]}>
              <cylinderGeometry args={[0.02, 0.03, 0.22, 5]} />
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
        <mesh>
          <cylinderGeometry args={[0.25, 0.25, 0.04, 24]} />
          <meshStandardMaterial color={a} />
        </mesh>
        <mesh position={[0, 0.24, 0]}>
          <cylinderGeometry args={[0.21, 0.21, 0.4, 24]} />
          <meshStandardMaterial color={c} />
        </mesh>
      </group>
    );
  }
  if (item.id === "hat_fedora") {
    return (
      <group position={[0, 2.48, 0]}>
        <mesh>
          <cylinderGeometry args={[0.3, 0.3, 0.04, 24]} />
          <meshStandardMaterial color={c} />
        </mesh>
        <mesh position={[0, 0.18, 0]}>
          <cylinderGeometry args={[0.21, 0.24, 0.3, 24]} />
          <meshStandardMaterial color={c} />
        </mesh>
      </group>
    );
  }
  if (item.id === "hat_hunting") {
    return (
      <group position={[0, 2.46, 0]}>
        <mesh>
          <sphereGeometry args={[0.26, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={c} />
        </mesh>
        <mesh position={[0, -0.02, 0.18]}>
          <boxGeometry args={[0.22, 0.04, 0.14]} />
          <meshStandardMaterial color={c} />
        </mesh>
      </group>
    );
  }
  if (item.id === "hat_bungeo") {
    return (
      <group position={[0, 2.44, 0]}>
        <mesh>
          <cylinderGeometry args={[0.28, 0.28, 0.04, 24]} />
          <meshStandardMaterial color={c} />
        </mesh>
        <mesh position={[0, 0.14, 0]}>
          <sphereGeometry args={[0.24, 16, 8, 0, Math.PI * 2, 0, Math.PI / 1.3]} />
          <meshStandardMaterial color={c} />
        </mesh>
      </group>
    );
  }
  return (
    <group position={[0, 2.48, 0]}>
      <mesh>
        <cylinderGeometry args={[0.3, 0.3, 0.04, 24]} />
        <meshStandardMaterial color={c} />
      </mesh>
      <mesh position={[0, 0.14, 0.04]}>
        <sphereGeometry args={[0.24, 16, 10, 0, Math.PI * 2, 0, Math.PI / 1.5]} />
        <meshStandardMaterial color={c} />
      </mesh>
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
      <group position={[-0.44, 1.44, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.07, 0.02, 8, 20]} />
          <meshStandardMaterial color={c} metalness={0.8} roughness={0.15} />
        </mesh>
        <mesh>
          <boxGeometry args={[0.07, 0.07, 0.02]} />
          <meshStandardMaterial color={item.id === "scarf_smartwatch" ? "#10B981" : "#F6C90E"} />
        </mesh>
      </group>
    );
  }
  if (item.id === "scarf_canvas_shoes") {
    return (
      <group>
        {[-0.15, 0.15].map((x, i) => (
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
        <torusGeometry args={[0.17, 0.05, 8, 24]} />
        <meshStandardMaterial color={c} />
      </mesh>
      <mesh position={[0.06, -0.14, 0.13]}>
        <boxGeometry args={[0.07, 0.24, 0.06]} />
        <meshStandardMaterial color={a} />
      </mesh>
    </group>
  );
}

// ── 메인 아바타 캐릭터 ─────────────────────────────────────────────
function HumanoidAvatar({ equipped, avatar }: AvatarProps) {
  const bodyRef = useRef<THREE.Group>(null!);
  const leftArmRef = useRef<THREE.Group>(null!);
  const rightArmRef = useRef<THREE.Group>(null!);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    // 숨쉬기/떠있기 애니메이션
    if (bodyRef.current) {
      bodyRef.current.position.y = -1.1 + Math.sin(t * 1.3) * 0.04;
    }
    // 팔 흔들기
    if (leftArmRef.current) {
      leftArmRef.current.rotation.z = 0.18 + Math.sin(t * 1.3 + Math.PI) * 0.06;
    }
    if (rightArmRef.current) {
      rightArmRef.current.rotation.z = -0.18 + Math.sin(t * 1.3) * 0.06;
    }
  });

  const hatItem  = getItem(equipped.hat);
  const topItem  = getItem(equipped.top);
  const bottomItem = getItem(equipped.bottom);
  const scarfItem = getItem(equipped.scarf);

  const skinColor  = avatar === "male" ? "#F4CBA8" : "#FBDAC6";
  const topColor   = topItem   ? topItem.color   : avatar === "male" ? "#374151" : "#db7093";
  const bottomColor = bottomItem ? bottomItem.color : avatar === "male" ? "#1E3A5F" : "#7c3aed";
  const shoeColor  = "#2c2c2c";

  return (
    <group ref={bodyRef} position={[0, -1.1, 0]}>
      {/* ── 머리 ── */}
      <mesh position={[0, 2.14, 0]}>
        <sphereGeometry args={[0.32, 28, 28]} />
        <meshStandardMaterial color={skinColor} roughness={0.6} />
      </mesh>

      {/* ── 얼굴 (눈, 눈썹, 입, 볼터치) ── */}
      <Face avatar={avatar} skinColor={skinColor} />

      {/* ── 머리카락 ── */}
      <Hair avatar={avatar} />

      {/* ── 귀 ── */}
      <mesh position={[-0.31, 2.12, 0]}>
        <sphereGeometry args={[0.075, 8, 8]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>
      <mesh position={[0.31, 2.12, 0]}>
        <sphereGeometry args={[0.075, 8, 8]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>

      {/* ── 목 ── */}
      <mesh position={[0, 1.84, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.22, 12]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>

      {/* ── 몸통 ── */}
      <mesh position={[0, 1.4, 0]}>
        <boxGeometry args={[0.58, 0.66, 0.28]} />
        <meshStandardMaterial color={topColor} roughness={0.7} />
      </mesh>

      {/* ── 왼팔 (위) ── */}
      <group ref={leftArmRef} position={[-0.39, 1.55, 0]}>
        <mesh>
          <cylinderGeometry args={[0.09, 0.08, 0.44, 10]} />
          <meshStandardMaterial color={topColor} />
        </mesh>
        {/* 왼팔 아래 */}
        <mesh position={[0, -0.4, 0]}>
          <cylinderGeometry args={[0.075, 0.07, 0.36, 10]} />
          <meshStandardMaterial color={skinColor} />
        </mesh>
        {/* 손 */}
        <mesh position={[0, -0.62, 0]}>
          <sphereGeometry args={[0.085, 10, 10]} />
          <meshStandardMaterial color={skinColor} />
        </mesh>
      </group>

      {/* ── 오른팔 (위) ── */}
      <group ref={rightArmRef} position={[0.39, 1.55, 0]}>
        <mesh>
          <cylinderGeometry args={[0.09, 0.08, 0.44, 10]} />
          <meshStandardMaterial color={topColor} />
        </mesh>
        <mesh position={[0, -0.4, 0]}>
          <cylinderGeometry args={[0.075, 0.07, 0.36, 10]} />
          <meshStandardMaterial color={skinColor} />
        </mesh>
        <mesh position={[0, -0.62, 0]}>
          <sphereGeometry args={[0.085, 10, 10]} />
          <meshStandardMaterial color={skinColor} />
        </mesh>
      </group>

      {/* ── 힙 ── */}
      <mesh position={[0, 0.98, 0]}>
        <boxGeometry args={[0.52, 0.2, 0.26]} />
        <meshStandardMaterial color={bottomColor} />
      </mesh>

      {/* ── 다리 ── */}
      {([-0.16, 0.16] as const).map((x, i) => (
        <group key={i} position={[x, 0, 0]}>
          <mesh position={[0, 0.66, 0]}>
            <cylinderGeometry args={[0.11, 0.1, 0.44, 12]} />
            <meshStandardMaterial color={bottomColor} />
          </mesh>
          <mesh position={[0, 0.25, 0]}>
            <cylinderGeometry args={[0.09, 0.085, 0.36, 12]} />
            <meshStandardMaterial color={bottomColor} />
          </mesh>
          {/* 발 */}
          <mesh position={[0, 0.05, 0.09]}>
            <boxGeometry args={[0.14, 0.1, 0.28]} />
            <meshStandardMaterial color={shoeColor} roughness={0.6} />
          </mesh>
          {/* 신발 밑창 */}
          <mesh position={[0, 0.0, 0.09]}>
            <boxGeometry args={[0.145, 0.04, 0.29]} />
            <meshStandardMaterial color="#555" />
          </mesh>
        </group>
      ))}

      {/* ── 아이템들 ── */}
      <Hat item={hatItem} />
      <Scarf item={scarfItem} />
    </group>
  );
}

// ── 씬 ────────────────────────────────────────────────────────────
function Scene({ equipped, avatar, difficulty = "beginner" }: AvatarProps) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0.6, 3.4]} fov={52} />

      {/* 조명 */}
      <ambientLight intensity={0.9} />
      <directionalLight position={[3, 6, 4]} intensity={1.6} castShadow />
      <directionalLight position={[-3, 3, -2]} intensity={0.5} color="#a8c4ff" />
      <pointLight position={[0, 4, 0]} intensity={0.8} color="#ffffff" />
      {/* 아래에서 올라오는 플랫폼 색 반사 */}
      <pointLight
        position={[0, -0.6, 0]}
        intensity={1.2}
        color={difficulty === "beginner" ? "#10b981" : difficulty === "intermediate" ? "#3b82f6" : "#f59e0b"}
        distance={3}
      />
      {/* 림라이트 */}
      <directionalLight position={[0, 0, -4]} intensity={0.35} color="#c4b5fd" />

      <BackgroundStars />
      <StagePlatform difficulty={difficulty} />
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
  equipped: EquippedItems;
  avatar?: "male" | "female";
  difficulty?: Difficulty;
  className?: string;
}

export function Avatar3D({ equipped, avatar = "male", difficulty = "beginner", className }: Avatar3DProps) {
  return (
    <div
      className={className ?? "w-full h-full"}
      style={{
        background: "linear-gradient(160deg, #0f0c29 0%, #1a1a2e 40%, #16213e 70%, #0f3460 100%)",
      }}
    >
      <Canvas shadows>
        <Suspense fallback={null}>
          <Scene equipped={equipped} avatar={avatar} difficulty={difficulty} />
        </Suspense>
      </Canvas>
    </div>
  );
}
