import React, { useEffect, useRef } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { wheelSegments } from '@/data/puzzles';

interface WheelDetailViewProps {
  rotation: number;
  rotationRef?: React.MutableRefObject<number>;
}

const getColorFromSegment = (colorName: string): string => {
  const colorMap: Record<string, string> = {
    'wheel-red': '#fe3d2f',
    'wheel-blue': '#3b69ee',
    'wheel-yellow': '#fed815',
    'wheel-green': '#409b7b',
    'wheel-purple': '#e741e8',
    'bankrot': '#000000',
    'nic': '#000000',
  };
  return colorMap[colorName] || '#ffffff';
};

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
  
  const topInnerVertices: number[] = [];
  const topOuterVertices: number[] = [];
  const bottomInnerVertices: number[] = [];
  const bottomOuterVertices: number[] = [];
  
  for (let i = 0; i <= segments; i++) {
    const angle = startAngle + (endAngle - startAngle) * (i / segments);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    
    topInnerVertices.push(vertexIndex);
    vertices.push(innerRadius * cos, thickness / 2, innerRadius * sin);
    vertexIndex++;
    
    topOuterVertices.push(vertexIndex);
    vertices.push(outerRadius * cos, thickness / 2, outerRadius * sin);
    vertexIndex++;
    
    bottomInnerVertices.push(vertexIndex);
    vertices.push(innerRadius * cos, -thickness / 2, innerRadius * sin);
    vertexIndex++;
    
    bottomOuterVertices.push(vertexIndex);
    vertices.push(outerRadius * cos, -thickness / 2, outerRadius * sin);
    vertexIndex++;
  }
  
  for (let i = 0; i < segments; i++) {
    const topInner = topInnerVertices[i];
    const topOuter = topOuterVertices[i];
    const nextTopInner = topInnerVertices[i + 1];
    const nextTopOuter = topOuterVertices[i + 1];
    
    const bottomInner = bottomInnerVertices[i];
    const bottomOuter = bottomOuterVertices[i];
    const nextBottomInner = bottomInnerVertices[i + 1];
    const nextBottomOuter = bottomOuterVertices[i + 1];
    
    indices.push(topInner, topOuter, nextTopInner);
    indices.push(topOuter, nextTopOuter, nextTopInner);
    
    indices.push(bottomInner, nextBottomInner, bottomOuter);
    indices.push(bottomOuter, nextBottomInner, nextBottomOuter);
    
    indices.push(topInner, bottomInner, nextTopInner);
    indices.push(bottomInner, nextBottomInner, nextTopInner);
    
    indices.push(topOuter, nextTopOuter, bottomOuter);
    indices.push(bottomOuter, nextTopOuter, nextBottomOuter);
  }
  
  const startCapInner = topInnerVertices[0];
  const startCapOuter = topOuterVertices[0];
  const startCapBottomInner = bottomInnerVertices[0];
  const startCapBottomOuter = bottomOuterVertices[0];
  
  indices.push(startCapInner, startCapBottomInner, startCapOuter);
  indices.push(startCapOuter, startCapBottomInner, startCapBottomOuter);
  
  const endCapInner = topInnerVertices[segments];
  const endCapOuter = topOuterVertices[segments];
  const endCapBottomInner = bottomInnerVertices[segments];
  const endCapBottomOuter = bottomOuterVertices[segments];
  
  indices.push(endCapInner, endCapOuter, endCapBottomInner);
  indices.push(endCapOuter, endCapBottomOuter, endCapBottomInner);
  
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  
  return geometry;
};

const CameraController = () => {
  const { camera } = useThree();
  
  useEffect(() => {
    // Zaměřit na pointer pozici
    camera.lookAt(0, 1.875, -2.76);
    camera.updateProjectionMatrix();
  }, [camera]);
  
  return null;
};

const Pointer3D = () => {
  return (
    <group position={[0, 1.875, -2.76]}>
      <mesh rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[0.15, 0.4, 32]} />
        <meshStandardMaterial color="#FFD700" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
};

