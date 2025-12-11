import * as THREE from 'three';
import { TOTAL_PARTICLES } from '../constants';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { Font } from 'three/examples/jsm/loaders/FontLoader';

const tempVec = new THREE.Vector3();

// 1. Tree Shape Generator (Cone Volume/Surface)
export const generateTreePositions = (count: number): Float32Array => {
  const data = new Float32Array(count * 3);
  const height = 12;
  const maxRadius = 5;

  for (let i = 0; i < count; i++) {
    // Normalized height (0 at top, 1 at bottom)
    const yNorm = Math.pow(Math.random(), 0.8); 
    const y = 6 - (yNorm * height); // range roughly 6 to -6

    // Radius depends on height
    const r = yNorm * maxRadius * Math.sqrt(Math.random()); // Random spread inside cone
    
    // Spiral angle
    const theta = i * 0.5 + Math.random() * Math.PI * 2; 

    const x = r * Math.cos(theta);
    const z = r * Math.sin(theta);

    data[i * 3] = x;
    data[i * 3 + 1] = y;
    data[i * 3 + 2] = z;
  }
  return data;
};

// 2. Explosion Shape Generator (Sphere Volume)
export const generateExplosionPositions = (count: number): Float32Array => {
  const data = new Float32Array(count * 3);
  const radius = 15;

  for (let i = 0; i < count; i++) {
    const r = radius * Math.cbrt(Math.random()); // Even distribution in sphere
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);

    data[i * 3] = x;
    data[i * 3 + 1] = y;
    data[i * 3 + 2] = z;
  }
  return data;
};

// 3. Text Shape Generator
export const generateTextPositions = (font: Font, count: number): Float32Array => {
  const geometry = new TextGeometry('MERRY\nCHRISTMAS', {
    font: font,
    size: 2,
    depth: 0.5,
    curveSegments: 6,
    bevelEnabled: true,
    bevelThickness: 0.1,
    bevelSize: 0.05,
    bevelOffset: 0,
    bevelSegments: 3,
  });

  geometry.center();
  geometry.computeBoundingBox();

  // Raycast or Sample Logic
  // A simpler approach for aesthetics: Use vertices from the geometry
  // If we have more particles than vertices, we loop.
  // If fewer, we sample randomly.
  
  // Since TextGeometry is complex, let's use a standard sampler approach 
  // but simplified by extracting random points from the computed geometry faces.
  
  const posAttribute = geometry.attributes.position;
  const vertexCount = posAttribute.count;
  const data = new Float32Array(count * 3);
  
  // Create a temporary mesh to sample from surface area would be best,
  // but for performance, let's just pick random vertices and interpolate between triangles.
  // Actually, picking pure vertices often looks too grid-like.
  // Let's sample random points on triangles.

  for (let i = 0; i < count; i++) {
    // Pick a random triangle
    const faceIndex = Math.floor(Math.random() * (vertexCount / 3));
    const i0 = faceIndex * 3;
    const i1 = faceIndex * 3 + 1;
    const i2 = faceIndex * 3 + 2;

    const vA = new THREE.Vector3().fromBufferAttribute(posAttribute, i0);
    const vB = new THREE.Vector3().fromBufferAttribute(posAttribute, i1);
    const vC = new THREE.Vector3().fromBufferAttribute(posAttribute, i2);

    // Random barycentric coordinates
    let r1 = Math.random();
    let r2 = Math.random();
    if (r1 + r2 > 1) {
      r1 = 1 - r1;
      r2 = 1 - r2;
    }
    const r3 = 1 - r1 - r2;

    const x = vA.x * r1 + vB.x * r2 + vC.x * r3;
    const y = vA.y * r1 + vB.y * r2 + vC.y * r3;
    const z = vA.z * r1 + vB.z * r2 + vC.z * r3;

    data[i * 3] = x;
    data[i * 3 + 1] = y;
    data[i * 3 + 2] = z;
  }
  
  return data;
}