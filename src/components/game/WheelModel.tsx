import { useRef, useMemo, useEffect } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Text, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { wheelSegments } from '@/data/puzzles';
import { WheelSegment, Player } from '@/types/game';
import { WHEEL_RADIUS, WHEEL_DISK_HEIGHT, WHEEL_Y_POSITION } from '@/constants/wheel';
import { getColorFromSegment, createWedgeGeometry } from '@/utils/wheelGeometry';

interface WheelModelProps {
  rotation: number;
  rotationRef?: React.MutableRefObject<number>;
  tokenPositions: Map<number, number>;
  players: Player[];
  onSegmentClick?: (segmentId: number) => void;
  isClickable?: boolean;
  showCenterBadge?: boolean;
  centerBadgeScale?: number;
  centerBadgeYOffset?: number;
}

const WheelPeg = ({ angle, radius, height }: { angle: number; radius: number; height: number }) => {
  const rad = (angle * Math.PI) / 180;
  const x = radius * Math.cos(rad);
  const z = radius * Math.sin(rad);
  
  return (
    <mesh position={[x, height / 2, z]} castShadow>
      <cylinderGeometry args={[0.02, 0.02, height, 16]} />
      <meshStandardMaterial 
        color="#d4af37"
        metalness={0.9}
        roughness={0.1}
      />
    </mesh>
  );
};

// Canvas texture generator for the badge
function makeBadgeTexture({
  labelTop,
  labelMid,
  name1,
  name2,
  tagline,
}: {
  labelTop: string;
  labelMid: string;
  name1: string;
  name2: string;
  tagline: string;
}) {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 1024;
  const ctx = c.getContext("2d")!;
  ctx.clearRect(0, 0, c.width, c.height);

  const cx = c.width / 2;
  const cy = c.height / 2;

  // Background plate gradient
  {
    const g = ctx.createRadialGradient(cx - 140, cy - 180, 80, cx, cy, 520);
    g.addColorStop(0, "#1a1a1a");
    g.addColorStop(0.55, "#0c0c0c");
    g.addColorStop(1, "#050505");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, 480, 0, Math.PI * 2);
    ctx.fill();
  }

  // Soft vignette
  {
    const v = ctx.createRadialGradient(cx, cy, 240, cx, cy, 520);
    v.addColorStop(0, "rgba(0,0,0,0)");
    v.addColorStop(1, "rgba(0,0,0,0.55)");
    ctx.fillStyle = v;
    ctx.beginPath();
    ctx.arc(cx, cy, 480, 0, Math.PI * 2);
    ctx.fill();
  }

  // Grain / speckle
  {
    const img = ctx.getImageData(0, 0, c.width, c.height);
    const data = img.data;
    let seed = 1337;
    const rnd = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
    for (let i = 0; i < data.length; i += 4) {
      const px = ((i / 4) % c.width) - cx;
      const py = Math.floor(i / 4 / c.width) - cy;
      if (px * px + py * py > 480 * 480) continue;
      const n = (rnd() - 0.5) * 18;
      data[i] = Math.max(0, Math.min(255, data[i] + n));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + n));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + n));
    }
    ctx.putImageData(img, 0, 0);
  }

  // Text helper
  const drawText = (
    txt: string,
    x: number,
    y: number,
    font: string,
    fill: string,
    shadow = 0.35,
    blur = 8,
    yShadow = 6
  ) => {
    ctx.font = font;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.save();
    ctx.shadowColor = `rgba(0,0,0,${shadow})`;
    ctx.shadowBlur = blur;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = yShadow;
    ctx.fillStyle = fill;
    ctx.fillText(txt, x, y);
    ctx.restore();
    ctx.fillStyle = fill;
    ctx.fillText(txt, x, y);
  };

  const blockCenterY = cy + 18;

  // Top: URL
  drawText(labelTop, cx, blockCenterY - 240, "800 58px system-ui, -apple-system, Segoe UI, Roboto, Arial", "rgba(255,255,255,0.92)", 0.22, 10, 6);

  // GAME BY with divider lines
  drawText(labelMid, cx, blockCenterY - 175, "900 38px system-ui, -apple-system, Segoe UI, Roboto, Arial", "rgba(255,255,255,0.70)", 0.18, 7, 4);
  {
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.32)";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    const y = blockCenterY - 175;
    ctx.beginPath();
    ctx.moveTo(cx - 300, y);
    ctx.lineTo(cx - 120, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 120, y);
    ctx.lineTo(cx + 300, y);
    ctx.stroke();
    ctx.restore();
  }

  // Name (two lines)
  drawText(name1, cx, blockCenterY - 30, "900 156px system-ui, -apple-system, Segoe UI, Roboto, Arial", "rgba(255,255,255,1)", 0.28, 12, 7);
  drawText(name2, cx, blockCenterY + 140, "900 156px system-ui, -apple-system, Segoe UI, Roboto, Arial", "rgba(255,255,255,1)", 0.28, 12, 7);

  // Bottom: tagline
  drawText(tagline, cx, blockCenterY + 285, "900 40px system-ui, -apple-system, Segoe UI, Roboto, Arial", "rgba(255,255,255,0.55)", 0.16, 6, 4);

  // Contrast curve
  {
    const img = ctx.getImageData(0, 0, c.width, c.height);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      d[i] = Math.max(0, Math.min(255, (d[i] - 128) * 1.06 + 128));
      d[i + 1] = Math.max(0, Math.min(255, (d[i + 1] - 128) * 1.06 + 128));
      d[i + 2] = Math.max(0, Math.min(255, (d[i + 2] - 128) * 1.06 + 128));
    }
    ctx.putImageData(img, 0, 0);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

