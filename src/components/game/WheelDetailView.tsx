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
  debugRotation?: { x: number; y: number; z: number; yOffset: number };
}

const CameraController = () => {
  const { camera } = useThree();
  
  useEffect(() => {
    camera.lookAt(0, POINTER_Y_POSITION, POINTER_Z_POSITION);
    camera.updateProjectionMatrix();
  }, [camera]);
  
  return null;
};

const Pointer3D = () => {
  return (
    <group position={[0, POINTER_Y_POSITION, POINTER_Z_POSITION]}>
      <mesh rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[0.15, 0.4, 32]} />
        <meshStandardMaterial color="#FFD700" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
};

const Scene = ({ 
  rotation,
  rotationRef,
  tokenPositions,
  players,
  debugRotation
}: { 
  rotation: number;
  rotationRef?: React.MutableRefObject<number>;
  tokenPositions: Map<number, number>;
  players: Player[];
  debugRotation?: { x: number; y: number; z: number; yOffset: number };
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
        debugRotation={debugRotation}
      />
      <Pointer3D />
    </>
  );
};

export const WheelDetailView = ({ rotation, rotationRef, tokenPositions, players, debugRotation }: WheelDetailViewProps) => {
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
          debugRotation={debugRotation}
        />
      </Canvas>
    </div>
  );
};
