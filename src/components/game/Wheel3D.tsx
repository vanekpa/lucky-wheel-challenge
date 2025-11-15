import { useRef, useMemo } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { wheelSegments } from '@/data/puzzles';
import { WheelSegment, Player } from '@/types/game';

interface Wheel3DProps {
  rotation: number;
  isSpinning: boolean;
  onSpinComplete: (segment: WheelSegment) => void;
  tokenPositions: Map<number, number>;
  onSegmentClick: (segmentId: number) => void;
  placingTokensMode: boolean;
  players: Player[];
  currentPlayer: number;
}

const getColorFromSegment = (colorName: string): string => {
  const colorMap: Record<string, string> = {
    'wheel-red': '#f14e4e',
    'wheel-blue': '#3b5998',
    'wheel-yellow': '#ffd700',
    'wheel-green': '#22c55e',
    'wheel-purple': '#a855f7',
    'bankrot': '#1a1a1a',
    'nic': '#404040',
  };
  return colorMap[colorName] || '#ffffff';
};

const Pedestal = () => {
  const R = 3;
  
  return (
    <group position={[0, 0, 0]}>
      {/* Hlavní kuželový tvar */}
      <mesh position={[0, 0, 0.4]} castShadow receiveShadow>
        <cylinderGeometry args={[0.9 * R, 0.9 * R, 0.75 * R, 32]} />
        <meshStandardMaterial 
          color="#2a2a2a" 
          metalness={0.6}
          roughness={0.3}
        />
      </mesh>
      
      {/* Kovový límec */}
      <mesh position={[0, 0, 0.3]} receiveShadow>
        <torusGeometry args={[0.85 * R, 0.03 * R, 16, 32]} />
        <meshStandardMaterial 
          color="#c0c0c0" 
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
    </group>
  );
};

const WheelPeg = ({ angle, radius, height }: { angle: number; radius: number; height: number }) => {
  const rad = (angle * Math.PI) / 180;
  const x = radius * Math.cos(rad);
  const y = radius * Math.sin(rad);
  
  return (
    <mesh position={[x, y, height / 2]} castShadow>
      <cylinderGeometry args={[0.02, 0.02, height, 16]} />
      <meshStandardMaterial 
        color="#c0c0c0"
        metalness={0.9}
        roughness={0.1}
      />
    </mesh>
  );
};

const WheelRim = ({ radius }: { radius: number }) => {
  return (
    <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[radius - 0.03, 0.04, 16, 64]} />
      <meshStandardMaterial 
        color="#8B4513"
        metalness={0.3}
        roughness={0.7}
      />
    </mesh>
  );
};

const CenterHub = ({ radius }: { radius: number }) => {
  return (
    <group>
      {/* Spodní platforma */}
      <mesh position={[0, 0, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[radius, radius, 0.04, 32]} />
        <meshStandardMaterial color="#d4af37" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Horní kolečko */}
      <mesh position={[0, 0, 0.06]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[radius * 0.6, radius * 0.6, 0.03, 32]} />
        <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.1} />
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
  const angle = (index * Math.PI * 2) / totalSegments;
  const nextAngle = ((index + 1) * Math.PI * 2) / totalSegments;
  const midAngle = (angle + nextAngle) / 2;
  
  const segmentShape = useMemo(() => {
    const shape = new THREE.Shape();
    const innerRadius = 0.25 * radius;
    const outerRadius = 0.95 * radius;
    
    shape.moveTo(innerRadius * Math.cos(angle), innerRadius * Math.sin(angle));
    shape.lineTo(outerRadius * Math.cos(angle), outerRadius * Math.sin(angle));
    shape.arc(0, 0, outerRadius, angle, nextAngle, false);
    shape.lineTo(innerRadius * Math.cos(nextAngle), innerRadius * Math.sin(nextAngle));
    shape.arc(0, 0, innerRadius, nextAngle, angle, true);
    
    return shape;
  }, [angle, nextAngle, radius]);
  
  const extrudeSettings = useMemo(() => ({
    depth: diskHeight,
    bevelEnabled: false
  }), [diskHeight]);
  
  const color = getColorFromSegment(segment.color);
  
  // Text position
  const textRadius = 0.7 * radius;
  const textX = textRadius * Math.cos(midAngle);
  const textY = textRadius * Math.sin(midAngle);
  
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (isClickable && onClick && segment.type !== 'bankrot') {
      e.stopPropagation();
      onClick();
    }
  };
  
  return (
    <group>
      {/* Segment */}
      <mesh 
        position={[0, 0, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        receiveShadow
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
        <extrudeGeometry args={[segmentShape, extrudeSettings]} />
        <meshStandardMaterial 
          color={color}
          metalness={0.2}
          roughness={0.6}
        />
      </mesh>
      
      {/* Text label */}
      <Text
        position={[textX, textY, 0.08]}
        rotation={[0, 0, midAngle + Math.PI / 2]}
        fontSize={0.2}
        color="white"
        anchorX="center"
        anchorY="middle"
        font="/fonts/Inter-Bold.woff"
        outlineWidth={0.01}
        outlineColor="#000000"
      >
        {String(segment.value)}
      </Text>
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
  const angle = (segmentId * Math.PI * 2) / 32 + Math.PI / 32;
  const radius = 2.5;
  
  const x = radius * Math.cos(angle);
  const y = radius * Math.sin(angle);
  const z = 0.15;
  
  return (
    <group position={[x, y, z]}>
      {/* Žeton jako válec */}
      <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.05, 32]} />
        <meshStandardMaterial 
          color={player.color}
          metalness={0.4}
          roughness={0.5}
        />
      </mesh>
      
      {/* Číslo na žetonu */}
      <Text
        position={[0, 0, 0.04]}
        fontSize={0.1}
        color="white"
        anchorX="center"
        anchorY="middle"
        font="/fonts/Inter-Bold.woff"
      >
        {String(playerId + 1)}
      </Text>
    </group>
  );
};

