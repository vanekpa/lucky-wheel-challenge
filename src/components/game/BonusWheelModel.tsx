import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { WheelSegment } from '@/types/game';
import { WHEEL_RADIUS, WHEEL_DISK_HEIGHT, WHEEL_Y_POSITION } from '@/constants/wheel';
import { getColorFromSegment, createWedgeGeometry } from '@/utils/wheelGeometry';

// Animated segment with pulsing glow when revealed

interface BonusWheelModelProps {
  rotation: number;
  rotationRef?: React.MutableRefObject<number>;
  blackoutMode: boolean;
  revealedSegments: Set<number>;
  segments: WheelSegment[];
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
      <mesh position={[0, 0.02, 0]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[radius, radius, 0.04, 32]} />
        <meshStandardMaterial color="#d4af37" metalness={0.8} roughness={0.2} />
      </mesh>
      
      <mesh position={[0, 0.06, 0]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[radius * 0.6, radius * 0.6, 0.03, 32]} />
        <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.1} />
      </mesh>
      
      {/* BONUS text on center */}
      <Text
        position={[0, 0.08, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.2}
        color="#ffd700"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.01}
        outlineColor="#000000"
      >
        BONUS
      </Text>
    </group>
  );
};

const formatSegmentValue = (value: number | string): string => {
  if (typeof value === 'number') {
    return value >= 1000 ? `${value / 1000}K` : String(value);
  }
  return value;
};

const BonusWheelSegment3D = ({ 
  segment, 
  index, 
  totalSegments, 
  radius, 
  diskHeight,
  blackoutMode,
  isRevealed,
  visualOffset
}: { 
  segment: WheelSegment; 
  index: number; 
  totalSegments: number; 
  radius: number; 
  diskHeight: number;
  blackoutMode: boolean;
  isRevealed: boolean;
  visualOffset: number;
}) => {
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const glowRef = useRef<THREE.PointLight>(null);
  
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
  
  const showBlackout = blackoutMode && !isRevealed;
  const baseColor = showBlackout ? '#111111' : getColorFromSegment(segment.color);
  
  // Pulsing animation for revealed segments
  useFrame(({ clock }) => {
    if (isRevealed && materialRef.current) {
      const pulse = Math.sin(clock.elapsedTime * 4) * 0.5 + 0.5; // 0-1 pulsing
      materialRef.current.emissiveIntensity = 0.3 + pulse * 0.5;
      
      // Gold glow color when revealed
      materialRef.current.emissive.setHex(0xffd700);
    }
    
    if (glowRef.current) {
      if (isRevealed) {
        const pulse = Math.sin(clock.elapsedTime * 4) * 0.5 + 0.5;
        glowRef.current.intensity = 1.5 + pulse * 2;
      } else {
        glowRef.current.intensity = 0;
      }
    }
  });
  
  const textRadius = 0.7 * radius;
  const textX = textRadius * Math.cos(midAngle);
  const textZ = textRadius * Math.sin(midAngle);
  
  // Position for the glow light
  const glowRadius = 0.6 * radius;
  const glowX = glowRadius * Math.cos(midAngle);
  const glowZ = glowRadius * Math.sin(midAngle);
  
  return (
    <group>
      <mesh 
        position={[0, diskHeight/2 + segmentThickness/2, 0]}
        receiveShadow
        castShadow
      >
        <primitive object={wedgeGeometry} attach="geometry" />
        <meshStandardMaterial 
          ref={materialRef}
          color={baseColor}
          roughness={isRevealed ? 0.2 : 0.4}
          metalness={isRevealed ? 0.6 : 0.2}
          side={THREE.DoubleSide}
          polygonOffset
          polygonOffsetFactor={-1}
          polygonOffsetUnits={-1}
          emissive={isRevealed ? '#ffd700' : '#000000'}
          emissiveIntensity={isRevealed ? 0.5 : 0}
        />
      </mesh>
      
      {/* Point light for glow effect on revealed segments */}
      <pointLight
        ref={glowRef}
        position={[glowX, diskHeight/2 + segmentThickness + 0.3, glowZ]}
        color="#ffd700"
        intensity={0}
        distance={1.5}
        decay={2}
      />
      
      <group 
        position={[textX, diskHeight/2 + segmentThickness/2 + 0.05, textZ]}
        rotation={[0, -midAngle + Math.PI/2, 0]}
      >
        <Text
          rotation={[-Math.PI/2, 0, Math.PI/2]}
          fontSize={0.28}
          color={showBlackout ? '#555555' : '#ffffff'}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          {showBlackout ? '?' : formatSegmentValue(segment.value)}
        </Text>
      </group>
    </group>
  );
};

// Calculate visual offset from pointer for a given segment index
const getVisualOffsetFromPointer = (index: number, rotation: number, totalSegments: number): number => {
  const segmentAngle = (Math.PI * 2) / totalSegments;
  const geometryOffset = -Math.PI / 2;
  const pointerPos = 3 * Math.PI / 2; // 270° = top
  
  // Calculate where this segment is visually after rotation
  // Segment's base angle + geometry offset, then subtract rotation (wheel rotates with -rotation.y)
  const segmentCenterAngle = index * segmentAngle + segmentAngle / 2 + geometryOffset;
  const visualAngle = ((segmentCenterAngle - rotation) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
  
  // Calculate angular distance from pointer
  let angleDiff = visualAngle - pointerPos;
  // Normalize to -PI to PI
  while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
  while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
  
  // Convert to segment offset (inverted: positive = clockwise/right)
  const offset = Math.round(angleDiff / segmentAngle);
  
  return -offset;
};

export const BonusWheelModel = ({
  rotation, 
  rotationRef: externalRotationRef,
  blackoutMode,
  revealedSegments,
  segments
}: BonusWheelModelProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const currentRotationRef = useRef(rotation);
  
  useFrame(() => {
    if (groupRef.current) {
      const currentRotation = externalRotationRef?.current ?? rotation;
      currentRotationRef.current = currentRotation;
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
      
      {segments.map((segment, index) => {
        const currentRot = externalRotationRef?.current ?? rotation;
        const visualOffset = getVisualOffsetFromPointer(index, currentRot, segments.length);
        
        // Now revealedSegments contains physical indices, so check directly by index
        return (
          <BonusWheelSegment3D 
            key={index}
            segment={segment}
            index={index}
            totalSegments={segments.length}
            radius={WHEEL_RADIUS}
            diskHeight={WHEEL_DISK_HEIGHT}
            blackoutMode={blackoutMode}
            isRevealed={revealedSegments.has(index)}
            visualOffset={visualOffset}
          />
        );
      })}
      
      {segments.map((_, index) => (
        <WheelPeg 
          key={`peg-${index}`}
          angle={(index * 360) / segments.length - 90}
          radius={0.9 * WHEEL_RADIUS}
          height={0.08 * WHEEL_RADIUS}
        />
      ))}
      
      <CenterHub radius={0.25 * WHEEL_RADIUS} />
    </group>
  );
};