interface WheelSegment3DProps {
  segment: typeof wheelSegments[0];
  index: number;
  segmentAngle: number;
  innerRadius: number;
  outerRadius: number;
  thickness: number;
}

const WheelSegment3D = ({ segment, index, segmentAngle, innerRadius, outerRadius, thickness }: WheelSegment3DProps) => {
  const ROTATIONAL_OFFSET = -Math.PI / 2;
  const startAngle = index * segmentAngle + ROTATIONAL_OFFSET;
  const endAngle = (index + 1) * segmentAngle + ROTATIONAL_OFFSET;
  const midAngle = (startAngle + endAngle) / 2;
  
  const wedgeGeometry = createWedgeGeometry(innerRadius, outerRadius, startAngle, endAngle, thickness);
  
  const textRadius = (innerRadius + outerRadius) / 2;
  const textX = textRadius * Math.cos(midAngle);
  const textZ = textRadius * Math.sin(midAngle);
  
  const segmentColor = getColorFromSegment(segment.color);
  
  return (
    <group>
      <mesh geometry={wedgeGeometry}>
        <meshStandardMaterial 
          color={segmentColor} 
          metalness={0.3} 
          roughness={0.4}
        />
      </mesh>
      
      <Text
        position={[textX, thickness / 2 + 0.01, textZ]}
        rotation={[-Math.PI / 2, 0, midAngle + Math.PI / 2]}
        fontSize={0.25}
        color={segment.color === 'wheel-yellow' ? '#000000' : '#ffffff'}
        anchorX="center"
        anchorY="middle"
        font="/fonts/Arial-Bold.ttf"
      >
        {segment.value}
      </Text>
    </group>
  );
};

const WheelDisk = ({ 
  rotation,
  rotationRef: externalRotationRef 
}: { 
  rotation: number;
  rotationRef?: React.MutableRefObject<number>;
}) => {
  const meshRef = useRef<THREE.Group>(null);
  
  useFrame(() => {
    if (meshRef.current) {
      const currentRotation = externalRotationRef?.current ?? rotation;
      meshRef.current.rotation.y = -currentRotation;
    }
  });
  
  const diskRadius = 3;
  const innerRadius = 0.3;
  const thickness = 0.2;
  const segmentAngle = (2 * Math.PI) / wheelSegments.length;
  
  return (
    <group ref={meshRef} position={[0, 1.675, 0]}>
      <mesh>
        <cylinderGeometry args={[diskRadius, diskRadius, thickness, 64]} />
        <meshStandardMaterial color="#8B4513" metalness={0.4} roughness={0.6} />
      </mesh>
      
      {wheelSegments.map((segment, index) => (
        <WheelSegment3D
          key={segment.id}
          segment={segment}
          index={index}
          segmentAngle={segmentAngle}
          innerRadius={innerRadius}
          outerRadius={diskRadius}
          thickness={thickness}
        />
      ))}
    </group>
  );
};

const Scene = ({ 
  rotation,
  rotationRef 
}: { 
  rotation: number;
  rotationRef?: React.MutableRefObject<number>;
}) => {
  return (
    <>
      <CameraController />
      <ambientLight intensity={1.2} />
      <directionalLight position={[2, 5, -3]} intensity={2.0} castShadow />
      <pointLight position={[-2, 3, -4]} intensity={1.2} />
      <pointLight position={[2, 3, -4]} intensity={0.8} color="#ffffff" />
      
      <WheelDisk rotation={rotation} rotationRef={rotationRef} />
      <Pointer3D />
    </>
  );
};

export const WheelDetailView = ({ rotation, rotationRef }: WheelDetailViewProps) => {
  return (
    <div className="w-full h-full bg-gradient-to-br from-purple-900/50 to-blue-900/50">
      <Canvas
        camera={{ 
          position: [0, 2.5, -1.8],
          fov: 45,
          near: 0.1,
          far: 100
        }}
        shadows
        frameloop="always"
        gl={{ antialias: true }}
      >
        <Scene rotation={rotation} rotationRef={rotationRef} />
      </Canvas>
    </div>
  );
};
