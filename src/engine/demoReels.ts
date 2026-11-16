import type { DemoMode } from '../types/lab';

export function renderDemoFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  mode: DemoMode,
  t: number
) {
  if (mode === 'nature') {
    // Aesthetic Nature fallback (Lush waterfall & forest)
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#06282d');
    sky.addColorStop(0.4, '#0e443b');
    sky.addColorStop(1, '#061c14');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    // Cascading misty waterfall
    const fallX = w * 0.5;
    const fallW = w * 0.16;
    const fallGrad = ctx.createLinearGradient(fallX - fallW / 2, 0, fallX + fallW / 2, 0);
    fallGrad.addColorStop(0, 'rgba(255,255,255,0.2)');
    fallGrad.addColorStop(0.5, 'rgba(220,255,250,0.85)');
    fallGrad.addColorStop(1, 'rgba(255,255,255,0.2)');
    ctx.fillStyle = fallGrad;
    ctx.fillRect(fallX - fallW / 2, 0, fallW, h);

    // Mist particles
    for (let i = 0; i < 30; i++) {
      const mx = fallX + Math.sin(t * 3 + i) * (fallW * 0.8);
      const my = ((t * 180 + i * 45) % h);
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillRect(mx, my, 2.5, 14);
    }
  } else if (mode === 'supercar') {
    // Lambo / Bugatti driving fallback (Speeding highway)
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#030206');
    bg.addColorStop(0.6, '#110c1c');
    bg.addColorStop(1, '#080510');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Road with moving lines
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(w * 0.45, h * 0.5);
    ctx.lineTo(w * 0.55, h * 0.5);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    // Red supercar taillights trailing
    const tailY = h * 0.72;
    const tailX = w * 0.5;
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(tailX - 60, tailY, 40, 8);
    ctx.fillRect(tailX + 20, tailY, 40, 8);
  } else if (mode === 'celebrity') {
    // Famous Person cinema portrait fallback
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#1c1917');
    grad.addColorStop(0.5, '#292524');
    grad.addColorStop(1, '#0c0a09');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Flash bulbs
    if (Math.sin(t * 8) > 0.85) {
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(0, 0, w, h);
    }
  }
}

export function drawOSDOverlay(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  timeSec: number,
  options: {
    enabled: boolean;
    compareSplit: boolean;
    splitPos: number;
    isPlaying: boolean;
    osdDate: string;
    customCaption?: string;
  }
) {
  if (!options.enabled) return;

  ctx.save();
  const scale = Math.min(w, h) / 720;
  const pad = Math.round(32 * scale);

  if (options.compareSplit) {
    ctx.beginPath();
    ctx.rect(w * options.splitPos, 0, w * (1 - options.splitPos), h);
    ctx.clip();
  }

  ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
  ctx.shadowBlur = 5 * scale;
  ctx.shadowOffsetX = 2 * scale;
  ctx.shadowOffsetY = 2 * scale;

  const fontSize = Math.round(30 * scale);
  ctx.font = `${fontSize}px "VT323", monospace`;
  ctx.textBaseline = 'top';

  const blink = Math.floor(timeSec * 2) % 2 === 0;
  if (options.isPlaying && blink) {
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(pad + 10 * scale, pad + 14 * scale, 7 * scale, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = 'rgba(246, 239, 228, 0.92)';
  ctx.fillText(options.isPlaying ? '  PLAY ►' : '  PAUSE ❚❚', pad + 14 * scale, pad);

  // Top right tape status
  ctx.textAlign = 'right';
  ctx.fillText('SP   [■■■ ]', w - pad, pad);

  // Optional custom retro caption / typo title at top center
  if (options.customCaption) {
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(254, 240, 138, 0.90)';
    ctx.font = `${Math.round(28 * scale)}px "VT323", monospace`;
    ctx.fillText(options.customCaption.toUpperCase(), w / 2, pad);
  }

  // Bottom left date stamp
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  ctx.font = `${Math.round(34 * scale)}px "VT323", monospace`;
  ctx.fillStyle = 'rgba(245, 158, 11, 0.95)';
  ctx.fillText(options.osdDate || "NOV 16 '94", pad, h - pad);

  // Bottom right timecode
  const mins = String(Math.floor(timeSec / 60) % 60).padStart(2, '0');
  const secs = String(Math.floor(timeSec) % 60).padStart(2, '0');
  const frms = String(Math.floor((timeSec % 1) * 24)).padStart(2, '0');
  ctx.textAlign = 'right';
  ctx.font = `${Math.round(26 * scale)}px "VT323", monospace`;
  ctx.fillStyle = 'rgba(246, 239, 228, 0.82)';
  ctx.fillText(`00:${mins}:${secs}:${frms}`, w - pad, h - pad);

  ctx.restore();
}

export function formatTimecode(sec: number): string {
  if (!sec || Number.isNaN(sec)) return '00:00';
  const m = String(Math.floor(sec / 60)).padStart(2, '0');
  const s = String(Math.floor(sec % 60)).padStart(2, '0');
  return `${m}:${s}`;
}
