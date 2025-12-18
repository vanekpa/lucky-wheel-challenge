import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { WheelSegment, Player } from '@/types/game';
import { WHEEL_RADIUS, POINTER_Y_POSITION, POINTER_Z_POSITION } from '@/constants/wheel';
import { WheelModel } from './WheelModel';
import { useSeason, Season } from '@/hooks/useSeason';

const BADGE_DEBUG_STORAGE_KEY = 'wheel.badgeDebug.v1';

interface Wheel3DProps {
  rotation: number;
  rotationRef?: React.MutableRefObject<number>;
  isSpinning: boolean;
  onSpinComplete: (segment: WheelSegment) => void;
  tokenPositions: Map<number, number>;
  onSegmentClick: (segmentId: number) => void;
  placingTokensMode: boolean;
  players: Player[];
  currentPlayer: number;
  pointerBounce?: number;
}

const CameraController = () => {
  const { camera } = useThree();
  
  useEffect(() => {
    camera.lookAt(0, 2.7, 0);
    camera.updateProjectionMatrix();
  }, [camera]);
  
  return null;
};

const Pedestal = () => {
  return (
    <group position={[0, 0.4, 0]}>
      {/* Main pedestal body */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.0 * WHEEL_RADIUS, 0.9 * WHEEL_RADIUS, 0.75 * WHEEL_RADIUS, 32]} />
        <meshStandardMaterial 
          color="#1a1a2e" 
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
      
      {/* LED ring on top */}
      <mesh position={[0, 0.375 * WHEEL_RADIUS, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.95 * WHEEL_RADIUS, 0.05, 16, 64]} />
        <meshStandardMaterial 
          color="#00ffff"
          emissive="#00ffff"
          emissiveIntensity={1.5}
        />
      </mesh>
      
      {/* LED ring glow light */}
      <pointLight 
        position={[0, 0.4 * WHEEL_RADIUS, 0]} 
        intensity={2} 
        distance={4}
        color="#00ffff"
      />
      
      {/* Decorative gold ring */}
      <mesh position={[0, 0.2 * WHEEL_RADIUS, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.98 * WHEEL_RADIUS, 0.03, 16, 64]} />
        <meshStandardMaterial 
          color="#ffd700"
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
      
      {/* Base ring */}
      <mesh position={[0, -0.35 * WHEEL_RADIUS, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.88 * WHEEL_RADIUS, 0.04, 16, 64]} />
        <meshStandardMaterial 
          color="#ffd700"
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
    </group>
  );
};

// 3D Studio Elements
const StudioElements3D = () => {
  return (
    <group>
      {/* Reflective floor */}
      <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[12, 64]} />
        <meshStandardMaterial 
          color="#0a0a1a"
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
      
      {/* Floor LED ring */}
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[8, 8.2, 64]} />
        <meshStandardMaterial 
          color="#ff00ff"
          emissive="#ff00ff"
          emissiveIntensity={0.8}
        />
      </mesh>
      
      {/* Spotlight stands */}
      {[0, Math.PI / 2, Math.PI, 3 * Math.PI / 2].map((angle, i) => (
        <group key={i} position={[Math.sin(angle) * 7, 0, Math.cos(angle) * 7]}>
          {/* Stand pole */}
          <mesh position={[0, 3, 0]}>
            <cylinderGeometry args={[0.08, 0.1, 6, 8]} />
            <meshStandardMaterial color="#333" metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Spotlight head */}
          <mesh position={[0, 6, 0]} rotation={[0.4, angle + Math.PI, 0]}>
            <coneGeometry args={[0.4, 0.8, 16]} />
            <meshStandardMaterial color="#222" metalness={0.6} roughness={0.4} />
          </mesh>
          {/* Spotlight light */}
          <spotLight 
            position={[0, 5.8, 0]} 
            target-position={[0, 2.7, 0]}
            angle={0.5}
            penumbra={0.8}
            intensity={0.6}
            color={i % 2 === 0 ? "#ffccff" : "#ccffff"}
            distance={15}
          />
        </group>
      ))}
    </group>
  );
};

