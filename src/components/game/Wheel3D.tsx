import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, ThreeEvent, useThree } from '@react-three/fiber';
import { Text, OrbitControls } from '@react-three/drei';
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
    'wheel-red': '#ff6b6b',      // Světlejší lososová/červená
    'wheel-blue': '#5b8def',     // Jasná královská modrá
    'wheel-yellow': '#ffd700',   // Zlatá žlutá
    'wheel-green': '#4ade80',    // Světlejší zelená
    'wheel-purple': '#c084fc',   // Světlejší fialová/magenta
    'bankrot': '#000000',        // Čistá černá
    'nic': '#000000',            // Černá
  };
  return colorMap[colorName] || '#ffffff';
};

// Helper function to create a wedge-shaped geometry for wheel segments
const createWedgeGeometry = (
  innerRadius: number, 
  outerRadius: number, 
  startAngle: number, 
  endAngle: number, 
  thickness: number
): THREE.BufferGeometry => {
  const geometry = new THREE.BufferGeometry();
  const segments = 32;
  const vertices: number[] = [];
  const indices: number[] = [];
  
  let vertexIndex = 0;
  
  // Create vertices for the wedge shape (top and bottom faces)
  const topInnerVertices: number[] = [];
  const topOuterVertices: number[] = [];
  const bottomInnerVertices: number[] = [];
  const bottomOuterVertices: number[] = [];
  
  for (let i = 0; i <= segments; i++) {
    const angle = startAngle + (endAngle - startAngle) * (i / segments);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    
    // Top face vertices
    topInnerVertices.push(vertexIndex);
    vertices.push(innerRadius * cos, thickness / 2, innerRadius * sin);
    vertexIndex++;
    
    topOuterVertices.push(vertexIndex);
    vertices.push(outerRadius * cos, thickness / 2, outerRadius * sin);
    vertexIndex++;
    
    // Bottom face vertices
    bottomInnerVertices.push(vertexIndex);
    vertices.push(innerRadius * cos, -thickness / 2, innerRadius * sin);
    vertexIndex++;
    
    bottomOuterVertices.push(vertexIndex);
    vertices.push(outerRadius * cos, -thickness / 2, outerRadius * sin);
    vertexIndex++;
  }
  
  // Create faces for top and bottom
  for (let i = 0; i < segments; i++) {
    const topInner = topInnerVertices[i];
    const topOuter = topOuterVertices[i];
    const nextTopInner = topInnerVertices[i + 1];
    const nextTopOuter = topOuterVertices[i + 1];
    
    const bottomInner = bottomInnerVertices[i];
    const bottomOuter = bottomOuterVertices[i];
    const nextBottomInner = bottomInnerVertices[i + 1];
    const nextBottomOuter = bottomOuterVertices[i + 1];
    
    // Top face
    indices.push(topInner, topOuter, nextTopInner);
    indices.push(topOuter, nextTopOuter, nextTopInner);
    
    // Bottom face (reversed winding)
    indices.push(bottomInner, nextBottomInner, bottomOuter);
    indices.push(bottomOuter, nextBottomInner, nextBottomOuter);
    
    // Inner arc side faces
    indices.push(topInner, bottomInner, nextTopInner);
    indices.push(bottomInner, nextBottomInner, nextTopInner);
    
    // Outer arc side faces
    indices.push(topOuter, nextTopOuter, bottomOuter);
    indices.push(nextTopOuter, nextBottomOuter, bottomOuter);
  }
  
  // Start edge side face (from inner to outer radius at startAngle)
  const startTopInner = topInnerVertices[0];
  const startTopOuter = topOuterVertices[0];
  const startBottomInner = bottomInnerVertices[0];
  const startBottomOuter = bottomOuterVertices[0];
  
  indices.push(startTopInner, startBottomInner, startTopOuter);
  indices.push(startBottomInner, startBottomOuter, startTopOuter);
  
  // End edge side face (from inner to outer radius at endAngle)
  const endTopInner = topInnerVertices[segments];
  const endTopOuter = topOuterVertices[segments];
  const endBottomInner = bottomInnerVertices[segments];
  const endBottomOuter = bottomOuterVertices[segments];
  
  indices.push(endTopInner, endTopOuter, endBottomInner);
  indices.push(endTopOuter, endBottomOuter, endBottomInner);
  
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  
  return geometry;
};

// Camera controller to look at the wheel
const CameraController = () => {
  const { camera } = useThree();
  
  useEffect(() => {
    camera.lookAt(0, 2.7, 0);
    camera.updateProjectionMatrix();
  }, [camera]);
  
  return null;
};

