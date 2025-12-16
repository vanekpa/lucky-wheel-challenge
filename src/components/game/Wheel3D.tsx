import { useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { WheelSegment, Player } from '@/types/game';
import { WHEEL_RADIUS, POINTER_Y_POSITION, POINTER_Z_POSITION } from '@/constants/wheel';
import { WheelModel } from './WheelModel';

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
  pointerBounce = 0
}: { 
  rotation: number;
  rotationRef?: React.MutableRefObject<number>;
  tokenPositions: Map<number, number>;
  players: Player[];
  onSegmentClick?: (segmentId: number) => void;
  isClickable?: boolean;
  pointerBounce?: number;
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
      <Pointer3D bounce={pointerBounce} />
      <Pedestal />
      <WheelModel
        rotation={rotation}
        rotationRef={rotationRef}
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
  rotationRef,
  isSpinning,
  onSpinComplete,
  tokenPositions,
  onSegmentClick,
  placingTokensMode,
  players,
  currentPlayer,
  pointerBounce = 0
}: Wheel3DProps) => {
  return (
    <div className="w-full h-full bg-gradient-to-br from-blue-950/40 via-purple-950/40 to-indigo-950/40">
      <Canvas
        camera={{ 
          position: [0, 6, 8],
          fov: 45,
          near: 0.1,
          far: 1000
        }}
        shadows
        gl={{ antialias: true }}
      >
        <Scene 
          rotation={rotation}
          rotationRef={rotationRef}
          tokenPositions={tokenPositions}
          players={players}
          onSegmentClick={onSegmentClick}
          isClickable={placingTokensMode}
          pointerBounce={pointerBounce}
        />
      </Canvas>
    </div>
  );
};