// 3D Seasonal Particles
const SeasonalParticles3D = ({ season, effectsEnabled }: { season: Season; effectsEnabled: boolean }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const count = season === 'winter' ? 200 : season === 'autumn' ? 100 : 50;
  
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;     // x
      pos[i * 3 + 1] = Math.random() * 15;          // y
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20;  // z
    }
    return pos;
  }, [count]);

  const velocities = useMemo(() => {
    const vel = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      vel[i] = 0.01 + Math.random() * 0.02;
    }
    return vel;
  }, [count]);

  useFrame(() => {
    if (!pointsRef.current || !effectsEnabled) return;
    
    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
    
    for (let i = 0; i < count; i++) {
      // Fall down
      positions[i * 3 + 1] -= velocities[i];
      
      // Add slight horizontal drift
      positions[i * 3] += Math.sin(Date.now() * 0.001 + i) * 0.005;
      positions[i * 3 + 2] += Math.cos(Date.now() * 0.001 + i) * 0.005;
      
      // Reset when below ground
      if (positions[i * 3 + 1] < -1) {
        positions[i * 3] = (Math.random() - 0.5) * 20;
        positions[i * 3 + 1] = 15;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
      }
    }
    
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  if (!effectsEnabled) return null;

  const color = season === 'winter' ? '#ffffff' : 
                season === 'autumn' ? '#d4621a' : 
                season === 'spring' ? '#ffb6c1' : 
                '#fffacd';

  return (
    <Points ref={pointsRef} positions={positions}>
      <PointMaterial
        transparent
        color={color}
        size={season === 'winter' ? 0.08 : 0.12}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.8}
      />
    </Points>
  );
};

const Pointer3D = ({ bounce = 0 }: { bounce?: number }) => {
  const bounceRotation = Math.sin(bounce * Math.PI * 8) * 0.15 * Math.max(0, 1 - bounce);
  
  return (
    <group 
      position={[0, POINTER_Y_POSITION, POINTER_Z_POSITION]} 
      rotation={[bounceRotation, Math.PI, 0]}
    >
      {/* Main pointer body - larger */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} castShadow>
        <coneGeometry args={[0.25, 0.4, 3]} />
        <meshStandardMaterial 
          color="#1a1a2e"
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>
      
      {/* Gold tip - larger and glowing */}
      <mesh position={[0, 0, -0.2]} rotation={[-Math.PI / 2, 0, 0]} castShadow>
        <coneGeometry args={[0.2, 0.25, 3]} />
        <meshStandardMaterial 
          color="#ffd700"
          emissive="#ffd700"
          emissiveIntensity={0.8}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
      
      {/* Pointer glow light - stronger */}
      <pointLight 
        position={[0, 0, 0.3]} 
        intensity={1.5} 
        distance={2}
        color="#ffd700"
      />
      
      {/* Secondary glow */}
      <pointLight 
        position={[0, 0, -0.3]} 
        intensity={0.8} 
        distance={1.5}
        color="#ffaa00"
      />
    </group>
  );
};

const Scene = ({
  rotation,
  rotationRef,
  tokenPositions,
  players,
  onSegmentClick,
  isClickable,
  pointerBounce = 0,
  season,
  effectsEnabled,
  badgeEnabled,
  badgeScale,
  badgeYOffset,
}: {
  rotation: number;
  rotationRef?: React.MutableRefObject<number>;
  tokenPositions: Map<number, number>;
  players: Player[];
  onSegmentClick?: (segmentId: number) => void;
  isClickable?: boolean;
  pointerBounce?: number;
  season: Season;
  effectsEnabled: boolean;
  badgeEnabled: boolean;
  badgeScale?: number;
  badgeYOffset?: number;
}) => {
  return (
    <>
      <OrbitControls 
        target={[0, 2.7, 0]}
        enableDamping
        dampingFactor={0.05}
        minDistance={3}
        maxDistance={15}
        maxPolarAngle={Math.PI / 2}
      />
      <CameraController />
      
      <ambientLight intensity={2.0} />
      <pointLight 
        position={[0, 5, 0]} 
        intensity={1.5} 
        distance={10}
        decay={2}
      />
      <directionalLight 
        position={[5, 8, 5]} 
        intensity={2.0}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <spotLight 
        position={[0, 8, 0]} 
        intensity={1.2} 
        angle={0.6}
        penumbra={0.5}
        castShadow
      />
      <pointLight position={[5, 3, 5]} intensity={0.8} color="#ffffff" />
      <pointLight position={[-5, 3, -5]} intensity={0.8} color="#ffffff" />
      
      <StudioElements3D />
      <SeasonalParticles3D season={season} effectsEnabled={effectsEnabled} />
      <Pointer3D bounce={pointerBounce} />
      <Pedestal />
      <WheelModel
        rotation={rotation}
        rotationRef={rotationRef}
        tokenPositions={tokenPositions}
        players={players}
        onSegmentClick={onSegmentClick}
        isClickable={isClickable}
        showCenterBadge={badgeEnabled}
        centerBadgeScale={badgeScale}
        centerBadgeYOffset={badgeYOffset}
      />
    </>
  );
};

