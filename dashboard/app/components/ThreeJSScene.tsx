'use client';

import { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Box, Sphere } from '@react-three/drei';
import * as THREE from 'three';

function InteractiveCube({ position, color, onClick }: { 
  position: [number, number, number]; 
  color: string;
  onClick: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.3;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.2;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime) * 0.1;
      meshRef.current.scale.setScalar(hovered ? 1.2 : 1);
    }
  });

  return (
    <Box 
      ref={meshRef} 
      position={position}
      args={[1, 1, 1]}
      onClick={onClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <meshStandardMaterial 
        color={hovered ? '#ffffff' : color}
        metalness={0.7}
        roughness={0.1}
        emissive={color}
        emissiveIntensity={hovered ? 0.5 : 0.2}
      />
    </Box>
  );
}

function InteractiveSphere({ position, color, onClick }: { 
  position: [number, number, number]; 
  color: string;
  onClick: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.2;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.4;
      meshRef.current.position.y = position[1] + Math.cos(state.clock.elapsedTime * 1.5) * 0.15;
      meshRef.current.scale.setScalar(hovered ? 1.3 : 1);
    }
  });

  return (
    <Sphere 
      ref={meshRef} 
      position={position}
      args={[0.6, 32, 32]}
      onClick={onClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <meshStandardMaterial 
        color={hovered ? '#ffffff' : color}
        metalness={0.8}
        roughness={0.2}
        emissive={color}
        emissiveIntensity={hovered ? 0.6 : 0.3}
      />
    </Sphere>
  );
}

function DataVisualization() {
  return (
    <group>
      <Text
        position={[0, 3, 0]}
        fontSize={0.5}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        Interactive Dashboard
      </Text>
      
      <Text
        position={[0, 2.5, 0]}
        fontSize={0.2}
        color="#94a3b8"
        anchorX="center"
        anchorY="middle"
      >
        Click and drag to explore • Hover over objects
      </Text>
    </group>
  );
}

export default function ThreeJSScene() {
  const handleCubeClick = () => {
    console.log('Cube clicked - Revenue data');
  };

  const handleSphereClick = () => {
    console.log('Sphere clicked - Analytics data');
  };

  return (
    <div className="absolute inset-0">
      <Canvas 
        camera={{ position: [0, 2, 8], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        {/* Enhanced Lighting */}
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color="#ffffff" />
        <pointLight position={[-10, -10, -5]} intensity={1} color="#3b82f6" />
        <directionalLight position={[0, 5, 5]} intensity={0.8} color="#8b5cf6" />
        <spotLight 
          position={[0, 10, 0]} 
          angle={0.3} 
          penumbra={1} 
          intensity={0.5}
          color="#10b981"
        />
        
        {/* Interactive 3D Objects */}
        <InteractiveCube 
          position={[-3, 0, 0]} 
          color="#3b82f6" 
          onClick={handleCubeClick}
        />
        <InteractiveSphere 
          position={[3, 0, 0]} 
          color="#8b5cf6" 
          onClick={handleSphereClick}
        />
        <InteractiveCube 
          position={[0, 0, -2]} 
          color="#10b981" 
          onClick={() => console.log('Performance metrics')}
        />
        <InteractiveSphere 
          position={[-1.5, 2, 1]} 
          color="#f59e0b" 
          onClick={() => console.log('Client data')}
        />
        <InteractiveCube 
          position={[1.5, -2, 1]} 
          color="#ef4444" 
          onClick={() => console.log('Project status')}
        />
        
        {/* Text Information */}
        <DataVisualization />
        
        {/* Interactive Controls */}
        <OrbitControls 
          enableZoom={true} 
          enablePan={true}
          autoRotate={false}
          maxDistance={15}
          minDistance={3}
          maxPolarAngle={Math.PI * 0.8}
          minPolarAngle={Math.PI * 0.2}
        />
      </Canvas>
    </div>
  );
}
