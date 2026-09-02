import React, { useEffect, useRef } from 'react';
import { useTheme } from '../../hooks/useTheme';

interface Particle {
  id: number;
  type: 'bean' | 'leaf' | 'bokeh';
  x: number; // percentage (0 - 100)
  y: number; // percentage (0 - 100)
  size: number; // px
  rotation: number; // deg
  rotSpeed: number;
  depth: number; // 0.2 (far/slow) to 1.6 (near/fast)
  blur: number; // px blur for depth of field
  opacity: number;
  driftPhase: number;
  driftSpeed: number;
  tilt: number;
  isForeground?: boolean; // If true, floats over card edges with pointer-events-none
}

export const FloatingCafeBackground: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse coordinates with smoothing (lerp)
  const targetMouse = useRef({ x: 0, y: 0 });
  const currentMouse = useRef({ x: 0, y: 0 });
  const animFrameId = useRef<number>();
  const timeRef = useRef<number>(0);

  // Particle distribution with foreground overlays around the login box
  const particlesRef = useRef<Particle[]>([
    // === FOREGROUND OVERLAYS (Floating Across Card Edges - Z-Index 25) ===
    { id: 1, type: 'leaf', x: 33, y: 34, size: 68, rotation: -35, rotSpeed: 0.1, depth: 1.5, blur: 0, opacity: 0.96, driftPhase: 0, driftSpeed: 0.0019, tilt: 22, isForeground: true },
    { id: 2, type: 'bean', x: 67, y: 72, size: 62, rotation: 45, rotSpeed: -0.12, depth: 1.45, blur: 0, opacity: 0.95, driftPhase: 2.4, driftSpeed: 0.0017, tilt: -18, isForeground: true },
    { id: 3, type: 'leaf', x: 68, y: 30, size: 56, rotation: 55, rotSpeed: -0.09, depth: 1.4, blur: 0, opacity: 0.92, driftPhase: 4.1, driftSpeed: 0.0018, tilt: 15, isForeground: true },
    { id: 4, type: 'bean', x: 32, y: 76, size: 54, rotation: -25, rotSpeed: 0.11, depth: 1.35, blur: 0, opacity: 0.94, driftPhase: 1.8, driftSpeed: 0.0016, tilt: 12, isForeground: true },

    // === MIDGROUND PARTICLES (Floating Beside Card - Z-Index 0) ===
    { id: 5, type: 'bean', x: 14, y: 22, size: 56, rotation: 25, rotSpeed: 0.12, depth: 1.15, blur: 0, opacity: 0.92, driftPhase: 0.5, driftSpeed: 0.0017, tilt: 15 },
    { id: 6, type: 'bean', x: 86, y: 24, size: 52, rotation: -40, rotSpeed: -0.14, depth: 1.1, blur: 0, opacity: 0.9, driftPhase: 2.2, driftSpeed: 0.0015, tilt: -20 },
    { id: 7, type: 'leaf', x: 12, y: 55, size: 62, rotation: 45, rotSpeed: 0.08, depth: 1.2, blur: 0, opacity: 0.94, driftPhase: 3.5, driftSpeed: 0.0016, tilt: -10 },
    { id: 8, type: 'leaf', x: 88, y: 56, size: 58, rotation: -55, rotSpeed: -0.1, depth: 1.25, blur: 0, opacity: 0.93, driftPhase: 1.2, driftSpeed: 0.0019, tilt: 25 },
    { id: 9, type: 'bean', x: 16, y: 84, size: 50, rotation: 65, rotSpeed: 0.09, depth: 1.05, blur: 0, opacity: 0.88, driftPhase: 4.6, driftSpeed: 0.0015, tilt: 8 },
    { id: 10, type: 'leaf', x: 84, y: 86, size: 52, rotation: 110, rotSpeed: 0.07, depth: 1.1, blur: 0, opacity: 0.9, driftPhase: 0.9, driftSpeed: 0.0016, tilt: -15 },

    // === BACKGROUND / DEEP FIELD PARTICLES (Soft Cinematic Blur - Z-Index 0) ===
    { id: 11, type: 'bean', x: 26, y: 12, size: 36, rotation: 120, rotSpeed: 0.05, depth: 0.45, blur: 2.5, opacity: 0.55, driftPhase: 3, driftSpeed: 0.001, tilt: 5 },
    { id: 12, type: 'bean', x: 74, y: 14, size: 38, rotation: -85, rotSpeed: -0.06, depth: 0.5, blur: 2, opacity: 0.6, driftPhase: 5, driftSpeed: 0.0012, tilt: -8 },
    { id: 13, type: 'leaf', x: 24, y: 92, size: 42, rotation: -15, rotSpeed: -0.05, depth: 0.6, blur: 1.5, opacity: 0.65, driftPhase: 2.7, driftSpeed: 0.0013, tilt: 10 },
    { id: 14, type: 'bean', x: 76, y: 90, size: 40, rotation: 30, rotSpeed: 0.06, depth: 0.55, blur: 1.8, opacity: 0.6, driftPhase: 1.4, driftSpeed: 0.0011, tilt: -6 },

    // === AMBIENT WARM BOKEH LIGHT SPHERES ===
    { id: 15, type: 'bokeh', x: 20, y: 30, size: 85, rotation: 0, rotSpeed: 0, depth: 0.3, blur: 16, opacity: 0.25, driftPhase: 0.5, driftSpeed: 0.0008, tilt: 0 },
    { id: 16, type: 'bokeh', x: 80, y: 65, size: 95, rotation: 0, rotSpeed: 0, depth: 0.35, blur: 20, opacity: 0.22, driftPhase: 2.8, driftSpeed: 0.0007, tilt: 0 },
    { id: 17, type: 'bokeh', x: 50, y: 88, size: 75, rotation: 0, rotSpeed: 0, depth: 0.25, blur: 14, opacity: 0.2, driftPhase: 4.2, driftSpeed: 0.0009, tilt: 0 },
  ]);

  const itemsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      targetMouse.current = {
        x: (e.clientX / innerWidth - 0.5) * 2,
        y: (e.clientY / innerHeight - 0.5) * 2,
      };
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const { innerWidth, innerHeight } = window;
        targetMouse.current = {
          x: (touch.clientX / innerWidth - 0.5) * 2,
          y: (touch.clientY / innerHeight - 0.5) * 2,
        };
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    let running = true;

    const animate = () => {
      if (!running) return;
      timeRef.current += 1;

      // Smooth Lerp physics for fluid inertia
      currentMouse.current.x += (targetMouse.current.x - currentMouse.current.x) * 0.045;
      currentMouse.current.y += (targetMouse.current.y - currentMouse.current.y) * 0.045;

      const mx = currentMouse.current.x;
      const my = currentMouse.current.y;
      const t = timeRef.current;

      particlesRef.current.forEach((p, index) => {
        const el = itemsRef.current[index];
        if (!el) return;

        // Ambient continuous floating oscillation
        const driftX = Math.sin(t * p.driftSpeed + p.driftPhase) * 16;
        const driftY = Math.cos(t * p.driftSpeed * 0.85 + p.driftPhase) * 18;
        const driftRot = Math.sin(t * p.driftSpeed * 0.5 + p.driftPhase) * 10;

        // Interactive mouse parallax based on depth
        const parallaxX = mx * (p.depth * 36);
        const parallaxY = my * (p.depth * 36);

        // 3D Tilt perspective
        const currentRot = p.rotation + t * p.rotSpeed + driftRot;
        const tiltX = my * p.depth * 12;
        const tiltY = -mx * p.depth * 12;

        el.style.transform = `translate3d(${driftX + parallaxX}px, ${driftY + parallaxY}px, 0px) rotate(${currentRot}deg) rotateX(${tiltX + p.tilt}deg) rotateY(${tiltY}deg)`;
      });

      animFrameId.current = requestAnimationFrame(animate);
    };

    animFrameId.current = requestAnimationFrame(animate);

    return () => {
      running = false;
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none select-none"
      style={{ perspective: '1200px' }}
      aria-hidden="true"
    >
      {particlesRef.current.map((p, index) => (
        <div
          key={p.id}
          ref={el => (itemsRef.current[index] = el)}
          className={`absolute will-change-transform pointer-events-none ${
            p.isForeground ? 'z-25' : 'z-0'
          }`}
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            filter: p.blur > 0 ? `blur(${p.blur}px)` : undefined,
            opacity: p.opacity,
            transformStyle: 'preserve-3d',
          }}
        >
          {p.type === 'bean' && <RealisticCoffeeBean isDark={isDark} size={p.size} />}
          {p.type === 'leaf' && <RealisticTeaLeaf isDark={isDark} size={p.size} />}
          {p.type === 'bokeh' && <BokehGlow isDark={isDark} />}
        </div>
      ))}
    </div>
  );
};

