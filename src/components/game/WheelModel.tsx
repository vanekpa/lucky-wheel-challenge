import { useRef, useMemo } from 'react';
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

const CenterHub = ({ radius }: { radius: number }) => {
  return (
    <group>
      {/* Zlatý vnější okraj */}
      <mesh position={[0, 0.02, 0]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[radius, radius, 0.06, 32]} />
        <meshStandardMaterial color="#d4af37" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Tmavý vnitřní kruh pro logo */}
      <mesh position={[0, 0.06, 0]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[radius * 0.9, radius * 0.9, 0.04, 32]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.3} roughness={0.5} />
      </mesh>
      
      {/* Logo "PEKLO" - větší, výš, červeně */}
      <Text
        position={[0, 0.15, -0.35]}
        rotation={[-Math.PI/2, 0, 0]}
        fontSize={0.65}
        color="#ff3333"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.04}
        outlineColor="#000000"
        fontWeight="bold"
      >
        PEKLO
      </Text>
      
      {/* Subtext "EDU.CZ" - větší, zlatě */}
      <Text
        position={[0, 0.15, 0.45]}
        rotation={[-Math.PI/2, 0, 0]}
        fontSize={0.35}
        color="#ffd700"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.025}
        outlineColor="#000000"
      >
        EDU.CZ
      </Text>
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
  isClickable
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
      
      <CenterHub radius={0.45 * WHEEL_RADIUS} />
      
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