const Pedestal = () => {
  const R = 3;
  
  return (
    <group position={[0, 0.4, 0]}>
      {/* Hlavní kuželový tvar */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.0 * R, 0.9 * R, 0.75 * R, 32]} />
        <meshStandardMaterial 
          color="#2a2a2a" 
          metalness={0.6}
          roughness={0.3}
        />
      </mesh>
    </group>
  );
};

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
      {/* Spodní platforma */}
      <mesh position={[0, 0.02, 0]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[radius, radius, 0.04, 32]} />
        <meshStandardMaterial color="#d4af37" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Horní kolečko */}
      <mesh position={[0, 0.06, 0]} rotation={[0, 0, 0]}>
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
  // Negative angles for clockwise rotation
  const angle = -(index * Math.PI * 2) / totalSegments;
  const nextAngle = -((index + 1) * Math.PI * 2) / totalSegments;
  const midAngle = (angle + nextAngle) / 2;
  
  const innerRadius = 0.25 * radius;
  const outerRadius = 0.95 * radius;
  const segmentThickness = 0.05;
  
  const wedgeGeometry = useMemo(() => {
    // Swap angles because nextAngle < angle for clockwise rotation
    return createWedgeGeometry(innerRadius, outerRadius, nextAngle, angle, segmentThickness);
  }, [angle, nextAngle, innerRadius, outerRadius]);
  
  const color = getColorFromSegment(segment.color);
  
  // Text position
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
      {/* Segment */}
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
        <primitive object={wedgeGeometry} />
        <meshStandardMaterial 
          color={color}
          emissive={color}
          emissiveIntensity={
            segment.color === 'bankrot' || segment.color === 'nic' 
              ? 0.0  // Černé segmenty bez emissive
              : segment.color === 'wheel-yellow' 
                ? 0.35 
                : 0.2
          }
          metalness={
            segment.color === 'bankrot' || segment.color === 'nic'
              ? 0.0  // Žádná kovová odlesk pro černé segmenty
              : 0.2
          }
          roughness={
            segment.color === 'bankrot' || segment.color === 'nic'
              ? 1.0  // Maximální drsnost = žádné odrazy světla
              : 0.6
          }
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Text label */}
      <group rotation={[0, midAngle, 0]} position={[0, diskHeight/2 + segmentThickness + 0.02, 0]}>
        <Text
          position={[textRadius, 0, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.3}
          color="white"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          fillOpacity={1}
          outlineColor="#000000"
        >
          {String(segment.value)}
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
  const angle = (segmentId * Math.PI * 2) / 32 + Math.PI / 32;
  const radius = 2.7; // Zvětšeno pro lepší viditelnost
  
  const x = radius * Math.cos(angle);
  const z = radius * Math.sin(angle);
  const y = 0.25; // Zvednuto výše
  
  return (
    <group position={[x, y, z]}>
      {/* Žeton jako válec - větší a výraznější */}
      <mesh castShadow rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.08, 32]} />
        <meshStandardMaterial 
          color={player.color}
          metalness={0.6}
          roughness={0.3}
          emissive={player.color}
          emissiveIntensity={0.3}
        />
      </mesh>
      
      {/* Číslo na žetonu - větší */}
      <Text
        position={[0, 0.05, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.12}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.01}
        outlineColor="#000000"
      >
        {String(playerId + 1)}
      </Text>
    </group>
  );
};

// 3D Pointer that shows which segment is selected (small triangular wedge on wheel rim)
const Pointer3D = () => {
  const R = 3;
  const diskHeight = 0.1 * R;  // 0.3
  const wheelY = 1.525 + diskHeight/2;  // 1.675
  const segmentThickness = 0.05;
  
  // Pointer bude těsně nad povrchem segmentů na okraji kola
  const pointerY = wheelY + diskHeight/2 + segmentThickness;  // 1.675 + 0.15 + 0.05 = 1.875
  const pointerZ = -R * 0.92;  // -2.76 - na okraji z druhé strany, ukazuje dovnitř
  
  return (
    <group position={[0, pointerY, pointerZ]} rotation={[0, Math.PI, 0]}>
      {/* Malý plochý trojúhelník z tmavého dřeva */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} castShadow>
        <coneGeometry args={[0.15, 0.25, 3]} />
        <meshStandardMaterial 
          color="#5d4037"  // Tmavé dřevo
          roughness={0.85}
          metalness={0.0}
        />
      </mesh>
      
      {/* Malá žlutá špička */}
      <mesh position={[0, 0, -0.15]} rotation={[-Math.PI / 2, 0, 0]} castShadow>
        <coneGeometry args={[0.12, 0.15, 3]} />
        <meshStandardMaterial 
          color="#ffd700"
          emissive="#ffd700"
          emissiveIntensity={0.3}
        />
      </mesh>
      
      {/* Jemné světlo */}
      <pointLight 
        position={[0, 0, 0.2]} 
        intensity={0.3} 
        distance={0.8}
        color="#ffd700"
      />
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
  const wheelY = 1.525 + diskHeight / 2;
  
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y = -rotation; // Záporná rotace = clockwise (po směru hodinových ručiček)
    }
  });
  
  return (
    <group 
      ref={groupRef}
      position={[0, wheelY, 0]}
    >
      {/* Hlavní disk */}
      <mesh castShadow receiveShadow rotation={[0, 0, 0]}>
        <cylinderGeometry args={[R, R, diskHeight, 64]} />
        <meshStandardMaterial color="#2a2a2a" />
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
      
      <Pointer3D />
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
    <div className="relative w-full h-full min-h-[500px] max-h-[70vh]">
      <Canvas
        camera={{ 
          position: [6, 3, 6],
          fov: 50,
          near: 0.1,
          far: 100
        }}
        shadows
        gl={{ 
          antialias: true,
          alpha: true 
        }}
        style={{ 
          width: '100%',
          height: '100%',
          background: 'transparent' 
        }}
      >
        <Scene 
          rotation={rotation}
          tokenPositions={tokenPositions}
          players={players}
          onSegmentClick={onSegmentClick}
          isClickable={placingTokensMode}
        />
      </Canvas>
    </div>
  );
};
