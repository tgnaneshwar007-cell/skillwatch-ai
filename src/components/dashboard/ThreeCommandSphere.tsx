import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Centre } from '../../types';
import { Eye, ShieldCheck, MapPin, Maximize2, Radio } from 'lucide-react';

interface ThreeCommandSphereProps {
  centres: Centre[];
  selectedCentre?: Centre | null;
  onSelectCentre?: (centre: Centre) => void;
}

export const ThreeCommandSphere: React.FC<ThreeCommandSphereProps> = ({
  centres,
  selectedCentre,
  onSelectCentre,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 400;
    const height = mount.clientHeight || 320;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 18;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    // 2. Holographic Sphere Wireframe (Midnight Navy & Electric Cyan)
    const sphereRadius = 6.5;
    const sphereGeo = new THREE.SphereGeometry(sphereRadius, 24, 24);
    const wireframeMat = new THREE.MeshBasicMaterial({
      color: 0x0ea5e9, // Electric Sky/Cyan
      wireframe: true,
      transparent: true,
      opacity: 0.15,
    });
    const globeMesh = new THREE.Mesh(sphereGeo, wireframeMat);
    scene.add(globeMesh);

    // Inner glowing core sphere
    const coreGeo = new THREE.SphereGeometry(sphereRadius * 0.98, 20, 20);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x070d18,
      transparent: true,
      opacity: 0.85,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    scene.add(coreMesh);

    // Orbital ring
    const ringGeo = new THREE.RingGeometry(sphereRadius * 1.15, sphereRadius * 1.18, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00f2fe,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2.3;
    scene.add(ringMesh);

    // Outer faint dashed orbit
    const outerRingGeo = new THREE.RingGeometry(sphereRadius * 1.35, sphereRadius * 1.37, 64);
    const outerRingMat = new THREE.MeshBasicMaterial({
      color: 0x818cf8, // Subtle violet
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.2,
    });
    const outerRingMesh = new THREE.Mesh(outerRingGeo, outerRingMat);
    outerRingMesh.rotation.x = Math.PI / 3;
    scene.add(outerRingMesh);

    // 3. Node Points for Training Facilities strictly from actual database records
    const nodeGroup = new THREE.Group();
    scene.add(nodeGroup);

    const nodesData = centres;

    // Distribute nodes roughly around India's coordinate sector
    nodesData.forEach((centre, idx) => {
      const phi = (0.35 + (idx * 0.12)) * Math.PI;
      const theta = (0.2 + (idx * 0.35)) * Math.PI;

      const x = sphereRadius * Math.sin(phi) * Math.cos(theta);
      const y = sphereRadius * Math.cos(phi);
      const z = sphereRadius * Math.sin(phi) * Math.sin(theta);

      // Node mesh
      const nodeGeo = new THREE.SphereGeometry(0.32, 16, 16);
      const nodeMat = new THREE.MeshBasicMaterial({
        color: idx % 2 === 0 ? 0x00f2fe : 0x14b8a6,
      });
      const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat);
      nodeMesh.position.set(x, y, z);
      nodeMesh.userData = { centre };
      nodeGroup.add(nodeMesh);

      // Halo ring around each node
      const haloGeo = new THREE.RingGeometry(0.45, 0.52, 16);
      const haloMat = new THREE.MeshBasicMaterial({
        color: 0x00f2fe,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7,
      });
      const haloMesh = new THREE.Mesh(haloGeo, haloMat);
      haloMesh.position.set(x, y, z);
      haloMesh.lookAt(0, 0, 0);
      nodeGroup.add(haloMesh);
    });

    // 4. Interactive Drag-to-Rotate
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      globeMesh.rotation.y += deltaX * 0.005;
      globeMesh.rotation.x += deltaY * 0.005;
      coreMesh.rotation.y += deltaX * 0.005;
      coreMesh.rotation.x += deltaY * 0.005;
      nodeGroup.rotation.y += deltaX * 0.005;
      nodeGroup.rotation.x += deltaY * 0.005;

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    mount.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // 5. Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Slow autonomous idle rotation
      if (!isDragging) {
        globeMesh.rotation.y += 0.002;
        coreMesh.rotation.y += 0.002;
        nodeGroup.rotation.y += 0.002;
      }

      // Orbital wobble
      ringMesh.rotation.z = elapsedTime * 0.08;
      outerRingMesh.rotation.z = -elapsedTime * 0.04;

      renderer.render(scene, camera);
    };

    animate();

    // 6. Handle resize
    const handleResize = () => {
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      mount.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('resize', handleResize);
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [centres]);

  return (
    <div className="relative w-full h-[340px] rounded-2xl bg-gradient-to-b from-navy-950 via-[#070D19] to-navy-950 border border-cyan-900/30 overflow-hidden shadow-2xl flex flex-col justify-between p-4">
      {/* Top Header Badge */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300">
            Geospatial Telemetry Sphere (3D)
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-400 border border-navy-800 bg-navy-900/80 px-2 py-0.5 rounded">
          WebGL Active • Drag to Orbit
        </span>
      </div>

      {/* 3D Canvas Mount Point */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating Bottom Telemetry Strip */}
      <div className="z-10 bg-navy-900/85 backdrop-blur-md border border-navy-800 rounded-xl p-2.5 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="font-semibold text-white">
            {centres.length > 0 ? `${centres.length} Monitored Facilities` : '0 Active Nodes'}
          </span>
          <span className="text-slate-500 hidden sm:inline">•</span>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Real-time biometric & physical audit grid
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-cyan-400 font-mono">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>MSDE Secure Grid</span>
        </div>
      </div>
    </div>
  );
};

