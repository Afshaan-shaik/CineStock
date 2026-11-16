import React, { useEffect, useRef, useState } from 'react';
import {
  ASPECT_OPTIONS,
  DEMO_REELS,
  RETRO_TYPO_CAPTIONS,
  type AspectRatioMode,
  type DemoMode,
  type SourceType,
} from '../types/lab';
import { retroAudio } from '../engine/audioSynthesizer';
import { Type, Shuffle } from 'lucide-react';

interface MonitorStageProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  aspect: AspectRatioMode;
  onAspectChange: (aspect: AspectRatioMode) => void;
  compareSplit: boolean;
  splitPos: number;
  onSplitPosChange: (pos: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  sourceType: SourceType;
  demoMode: DemoMode;
  onSelectDemo: (mode: DemoMode) => void;
  seekPercent: number;
  onSeek: (pct: number) => void;
  timecodeText: string;
  isMuted: boolean;
  onToggleMute: () => void;
  onFileDrop: (file: File) => void;
  customCaption: string;
  onChangeCustomCaption: (text: string) => void;
}

export const MonitorStage: React.FC<MonitorStageProps> = ({
  canvasRef,
  aspect,
  onAspectChange,
  compareSplit,
  splitPos,
  onSplitPosChange,
  isPlaying,
  onTogglePlay,
  sourceType,
  demoMode,
  onSelectDemo,
  seekPercent,
  onSeek,
  timecodeText,
  isMuted,
  onToggleMute,
  onFileDrop,
  customCaption,
  onChangeCustomCaption,
}) => {
  const screenRef = useRef<HTMLDivElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);

  useEffect(() => {
    if (!isDraggingSplit) return;

    const updatePos = (clientX: number) => {
      const rect = screenRef.current?.getBoundingClientRect();
      if (!rect || rect.width <= 0) return;
      const next = Math.max(0.04, Math.min(0.96, (clientX - rect.left) / rect.width));
      onSplitPosChange(next);
    };

    const handleMouseMove = (e: MouseEvent) => updatePos(e.clientX);
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) updatePos(e.touches[0].clientX);
    };
    const handleEnd = () => setIsDraggingSplit(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDraggingSplit, onSplitPosChange]);

  const handlePointerDownScreen = (e: React.PointerEvent) => {
    if (compareSplit) {
      setIsDraggingSplit(true);
      const rect = screenRef.current?.getBoundingClientRect();
      if (rect) {
        const next = Math.max(0.04, Math.min(0.96, (e.clientX - rect.left) / rect.width));
        onSplitPosChange(next);
      }
    }
  };

  const handlePickRandomTypo = () => {
    retroAudio.playClick();
    const other = RETRO_TYPO_CAPTIONS.filter((c) => c !== customCaption);
    const pick = other[Math.floor(Math.random() * other.length)] ?? RETRO_TYPO_CAPTIONS[0];
    onChangeCustomCaption(pick);
  };

  return (
    <div className="ctr">
      <div className="pn">
        <div
          ref={screenRef}
          id="scr"
          onPointerDown={handlePointerDownScreen}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOver(false);
            const f = e.dataTransfer.files?.[0];
            if (f) onFileDrop(f);
          }}
          className={`screen select-none ${isDragOver ? 'over' : ''}`}
        >
          <canvas
            ref={canvasRef}
            id="out"
            width={1280}
            height={720}
          />

          {compareSplit && (
            <>
              <div
                id="spl"
                style={{
                  display: 'block',
                  left: `${splitPos * 100}%`,
                  height: '100%',
                }}
                className="split"
              />
              <span
                id="l1"
                style={{ display: 'block', top: '12px', left: '12px' }}
                className="cmpl"
              >
                ORIGINAL
              </span>
              <span
                id="l2"
                style={{ display: 'block', top: '12px', right: '12px' }}
                className="cmpl"
              >
                NOSTALGIA
              </span>
            </>
          )}

          {isDragOver && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center font-['VT323',monospace] text-2xl text-[var(--a)] tracking-widest pointer-events-none">
              [DROP TAPE / VIDEO / PHOTO TO LOAD]
            </div>
          )}
        </div>

        {/* Transport Bar */}
        <div className="tbar">
          <button
            type="button"
            id="pl"
            onClick={() => {
              retroAudio.playClick();
              onTogglePlay();
            }}
            aria-label="Play or pause"
            className="btn ibtn"
          >
            {isPlaying ? '❚❚' : '►'}
          </button>

          <button
            type="button"
            id="mu"
            onClick={() => {
              retroAudio.playClick();
              onToggleMute();
            }}
            aria-label="Mute or unmute"
            style={{ opacity: isMuted ? 0.45 : 1 }}
            className="btn ibtn"
          >
            ♪
          </button>

          <input
            type="range"
            id="seek"
            min="0"
            max="100"
            step="0.1"
            value={seekPercent}
            onChange={(e) => onSeek(parseFloat(e.target.value))}
            aria-label="Seek"
          />

          <span id="tc" className="tc">
            {timecodeText}
          </span>
        </div>

        {/* Aspect Frame Selector */}
        <div className="row2">
          <small>Frame</small>
          <span id="asp" style={{ display: 'contents' }}>
            {ASPECT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  retroAudio.playClick();
                  onAspectChange(opt.value);
                }}
                aria-pressed={aspect === opt.value}
                className="tag"
              >
                {opt.label}
              </button>
            ))}
          </span>
        </div>

        {/* Demo Scenes */}
        <div className="row2">
          <small>Demo scenes</small>
          <span id="dm" style={{ display: 'contents' }}>
            {DEMO_REELS.map((dm) => (
              <button
                key={dm.key}
                type="button"
                onClick={() => {
                  retroAudio.playClick();
                  onSelectDemo(dm.key);
                }}
                aria-pressed={sourceType === 'video' && demoMode === dm.key}
                className="tag"
              >
                {dm.label}
              </button>
            ))}
          </span>
        </div>

        {/* Custom OSD Typo / Tape Title Generator */}
        <div className="row2" style={{ borderTop: '1px solid var(--ln)', paddingTop: '14px', marginTop: '16px' }}>
          <small className="flex items-center gap-1.5 text-[var(--a)] font-mono">
            <Type className="w-3.5 h-3.5" />
            <span>OSD TYPO:</span>
          </small>
          <input
            type="text"
            value={customCaption}
            maxLength={26}
            onChange={(e) => onChangeCustomCaption(e.target.value)}
            placeholder="CUSTOM TITLE..."
            style={{
              flex: 1,
              minWidth: '150px',
              background: 'var(--sf)',
              border: '1px solid var(--ln)',
              borderRadius: 'var(--rs)',
              padding: '6px 12px',
              font: '18px "VT323", monospace',
              color: 'var(--fg)',
              outline: 'none',
            }}
          />
          <button
            type="button"
            onClick={handlePickRandomTypo}
            className="tag flex items-center gap-1"
          >
            <Shuffle className="w-3 h-3" />
            <span>Random</span>
          </button>
        </div>
      </div>
    </div>
  );
};
