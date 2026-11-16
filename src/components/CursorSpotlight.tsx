import React, { useEffect, useRef } from 'react';

interface CursorSpotlightProps {
  primaryColor: string;
  secondaryColor: string;
}

interface TrailParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
}

export const CursorSpotlight: React.FC<CursorSpotlightProps> = ({
  primaryColor,
  secondaryColor,
}) => {
  const glowOrbRef = useRef<HTMLDivElement | null>(null);
  const coreOrbRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const colorsRef = useRef({ primaryColor, secondaryColor });

  colorsRef.current = { primaryColor, secondaryColor };

  useEffect(() => {
    let targetX = window.innerWidth * 0.5;
    let targetY = window.innerHeight * 0.35;
    let currentX = targetX;
    let currentY = targetY;
    let coreX = targetX;
    let coreY = targetY;

    const particles: TrailParticle[] = [];
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');

    const handleResize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    handleResize();

    const palette = [
      '#f59e0b',
      '#ec4899',
      '#38bdf8',
      '#a855f7',
      '#2dd4bf',
      '#fb7185',
    ];

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - targetX;
      const dy = e.clientY - targetY;
      const dist = Math.hypot(dx, dy);

      targetX = e.clientX;
      targetY = e.clientY;

      document.documentElement.style.setProperty('--cursor-x', `${e.clientX}px`);
      document.documentElement.style.setProperty('--cursor-y', `${e.clientY}px`);

      if (dist > 4 && particles.length < 48) {
        const pick =
          Math.random() > 0.45
            ? colorsRef.current.primaryColor
            : Math.random() > 0.5
              ? colorsRef.current.secondaryColor
              : palette[Math.floor(Math.random() * palette.length)];

        particles.push({
          x: e.clientX + (Math.random() - 0.5) * 14,
          y: e.clientY + (Math.random() - 0.5) * 14,
          vx: (Math.random() - 0.5) * 0.9 - dx * 0.025,
          vy: (Math.random() - 0.5) * 0.9 - dy * 0.025,
          size: 16 + Math.random() * 28,
          alpha: 0.42,
          color: pick,
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('resize', handleResize);

    let rafId = 0;
    const animate = () => {
      rafId = requestAnimationFrame(animate);

      currentX += (targetX - currentX) * 0.12;
      currentY += (targetY - currentY) * 0.12;

      coreX += (targetX - coreX) * 0.28;
      coreY += (targetY - coreY) * 0.28;

      if (glowOrbRef.current) {
        glowOrbRef.current.style.transform = `translate3d(${currentX - 320}px, ${currentY - 320}px, 0)`;
      }
      if (coreOrbRef.current) {
        coreOrbRef.current.style.transform = `translate3d(${coreX - 90}px, ${coreY - 90}px, 0)`;
      }

      if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = 'lighter';

        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.alpha *= 0.93;
          p.size *= 0.985;

          if (p.alpha < 0.015) {
            particles.splice(i, 1);
            continue;
          }

          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
          grad.addColorStop(0, `${p.color}${Math.round(p.alpha * 255).toString(16).padStart(2, '0')}`);
          grad.addColorStop(1, `${p.color}00`);

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-30 overflow-hidden">
      {/* Large soft chromatic aura following cursor */}
      <div
        ref={glowOrbRef}
        className="w-[640px] h-[640px] rounded-full opacity-35 blur-[95px] transition-colors duration-700 will-change-transform mix-blend-screen"
        style={{
          background: `radial-gradient(circle, ${primaryColor}55 0%, ${secondaryColor}33 42%, transparent 72%)`,
        }}
      />

      {/* Focused luminous core halo */}
      <div
        ref={coreOrbRef}
        className="w-[180px] h-[180px] rounded-full opacity-45 blur-[28px] transition-colors duration-500 will-change-transform mix-blend-screen"
        style={{
          background: `radial-gradient(circle, #ffffff55 0%, ${primaryColor}66 45%, transparent 75%)`,
        }}
      />

      {/* Luminous bokeh light trail canvas */}
      <canvas ref={canvasRef} className="fixed inset-0 w-full h-full mix-blend-screen opacity-80" />
    </div>
  );
};
