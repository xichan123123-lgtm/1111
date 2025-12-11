import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Stars } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import MagicParticles from './MagicParticles';
import TreeTopper from './TreeTopper';
import { AppState } from '../types';

interface SceneProps {
  appState: AppState;
}

// Wrapper to rotate the whole group slowly
const RotatingGroup: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.1; // Slow rotation
    }
  });
  return <group ref={groupRef}>{children}</group>;
};

const Scene: React.FC<SceneProps> = ({ appState }) => {
  return (
    <Canvas
      camera={{ position: [0, 0, 20], fov: 45 }}
      dpr={[1, 2]} // Support high DPI
      gl={{ toneMapping: THREE.ReinhardToneMapping, toneMappingExposure: 1.5 }}
    >
      <color attach="background" args={['#050505']} />
      <fog attach="fog" args={['#050505', 15, 35]} />

      {/* Lighting */}
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#ffaa00" />
      <spotLight 
        position={[-10, 20, 10]} 
        angle={0.3} 
        penumbra={1} 
        intensity={2} 
        castShadow 
        color="#ffeb3b"
      />

      {/* Main Content */}
      <RotatingGroup>
        <MagicParticles appState={appState} />
        <TreeTopper appState={appState} />
      </RotatingGroup>

      {/* Environment & Effects */}
      <ContactShadows resolution={1024} scale={30} blur={2} opacity={0.5} far={10} color="#000000" />
      <Environment preset="city" />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

      <EffectComposer enableNormalPass={false}>
        <Bloom 
          luminanceThreshold={1} 
          mipmapBlur 
          intensity={1.5} 
          radius={0.4}
        />
      </EffectComposer>

      <OrbitControls 
        enablePan={false} 
        minPolarAngle={0} 
        maxPolarAngle={Math.PI / 1.5}
        minDistance={5}
        maxDistance={30}
        makeDefault 
      />
    </Canvas>
  );
};

export default Scene;