import * as THREE from 'three';

export const getColorFromSegment = (colorName: string): string => {
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

export const createWedgeGeometry = (
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
  
  // Add small overlap to prevent gaps between segments
  const overlap = 0.002;
  const adjustedEndAngle = endAngle + overlap;
  
  let vertexIndex = 0;
  
  const topInnerVertices: number[] = [];
  const topOuterVertices: number[] = [];
  const bottomInnerVertices: number[] = [];
  const bottomOuterVertices: number[] = [];
  
  for (let i = 0; i <= segments; i++) {
    const angle = startAngle + (adjustedEndAngle - startAngle) * (i / segments);
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
