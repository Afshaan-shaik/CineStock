import React, { useEffect, useRef } from 'react';

interface BackgroundBokehProps {
  primaryColor: string;
  secondaryColor: string;
}

interface Particle {
  x: number;
  y: number;
  r: number;
  life: number;
  color: string;
  vx: number;
  vy: number;
}

export const BackgroundBokeh: React.FC<BackgroundBokehProps> = ({
  primaryColor,
  secondaryColor,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const particles: Particle[] = [];
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const handlePointerMove = (e: PointerEvent) => {
      document.body.style.setProperty('--cx', `${e.clientX}px`);
      document.body.style.setProperty('--cy', `${e.clientY}px`);

      if (reducedMotion || e.pointerType === 'touch') return;

      if (particles.length < 80 && Math.random() < 0.6) {
        particles.push({
          x: e.clientX,
          y: e.clientY,
          r: 6 + Math.random() * 16,
          life: 1.0,
          color: Math.random() < 0.5 ? primaryColor : secondaryColor,
          vx: (Math.random() - 0.5) * 0.8,
          vy: -0.2 - Math.random() * 0.6,
        });
      }
    };

    window.addEventListener('pointermove', handlePointerMove);

    let animId = 0;
    const render = () => {
      animId = requestAnimationFrame(render);
      ctx.clearRect(0, 0, width, height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.016;

        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.globalAlpha = p.life * 0.42;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', handlePointerMove);
    };
  }, [primaryColor, secondaryColor]);

  return (
    <canvas
      ref={canvasRef}
      id="bk"
      className="fixed inset-0 pointer-events-none z-[1] w-full h-full"
    />
  );
};

