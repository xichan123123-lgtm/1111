import React, { useMemo, useRef, useEffect, useState } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { AppState } from '../types';
import { 
  TOTAL_PARTICLES, 
  SPHERE_COUNT, 
  COLOR_GOLD, 
  COLOR_RED, 
  COLOR_GREEN, 
  COLOR_DEEP_GREEN,
  FONT_URL
} from '../constants';
import { generateTreePositions, generateExplosionPositions, generateTextPositions } from '../utils/geometryGenerator';

interface MagicParticlesProps {
  appState: AppState;
}

const MagicParticles: React.FC<MagicParticlesProps> = ({ appState }) => {
  // Load Font
  const font = useLoader(FontLoader, FONT_URL);

  // References to InstancedMeshes (Main only)
  const spheresRef = useRef<THREE.InstancedMesh>(null);
  const cubesRef = useRef<THREE.InstancedMesh>(null);
  
  // Data Stores
  const [targetPositions, setTargetPositions] = useState<Float32Array | null>(null);
  
  // Memoize geometry data
  const { treePos, explodePos, textPos } = useMemo(() => {
    if (!font) return { treePos: new Float32Array(), explodePos: new Float32Array(), textPos: new Float32Array() };
    return {
      treePos: generateTreePositions(TOTAL_PARTICLES),
      explodePos: generateExplosionPositions(TOTAL_PARTICLES),
      textPos: generateTextPositions(font, TOTAL_PARTICLES)
    };
  }, [font]);

  // Colors array
  const colors = useMemo(() => {
    const cSpheres = new Float32Array(SPHERE_COUNT * 3);
    const cCubes = new Float32Array((TOTAL_PARTICLES - SPHERE_COUNT) * 3);
    const color = new THREE.Color();

    // Spheres
    for (let i = 0; i < SPHERE_COUNT; i++) {
      if (Math.random() > 0.3) color.set(COLOR_GOLD);
      else color.set(COLOR_RED);
      color.offsetHSL(0, 0, (Math.random() - 0.5) * 0.1);
      cSpheres[i * 3] = color.r;
      cSpheres[i * 3 + 1] = color.g;
      cSpheres[i * 3 + 2] = color.b;
    }

    // Cubes
    for (let i = 0; i < TOTAL_PARTICLES - SPHERE_COUNT; i++) {
      if (Math.random() > 0.5) color.set(COLOR_GOLD);
      else if (Math.random() > 0.5) color.set(COLOR_GREEN);
      else color.set(COLOR_DEEP_GREEN);
      color.offsetHSL(0, 0, (Math.random() - 0.5) * 0.1);
      cCubes[i * 3] = color.r;
      cCubes[i * 3 + 1] = color.g;
      cCubes[i * 3 + 2] = color.b;
    }
    return { spheres: cSpheres, cubes: cCubes };
  }, []);

  // Update target
  useEffect(() => {
    if (!font) return;
    switch (appState) {
      case AppState.TREE: setTargetPositions(treePos); break;
      case AppState.EXPLODED: setTargetPositions(explodePos); break;
      case AppState.TEXT: setTargetPositions(textPos); break;
    }
  }, [appState, font, treePos, explodePos, textPos]);

  // Position Arrays (Current)
  const currentPositions = useRef<Float32Array>(new Float32Array(TOTAL_PARTICLES * 3));
  
  // Initialize positions
  useEffect(() => {
    if (treePos.length > 0 && currentPositions.current[0] === 0) {
       currentPositions.current.set(treePos);
    }
  }, [treePos]);

  // Animation Loop
  useFrame((state, delta) => {
    if (!spheresRef.current || !cubesRef.current || !targetPositions) return;

    const dummy = new THREE.Object3D();
    const lerpSpeed = 4 * delta; 

    let i = 0;
    const time = state.clock.elapsedTime;

    // Helper to update matrices for a particle index
    const updateParticle = (
      idx: number, 
      baseScale: number, 
      meshMain: THREE.InstancedMesh, 
      instanceId: number,
      rotationFactor: number
    ) => {
        // 1. Update Main Position
        currentPositions.current[idx] = THREE.MathUtils.lerp(currentPositions.current[idx], targetPositions[idx], lerpSpeed);
        currentPositions.current[idx+1] = THREE.MathUtils.lerp(currentPositions.current[idx+1], targetPositions[idx+1], lerpSpeed);
        currentPositions.current[idx+2] = THREE.MathUtils.lerp(currentPositions.current[idx+2], targetPositions[idx+2], lerpSpeed);

        // Calculate Rotation & Breathing
        const rotX = time * rotationFactor + i;
        const rotY = time * (rotationFactor * 0.5) + i;
        const breathing = Math.sin(time * 2 + i) * 0.05;

        // Apply Main
        dummy.position.set(currentPositions.current[idx], currentPositions.current[idx+1], currentPositions.current[idx+2]);
        dummy.rotation.set(rotX, rotY, 0);
        dummy.scale.setScalar(baseScale + breathing);
        dummy.updateMatrix();
        meshMain.setMatrixAt(instanceId, dummy.matrix);
    };

    // Process Spheres
    for (let j = 0; j < SPHERE_COUNT; j++) {
      updateParticle(i * 3, 0.25, spheresRef.current, j, 0.2);
      i++;
    }

    // Process Cubes
    const cubeCount = TOTAL_PARTICLES - SPHERE_COUNT;
    for (let j = 0; j < cubeCount; j++) {
      updateParticle(i * 3, 0.22, cubesRef.current, j, 0.5);
      i++;
    }

    spheresRef.current.instanceMatrix.needsUpdate = true;
    cubesRef.current.instanceMatrix.needsUpdate = true;
  });

  // Set colors
  const applyColors = (mesh: THREE.InstancedMesh, colorsArray: Float32Array, count: number) => {
    for (let i = 0; i < count; i++) {
      mesh.setColorAt(i, new THREE.Color(colorsArray[i*3], colorsArray[i*3+1], colorsArray[i*3+2]));
    }
    mesh.instanceColor!.needsUpdate = true;
  };

  useEffect(() => {
    if (spheresRef.current && cubesRef.current) {
      applyColors(spheresRef.current, colors.spheres, SPHERE_COUNT);
      applyColors(cubesRef.current, colors.cubes, TOTAL_PARTICLES - SPHERE_COUNT);
    }
  }, [colors]);

  return (
    <group>
      {/* --- SPHERES --- */}
      <instancedMesh ref={spheresRef} args={[undefined, undefined, SPHERE_COUNT]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial metalness={0.9} roughness={0.15} envMapIntensity={1.5} />
      </instancedMesh>

      {/* --- CUBES --- */}
      <instancedMesh ref={cubesRef} args={[undefined, undefined, TOTAL_PARTICLES - SPHERE_COUNT]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial metalness={0.8} roughness={0.2} envMapIntensity={1.2} />
      </instancedMesh>
    </group>
  );
};

export default MagicParticles;