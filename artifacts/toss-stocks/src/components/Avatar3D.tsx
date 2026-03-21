import { useRef, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import type { EquippedItems } from "@/hooks/use-equipped";
import { WARDROBE_ITEMS, type WardrobeItem } from "@/data/wardrobe-items";

interface AvatarProps {
  equipped: EquippedItems;
  avatar: "male" | "female";
}

function getItem(id?: string): WardrobeItem | undefined {
  if (!id) return undefined;
  return WARDROBE_ITEMS.find((i) => i.id === id);
}

function Hat({ item }: { item?: WardrobeItem }) {
  if (!item) return null;
  const c = new THREE.Color(item.color);
  const a = item.accentColor ? new THREE.Color(item.accentColor) : c;

  if (item.id === "hat_crown") {
    return (
      <group position={[0, 2.42, 0]}>
        <mesh>
          <torusGeometry args={[0.25, 0.055, 8, 24]} />
          <meshStandardMaterial color={c} metalness={0.9} roughness={0.1} />
        </mesh>
        {[0, 72, 144, 216, 288].map((deg, i) => {
          const angle = (deg * Math.PI) / 180;
          return (
            <mesh key={i} position={[Math.sin(angle) * 0.2, 0.14, Math.cos(angle) * 0.2]}>
              <cylinderGeometry args={[0.02, 0.03, 0.2, 5]} />
              <meshStandardMaterial color={a} metalness={0.9} roughness={0.1} />
            </mesh>
          );
        })}
      </group>
    );
  }
  if (item.id === "hat_silk") {
    return (
      <group position={[0, 2.38, 0]}>
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.22, 0.22, 0.04, 24]} />
          <meshStandardMaterial color={a} />
        </mesh>
        <mesh position={[0, 0.22, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 0.38, 24]} />
          <meshStandardMaterial color={c} />
        </mesh>
        <mesh position={[0, 0.42, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 0.02, 24]} />
          <meshStandardMaterial color={c} />
        </mesh>
      </group>
    );
  }
  if (item.id === "hat_fedora") {
    return (
      <group position={[0, 2.38, 0]}>
        <mesh>
          <cylinderGeometry args={[0.27, 0.27, 0.04, 24]} />
          <meshStandardMaterial color={c} />
        </mesh>
        <mesh position={[0, 0.17, 0]}>
          <cylinderGeometry args={[0.2, 0.22, 0.28, 24]} />
          <meshStandardMaterial color={c} />
        </mesh>
      </group>
    );
  }
  if (item.id === "hat_hunting") {
    return (
      <group position={[0, 2.36, 0]}>
        <mesh>
          <sphereGeometry args={[0.24, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={c} />
        </mesh>
        <mesh position={[0, -0.02, 0.16]}>
          <boxGeometry args={[0.22, 0.04, 0.14]} />
          <meshStandardMaterial color={c} />
        </mesh>
      </group>
    );
  }
  if (item.id === "hat_bungeo") {
    return (
      <group position={[0, 2.34, 0]}>
        <mesh>
          <cylinderGeometry args={[0.26, 0.26, 0.04, 24]} />
          <meshStandardMaterial color={c} />
        </mesh>
        <mesh position={[0, 0.12, 0]}>
          <sphereGeometry args={[0.22, 16, 8, 0, Math.PI * 2, 0, Math.PI / 1.3]} />
          <meshStandardMaterial color={c} />
        </mesh>
      </group>
    );
  }
  return (
    <group position={[0, 2.38, 0]}>
      <mesh>
        <cylinderGeometry args={[0.28, 0.28, 0.04, 24]} />
        <meshStandardMaterial color={c} />
      </mesh>
      <mesh position={[0, 0.13, 0.04]}>
        <sphereGeometry args={[0.22, 16, 10, 0, Math.PI * 2, 0, Math.PI / 1.5]} />
        <meshStandardMaterial color={c} />
      </mesh>
      <mesh position={[0, 0.05, 0.24]}>
        <boxGeometry args={[0.2, 0.04, 0.12]} />
        <meshStandardMaterial color={c} />
      </mesh>
    </group>
  );
}

function Scarf({ item }: { item?: WardrobeItem }) {
  if (!item) return null;
  const c = new THREE.Color(item.color);
  const a = item.accentColor ? new THREE.Color(item.accentColor) : c;

  if (item.id === "scarf_smartwatch" || item.id === "scarf_gold_watch") {
    return (
      <group position={[-0.42, 1.38, 0]}>
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
        {[-0.14, 0.14].map((x, i) => (
          <mesh key={i} position={[x, 0.06, 0.12]}>
            <boxGeometry args={[0.14, 0.1, 0.28]} />
            <meshStandardMaterial color={c} />
          </mesh>
        ))}
      </group>
    );
  }

  return (
    <group position={[0, 1.85, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.16, 0.048, 8, 24]} />
        <meshStandardMaterial color={c} />
      </mesh>
      <mesh position={[0.05, -0.12, 0.12]}>
        <boxGeometry args={[0.07, 0.22, 0.06]} />
        <meshStandardMaterial color={a} />
      </mesh>
    </group>
  );
}

function HumanoidAvatar({ equipped, avatar }: AvatarProps) {
  const groupRef = useRef<THREE.Group>(null);

  const hatItem = getItem(equipped.hat);
  const topItem = getItem(equipped.top);
  const bottomItem = getItem(equipped.bottom);
  const scarfItem = getItem(equipped.scarf);

  const skinColor = avatar === "male" ? "#F4CBA8" : "#FBDAC6";
  const topColor = topItem ? topItem.color : avatar === "male" ? "#374151" : "#9CA3AF";
  const bottomColor = bottomItem ? bottomItem.color : avatar === "male" ? "#1E3A5F" : "#4B5563";

  return (
    <group ref={groupRef} position={[0, -1.1, 0]}>
      {/* Head */}
      <mesh position={[0, 2.15, 0]}>
        <sphereGeometry args={[0.28, 24, 24]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>
      {/* Eyes */}
      <mesh position={[-0.1, 2.2, 0.26]}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0.1, 2.2, 0.26]}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      {/* Mouth */}
      <mesh position={[0, 2.05, 0.265]}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshStandardMaterial color="#c0645a" />
      </mesh>
      {/* Neck */}
      <mesh position={[0, 1.82, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.22, 12]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>
      {/* Torso */}
      <mesh position={[0, 1.38, 0]}>
        <boxGeometry args={[0.58, 0.68, 0.26]} />
        <meshStandardMaterial color={topColor} />
      </mesh>
      {/* Left upper arm */}
      <mesh position={[-0.38, 1.52, 0]} rotation={[0, 0, 0.18]}>
        <cylinderGeometry args={[0.09, 0.08, 0.44, 10]} />
        <meshStandardMaterial color={topColor} />
      </mesh>
      {/* Right upper arm */}
      <mesh position={[0.38, 1.52, 0]} rotation={[0, 0, -0.18]}>
        <cylinderGeometry args={[0.09, 0.08, 0.44, 10]} />
        <meshStandardMaterial color={topColor} />
      </mesh>
      {/* Left lower arm */}
      <mesh position={[-0.42, 1.12, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.4, 10]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>
      {/* Right lower arm */}
      <mesh position={[0.42, 1.12, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.4, 10]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>
      {/* Left hand */}
      <mesh position={[-0.42, 0.88, 0]}>
        <sphereGeometry args={[0.08, 10, 10]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>
      {/* Right hand */}
      <mesh position={[0.42, 0.88, 0]}>
        <sphereGeometry args={[0.08, 10, 10]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>
      {/* Hip */}
      <mesh position={[0, 0.95, 0]}>
        <boxGeometry args={[0.52, 0.22, 0.24]} />
        <meshStandardMaterial color={bottomColor} />
      </mesh>
      {/* Left upper leg */}
      <mesh position={[-0.16, 0.6, 0]}>
        <cylinderGeometry args={[0.12, 0.1, 0.48, 12]} />
        <meshStandardMaterial color={bottomColor} />
      </mesh>
      {/* Right upper leg */}
      <mesh position={[0.16, 0.6, 0]}>
        <cylinderGeometry args={[0.12, 0.1, 0.48, 12]} />
        <meshStandardMaterial color={bottomColor} />
      </mesh>
      {/* Left lower leg */}
      <mesh position={[-0.16, 0.2, 0]}>
        <cylinderGeometry args={[0.09, 0.08, 0.38, 12]} />
        <meshStandardMaterial color={bottomColor} />
      </mesh>
      {/* Right lower leg */}
      <mesh position={[0.16, 0.2, 0]}>
        <cylinderGeometry args={[0.09, 0.08, 0.38, 12]} />
        <meshStandardMaterial color={bottomColor} />
      </mesh>
      {/* Left foot */}
      <mesh position={[-0.16, 0.02, 0.08]}>
        <boxGeometry args={[0.13, 0.1, 0.26]} />
        <meshStandardMaterial color="#2c2c2c" />
      </mesh>
      {/* Right foot */}
      <mesh position={[0.16, 0.02, 0.08]}>
        <boxGeometry args={[0.13, 0.1, 0.26]} />
        <meshStandardMaterial color="#2c2c2c" />
      </mesh>

      {/* Accessory items */}
      <Hat item={hatItem} />
      <Scarf item={scarfItem} />
    </group>
  );
}

function Scene({ equipped, avatar }: AvatarProps) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0.5, 3.2]} fov={55} />
      <ambientLight intensity={1.2} />
      <directionalLight position={[3, 5, 3]} intensity={1.4} castShadow />
      <directionalLight position={[-2, 3, -2]} intensity={0.6} />
      <hemisphereLight args={["#e0e8ff", "#f0f0f0", 0.5]} />

      <HumanoidAvatar equipped={equipped} avatar={avatar} />

      <OrbitControls
        target={[0, 0.5, 0]}
        enablePan={false}
        minDistance={2}
        maxDistance={5}
        maxPolarAngle={Math.PI / 1.6}
        minPolarAngle={Math.PI / 6}
      />
    </>
  );
}

interface Avatar3DProps {
  equipped: EquippedItems;
  avatar?: "male" | "female";
  className?: string;
}

export function Avatar3D({ equipped, avatar = "male", className }: Avatar3DProps) {
  return (
    <div className={className ?? "w-full h-full"} style={{ background: "linear-gradient(180deg, #e8ecf4 0%, #f2f4f6 100%)" }}>
      <Canvas shadows>
        <Suspense fallback={null}>
          <Scene equipped={equipped} avatar={avatar} />
        </Suspense>
      </Canvas>
    </div>
  );
}
