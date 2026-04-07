import React, { useMemo, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { MarchingCubes } from 'three/examples/jsm/objects/MarchingCubes.js';
import * as THREE from 'three';
import { generateOrbitalPoints, getWavefunctionValue } from '../utils/physics';
import { QuantumNumbers, ViewMode } from '../types';

// Augment React's JSX namespace to recognize Three.js elements (React 18+)
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      ambientLight: any;
      pointLight: any;
      mesh: any;
      sphereGeometry: any;
      meshStandardMaterial: any;
      meshPhysicalMaterial: any;
      points: any;
      bufferGeometry: any;
      bufferAttribute: any;
      pointsMaterial: any;
      gridHelper: any;
      group: any;
      primitive: any;
    }
  }
}

// Also augment global JSX namespace as fallback
declare global {
  namespace JSX {
    interface IntrinsicElements {
      ambientLight: any;
      pointLight: any;
      mesh: any;
      sphereGeometry: any;
      meshStandardMaterial: any;
      meshPhysicalMaterial: any;
      points: any;
      bufferGeometry: any;
      bufferAttribute: any;
      pointsMaterial: any;
      gridHelper: any;
      group: any;
      primitive: any;
    }
  }
}

import { fieldCache } from '../utils/cache';
import OrbitalWorker from '../utils/orbitalWorker.ts?worker&inline';

interface VisualizerProps {
  quantumNumbers: QuantumNumbers;
  mode: ViewMode;
  autoRotate?: boolean;
  onCalculatingChange?: (isCalculating: boolean) => void;
}