export const Wheel3D = ({
  rotation,
  rotationRef,
  isSpinning,
  onSpinComplete,
  tokenPositions,
  onSegmentClick,
  placingTokensMode,
  players,
  currentPlayer,
  pointerBounce = 0,
}: Wheel3DProps) => {
  const { season, effectsEnabled } = useSeason();

  const [badgeDebugEnabled, setBadgeDebugEnabled] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem(BADGE_DEBUG_STORAGE_KEY);
      if (!raw) return true;
      const parsed = JSON.parse(raw) as { enabled?: boolean };
      return parsed.enabled ?? true;
    } catch {
      return true;
    }
  });

  const [badgeScale, setBadgeScale] = useState<number>(() => {
    try {
      const raw = localStorage.getItem(BADGE_DEBUG_STORAGE_KEY);
      if (!raw) return 0.02;
      const parsed = JSON.parse(raw) as { scale?: number };
      return typeof parsed.scale === 'number' ? parsed.scale : 0.02;
    } catch {
      return 0.02;
    }
  });

  const [badgeYOffset, setBadgeYOffset] = useState<number>(() => {
    try {
      const raw = localStorage.getItem(BADGE_DEBUG_STORAGE_KEY);
      if (!raw) return 0.12;
      const parsed = JSON.parse(raw) as { yOffset?: number };
      return typeof parsed.yOffset === 'number' ? parsed.yOffset : 0.12;
    } catch {
      return 0.12;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(
        BADGE_DEBUG_STORAGE_KEY,
        JSON.stringify({ enabled: badgeDebugEnabled, scale: badgeScale, yOffset: badgeYOffset })
      );
    } catch {
      // ignore
    }
  }, [badgeDebugEnabled, badgeScale, badgeYOffset]);

  return (
    <div className="w-full h-full relative">
      <div className="absolute top-3 right-3 z-20 pointer-events-auto">
        <div className="w-[280px] rounded-xl border border-border/60 bg-card/70 backdrop-blur-md p-3 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-medium">Debug: středový badge</div>
            <div className="flex items-center gap-2">
              <Label htmlFor="badge-debug" className="text-xs text-muted-foreground">
                aktivní
              </Label>
              <Switch id="badge-debug" checked={badgeDebugEnabled} onCheckedChange={setBadgeDebugEnabled} />
            </div>
          </div>

          {badgeDebugEnabled && (
            <div className="mt-3 space-y-4">
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <Label className="text-sm">Velikost</Label>
                  <span className="text-xs font-mono text-muted-foreground">{badgeScale.toFixed(3)}</span>
                </div>
                <Slider
                  value={[badgeScale]}
                  min={0.002}
                  max={0.06}
                  step={0.001}
                  onValueChange={(v) => setBadgeScale(v[0] ?? 0.02)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <Label className="text-sm">Výška nad kolem</Label>
                  <span className="text-xs font-mono text-muted-foreground">{badgeYOffset.toFixed(3)}</span>
                </div>
                <Slider
                  value={[badgeYOffset]}
                  min={0.02}
                  max={0.35}
                  step={0.005}
                  onValueChange={(v) => setBadgeYOffset(v[0] ?? 0.12)}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <Canvas
        camera={{
          position: [0, 8, 10],
          fov: 45,
          near: 0.1,
          far: 1000,
        }}
        shadows
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Scene
          rotation={rotation}
          rotationRef={rotationRef}
          tokenPositions={tokenPositions}
          players={players}
          onSegmentClick={onSegmentClick}
          isClickable={placingTokensMode}
          pointerBounce={pointerBounce}
          season={season}
          effectsEnabled={effectsEnabled}
          badgeEnabled={badgeDebugEnabled}
          badgeScale={badgeScale}
          badgeYOffset={badgeYOffset}
        />
      </Canvas>
    </div>
  );
};
