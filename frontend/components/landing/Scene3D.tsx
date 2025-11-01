'use client';

import React, { useRef, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, useGLTF, Html, useProgress } from '@react-three/drei';
import * as THREE from 'three';
import { TankConfig } from '@/lib/landing-types';

// Loading progress component
function LoadingProgress() {
  const { progress, active } = useProgress();
  return active ? (
    <Html center>
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-white text-sm font-medium">Loading 3D Model...</div>
        <div className="w-48 bg-gray-700 rounded-full h-2 overflow-hidden">
          <div 
            className="bg-blue-500 h-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-gray-400 text-xs">{Math.round(progress)}%</div>
      </div>
    </Html>
  ) : null;
}

// Component to load external GLTF model
function ExternalModel({ url, onPartHover, onPartClick, hoveredPart }: {
  url: string;
  onPartHover: (part: string | null) => void;
  onPartClick: (part: string) => void;
  hoveredPart: string | null;
}) {
  const { scene } = useGLTF(url);
  const groupRef = useRef<THREE.Group>(null);
  const lastUrlRef = useRef<string | null>(null);

  React.useEffect(() => {
    if (url) {
      console.log('🔵 Loading model from:', url);
    }
    lastUrlRef.current = url;
  }, [url]);

  React.useEffect(() => {
    if (scene && url === lastUrlRef.current) {
      console.log('✅ Model loaded successfully!', scene);
      console.log('✅ Scene children:', scene.children.length);

      requestAnimationFrame(() => {
        try {
          scene.position.set(0, 0, 0);
          scene.scale.set(1, 1, 1);
          scene.rotation.set(0, 0, 0);
          scene.updateMatrixWorld(true);

          const box = new THREE.Box3().setFromObject(scene);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());

          console.log('📦 Model bounds:', { center, size, isEmpty: box.isEmpty() });

          if (!box.isEmpty() && !isNaN(size.x) && !isNaN(size.y) && !isNaN(size.z) && size.x > 0 && size.y > 0 && size.z > 0) {
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = maxDim > 0 ? 8 / maxDim : 1;

            console.log('📏 Scaling model:', { maxDim, scale, size });

            scene.position.x = -center.x;
            scene.position.y = -center.y;
            scene.position.z = -center.z;
            scene.scale.set(scale, scale, scale);

            console.log('✅ Model positioned at:', scene.position);
            console.log('✅ Model scale:', scene.scale);
          } else {
            console.warn('⚠️ Invalid bounding box, trying fallback scaling');
            scene.position.set(0, 0, 0);
            scene.scale.set(0.01, 0.01, 0.01);
          }

          scene.updateMatrixWorld(true);

          let meshCount = 0;
          scene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              meshCount++;
              const mesh = child as THREE.Mesh;
              if (!mesh.userData.originalEmissive) {
                mesh.userData.originalEmissive = (mesh.material as any)?.emissive?.clone() || new THREE.Color(0x000000);
                mesh.userData.originalEmissiveIntensity = (mesh.material as any)?.emissiveIntensity || 0;
              }
              (child as any).cursor = 'pointer';
            }
          });
          console.log('🔷 Found', meshCount, 'meshes in model');
        } catch (err) {
          console.error('❌ Error processing model:', err);
        }
      });
    }
  }, [scene, url]);

  const detectPartFromPosition = (worldPosition: THREE.Vector3, name: string) => {
    const y = worldPosition.y;
    const z = worldPosition.z;
    const nameLower = name.toLowerCase();

    if (nameLower.includes('turret') || nameLower.includes('gun') || nameLower.includes('cannon')) {
      return 'turret';
    } else if (nameLower.includes('engine') || nameLower.includes('motor') || nameLower.includes('power')) {
      return 'engine';
    } else if (nameLower.includes('track') || nameLower.includes('wheel') || nameLower.includes('suspension')) {
      return 'tracks';
    } else if (nameLower.includes('hull') || nameLower.includes('body') || nameLower.includes('armor')) {
      return 'armor';
    } else if (nameLower.includes('sight') || nameLower.includes('optics') || nameLower.includes('viewer')) {
      return 'optics';
    } else if (nameLower.includes('transmission') || nameLower.includes('gearbox')) {
      return 'transmission';
    } else {
      if (y > 0.5 && Math.abs(z) < 2) {
        return 'turret';
      } else if (z < -1) {
        return 'engine';
      } else if (y < -0.5) {
        return 'tracks';
      } else if (z > 1) {
        return 'armor';
      } else if (y > 1.5) {
        return 'optics';
      } else {
        return 'armor';
      }
    }
  };

  // Don't show fallback here - Suspense will handle it
  if (!scene) {
    return null;
  }

  return (
    <group ref={groupRef} position={[0, 0, 0]} key={url}>
      <primitive
        object={scene}
        onClick={(e: any) => {
          e.stopPropagation();
          const worldPosition = new THREE.Vector3();
          e.object.getWorldPosition(worldPosition);
          let partName = e.object.name || '';
          
          if (!partName || partName === '') {
            let obj = e.object;
            for (let i = 0; i < 5 && obj.parent; i++) {
              obj = obj.parent;
              if (obj.name && obj.name !== '') {
                partName = obj.name;
                break;
              }
            }
          }

          partName = detectPartFromPosition(worldPosition, partName);
          console.log('🔵 Detected part:', partName);
          onPartClick(partName);
        }}
        onPointerOver={(e: any) => {
          e.stopPropagation();
          const worldPosition = new THREE.Vector3();
          e.object.getWorldPosition(worldPosition);
          let partName = e.object.name || '';
          
          if (!partName || partName === '') {
            let obj = e.object;
            for (let i = 0; i < 5 && obj.parent; i++) {
              obj = obj.parent;
              if (obj.name && obj.name !== '') {
                partName = obj.name;
                break;
              }
            }
          }

          partName = detectPartFromPosition(worldPosition, partName);
          const displayName = partName.charAt(0).toUpperCase() + partName.slice(1);
          onPartHover(displayName);

          if (e.object.material && (e.object as THREE.Mesh).isMesh) {
            if (Array.isArray(e.object.material)) {
              e.object.material.forEach((mat: any) => {
                if (mat) {
                  mat.emissive = new THREE.Color(0x4a9eff);
                  mat.emissiveIntensity = 0.4;
                }
              });
            } else {
              e.object.material.emissive = new THREE.Color(0x4a9eff);
              e.object.material.emissiveIntensity = 0.4;
            }
          }
        }}
        onPointerOut={(e: any) => {
          if (e.object.material && (e.object as THREE.Mesh).isMesh) {
            if (Array.isArray(e.object.material)) {
              e.object.material.forEach((mat: any, idx: number) => {
                if (mat && e.object.userData.originalEmissive) {
                  mat.emissive = e.object.userData.originalEmissive.clone();
                  mat.emissiveIntensity = e.object.userData.originalEmissiveIntensity || 0;
                }
              });
            } else {
              if (e.object.userData.originalEmissive) {
                e.object.material.emissive = e.object.userData.originalEmissive.clone();
                e.object.material.emissiveIntensity = e.object.userData.originalEmissiveIntensity || 0;
              } else {
                e.object.material.emissive = new THREE.Color(0x000000);
                e.object.material.emissiveIntensity = 0;
              }
            }
          }
          onPartHover(null);
        }}
      />
    </group>
  );
}

