import React, { useEffect, useRef, useState } from 'react';
import { retroAudio } from '../engine/audioSynthesizer';

interface CineStockIntroProps {
  onEnterLab: () => void;
}

interface StickerState {
  id: string;
  label: string;
  color: string;
  baseRotate: number;
  initialStyle: React.CSSProperties;
  x: number;
  y: number;
}

// QWERTY keyboard adjacency map for realistic typing errors
const QWERTY_NEIGHBORS: Record<string, string[]> = {
  a: ['s', 'q', 'z', 'w'],
  b: ['v', 'g', 'h', 'n'],
  c: ['x', 'd', 'v', 'f'],
  d: ['s', 'e', 'r', 'f', 'x', 'c'],
  e: ['w', 'r', 'd', 's'],
  f: ['d', 'r', 't', 'g', 'v', 'c'],
  g: ['f', 't', 'y', 'h', 'b', 'v'],
  h: ['g', 'y', 'u', 'j', 'n', 'b'],
  i: ['u', 'o', 'k', 'j'],
  j: ['h', 'u', 'i', 'k', 'm', 'n'],
  k: ['j', 'i', 'o', 'l', 'm'],
  l: ['k', 'o', 'p'],
  m: ['n', 'j', 'k'],
  n: ['b', 'h', 'j', 'm'],
  o: ['i', 'p', 'l', 'k'],
  p: ['o', 'l'],
  q: ['w', 'a'],
  r: ['e', 't', 'f', 'd'],
  s: ['a', 'w', 'e', 'd', 'x', 'z'],
  t: ['r', 'y', 'g', 'f'],
  u: ['y', 'i', 'j', 'h'],
  v: ['c', 'f', 'g', 'b'],
  w: ['q', 'e', 's', 'a'],
  x: ['z', 's', 'd', 'c'],
  y: ['t', 'u', 'h', 'g'],
  z: ['a', 's', 'x'],
};

