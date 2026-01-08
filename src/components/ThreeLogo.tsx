import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Float, PresentationControls, useGLTF } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import type { Group } from "three";

import glbUrl from "../../YATRA 3D ELEMENT.glb?url";

function LogoModel({ dragging }: { dragging: boolean }) {
  const group = useRef<Group>(null);
  const gltf = useGLTF(glbUrl);

  useFrame((_, delta) => {
    if (!group.current) return;
    // Idle motion when not dragging (click+drag is handled by PresentationControls).
    if (!dragging) {
      group.current.rotation.y += delta * 0.18;
      group.current.rotation.x = Math.sin(performance.now() / 1400) * 0.05;
    }
  });

  return (
    <group
      ref={group}
      scale={0.95}
      dispose={null}
    >
      <primitive object={(gltf as any).scene} />
    </group>
  );
}

export function ThreeLogo() {
  const [dragging, setDragging] = useState(false);

  // Make sure idle rotation never "fights" the user if pointer-up happens outside the canvas.
  useEffect(() => {
    if (!dragging) return;
    const handleUp = () => setDragging(false);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);
    return () => {
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
    };
  }, [dragging]);

  return (
    <div
      className="relative h-[240px] w-[240px] sm:h-[280px] sm:w-[280px] md:h-[320px] md:w-[320px] lg:h-[380px] lg:w-[380px] touch-manipulation"
      onPointerDown={() => setDragging(true)}
      style={{ touchAction: "none" }}
    >
      {/* Diffused white light behind the model */}
      <div className="pointer-events-none absolute -inset-10 z-0 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.40),rgba(255,255,255,0.18)_28%,rgba(0,0,0,0)_68%)] blur-3xl" />

      <Canvas 
        className="relative z-10" 
        camera={{ position: [0, 0.05, 3.6], fov: 42 }} 
        dpr={typeof window !== "undefined" && window.innerWidth < 768 ? [1, 1] : [1, 1.5]}
      >
        <ambientLight intensity={0.35} />
        <directionalLight position={[4, 6, 3]} intensity={1.35} />
        <spotLight position={[-4, 6, 2]} intensity={0.9} angle={0.35} penumbra={1} />

        <PresentationControls
          global
          cursor
          speed={1.65}
          snap={false}
          polar={[-1.1, 1.1]}
          azimuth={[-2.0, 2.0]}
          config={{ mass: 1.2, tension: 140, friction: 30 }}
        >
          <Float speed={1.6} rotationIntensity={0.12} floatIntensity={0.35}>
            <LogoModel dragging={dragging} />
          </Float>
        </PresentationControls>

        <ContactShadows
          opacity={0.35}
          scale={9}
          blur={2.8}
          far={10}
          position={[0, -1.35, 0]}
        />
        <Environment preset="sunset" />
      </Canvas>

      <div className="pointer-events-none absolute inset-0 z-20 rounded-full bg-[radial-gradient(circle_at_center,rgba(106,92,255,0.22),rgba(0,0,0,0)_60%)]" />
    </div>
  );
}

useGLTF.preload(glbUrl);


