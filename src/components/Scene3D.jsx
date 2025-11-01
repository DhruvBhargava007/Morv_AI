import React, { useRef, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';
import { defaultTank } from '../config/tanks';

// Component to handle clickable parts
function ClickablePart({ name, position, scale, rotation, onHover, onClick, isHovered, children }) {
    const meshRef = useRef();
    const [hovered, setHovered] = useState(false);

    useFrame(() => {
        if (meshRef.current) {
            // Subtle pulsing animation when hovered
            if (hovered || isHovered) {
                meshRef.current.scale.setScalar(1.05);
            } else {
                meshRef.current.scale.setScalar(1);
            }
        }
    });

    return (
        <group
            ref={meshRef}
            position={position}
            scale={scale}
            rotation={rotation}
            onPointerOver={(e) => {
                e.stopPropagation();
                setHovered(true);
                onHover(name);
            }}
            onPointerOut={(e) => {
                setHovered(false);
                onHover(null);
            }}
            onClick={(e) => {
                e.stopPropagation();
                onClick(name);
            }}
        >
            {children}
        </group>
    );
}

// Component to load external GLTF model
function ExternalModel({ url, onPartHover, onPartClick, hoveredPart }) {
    const { scene } = useGLTF(url);
    const groupRef = useRef();
    const lastUrlRef = useRef(null);

    // Reset and reinitialize when URL changes (new tank loaded)
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

            // Wait a frame to ensure scene is fully loaded
            requestAnimationFrame(() => {
                try {
                    // Reset any previous transformations
                    scene.position.set(0, 0, 0);
                    scene.scale.set(1, 1, 1);
                    scene.rotation.set(0, 0, 0);

                    // Update matrix world first
                    scene.updateMatrixWorld(true);

                    // Calculate bounding box
                    const box = new THREE.Box3().setFromObject(scene);
                    const center = box.getCenter(new THREE.Vector3());
                    const size = box.getSize(new THREE.Vector3());

                    console.log('📦 Model bounds:', { center, size, isEmpty: box.isEmpty() });

                    // Check if box is valid
                    if (!box.isEmpty() && !isNaN(size.x) && !isNaN(size.y) && !isNaN(size.z) && size.x > 0 && size.y > 0 && size.z > 0) {
                        // Get the max dimension for scaling - target medium size (~8 units)
                        const maxDim = Math.max(size.x, size.y, size.z);
                        // Calculate scale to fit nicely in view - medium size
                        const scale = maxDim > 0 ? 8 / maxDim : 1;

                        console.log('📏 Scaling model:', { maxDim, scale, size });

                        // Center the model at origin BEFORE scaling
                        scene.position.x = -center.x;
                        scene.position.y = -center.y;
                        scene.position.z = -center.z;

                        // Apply scale
                        scene.scale.set(scale, scale, scale);

                        console.log('✅ Model positioned at:', scene.position);
                        console.log('✅ Model scale:', scene.scale);
                        console.log('✅ URL was:', url);
                    } else {
                        console.warn('⚠️ Invalid bounding box, trying fallback scaling');
                        console.warn('Box info:', { isEmpty: box.isEmpty(), size, center });

                        // Try a simple scale and center approach
                        scene.position.set(0, 0, 0);
                        // Try a reasonable default scale
                        scene.scale.set(0.01, 0.01, 0.01); // Small scale for large models
                        console.log('Using fallback scale 0.01 at origin');
                    }

                    // Force update
                    scene.updateMatrixWorld(true);

                    // Make all meshes interactive
                    let meshCount = 0;
                    scene.traverse((child) => {
                        if (child.isMesh) {
                            meshCount++;
                            // Store original emissive if it exists
                            if (!child.userData.originalEmissive) {
                                child.userData.originalEmissive = child.material?.emissive?.clone() || new THREE.Color(0x000000);
                                child.userData.originalEmissiveIntensity = child.material?.emissiveIntensity || 0;
                            }
                            child.cursor = 'pointer';
                        }
                    });
                    console.log('🔷 Found', meshCount, 'meshes in model');
                } catch (err) {
                    console.error('❌ Error processing model:', err);
                }
            });
        }
    }, [scene, url]);

    // Always render something - if scene exists, use it; otherwise show loading
    if (!scene) {
        return (
            <Html center>
                <div className="text-white text-sm">Loading model: {url}</div>
            </Html>
        );
    }

    return (
        <group ref={groupRef} position={[0, 0, 0]} key={url}>
            <primitive
                object={scene}
                onClick={(e) => {
                    e.stopPropagation();

                    // Get world position of click to determine which part of the tank
                    const worldPosition = new THREE.Vector3();
                    e.object.getWorldPosition(worldPosition);

                    // Get mesh name or try to find meaningful name
                    let partName = e.object.name;

                    // If no name, check parent hierarchy
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

                    // Use position-based detection if name is not meaningful
                    if (!partName || partName === '' || partName === 'model' ||
                        partName.toLowerCase().includes('mesh') ||
                        partName.toLowerCase().includes('geometry') ||
                        partName.toLowerCase().includes('node') ||
                        partName.match(/^[A-Z0-9_-]+$/)) {

                        // Position-based part detection
                        // Relative to model center (0, 0, 0 after centering)
                        const y = worldPosition.y;
                        const z = worldPosition.z; // Forward/back
                        const x = worldPosition.x; // Left/right

                        // Check name for keywords first
                        const nameLower = partName.toLowerCase();
                        if (nameLower.includes('turret') || nameLower.includes('gun') || nameLower.includes('cannon')) {
                            partName = 'turret';
                        } else if (nameLower.includes('engine') || nameLower.includes('motor') || nameLower.includes('power')) {
                            partName = 'engine';
                        } else if (nameLower.includes('track') || nameLower.includes('wheel') || nameLower.includes('suspension')) {
                            partName = 'tracks';
                        } else if (nameLower.includes('hull') || nameLower.includes('body') || nameLower.includes('armor')) {
                            partName = 'armor';
                        } else if (nameLower.includes('sight') || nameLower.includes('optics') || nameLower.includes('viewer')) {
                            partName = 'optics';
                        } else if (nameLower.includes('transmission') || nameLower.includes('gearbox')) {
                            partName = 'transmission';
                        } else {
                            // Position-based detection fallback
                            // Top/center = turret, Back = engine, Bottom = tracks, Front = armor
                            if (y > 0.5 && Math.abs(z) < 2) {
                                partName = 'turret';
                            } else if (z < -1) {
                                partName = 'engine';
                            } else if (y < -0.5) {
                                partName = 'tracks';
                            } else if (z > 1) {
                                partName = 'armor';
                            } else if (y > 1.5) {
                                partName = 'optics';
                            } else {
                                partName = 'armor'; // Default to armor/hull
                            }
                        }
                    }

                    // Log for debugging
                    console.log('🔵 Clicked mesh name:', e.object.name);
                    console.log('🔵 Parent names:', (() => {
                        const parents = [];
                        let obj = e.object.parent;
                        for (let i = 0; i < 5 && obj; i++) {
                            if (obj.name) parents.push(obj.name);
                            obj = obj.parent;
                        }
                        return parents;
                    })());
                    console.log('🔵 World position:', worldPosition);
                    console.log('🔵 Detected part:', partName);

                    // Always call onPartClick with detected part name
                    onPartClick(partName);
                }}
                onPointerOver={(e) => {
                    e.stopPropagation();

                    // Get world position for part detection
                    const worldPosition = new THREE.Vector3();
                    e.object.getWorldPosition(worldPosition);

                    // Get mesh name or try to find meaningful name
                    let partName = e.object.name;

                    // If no name, check parent hierarchy
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

                    // Use same detection logic as click handler
                    if (!partName || partName === '' || partName === 'model' ||
                        partName.toLowerCase().includes('mesh') ||
                        partName.toLowerCase().includes('geometry') ||
                        partName.toLowerCase().includes('node') ||
                        partName.match(/^[A-Z0-9_-]+$/) ||
                        partName.toLowerCase().includes('part')) {

                        // Position-based part detection
                        const y = worldPosition.y;
                        const z = worldPosition.z; // Forward/back

                        // Check name for keywords first
                        const nameLower = partName.toLowerCase();
                        if (nameLower.includes('turret') || nameLower.includes('gun') || nameLower.includes('cannon')) {
                            partName = 'turret';
                        } else if (nameLower.includes('engine') || nameLower.includes('motor') || nameLower.includes('power')) {
                            partName = 'engine';
                        } else if (nameLower.includes('track') || nameLower.includes('wheel') || nameLower.includes('suspension')) {
                            partName = 'tracks';
                        } else if (nameLower.includes('hull') || nameLower.includes('body') || nameLower.includes('armor')) {
                            partName = 'armor';
                        } else if (nameLower.includes('sight') || nameLower.includes('optics') || nameLower.includes('viewer')) {
                            partName = 'optics';
                        } else if (nameLower.includes('transmission') || nameLower.includes('gearbox')) {
                            partName = 'transmission';
                        } else {
                            // Position-based detection fallback
                            if (y > 0.5 && Math.abs(z) < 2) {
                                partName = 'turret';
                            } else if (z < -1) {
                                partName = 'engine';
                            } else if (y < -0.5) {
                                partName = 'tracks';
                            } else if (z > 1) {
                                partName = 'armor';
                            } else if (y > 1.5) {
                                partName = 'optics';
                            } else {
                                partName = 'armor'; // Default to armor/hull
                            }
                        }
                    }

                    // Capitalize first letter for display
                    const displayName = partName.charAt(0).toUpperCase() + partName.slice(1);
                    onPartHover(displayName);

                    // Highlight the mesh with a subtle glow
                    if (e.object.material && e.object.isMesh) {
                        if (Array.isArray(e.object.material)) {
                            e.object.material.forEach(mat => {
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
                onPointerOut={(e) => {
                    if (e.object.material && e.object.isMesh) {
                        // Restore original emissive
                        if (Array.isArray(e.object.material)) {
                            e.object.material.forEach((mat, idx) => {
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

// Tank model component - fallback geometric representation if no external model
function TankModel({ onPartHover, onPartClick, hoveredPart }) {
    return (
        <group>
            {/* Hull/Body */}
            <ClickablePart
                name="armor"
                position={[0, 0, 0]}
                scale={[1, 1, 1]}
                onHover={onPartHover}
                onClick={onPartClick}
                isHovered={hoveredPart === 'armor'}
            >
                <mesh receiveShadow castShadow>
                    <boxGeometry args={[3, 1.5, 4]} />
                    <meshStandardMaterial
                        color={hoveredPart === 'armor' ? '#4a9eff' : '#2a2a2a'}
                        metalness={0.8}
                        roughness={0.2}
                    />
                </mesh>
            </ClickablePart>

            {/* Turret */}
            <ClickablePart
                name="turret"
                position={[0, 1.2, 0]}
                scale={[1, 1, 1]}
                onHover={onPartHover}
                onClick={onPartClick}
                isHovered={hoveredPart === 'turret'}
            >
                <mesh receiveShadow castShadow>
                    <cylinderGeometry args={[0.8, 0.8, 0.6, 16]} />
                    <meshStandardMaterial
                        color={hoveredPart === 'turret' ? '#4a9eff' : '#1a1a1a'}
                        metalness={0.9}
                        roughness={0.1}
                    />
                </mesh>
            </ClickablePart>

            {/* Gun Barrel */}
            <group position={[0, 1.2, 2.5]}>
                <mesh receiveShadow castShadow>
                    <cylinderGeometry args={[0.15, 0.15, 2, 16]} />
                    <meshStandardMaterial color="#1a1a1a" metalness={0.9} roughness={0.1} />
                </mesh>
            </group>

            {/* Engine compartment (back) */}
            <ClickablePart
                name="engine"
                position={[0, 0.5, -1.8]}
                scale={[1, 1, 1]}
                onHover={onPartHover}
                onClick={onPartClick}
                isHovered={hoveredPart === 'engine'}
            >
                <mesh receiveShadow castShadow>
                    <boxGeometry args={[2.5, 1.2, 0.8]} />
                    <meshStandardMaterial
                        color={hoveredPart === 'engine' ? '#4a9eff' : '#2a2a2a'}
                        metalness={0.7}
                        roughness={0.3}
                    />
                </mesh>
            </ClickablePart>

            {/* Tracks - Left */}
            <ClickablePart
                name="tracks"
                position={[-2, -0.8, 0]}
                scale={[1, 1, 1]}
                onHover={onPartHover}
                onClick={onPartClick}
                isHovered={hoveredPart === 'tracks'}
            >
                <mesh receiveShadow castShadow>
                    <boxGeometry args={[0.6, 0.8, 4.5]} />
                    <meshStandardMaterial
                        color={hoveredPart === 'tracks' ? '#4a9eff' : '#1a1a1a'}
                        metalness={0.6}
                        roughness={0.4}
                    />
                </mesh>
            </ClickablePart>

            {/* Tracks - Right */}
            <ClickablePart
                name="tracks"
                position={[2, -0.8, 0]}
                scale={[1, 1, 1]}
                onHover={onPartHover}
                onClick={onPartClick}
                isHovered={hoveredPart === 'tracks'}
            >
                <mesh receiveShadow castShadow>
                    <boxGeometry args={[0.6, 0.8, 4.5]} />
                    <meshStandardMaterial
                        color={hoveredPart === 'tracks' ? '#4a9eff' : '#1a1a1a'}
                        metalness={0.6}
                        roughness={0.4}
                    />
                </mesh>
            </ClickablePart>

            {/* Optics/Targeting System */}
            <ClickablePart
                name="optics"
                position={[0, 1.5, 0.5]}
                scale={[1, 1, 1]}
                onHover={onPartHover}
                onClick={onPartClick}
                isHovered={hoveredPart === 'optics'}
            >
                <mesh receiveShadow castShadow>
                    <boxGeometry args={[0.3, 0.3, 0.4]} />
                    <meshStandardMaterial
                        color={hoveredPart === 'optics' ? '#4a9eff' : '#3a3a3a'}
                        metalness={0.9}
                        roughness={0.1}
                    />
                </mesh>
            </ClickablePart>

            {/* Transmission (bottom center) */}
            <ClickablePart
                name="transmission"
                position={[0, -0.5, 0]}
                scale={[1, 1, 1]}
                onHover={onPartHover}
                onClick={onPartClick}
                isHovered={hoveredPart === 'transmission'}
            >
                <mesh receiveShadow castShadow>
                    <boxGeometry args={[2, 0.6, 2]} />
                    <meshStandardMaterial
                        color={hoveredPart === 'transmission' ? '#4a9eff' : '#2a2a2a'}
                        metalness={0.7}
                        roughness={0.3}
                    />
                </mesh>
            </ClickablePart>
        </group>
    );
}

// Scene component
function Scene({ onPartHover, onPartClick, hoveredPart, tankModel }) {
    const modelUrl = tankModel?.modelPath || defaultTank.modelPath;

    // Debug: log the model URL
    React.useEffect(() => {
        console.log('🎯 Scene using model URL:', modelUrl);
        console.log('🎯 Tank config:', tankModel);
    }, [modelUrl, tankModel]);

    return (
        <div className="w-full h-full">
            <Canvas shadows camera={{ position: [12, 8, 12], fov: 50 }} gl={{ antialias: true }} dpr={[1, 2]} style={{ width: '100%', height: '100%', background: '#1a1a1a' }}>
            <PerspectiveCamera makeDefault position={[12, 8, 12]} fov={50} />

            {/* Enhanced Lighting - Much Brighter */}
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

            {/* Ground plane - positioned below model so it doesn't hide it */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3, 0]} receiveShadow>
                <planeGeometry args={[30, 30]} />
                <meshStandardMaterial color="#1a1a1a" roughness={0.8} transparent={false} />
            </mesh>

            {/* Tank Model - Load external model if path is provided, otherwise use geometric fallback */}
            <Suspense fallback={
                <Html center>
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <div className="text-white text-sm font-medium">Loading model: {modelUrl || 'none'}</div>
                    </div>
                </Html>
            }>
                {modelUrl ? (
                    <ExternalModel
                        url={modelUrl}
                        onPartHover={onPartHover}
                        onPartClick={onPartClick}
                        hoveredPart={hoveredPart}
                    />
                ) : (
                    <TankModel
                        onPartHover={onPartHover}
                        onPartClick={onPartClick}
                        hoveredPart={hoveredPart}
                    />
                )}
            </Suspense>

            {/* Helper: Show if model is loading or not available */}
            {!modelUrl && (
                <Html center>
                    <div className="text-yellow-400 text-sm">Model not available - showing placeholder</div>
                </Html>
            )}

            {/* Enhanced Controls - prevent hiding behind ground */}
            <OrbitControls
                enablePan={true}
                enableZoom={true}
                enableRotate={true}
                target={[0, 0, 0]} // Always look at center
                minDistance={5}
                maxDistance={25}
                maxPolarAngle={Math.PI / 2.1} // Limit downward rotation - keep model visible
                minPolarAngle={0} // Allow viewing from top
                autoRotate={false}
                autoRotateSpeed={0}
            />

            {/* Lighter fog for depth */}
            <fog attach="fog" args={['#1a1a1a', 20, 40]} />
        </Canvas>
        </div>
    );
}

export default Scene;