function getNeighborChar(char: string): string {
  const lower = char.toLowerCase();
  const list = QWERTY_NEIGHBORS[lower];
  if (!list || list.length === 0) return char;
  const picked = list[Math.floor(Math.random() * list.length)];
  return char === char.toUpperCase() ? picked.toUpperCase() : picked;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const CineStockIntro: React.FC<CineStockIntroProps> = ({ onEnterLab }) => {
  const [isEntering, setIsEntering] = useState(false);
  const [buttonText, setButtonText] = useState('Enter the lab');

  // Typewriter lines state
  const [labelTyped, setLabelTyped] = useState('');
  const [kickTyped, setKickTyped] = useState('');
  const [headlineTyped, setHeadlineTyped] = useState('');
  const [subTyped, setSubTyped] = useState('');
  const [activeLine, setActiveLine] = useState<'label' | 'kick' | 'headline' | 'sub' | null>(null);

  const cassetteRef = useRef<HTMLDivElement | null>(null);
  const runTokenRef = useRef(0);

  // Die-cut draggable stickers
  const [stickers, setStickers] = useState<StickerState[]>([
    {
      id: 'hi8',
      label: 'HI-8',
      color: '#f5a623',
      baseRotate: 8,
      initialStyle: { top: '6%', right: 'calc(50% - min(260px, 45vw))' },
      x: 0,
      y: 0,
    },
    {
      id: 'rec',
      label: 'REC ●',
      color: '#ef4444',
      baseRotate: -9,
      initialStyle: { bottom: '4%', left: 'calc(50% - min(250px, 44vw))' },
      x: 0,
      y: 0,
    },
    {
      id: 'sp',
      label: 'SP TAPE',
      color: '#35d0ba',
      baseRotate: 6,
      initialStyle: { bottom: '-2%', right: 'calc(50% - min(210px, 38vw))' },
      x: 0,
      y: 0,
    },
  ]);

  // Pointer drag tracking for stickers
  const dragRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  // Typewriter engine
  const runTypewriter = () => {
    const currentToken = ++runTokenRef.current;

    // Check user preference for reduced motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setLabelTyped('Rewind the city - side A');
      setKickTyped('[ ANALOG LAB v88 ]');
      setHeadlineTyped('REWIND THE CITY');
      setSubTyped(
        'Neon, tape hiss and rain on the lens. Add your footage and push it through twenty-four stocks in real time.'
      );
      setActiveLine(null);
      return;
    }

    // Reset lines
    setLabelTyped('');
    setKickTyped('');
    setHeadlineTyped('');
    setSubTyped('');
    setActiveLine('label');

    const typeLine = async (
      fullText: string,
      setter: React.Dispatch<React.SetStateAction<string>>,
      lineKey: 'label' | 'kick' | 'headline' | 'sub',
      baseSpeed: number,
      startDelay: number
    ) => {
      if (runTokenRef.current !== currentToken) return false;
      setActiveLine(lineKey);
      await sleep(startDelay);

      let currentText = '';
      for (let i = 0; i < fullText.length; i++) {
        if (runTokenRef.current !== currentToken) return false;
        const targetChar = fullText[i];

        // 8% chance of typo on letters, only after first 2 characters
        if (/[a-zA-Z]/.test(targetChar) && i > 1 && Math.random() < 0.08) {
          const typoCount = Math.random() < 0.35 ? 2 : 1;
          const wrongChars: string[] = [];

          // Type 1 or 2 wrong neighboring characters
          for (let k = 0; k < typoCount; k++) {
            const wrongChar = getNeighborChar(fullText[i + k] || targetChar);
            wrongChars.push(wrongChar);
            currentText += wrongChar;
            setter(currentText);
            await sleep(baseSpeed * 1.25);
          }

          // Human hesitation
          await sleep(baseSpeed * 4.2);

          // Backspace wrong character(s)
          for (let k = 0; k < typoCount; k++) {
            currentText = currentText.slice(0, -1);
            setter(currentText);
            await sleep(baseSpeed * 0.7);
          }

          await sleep(baseSpeed * 1.6);
        }

        // Type correct character
        currentText += targetChar;
        setter(currentText);

        // Realistic typing rhythm
        const keyDelay =
          baseSpeed * (0.6 + Math.random() * 0.9) +
          (targetChar === ' ' ? baseSpeed * 0.55 : 0);
        await sleep(keyDelay);
      }

      return true;
    };

    (async () => {
      // 1. Handwritten cassette label
      const ok1 = await typeLine(
        'Rewind the city - side A',
        setLabelTyped,
        'label',
        85,
        400
      );
      if (!ok1) return;

      // 2. Kick line [ ANALOG LAB v88 ]
      const ok2 = await typeLine(
        '[ ANALOG LAB v88 ]',
        setKickTyped,
        'kick',
        52,
        250
      );
      if (!ok2) return;

      // 3. Headline REWIND THE CITY
      const ok3 = await typeLine(
        'REWIND THE CITY',
        setHeadlineTyped,
        'headline',
        75,
        250
      );
      if (!ok3) return;

      // 4. Subtitle
      const ok4 = await typeLine(
        'Neon, tape hiss and rain on the lens. Add your footage and push it through twenty-four stocks in real time.',
        setSubTyped,
        'sub',
        25,
        250
      );
      if (!ok4) return;

      setActiveLine(null);
    })();
  };

  useEffect(() => {
    runTypewriter();

    // Mouse tilt tracking for the 3D cassette
    const handlePointerMove = (e: PointerEvent) => {
      if (!cassetteRef.current) return;
      const rx = 8 - (e.clientY / window.innerHeight - 0.5) * 22;
      const ry = -8 + (e.clientX / window.innerWidth - 0.5) * 32;
      cassetteRef.current.style.setProperty('--rx', `${rx.toFixed(2)}deg`);
      cassetteRef.current.style.setProperty('--ry', `${ry.toFixed(2)}deg`);
    };

    // Device tilt on mobile devices
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (!cassetteRef.current || e.beta === null || e.gamma === null) return;
      const rx = Math.max(-14, Math.min(14, (e.beta - 45) * 0.35));
      const ry = Math.max(-18, Math.min(18, e.gamma * 0.35));
      cassetteRef.current.style.setProperty('--rx', `${rx.toFixed(2)}deg`);
      cassetteRef.current.style.setProperty('--ry', `${ry.toFixed(2)}deg`);
    };

    window.addEventListener('pointermove', handlePointerMove);
    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation);
    }

    return () => {
      runTokenRef.current++;
      window.removeEventListener('pointermove', handlePointerMove);
      if (window.DeviceOrientationEvent) {
        window.removeEventListener('deviceorientation', handleOrientation);
      }
    };
  }, []);

  // Enter lab handler
  const handleEnterLab = () => {
    if (isEntering) return;
    setIsEntering(true);
    setButtonText('Loading reel...');
    try {
      retroAudio.playCassetteInsert();
    } catch {
      // Audio autoplay gracefully handled
    }

    setTimeout(() => {
      onEnterLab();
    }, 1350);
  };

  // Sticker dragging handlers
  const handleStickerPointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    sticker: StickerState
  ) => {
    e.stopPropagation();
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);

    dragRef.current = {
      id: sticker.id,
      startX: e.clientX,
      startY: e.clientY,
      origX: sticker.x,
      origY: sticker.y,
    };
  };

  const handleStickerPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const { id, startX, startY, origX, origY } = dragRef.current;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    setStickers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, x: origX + dx, y: origY + dy } : s))
    );
  };

  const handleStickerPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Safe release
      }
      dragRef.current = null;
    }
  };

  return (
    <div className="c-intro-root fixed inset-0 z-50 overflow-hidden select-none flex flex-col justify-between">
      {/* Blueprint Grid & Ambient Corner Amber Glow */}
      <div className="blueprint-backdrop absolute inset-0 pointer-events-none" />

      {/* Stepped Film Grain Noise Overlay */}
      <div className="film-grain-overlay absolute inset-0 pointer-events-none" />

      {/* Header */}
      <header className="relative z-20 flex justify-between items-center w-full px-6 sm:px-12 py-5 sm:py-6 shrink-0">
        <div className="flex items-baseline">
          <span className="font-['Space_Grotesk',sans-serif] font-bold text-lg sm:text-xl tracking-[0.2em] text-[#eaf4ff]">
            CINE
          </span>
          <span className="font-['Space_Grotesk',sans-serif] font-bold text-lg sm:text-xl tracking-[0.2em] text-[#f5a623]">
            STOCK
          </span>
        </div>

        <div className="font-['Space_Mono',monospace] text-[11px] sm:text-xs tracking-[0.2em] text-[#8d9ab3] uppercase flex items-center gap-1.5">
          <span>REC</span>
          <span className="text-[#ef4444] animate-pulse">●</span>
          <span>24 STOCKS ONLINE</span>
        </div>
      </header>

      {/* Center Hero Stage (Perspective + 3D Cassette + Typography + CTA) */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-2 w-full max-w-[960px] mx-auto text-center">
        {/* 3D Cassette Scene with Draggable Stickers and Masking Tape */}
        <div className="relative w-full flex items-center justify-center h-[230px] sm:h-[280px] lg:h-[300px] mb-4 sm:mb-6">
          {/* Cassette Floating Container */}
          <div className="cassette-float-wrapper">
            <div
              ref={cassetteRef}
              className={`cassette-shell ${isEntering ? 'reels-fast' : ''}`}
            >
              {/* Corner Screws */}
              <i className="corner-screw top-[10px] left-[10px]" />
              <i className="corner-screw top-[10px] right-[10px]" />
              <i className="corner-screw bottom-[10px] left-[10px]" />
              <i className="corner-screw bottom-[10px] right-[10px]" />

              {/* Cream Paper Label with Red Header Stripe & Writing Lines */}
              <div className="cassette-label">
                <span className={`handwritten-label ${activeLine === 'label' ? 'has-caret' : ''}`}>
                  {labelTyped}
                </span>
              </div>

              {/* Window with Two Spinning Reels */}
              <div className="cassette-window">
                <div className="reel-spool" />
                <div className="reel-spool" />
              </div>
            </div>
          </div>

          {/* Masking Tape with Torn Zig-Zag Ends */}
          <div
            className="masking-tape-strip pointer-events-none"
            style={{
              top: '4%',
              left: 'calc(50% - min(190px, 35vw))',
              transform: 'rotate(-14deg)',
            }}
          />

          {/* Three Die-Cut Draggable Stickers */}
          {stickers.map((stk) => (
            <div
              key={stk.id}
              onPointerDown={(e) => handleStickerPointerDown(e, stk)}
              onPointerMove={handleStickerPointerMove}
              onPointerUp={handleStickerPointerUp}
              onPointerCancel={handleStickerPointerUp}
              className="die-cut-sticker active:cursor-grabbing"
              style={{
                ...stk.initialStyle,
                transform: `translate(${stk.x}px, ${stk.y}px) rotate(${stk.baseRotate}deg)`,
                backgroundColor: stk.color,
              }}
              title="Drag me!"
            >
              <span>{stk.label}</span>
            </div>
          ))}
        </div>

        {/* Small Tag: [ ANALOG LAB v88 ] */}
        <div className="h-6 flex items-center justify-center mb-2 sm:mb-3">
          <p
            className={`font-['Space_Mono',monospace] text-[11px] sm:text-xs text-[#f5a623] tracking-[0.32em] uppercase font-bold ${
              activeLine === 'kick' ? 'has-caret' : ''
            }`}
          >
            {kickTyped}
          </p>
        </div>

        {/* Headline: REWIND THE CITY (Space Grotesk bold, VHS RGB text shadow) */}
        <div className="min-h-[44px] sm:min-h-[64px] lg:min-h-[82px] flex items-center justify-center mb-2 sm:mb-3">
          <h1
            className={`font-['Space_Grotesk',sans-serif] font-bold text-uppercase tracking-[-0.02em] leading-[0.95] text-[#eaf4ff] text-[clamp(38px,8vw,92px)] ${
              activeLine === 'headline' ? 'has-caret' : ''
            }`}
            style={{
              textShadow: '3px 0 #f5a623, 6px 0 #ef4444',
            }}
          >
            {headlineTyped}
          </h1>
        </div>

        {/* Subtitle */}
        <div className="min-h-[38px] sm:min-h-[46px] max-w-[540px] flex items-center justify-center px-4 mb-4 sm:mb-6">
          <p
            className={`font-['Space_Mono',monospace] text-xs sm:text-[14px] text-[#8d9ab3] leading-relaxed ${
              activeLine === 'sub' ? 'has-caret' : ''
            }`}
          >
            {subTyped}
          </p>
        </div>

        {/* "Enter the lab" Action Button */}
        <div className="relative z-20">
          <button
            type="button"
            id="go"
            onClick={handleEnterLab}
            disabled={isEntering}
            className="enter-lab-cta flex items-center justify-center font-['Space_Mono',monospace] font-bold text-xs sm:text-sm tracking-wider uppercase px-7 sm:px-9 py-3.5 sm:py-4 rounded-xl text-[#111] transition-all duration-200 cursor-pointer active:scale-95 disabled:opacity-90"
          >
            {buttonText}
          </button>
        </div>
      </main>

      {/* Footer / Replay Typing Button */}
      <footer className="relative z-20 w-full px-6 py-4 flex justify-between items-center shrink-0">
        <button
          type="button"
          onClick={runTypewriter}
          className="font-['Space_Mono',monospace] text-[11px] text-[#6d7690] hover:text-[#eaf4ff] bg-[#0c101d] hover:bg-[#141b2e] border border-[#2b354f] hover:border-[#f5a623] px-2.5 py-1 rounded transition-colors cursor-pointer"
          title="Replay typewriter typing effect"
        >
          replay typing
        </button>

        <span className="font-['Space_Mono',monospace] text-[10px] text-[#4d5770] tracking-widest hidden sm:inline">
          CINESTOCK // NO.88 VHS ENGINE
        </span>
      </footer>

      {/* Embedded High-Fidelity CSS for 3D Cassette, Stickers & Typewriter Caret */}
      <style>{`
        .c-intro-root {
          background-color: #090a10;
          color: #eaf4ff;
          height: 100dvh;
          max-height: 100dvh;
          padding: env(safe-area-inset-top, 0px) 0 env(safe-area-inset-bottom, 0px);
        }

        /* Blueprint Grid & Corner Amber Glow */
        .blueprint-backdrop {
          background:
            linear-gradient(rgba(27, 42, 64, 0.16) 1px, transparent 1px) 0 0 / 100% 98px,
            linear-gradient(90deg, rgba(27, 42, 64, 0.16) 1px, transparent 1px) 0 0 / 98px 100%,
            radial-gradient(ellipse at 85% 82%, rgba(245, 166, 35, 0.16), transparent 55%);
        }

        /* Stepped Animated Film Grain Noise */
        .film-grain-overlay {
          opacity: 0.13;
          background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E");
          animation: intro-grain 0.5s steps(3) infinite;
        }

        @keyframes intro-grain {
          50% { transform: translate(-3%, 2%); }
        }

        /* 3D Cassette Structure */
        .cassette-float-wrapper {
          perspective: 1300px;
          animation: cassette-float 6s ease-in-out infinite;
        }

        @keyframes cassette-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        .cassette-shell {
          width: min(440px, 80vw);
          aspect-ratio: 1.6;
          position: relative;
          border-radius: 16px;
          background: linear-gradient(145deg, #3a3d52, #13141c);
          box-shadow: 0 45px 80px rgba(0, 0, 0, 0.88), inset 0 2px 0 rgba(255, 255, 255, 0.18), inset 0 -8px 14px rgba(0, 0, 0, 0.65);
          transform-style: preserve-3d;
          transform: rotateX(var(--rx, 8deg)) rotateY(var(--ry, -10deg));
          transition: transform 0.12s cubic-bezier(0.2, 0.8, 0.2, 1);
        }

        .corner-screw {
          position: absolute;
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #0a0a0f;
          box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.25);
          transform: translateZ(6px);
        }

        .cassette-label {
          position: absolute;
          left: 7%;
          right: 7%;
          top: 8%;
          height: 48%;
          background: linear-gradient(#efe3c2, #e4d5aa);
          color: #2a2018;
          border-radius: 6px;
          padding: clamp(10px, 2.8vw, 16px) clamp(12px, 3vw, 18px);
          text-align: left;
          border-top: 14px solid #ef4444;
          transform: translateZ(16px);
          box-shadow: 0 5px 0 rgba(0, 0, 0, 0.2);
        }

        .cassette-label::after {
          content: "";
          position: absolute;
          left: 18px;
          right: 18px;
          bottom: 15px;
          height: 2px;
          background: rgba(42, 32, 24, 0.35);
          box-shadow: 0 -13px rgba(42, 32, 24, 0.22);
        }

        .handwritten-label {
          font-family: 'Caveat', cursive;
          font-weight: 600;
          font-size: clamp(20px, 4vw, 30px);
          line-height: 1.1;
          display: block;
          color: #2a2018;
        }

        .cassette-window {
          position: absolute;
          left: 20%;
          right: 20%;
          bottom: 8%;
          height: 26%;
          background: #06060a;
          border-radius: 50px;
          display: flex;
          justify-content: space-around;
          align-items: center;
          transform: translateZ(10px);
          box-shadow: inset 0 3px 8px #000;
        }

        .reel-spool {
          width: 16%;
          aspect-ratio: 1;
          border-radius: 50%;
          background:
            radial-gradient(#06060a 0 22%, transparent 23%),
            conic-gradient(#eee 0 12%, #222 0 25%, #eee 0 37%, #222 0 50%, #eee 0 62%, #222 0 75%, #eee 0 87%, #222 0);
          animation: reel-spin 2.6s linear infinite;
        }

        .reels-fast .reel-spool {
          animation-duration: 0.35s !important;
        }

        @keyframes reel-spin {
          to { transform: rotate(1turn); }
        }

        /* Torn Masking Tape Strip */
        .masking-tape-strip {
          position: absolute;
          width: 118px;
          height: 28px;
          background: rgba(238, 222, 170, 0.84);
          z-index: 4;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
          clip-path: polygon(
            0 0, 3% 12%, 0 25%, 3% 38%, 0 50%, 3% 62%, 0 75%, 3% 88%, 0 100%,
            100% 100%, 97% 88%, 100% 75%, 97% 62%, 100% 50%, 97% 38%, 100% 25%, 97% 12%, 100% 0
          );
        }

        /* Die-Cut Draggable Stickers */
        .die-cut-sticker {
          position: absolute;
          display: grid;
          place-items: center;
          padding: 0.52em 0.95em;
          border-radius: 999px;
          font: 700 12px 'Space Mono', monospace;
          color: #111;
          border: 2px dashed rgba(0, 0, 0, 0.4);
          box-shadow: 0 0 0 3px #f4f4f0, 0 8px 16px rgba(0, 0, 0, 0.7);
          z-index: 5;
          cursor: grab;
          touch-action: none;
          user-select: none;
          transition: filter 0.15s, box-shadow 0.15s;
        }

        .die-cut-sticker:hover {
          filter: brightness(1.1);
          box-shadow: 0 0 0 3px #fff, 0 12px 24px rgba(0, 0, 0, 0.85);
        }

        /* Blinking Block Caret */
        .has-caret::after {
          content: "";
          display: inline-block;
          width: 0.55em;
          height: 1em;
          margin-left: 3px;
          background: currentColor;
          vertical-align: -0.12em;
          animation: caret-blink 0.8s steps(1) infinite;
        }

        @keyframes caret-blink {
          50% { opacity: 0; }
        }

        /* "Enter the lab" CTA */
        .enter-lab-cta {
          background: linear-gradient(90deg, #f5a623, #ef4444);
          box-shadow: 0 0 34px rgba(245, 166, 35, 0.45), 0 8px 24px rgba(239, 68, 68, 0.3);
        }

        .enter-lab-cta:hover {
          filter: brightness(1.15);
          box-shadow: 0 0 46px rgba(245, 166, 35, 0.65), 0 12px 30px rgba(239, 68, 68, 0.45);
          transform: translateY(-1px);
        }

        /* Reduced Motion Accessibility */
        @media (prefers-reduced-motion: reduce) {
          *, .film-grain-overlay, .cassette-float-wrapper, .reel-spool, .has-caret::after {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
};
