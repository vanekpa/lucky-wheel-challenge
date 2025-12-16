import { useEffect, useRef } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { WHEEL_RADIUS, POINTER_Y_POSITION, POINTER_Z_POSITION } from '@/constants/wheel';
import { BonusWheelModel } from './BonusWheelModel';

interface BonusWheel3DProps {
  rotation: number;
  rotationRef?: React.MutableRefObject<number>;
  blackoutMode: boolean;
  revealedSegments: Set<number>;
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

const Pointer3D = ({ bounce = 0 }: { bounce?: number }) => {
  const bounceRotation = Math.sin(bounce * Math.PI * 8) * 0.15 * Math.max(0, 1 - bounce);
  
  return (
    <group 
      position={[0, POINTER_Y_POSITION, POINTER_Z_POSITION]} 
      rotation={[bounceRotation, Math.PI, 0]}
    >
      {/* Main pointer body */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} castShadow>
        <coneGeometry args={[0.25, 0.4, 3]} />
        <meshStandardMaterial 
          color="#1a1a2e"
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>
      
      {/* Gold tip */}
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
      
      {/* Glow lights */}
      <pointLight 
        position={[0, 0, 0.3]} 
        intensity={1.5} 
        distance={2}
        color="#ffd700"
      />
      <pointLight 
        position={[0, 0, -0.3]} 
        intensity={0.8} 
        distance={1.5}
        color="#ffaa00"
      />
    </group>
  );
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
      
      {/* LED ring on top - gold for bonus */}
      <mesh position={[0, 0.375 * WHEEL_RADIUS, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.95 * WHEEL_RADIUS, 0.05, 16, 64]} />
        <meshStandardMaterial 
          color="#ffd700"
          emissive="#ffd700"
          emissiveIntensity={1.5}
        />
      </mesh>
      
      {/* LED ring glow light */}
      <pointLight 
        position={[0, 0.4 * WHEEL_RADIUS, 0]} 
        intensity={2} 
        distance={4}
        color="#ffd700"
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

const Scene = ({ 
  rotation,
  rotationRef,
  blackoutMode,
  revealedSegments,
  pointerBounce = 0,
}: { 
  rotation: number;
  rotationRef?: React.MutableRefObject<number>;
  blackoutMode: boolean;
  revealedSegments: Set<number>;
  pointerBounce?: number;
}) => {
  return (
    <>
      <CameraController />
      
      {/* Lighting */}
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
      <pointLight position={[5, 3, 5]} intensity={0.8} color="#ffd700" />
      <pointLight position={[-5, 3, -5]} intensity={0.8} color="#ffd700" />
      
      {/* Floor */}
      <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[12, 64]} />
        <meshStandardMaterial 
          color="#0a0a1a"
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
      
      {/* Gold floor ring */}
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[8, 8.2, 64]} />
        <meshStandardMaterial 
          color="#ffd700"
          emissive="#ffd700"
          emissiveIntensity={0.8}
        />
      </mesh>
      
      <Pointer3D bounce={pointerBounce} />
      <Pedestal />
      <BonusWheelModel
        rotation={rotation}
        rotationRef={rotationRef}
        blackoutMode={blackoutMode}
        revealedSegments={revealedSegments}
      />
    </>
  );
};

export const BonusWheel3D = ({
  rotation,
  rotationRef,
  blackoutMode,
  revealedSegments,
  pointerBounce = 0
}: BonusWheel3DProps) => {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ 
          position: [0, 6, 8],
          fov: 45,
          near: 0.1,
          far: 1000
        }}
        shadows
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Scene 
          rotation={rotation}
          rotationRef={rotationRef}
          blackoutMode={blackoutMode}
          revealedSegments={revealedSegments}
          pointerBounce={pointerBounce}
        />
      </Canvas>
    </div>
  );
};