// Scene component
function Scene({ onPartHover, onPartClick, hoveredPart, tankModel }: {
  onPartHover: (part: string | null) => void;
  onPartClick: (part: string) => void;
  hoveredPart: string | null;
  tankModel: TankConfig;
}) {
  const modelUrl = tankModel?.modelPath;

  React.useEffect(() => {
    console.log('🎯 Scene using model URL:', modelUrl);
    console.log('🎯 Tank config:', tankModel);
  }, [modelUrl, tankModel]);

  return (
    <div className="w-full h-full">
      <Canvas 
        shadows 
        camera={{ position: [12, 8, 12], fov: 50 }} 
        gl={{ antialias: true, powerPreference: 'high-performance' }} 
        dpr={[1, 1.5]} 
        style={{ width: '100%', height: '100%', background: '#1a1a1a' }}
      >
        <PerspectiveCamera makeDefault position={[12, 8, 12]} fov={50} />

        <ambientLight intensity={0.8} />
        <directionalLight
          position={[10, 12, 8]}
          intensity={1.5}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={50}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />
        <directionalLight position={[-8, 8, -8]} intensity={0.8} />
        <directionalLight position={[0, 10, -5]} intensity={0.6} />
        <pointLight position={[5, 10, 5]} intensity={0.5} />
        <pointLight position={[-5, 10, -5]} intensity={0.5} />

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3, 0]} receiveShadow>
          <planeGeometry args={[30, 30]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.8} transparent={false} />
        </mesh>

        <LoadingProgress />
        <Suspense fallback={null}>
          {modelUrl && (
            <ExternalModel
              url={modelUrl}
              onPartHover={onPartHover}
              onPartClick={onPartClick}
              hoveredPart={hoveredPart}
            />
          )}
        </Suspense>

        {!modelUrl && (
          <Html center>
            <div className="text-yellow-400 text-sm">Model not available - showing placeholder</div>
          </Html>
        )}

        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          target={[0, 0, 0]}
          minDistance={5}
          maxDistance={25}
          maxPolarAngle={Math.PI / 2.1}
          minPolarAngle={0}
          autoRotate={false}
          autoRotateSpeed={0}
        />

        <fog attach="fog" args={['#1a1a1a', 20, 40]} />
      </Canvas>
    </div>
  );
}

export default Scene;