const CenterBadge3D = ({
  show = true,
  scale = 1.0,
  yOffset = 0.05,
}: {
  show?: boolean;
  scale?: number;
  yOffset?: number;
}) => {
  const texture = useMemo(() => makeBadgeTexture({
    labelTop: "peklo-edu.cz",
    labelMid: "GAME BY",
    name1: "Patrik",
    name2: "Vaněk",
    tagline: "EDU • GAMES • CANVA",
  }), []);

  useEffect(() => {
    return () => texture.dispose();
  }, [texture]);

  if (!show) return null;

  const r = 0.34 * scale;
  const thickness = 0.045 * scale;
  const rimOuterR = r * 1.03;
  const rimInnerR = r * 0.965;

  return (
    <group position={[0, WHEEL_DISK_HEIGHT / 2 + yOffset, 0]}>
      {/* Base disk (main plate) */}
      <mesh>
        <cylinderGeometry args={[r, r, thickness, 96]} />
        <meshStandardMaterial color="#070707" metalness={0.05} roughness={0.85} />
      </mesh>

      {/* Outer rim body (coin-like side wall) */}
      <mesh>
        <cylinderGeometry args={[rimOuterR, rimOuterR, thickness * 1.02, 128, 1, true]} />
        <meshPhysicalMaterial color="#8a6a1f" metalness={1} roughness={0.35} clearcoat={0.4} clearcoatRoughness={0.25} />
      </mesh>

      {/* Dark inner step */}
      <mesh>
        <cylinderGeometry args={[rimInnerR, rimInnerR, thickness * 1.005, 128, 1, true]} />
        <meshStandardMaterial color="#0b0b0f" metalness={0.2} roughness={0.7} />
      </mesh>

      {/* Highlight circle plane */}
      <mesh position={[0, thickness * 0.52, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[r * 0.94, 80]} />
        <meshPhysicalMaterial color="#101010" metalness={0} roughness={0.35} transparent opacity={0.55} clearcoat={0.7} clearcoatRoughness={0.25} />
      </mesh>

      {/* Gold rim highlight ring (thin torus on top edge) */}
      <mesh position={[0, thickness * 0.52, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[r * 1.01, 0.0105, 24, 140]} />
        <meshPhysicalMaterial color="#d4af37" metalness={1} roughness={0.22} clearcoat={0.6} clearcoatRoughness={0.18} />
      </mesh>

      {/* Secondary inner gold lip */}
      <mesh position={[0, thickness * 0.525, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[r * 0.965, 0.0042, 18, 140]} />
        <meshPhysicalMaterial color="#d4af37" metalness={1} roughness={0.18} clearcoat={0.7} clearcoatRoughness={0.12} />
      </mesh>

      {/* Inner thin line */}
      <mesh position={[0, thickness * 0.52, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[r * 0.88, 0.0032, 12, 140]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.14} roughness={1} />
      </mesh>

      {/* Text plane with canvas texture */}
      <mesh position={[0, thickness * 0.53, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.70 * scale, 0.70 * scale]} />
        <meshBasicMaterial map={texture} transparent alphaTest={0.02} />
      </mesh>
    </group>
  );
};

const WheelSegment3D = ({ 
  segment, 
  index, 
  totalSegments, 
  radius, 
  diskHeight,
  onClick,
  isClickable
}: { 
  segment: WheelSegment; 
  index: number; 
  totalSegments: number; 
  radius: number; 
  diskHeight: number;
  onClick?: () => void;
  isClickable?: boolean;
}) => {
  const angleOffset = -Math.PI / 2;
  const angle = (index * Math.PI * 2) / totalSegments + angleOffset;
  const nextAngle = ((index + 1) * Math.PI * 2) / totalSegments + angleOffset;
  const midAngle = (angle + nextAngle) / 2;
  
  const innerRadius = 0.25 * radius;
  const outerRadius = 0.95 * radius;
  const segmentThickness = 0.05;
  
  const wedgeGeometry = useMemo(() => {
    return createWedgeGeometry(innerRadius, outerRadius, angle, nextAngle, segmentThickness);
  }, [angle, nextAngle, innerRadius, outerRadius]);
  
  const color = getColorFromSegment(segment.color);
  
  const textRadius = 0.7 * radius;
  const textX = textRadius * Math.cos(midAngle);
  const textZ = textRadius * Math.sin(midAngle);
  
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (isClickable && onClick && segment.type !== 'bankrot') {
      e.stopPropagation();
      onClick();
    }
  };
  
  return (
    <group>
      <mesh 
        position={[0, diskHeight/2 + segmentThickness/2, 0]}
        receiveShadow
        castShadow
        onClick={handleClick}
        onPointerOver={(e) => {
          if (isClickable && segment.type !== 'bankrot') {
            e.stopPropagation();
            document.body.style.cursor = 'pointer';
          }
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        <primitive object={wedgeGeometry} attach="geometry" />
        <meshStandardMaterial 
          color={color}
          roughness={0.4}
          metalness={0.2}
          side={THREE.DoubleSide}
          polygonOffset
          polygonOffsetFactor={-1}
          polygonOffsetUnits={-1}
        />
      </mesh>
      
      <group 
        position={[textX, diskHeight/2 + segmentThickness/2 + 0.05, textZ]}
        rotation={[0, -midAngle + Math.PI/2, 0]}
      >
        <Text
          rotation={[-Math.PI/2, 0, Math.PI/2]}
          fontSize={0.28}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          {segment.value}
        </Text>
      </group>
    </group>
  );
};

const PlayerToken3D = ({ 
  playerId, 
  segmentId, 
  players 
}: { 
  playerId: number; 
  segmentId: number; 
  players: Player[];
}) => {
  const player = players[playerId];
  const angleOffset = -Math.PI / 2;
  const angle = (segmentId * Math.PI * 2) / 32 + angleOffset + (Math.PI / 32);
  const radius = 2.0;
  
  const x = radius * Math.cos(angle);
  const z = radius * Math.sin(angle);
  const y = WHEEL_DISK_HEIGHT / 2 + 0.09; // Na povrchu segmentu
  
  return (
    <group position={[x, y, z]}>
      {/* Bílý podstavec - puk se zkosenou hranou */}
      <mesh castShadow>
        <cylinderGeometry args={[0.18, 0.2, 0.06, 32]} />
        <meshStandardMaterial 
          color="#ffffff"
          metalness={0.6}
          roughness={0.3}
          emissive="#ffffff"
          emissiveIntensity={0.15}
        />
      </mesh>
      
      {/* Hráč 0: Trojúhelník - zaoblený */}
      {playerId === 0 && (
        <mesh position={[0, 0.06, 0]} rotation={[0, 0, 0]} castShadow>
          <cylinderGeometry args={[0.12, 0.12, 0.04, 3]} />
          <meshStandardMaterial color={player.color} metalness={0.3} roughness={0.5} />
        </mesh>
      )}
      
      {/* Hráč 1: Čtverec - zaoblené rohy */}
      {playerId === 1 && (
        <RoundedBox 
          position={[0, 0.06, 0]} 
          args={[0.17, 0.04, 0.17]} 
          radius={0.02} 
          smoothness={4}
          castShadow
        >
          <meshStandardMaterial color={player.color} metalness={0.3} roughness={0.5} />
        </RoundedBox>
      )}
      
      {/* Hráč 2: Kruh - placatý válec */}
      {playerId === 2 && (
        <mesh position={[0, 0.06, 0]} castShadow>
          <cylinderGeometry args={[0.1, 0.1, 0.04, 32]} />
          <meshStandardMaterial color={player.color} metalness={0.3} roughness={0.5} />
        </mesh>
      )}
    </group>
  );
};

export const WheelModel = ({
  rotation,
  rotationRef: externalRotationRef,
  tokenPositions,
  players,
  onSegmentClick,
  isClickable,
  showCenterBadge = true,
  centerBadgeScale,
  centerBadgeYOffset,
}: WheelModelProps) => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame(() => {
    if (groupRef.current) {
      const currentRotation = externalRotationRef?.current ?? rotation;
      groupRef.current.rotation.y = -currentRotation;
    }
  });
  
  return (
    <group 
      ref={groupRef}
      position={[0, WHEEL_Y_POSITION, 0]}
    >
      <mesh castShadow receiveShadow rotation={[0, 0, 0]}>
        <cylinderGeometry args={[WHEEL_RADIUS, WHEEL_RADIUS, WHEEL_DISK_HEIGHT, 64]} />
        <meshStandardMaterial color="#2a2a2a" side={THREE.DoubleSide} />
      </mesh>
      
      {wheelSegments.map((segment) => (
        <WheelSegment3D 
          key={segment.id}
          segment={segment}
          index={segment.id}
          totalSegments={wheelSegments.length}
          radius={WHEEL_RADIUS}
          diskHeight={WHEEL_DISK_HEIGHT}
          onClick={() => onSegmentClick?.(segment.id)}
          isClickable={isClickable}
        />
      ))}
      
      {wheelSegments.map((segment) => (
        <WheelPeg 
          key={`peg-${segment.id}`}
          angle={(segment.id * 360) / wheelSegments.length - 90}
          radius={0.9 * WHEEL_RADIUS}
          height={0.08 * WHEEL_RADIUS}
        />
      ))}
      
      <CenterBadge3D
        show={showCenterBadge}
        scale={centerBadgeScale}
        yOffset={centerBadgeYOffset}
      />
      
      {Array.from(tokenPositions.entries()).map(([segmentId, playerId]) => (
        <PlayerToken3D
          key={`token-${segmentId}`}
          playerId={playerId}
          segmentId={segmentId}
          players={players}
        />
      ))}
    </group>
  );
};