const WheelDisk = ({ 
  rotation, 
  tokenPositions,
  players,
  onSegmentClick,
  isClickable
}: { 
  rotation: number;
  tokenPositions: Map<number, number>;
  players: Player[];
  onSegmentClick?: (segmentId: number) => void;
  isClickable?: boolean;
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const R = 3;
  const diskHeight = 0.1 * R;
  const wheelY = 0.9 * R;
  
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.z = rotation;
    }
  });
  
  return (
    <group 
      ref={groupRef}
      position={[0, 0, wheelY]}
    >
      {/* Hlavní disk */}
      <mesh castShadow receiveShadow rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[R, R, diskHeight, 64]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      
      {/* Segmenty */}
      {wheelSegments.map((segment, i) => (
        <WheelSegment3D 
          key={segment.id}
          segment={segment}
          index={i}
          totalSegments={wheelSegments.length}
          radius={R}
          diskHeight={diskHeight}
          onClick={() => onSegmentClick?.(segment.id)}
          isClickable={isClickable}
        />
      ))}
      
      {/* Vnější ráfek */}
      <WheelRim radius={R} />
      
      {/* Kolíky mezi segmenty */}
      {wheelSegments.map((_, i) => (
        <WheelPeg 
          key={`peg-${i}`}
          angle={(i * 360) / wheelSegments.length}
          radius={0.9 * R}
          height={0.08 * R}
        />
      ))}
      
      {/* Středový kotouč */}
      <CenterHub radius={0.25 * R} />
      
      {/* Žetony */}
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

const Scene = ({ 
  rotation, 
  tokenPositions,
  players,
  onSegmentClick,
  isClickable
}: { 
  rotation: number;
  tokenPositions: Map<number, number>;
  players: Player[];
  onSegmentClick?: (segmentId: number) => void;
  isClickable?: boolean;
}) => {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight 
        position={[5, 5, 8]} 
        intensity={1.2} 
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <spotLight 
        position={[0, 0, 10]} 
        intensity={0.8} 
        angle={0.6}
        penumbra={0.5}
        castShadow
      />
      <pointLight position={[-5, -5, 5]} intensity={0.4} color="#4488ff" />
      
      <Pedestal />
      <WheelDisk 
        rotation={rotation}
        tokenPositions={tokenPositions}
        players={players}
        onSegmentClick={onSegmentClick}
        isClickable={isClickable}
      />
    </>
  );
};

export const Wheel3D = ({
  rotation,
  tokenPositions,
  players,
  onSegmentClick,
  placingTokensMode,
}: Wheel3DProps) => {
  return (
    <div className="relative w-full h-full">
      <Canvas
        camera={{ 
          position: [0, -3.5, 4],
          fov: 45,
          near: 0.1,
          far: 100
        }}
        shadows
        gl={{ 
          antialias: true,
          alpha: true 
        }}
        style={{ background: 'transparent' }}
      >
        <Scene 
          rotation={rotation}
          tokenPositions={tokenPositions}
          players={players}
          onSegmentClick={onSegmentClick}
          isClickable={placingTokensMode}
        />
      </Canvas>
      
      {/* Pointer overlay */}
      <div className="absolute top-[15%] left-1/2 -translate-x-1/2 z-10 pointer-events-none">
        <div className="relative">
          <div 
            className="w-0 h-0 border-l-[30px] border-l-transparent border-r-[30px] border-r-transparent border-t-[60px] border-t-primary"
            style={{
              filter: 'drop-shadow(0 0 20px hsl(var(--primary) / 0.8))',
            }}
          />
        </div>
      </div>
    </div>
  );
};