/**
 * 3D Realistic Roasted Coffee Bean Vector with Center Crease, Specular Highlights & Ambient Shadow
 */
const RealisticCoffeeBean: React.FC<{ isDark: boolean; size: number }> = ({ isDark, size }) => {
  return (
    <svg
      viewBox="0 0 100 100"
      className="w-full h-full pointer-events-none drop-shadow-[0_12px_20px_rgba(0,0,0,0.45)]"
      style={{
        filter: isDark
          ? 'drop-shadow(0 10px 22px rgba(0,0,0,0.85)) drop-shadow(0 0 12px rgba(214,142,88,0.22))'
          : 'drop-shadow(0 8px 16px rgba(59,35,20,0.24))',
      }}
    >
      <defs>
        {/* Outer Bean 3D Radial Gradient */}
        <radialGradient id={`beanBody-${size}`} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor={isDark ? '#5C3822' : '#6B3E23'} />
          <stop offset="40%" stopColor={isDark ? '#3D2214' : '#4E2B17'} />
          <stop offset="85%" stopColor={isDark ? '#23120A' : '#2D160A'} />
          <stop offset="100%" stopColor={isDark ? '#140804' : '#1A0C06'} />
        </radialGradient>

        {/* Center Crease / Split Shadow */}
        <linearGradient id={`beanCrease-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0B0402" />
          <stop offset="50%" stopColor="#1B0A05" />
          <stop offset="100%" stopColor="#090301" />
        </linearGradient>

        {/* Specular 3D Highlight */}
        <linearGradient id={`beanHighlight-${size}`} x1="0%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="rgba(255, 235, 215, 0.45)" />
          <stop offset="60%" stopColor="rgba(245, 210, 175, 0.15)" />
          <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
        </linearGradient>

        {/* Ambient Rim Light */}
        <linearGradient id={`beanRim-${size}`} x1="100%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor={isDark ? 'rgba(235, 160, 95, 0.35)' : 'rgba(214, 142, 88, 0.25)'} />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>

      {/* Main Oval Bean Body */}
      <path
        d="M50,8 C74,8 92,26 92,50 C92,74 74,92 50,92 C26,92 8,74 8,50 C8,26 26,8 50,8 Z"
        fill={`url(#beanBody-${size})`}
        stroke={isDark ? 'rgba(235, 170, 110, 0.2)' : 'rgba(100, 55, 28, 0.3)'}
        strokeWidth="1.2"
      />

      {/* Specular Top-Left 3D Curve Highlight */}
      <path
        d="M26,18 C40,11 60,11 74,18 C58,16 38,18 26,28 C20,34 16,42 16,50 C14,40 18,26 26,18 Z"
        fill={`url(#beanHighlight-${size})`}
      />

      {/* Center S-Curve Crease / Groove */}
      <path
        d="M50,14 C48,28 58,40 48,60 C42,72 50,86 50,86 C48,80 40,70 45,58 C51,44 44,30 50,14 Z"
        fill={`url(#beanCrease-${size})`}
      />

      {/* Crease Subtle Inner Lip Highlight */}
      <path
        d="M52,16 C50,28 59,41 50,60 C45,70 51,84 51,84"
        fill="none"
        stroke={isDark ? 'rgba(235, 165, 110, 0.3)' : 'rgba(214, 142, 88, 0.25)'}
        strokeWidth="1.2"
        strokeLinecap="round"
      />

      {/* Bottom Rim Glow */}
      <path
        d="M74,82 C66,88 56,92 50,92 C38,92 28,88 22,82 C30,88 42,90 50,90 C60,90 70,87 74,82 Z"
        fill={`url(#beanRim-${size})`}
      />
    </svg>
  );
};

/**
 * 3D Realistic Fresh Tea Leaf Vector with Organic Vein Details & Translucent Emerald Gloss
 */
const RealisticTeaLeaf: React.FC<{ isDark: boolean; size: number }> = ({ isDark, size }) => {
  return (
    <svg
      viewBox="0 0 100 100"
      className="w-full h-full pointer-events-none drop-shadow-[0_12px_22px_rgba(0,0,0,0.35)]"
      style={{
        filter: isDark
          ? 'drop-shadow(0 10px 24px rgba(0,0,0,0.8)) drop-shadow(0 0 14px rgba(52,211,153,0.3))'
          : 'drop-shadow(0 8px 16px rgba(20,83,45,0.22))',
      }}
    >
      <defs>
        {/* Leaf 3D Green Gradient */}
        <linearGradient id={`leafBody-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={isDark ? '#2D8A5E' : '#34A853'} />
          <stop offset="35%" stopColor={isDark ? '#1C6843' : '#238642'} />
          <stop offset="70%" stopColor={isDark ? '#134D31' : '#176632'} />
          <stop offset="100%" stopColor={isDark ? '#0A2F1D' : '#0E401E'} />
        </linearGradient>

        {/* Leaf Surface Specular Sheen */}
        <linearGradient id={`leafSheen-${size}`} x1="0%" y1="0%" x2="80%" y2="80%">
          <stop offset="0%" stopColor="rgba(255, 255, 255, 0.55)" />
          <stop offset="40%" stopColor="rgba(167, 243, 208, 0.2)" />
          <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
        </linearGradient>
      </defs>

      {/* Organic Curved Tea Leaf Blade */}
      <path
        d="M12,88 C12,88 28,68 34,46 C40,24 64,12 88,12 C88,12 82,38 72,58 C60,80 32,88 12,88 Z"
        fill={`url(#leafBody-${size})`}
        stroke={isDark ? 'rgba(110, 231, 183, 0.35)' : 'rgba(22, 101, 52, 0.3)'}
        strokeWidth="1.2"
      />

      {/* Surface Gloss Sheen (Left half of blade) */}
      <path
        d="M26,76 C32,60 38,40 50,28 C64,16 78,14 84,14 C74,22 62,38 52,52 C42,66 32,74 26,76 Z"
        fill={`url(#leafSheen-${size})`}
      />

      {/* Center Spine Main Vein */}
      <path
        d="M12,88 Q45,55 88,12"
        fill="none"
        stroke={isDark ? 'rgba(167, 243, 208, 0.65)' : 'rgba(187, 247, 208, 0.75)'}
        strokeWidth="1.6"
        strokeLinecap="round"
      />

      {/* Delicate Side Veins */}
      <path
        d="M32,68 Q40,62 48,66 M42,54 Q52,46 62,52 M52,42 Q64,34 74,40 M64,28 Q74,22 82,26"
        fill="none"
        stroke={isDark ? 'rgba(167, 243, 208, 0.35)' : 'rgba(187, 247, 208, 0.45)'}
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
};

/**
 * Warm Bokeh Light Sphere for Atmospheric Depth
 */
const BokehGlow: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  return (
    <div
      className="w-full h-full rounded-full pointer-events-none"
      style={{
        background: isDark
          ? 'radial-gradient(circle, rgba(235,160,95,0.45) 0%, rgba(214,142,88,0.15) 50%, transparent 70%)'
          : 'radial-gradient(circle, rgba(214,142,88,0.35) 0%, rgba(139,74,32,0.12) 50%, transparent 70%)',
      }}
    />
  );
};
