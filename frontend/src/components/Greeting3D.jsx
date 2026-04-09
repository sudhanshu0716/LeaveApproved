import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Environment, ContactShadows, PresentationControls } from '@react-three/drei';

function AbstractCharacter() {
  const group = useRef();
  
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    group.current.rotation.y = Math.sin(t / 2) * 0.3;
    group.current.position.y = Math.sin(t) * 0.1;
  });

  return (
    <group ref={group}>
      {/* Head */}
      <mesh position={[0, 1.5, 0]}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color="#FF6B6B" roughness={0.2} metalness={0.1} />
      </mesh>
      
      {/* Body */}
      <mesh position={[0, 0.2, 0]}>
        <capsuleGeometry args={[0.6, 1, 32, 32]} />
        <meshStandardMaterial color="#4ECDC4" roughness={0.3} metalness={0.2} />
      </mesh>
      
      {/* Backpack / Detail */}
      <mesh position={[0, 0.5, -0.6]}>
        <boxGeometry args={[0.8, 1, 0.4]} />
        <meshStandardMaterial color="#FFE66D" roughness={0.5} />
      </mesh>
      
      {/* Arms */}
      <mesh position={[-0.8, 0.5, 0]} rotation={[0, 0, 0.5]}>
        <capsuleGeometry args={[0.15, 0.8, 16, 16]} />
        <meshStandardMaterial color="#FF6B6B" />
      </mesh>
      <mesh position={[0.8, 0.5, 0]} rotation={[0, 0, -0.5]}>
        <capsuleGeometry args={[0.15, 0.8, 16, 16]} />
        <meshStandardMaterial color="#FF6B6B" />
      </mesh>
    </group>
  );
}

export default function Greeting3D() {
  return (
    <div style={{ height: '400px', width: '100%', position: 'relative' }}>
      <Canvas camera={{ position: [0, 1, 5], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
        <PresentationControls 
          global rotation={[0, 0, 0]} 
          polar={[-0.2, 0.2]} 
          azimuth={[-0.5, 0.5]}
        >
          <Float speed={2} rotationIntensity={0.5} floatIntensity={2}>
            <AbstractCharacter />
          </Float>
        </PresentationControls>
        <ContactShadows position={[0, -1.5, 0]} opacity={0.5} scale={10} blur={2} />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
