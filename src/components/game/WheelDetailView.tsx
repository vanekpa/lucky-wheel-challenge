import { useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { POINTER_Y_POSITION, POINTER_Z_POSITION } from '@/constants/wheel';
import { WheelModel } from './WheelModel';
import { Player } from '@/types/game';

interface WheelDetailViewProps {
  rotation: number;
  rotationRef?: React.MutableRefObject<number>;
  tokenPositions: Map<number, number>;
  players: Player[];
  pointerBounce?: number;
}

const CameraController = () => {
  const { camera } = useThree();
  
  useEffect(() => {
    camera.lookAt(0, POINTER_Y_POSITION, POINTER_Z_POSITION);
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
      {/* Dřevěná báze */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} castShadow>
        <coneGeometry args={[0.15, 0.25, 3]} />
        <meshStandardMaterial 
          color="#5d4037"
          roughness={0.85}
          metalness={0.0}
        />
      </mesh>
      
      {/* Zlatá špička */}
      <mesh position={[0, 0, -0.15]} rotation={[-Math.PI / 2, 0, 0]} castShadow>
        <coneGeometry args={[0.12, 0.15, 3]} />
        <meshStandardMaterial 
          color="#ffd700"
          emissive="#ffd700"
          emissiveIntensity={0.3}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
      
      {/* Světelný efekt */}
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
  pointerBounce = 0
}: { 
  rotation: number;
  rotationRef?: React.MutableRefObject<number>;
  tokenPositions: Map<number, number>;
  players: Player[];
  pointerBounce?: number;
}) => {
  return (
    <>
      <CameraController />
      <ambientLight intensity={1.2} />
      <directionalLight position={[2, 5, -3]} intensity={2.0} castShadow />
      <pointLight position={[-2, 3, -4]} intensity={1.2} />
      <pointLight position={[2, 3, -4]} intensity={0.8} color="#ffffff" />
      
      <WheelModel 
        rotation={rotation} 
        rotationRef={rotationRef}
        tokenPositions={tokenPositions}
        players={players}
      />
      <Pointer3D bounce={pointerBounce} />
    </>
  );
};

export const WheelDetailView = ({ rotation, rotationRef, tokenPositions, players, pointerBounce = 0 }: WheelDetailViewProps) => {
  return (
    <div className="w-full h-full bg-gradient-to-br from-purple-900/50 to-blue-900/50">
      <Canvas
        camera={{ 
          position: [0, 2.5, -4.5],
          fov: 45,
          near: 0.1,
          far: 100
        }}
        shadows
        frameloop="always"
        gl={{ antialias: true }}
      >
        <Scene 
          rotation={rotation} 
          rotationRef={rotationRef}
          tokenPositions={tokenPositions}
          players={players}
          pointerBounce={pointerBounce}
        />
      </Canvas>
    </div>
  );
};
