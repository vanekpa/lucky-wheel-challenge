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
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.0 * WHEEL_RADIUS, 0.9 * WHEEL_RADIUS, 0.75 * WHEEL_RADIUS, 32]} />
        <meshStandardMaterial 
          color="#2a2a2a" 
          metalness={0.6}
          roughness={0.3}
        />
      </mesh>
    </group>
  );
};

const Pointer3D = ({ bounce = 0 }: { bounce?: number }) => {
  // Bounce effect - oscillating rotation when wheel stops
  const bounceRotation = Math.sin(bounce * Math.PI * 8) * 0.15 * Math.max(0, 1 - bounce);
  
  return (
    <group 
      position={[0, POINTER_Y_POSITION, POINTER_Z_POSITION]} 
      rotation={[bounceRotation, Math.PI, 0]}
    >
      <mesh rotation={[-Math.PI / 2, 0, 0]} castShadow>
        <coneGeometry args={[0.15, 0.25, 3]} />
        <meshStandardMaterial 
          color="#5d4037"
          roughness={0.85}
          metalness={0.0}
        />
      </mesh>
      
      <mesh position={[0, 0, -0.15]} rotation={[-Math.PI / 2, 0, 0]} castShadow>
        <coneGeometry args={[0.12, 0.15, 3]} />
        <meshStandardMaterial 
          color="#ffd700"
          emissive="#ffd700"
          emissiveIntensity={0.3}
        />
      </mesh>
      
      <pointLight 
        position={[0, 0, 0.2]} 
        intensity={0.3} 
        distance={0.8}
        color="#ffd700"
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