const PointCloudOrbital: React.FC<{ quantumNumbers: QuantumNumbers, autoRotate?: boolean }> = ({ quantumNumbers, autoRotate }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 15000; 

  // Memoize point generation so it only recalculates when N, L, M change
  const { positions, colors } = useMemo(() => {
    return generateOrbitalPoints(quantumNumbers.n, quantumNumbers.l, quantumNumbers.m, count);
  }, [quantumNumbers.n, quantumNumbers.l, quantumNumbers.m]);

  useFrame((state) => {
    if (pointsRef.current) {
      // Slow rotation for cinematic effect
      if (autoRotate) {
        pointsRef.current.rotation.y += 0.001;
      }
      // Gentle breathing effect
      const t = state.clock.getElapsedTime();
      pointsRef.current.scale.setScalar(1 + Math.sin(t * 0.5) * 0.02);
    }
  });

  return (
    <points 
      ref={pointsRef} 
      key={`orb-${quantumNumbers.n}-${quantumNumbers.l}-${quantumNumbers.m}`}
    >
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation={true}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

const IsosurfaceOrbital: React.FC<{ quantumNumbers: QuantumNumbers, autoRotate?: boolean, onCalculatingChange?: (isCalculating: boolean) => void }> = ({ quantumNumbers, autoRotate, onCalculatingChange }) => {
  // Reduced resolution to 100 for a better balance of speed and quality.
  // 100^3 = 1M voxels, which is ~6x faster than 180^3.
  const resolution = 100; 
  const groupRef = useRef<THREE.Group>(null);
  const { n, l, m } = quantumNumbers;
  const cacheKey = `${n}-${l}-${m}-${resolution}`;

  // Increased maxR to prevent boundary cut-offs for higher orbitals
  const maxR = n * n * 3.0 + 15;

  // Use MeshPhysicalMaterial for a smooth, glossy look with fixed 100% opacity
  const materialPos = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: "#0ea5e9", // Cyan for positive phase
    emissive: "#0284c7",
    emissiveIntensity: 0.05,
    roughness: 0.05,
    metalness: 0.3,
    clearcoat: 1.0,
    clearcoatRoughness: 0.02,
    transparent: false,
    opacity: 1.0,
    side: THREE.FrontSide,
    depthWrite: true,
  }), []);

  const materialNeg = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: "#f97316", // Orange for negative phase
    emissive: "#c2410c",
    emissiveIntensity: 0.05,
    roughness: 0.05,
    metalness: 0.3,
    clearcoat: 1.0,
    clearcoatRoughness: 0.02,
    transparent: false,
    opacity: 1.0,
    side: THREE.FrontSide,
    depthWrite: true,
  }), []);

  const mcPos = useMemo(() => {
    // 100^3 voxels = 1,000,000. Max 5 polys per voxel = 5,000,000 polys.
    const instance = new MarchingCubes(resolution, materialPos, false, false, 5000000);
    instance.scale.set(maxR, maxR, maxR);
    return instance;
  }, [resolution, materialPos, maxR]);

  const mcNeg = useMemo(() => {
    const instance = new MarchingCubes(resolution, materialNeg, false, false, 5000000);
    instance.scale.set(maxR, maxR, maxR);
    return instance;
  }, [resolution, materialNeg, maxR]);

  useEffect(() => {
    if (!mcPos || !mcNeg) return;
    
    // Check cache first
    const cached = fieldCache.get(cacheKey);
    if (cached) {
      mcPos.reset();
      mcNeg.reset();
      mcPos.field.set(cached.fieldPos);
      mcNeg.field.set(cached.fieldNeg);
      
      const iso = cached.maxPsi > 0 ? cached.maxPsi * 0.15 : 0.001;
      mcPos.isolation = iso;
      mcNeg.isolation = iso;
      
      mcPos.update();
      mcNeg.update();
      mcPos.geometry.computeVertexNormals();
      mcNeg.geometry.computeVertexNormals();
      return;
    }

    onCalculatingChange?.(true);

    // Create worker
    const worker = new OrbitalWorker();
    
    worker.onmessage = (e) => {
      const { fieldPos, fieldNeg, maxPsi } = e.data;
      
      // Store in cache
      fieldCache.set(cacheKey, { fieldPos, fieldNeg, maxPsi });

      mcPos.reset();
      mcNeg.reset();

      // Copy fields
      mcPos.field.set(fieldPos);
      mcNeg.field.set(fieldNeg);

      // Threshold logic
      if (maxPsi > 0) {
        const iso = maxPsi * 0.15;
        mcPos.isolation = iso; 
        mcNeg.isolation = iso;
      } else {
        mcPos.isolation = 0.001;
        mcNeg.isolation = 0.001;
      }
      
      mcPos.update();
      mcNeg.update();

      mcPos.geometry.computeVertexNormals();
      mcNeg.geometry.computeVertexNormals();

      onCalculatingChange?.(false);
      worker.terminate();
    };

    worker.postMessage({ n, l, m, resolution, maxR });

    return () => {
      worker.terminate();
    };
  }, [n, l, m, resolution, maxR, mcPos, mcNeg, cacheKey, onCalculatingChange]);
  
  useFrame((state) => {
    if (groupRef.current && autoRotate) {
       groupRef.current.rotation.y += 0.002;
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={mcPos} />
      <primitive object={mcNeg} />
    </group>
  );
};

const AtomScene: React.FC<VisualizerProps> = ({ quantumNumbers, mode, autoRotate, onCalculatingChange }) => {
  // Determine physical extent of orbital to normalize view
  const orbitalRadius = quantumNumbers.n * quantumNumbers.n * 3.0 + 15;
  
  // We want the orbital to occupy roughly 6-8 units of screen space radius
  const targetRadius = 7.0;
  const visualScale = targetRadius / orbitalRadius;

  return (
    <>
      <ambientLight intensity={1.0} />
      <pointLight position={[10, 10, 10]} intensity={2.0} />
      <pointLight position={[-10, -10, -10]} intensity={1.5} />
      <pointLight position={[0, 5, 0]} intensity={1.0} color="#38bdf8" />
      
      {/* Nucleus - Scaled to be visible but small */}
      <mesh position={[0, 0, 0]} scale={[0.5, 0.5, 0.5]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.8} />
      </mesh>
 
      {/* Electron Cloud Group */}
      <group scale={[visualScale, visualScale, visualScale]}>
        {mode === 'points' ? (
           <PointCloudOrbital quantumNumbers={quantumNumbers} autoRotate={autoRotate} />
        ) : (
           <IsosurfaceOrbital quantumNumbers={quantumNumbers} autoRotate={autoRotate} onCalculatingChange={onCalculatingChange} />
        )}
      </group>

      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      {/* Grid helper - Fixed size reference */}
      <gridHelper args={[30, 30, 0x444444, 0x222222]} position={[0, -8, 0]} />
    </>
  );
};

export const Visualizer: React.FC<VisualizerProps> = ({ quantumNumbers, mode, autoRotate }) => {
  const [isCalculating, setIsCalculating] = React.useState(false);

  return (
    <div className="w-full h-full relative bg-slate-950">
      <Canvas camera={{ position: [0, 2, 18], fov: 45 }} gl={{ antialias: true, alpha: false }}>
        <AtomScene quantumNumbers={quantumNumbers} mode={mode} autoRotate={autoRotate} onCalculatingChange={setIsCalculating} />
        <OrbitControls enablePan={false} minDistance={5} maxDistance={100} autoRotate={autoRotate} autoRotateSpeed={1.0} />
      </Canvas>
      <div className="absolute top-4 right-4 text-white/40 text-sm font-mono select-none pointer-events-none z-10 flex flex-col gap-1 text-right">
        {isCalculating && <div className="text-science-400 animate-pulse font-bold text-base">正在生成高精度模型...</div>}
        <div>旋转: {autoRotate ? '开启' : '关闭'} | 缩放: 滚轮</div>
      </div>
    </div>
  );
};