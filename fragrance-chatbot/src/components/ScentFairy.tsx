"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

type ScentFairyProps = {
  /** Bump this number to make the fairy play its reaction animation. */
  reactTrigger: number;
};

export default function ScentFairy({ reactTrigger }: ScentFairyProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reactFnRef = useRef<() => void>(() => {});

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 400;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.5);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffe6eb, 1.2);
    scene.add(ambientLight);
    const mainLight = new THREE.PointLight(0xffb7c5, 2.5, 20);
    mainLight.position.set(2, 4, 4);
    scene.add(mainLight);
    const accentLight = new THREE.PointLight(0xd8b4fe, 2.0, 20);
    accentLight.position.set(-3, -2, 3);
    scene.add(accentLight);
    const rimLight = new THREE.DirectionalLight(0xfff0f5, 1.5);
    rimLight.position.set(0, 5, -5);
    scene.add(rimLight);

    const charGroup = new THREE.Group();
    scene.add(charGroup);

    const bodyMaterial = new THREE.MeshPhongMaterial({
      color: 0xffeef2,
      emissive: 0xffb6c1,
      emissiveIntensity: 0.35,
      specular: 0xffffff,
      shininess: 90,
      transparent: true,
      opacity: 0.95,
    });
    const earMaterial = new THREE.MeshPhongMaterial({
      color: 0xffc0cb,
      emissive: 0xff99aa,
      emissiveIntensity: 0.2,
      specular: 0xffffff,
      shininess: 60,
    });
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x3d2836 });
    const eyeGleamMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const blushMaterial = new THREE.MeshBasicMaterial({
      color: 0xff7597,
      transparent: true,
      opacity: 0.55,
    });

    const headGeo = new THREE.SphereGeometry(1.2, 32, 32);
    headGeo.scale(1.0, 1.05, 0.95);
    charGroup.add(new THREE.Mesh(headGeo, bodyMaterial));

    const earGeo = new THREE.ConeGeometry(0.4, 0.9, 24);
    earGeo.scale(0.8, 1.1, 0.5);
    const leftEar = new THREE.Mesh(earGeo, earMaterial);
    leftEar.position.set(-0.6, 1.1, 0);
    leftEar.rotation.set(-0.15, 0, 0.25);
    charGroup.add(leftEar);
    const rightEar = new THREE.Mesh(earGeo, earMaterial);
    rightEar.position.set(0.6, 1.1, 0);
    rightEar.rotation.set(-0.15, 0, -0.25);
    charGroup.add(rightEar);

    const eyeGeo = new THREE.SphereGeometry(0.11, 16, 16);
    eyeGeo.scale(0.8, 1.2, 0.4);
    const leftEye = new THREE.Mesh(eyeGeo, eyeMaterial);
    leftEye.position.set(-0.35, 0.12, 1.02);
    charGroup.add(leftEye);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMaterial);
    rightEye.position.set(0.35, 0.12, 1.02);
    charGroup.add(rightEye);

    const gleamGeo = new THREE.SphereGeometry(0.04, 8, 8);
    const leftGleam = new THREE.Mesh(gleamGeo, eyeGleamMaterial);
    leftGleam.position.set(-0.38, 0.17, 1.08);
    charGroup.add(leftGleam);
    const rightGleam = new THREE.Mesh(gleamGeo, eyeGleamMaterial);
    rightGleam.position.set(0.32, 0.17, 1.08);
    charGroup.add(rightGleam);

    const blushGeo = new THREE.SphereGeometry(0.18, 16, 16);
    blushGeo.scale(1.3, 0.7, 0.2);
    const leftBlush = new THREE.Mesh(blushGeo, blushMaterial);
    leftBlush.position.set(-0.55, -0.05, 0.96);
    charGroup.add(leftBlush);
    const rightBlush = new THREE.Mesh(blushGeo, blushMaterial);
    rightBlush.position.set(0.55, -0.05, 0.96);
    charGroup.add(rightBlush);

    const wingMaterial = new THREE.MeshPhongMaterial({
      color: 0xffd1dc,
      emissive: 0xd8b4fe,
      emissiveIntensity: 0.4,
      specular: 0xffffff,
      shininess: 100,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
    });
    const wingGeo = new THREE.CircleGeometry(0.65, 32);
    wingGeo.scale(0.6, 1.2, 1);
    const leftWing = new THREE.Mesh(wingGeo, wingMaterial);
    leftWing.position.set(-0.85, 0.3, -0.6);
    leftWing.rotation.y = -0.4;
    charGroup.add(leftWing);
    const rightWing = new THREE.Mesh(wingGeo, wingMaterial);
    rightWing.position.set(0.85, 0.3, -0.6);
    rightWing.rotation.y = 0.4;
    charGroup.add(rightWing);

    const haloGeo = new THREE.TorusGeometry(1.6, 0.04, 16, 64);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xffd9e8,
      transparent: true,
      opacity: 0.65,
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.rotation.x = Math.PI / 2.3;
    charGroup.add(halo);

    const particleCount = 80;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    const particleSpeed: { y: number; phase: number }[] = [];
    for (let i = 0; i < particleCount; i++) {
      particlePos[i * 3] = (Math.random() - 0.5) * 5;
      particlePos[i * 3 + 1] = (Math.random() - 0.5) * 5;
      particlePos[i * 3 + 2] = (Math.random() - 0.5) * 3;
      particleSpeed.push({ y: 0.008 + Math.random() * 0.02, phase: Math.random() * Math.PI * 2 });
    }
    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePos, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xffbfdf,
      size: 0.12,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    const dropGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const dropMat = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      emissive: 0xff85a2,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.85,
      shininess: 120,
    });
    const droplets = Array.from({ length: 5 }, () => {
      const mesh = new THREE.Mesh(dropGeo, dropMat);
      scene.add(mesh);
      return {
        mesh,
        radius: 1.8 + Math.random() * 0.8,
        speed: 0.6 + Math.random() * 0.8,
        offset: Math.random() * Math.PI * 2,
        yBase: (Math.random() - 0.5) * 1.5,
      };
    });

    let mouseX = 0;
    let mouseY = 0;
    let targetRotY = 0;
    let targetRotX = 0;
    let isReacting = 0;
    let reactionType = 0;
    const REACTION_COUNT = 5;

    function handleMouseMove(e: MouseEvent) {
      const rect = container!.getBoundingClientRect();
      const inside =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;

      if (inside && rect.width && rect.height) {
        mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        mouseY = -((e.clientY - rect.top) / rect.height - 0.5) * 2;
      } else {
        // Mouse is elsewhere on the page (e.g. over the chat panel) - look forward.
        mouseX = 0;
        mouseY = 0;
      }
    }
    window.addEventListener("mousemove", handleMouseMove);

    reactFnRef.current = () => {
      isReacting = 1.0;
      reactionType = Math.floor(Math.random() * REACTION_COUNT);
    };

    const clock = new THREE.Clock();
    let frameId: number;

    function animate() {
      frameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      charGroup.position.y = Math.sin(t * 1.6) * 0.22;
      targetRotY = mouseX * 0.45;
      targetRotX = -mouseY * 0.25;

      let wingSpeed = 6;
      let earDroop = 0;

      if (isReacting > 0) {
        isReacting -= 0.008;
        const k = isReacting;
        wingSpeed = 16;

        switch (reactionType) {
          case 0: // Joyful bounce
            charGroup.rotation.z = Math.sin(t * 14) * 0.22 * k;
            charGroup.scale.setScalar(1 + Math.sin(t * 12) * 0.18 * k);
            charGroup.position.y += Math.abs(Math.sin(t * 10)) * 0.35 * k;
            mainLight.intensity = 2.5 + Math.sin(t * 9) * 2.5 * k;
            haloMat.opacity = 0.65 + 0.35 * k;
            break;
          case 1: // Happy spin
            charGroup.rotation.y += 0.3 * k;
            charGroup.rotation.z = Math.sin(t * 10) * 0.08 * k;
            charGroup.scale.setScalar(1 + Math.sin(t * 10) * 0.1 * k);
            mainLight.intensity = 2.5 + 1.2 * k;
            haloMat.opacity = 0.65 + 0.3 * k;
            wingSpeed = 20;
            break;
          case 2: // Shy wiggle
            charGroup.rotation.x = 0.16 * k;
            charGroup.rotation.z = Math.sin(t * 7) * 0.06 * k;
            blushMaterial.opacity = 0.55 + 0.4 * k;
            earDroop = 0.25 * k;
            wingSpeed = 5;
            break;
          case 3: // Sparkle burst
            charGroup.scale.setScalar(1 + Math.sin(t * 20) * 0.05 * k);
            mainLight.intensity = 2.5 + Math.sin(t * 14) * 3.2 * k;
            accentLight.intensity = 2.0 + Math.sin(t * 11) * 2.2 * k;
            haloMat.opacity = 0.65 + 0.35 * Math.abs(Math.sin(t * 10)) * k;
            wingSpeed = 22;
            break;
          default: // Nod yes
            charGroup.rotation.x = Math.sin(t * 9) * 0.18 * k;
            charGroup.scale.setScalar(1 + Math.sin(t * 9) * 0.06 * k);
            mainLight.intensity = 2.5 + 1.0 * k;
            haloMat.opacity = 0.65 + 0.2 * k;
            wingSpeed = 10;
        }
      } else {
        charGroup.scale.set(1, 1, 1);
        charGroup.rotation.z = Math.sin(t * 0.8) * 0.04;
        mainLight.intensity = 2.5;
        accentLight.intensity = 2.0;
        haloMat.opacity = 0.65;
        blushMaterial.opacity = 0.55;
        charGroup.rotation.y += (targetRotY - charGroup.rotation.y) * 0.08;
        charGroup.rotation.x += (targetRotX - charGroup.rotation.x) * 0.08;
      }

      const wingFlutter = Math.sin(t * wingSpeed) * 0.35;
      leftWing.rotation.y = -0.4 + wingFlutter;
      rightWing.rotation.y = 0.4 - wingFlutter;

      leftEar.rotation.z = 0.25 + Math.sin(t * 2.2) * 0.06;
      rightEar.rotation.z = -0.25 - Math.sin(t * 2.2 + 0.5) * 0.06;
      leftEar.rotation.x = -0.15 - earDroop;
      rightEar.rotation.x = -0.15 - earDroop;

      halo.rotation.z = t * 0.3;

      droplets.forEach((d) => {
        const angle = t * d.speed + d.offset;
        d.mesh.position.x = Math.cos(angle) * d.radius;
        d.mesh.position.z = Math.sin(angle) * d.radius;
        d.mesh.position.y = d.yBase + Math.sin(t * 2 + d.offset) * 0.3;
      });

      const positions = particles.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3 + 1] += particleSpeed[i].y;
        positions[i * 3] += Math.sin(t + particleSpeed[i].phase) * 0.005;
        if (positions[i * 3 + 1] > 2.8) {
          positions[i * 3 + 1] = -2.8;
          positions[i * 3] = (Math.random() - 0.5) * 5;
        }
      }
      particles.geometry.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    }
    animate();

    function handleResize() {
      if (!container) return;
      const newW = container.clientWidth || 400;
      const newH = container.clientHeight || 400;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    }
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  useEffect(() => {
    if (reactTrigger > 0) reactFnRef.current();
  }, [reactTrigger]);

  return (
    <div
      ref={containerRef}
      onClick={() => reactFnRef.current()}
      className="h-full w-full cursor-pointer"
    />
  );
}
