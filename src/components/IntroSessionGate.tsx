import React, { useState, useEffect } from 'react';
import { Play, Sparkles, Volume2, VolumeX, ArrowRight, Disc } from 'lucide-react';
import { retroAudio, AUDIO_ENABLED } from '../engine/audioSynthesizer';

interface IntroSessionGateProps {
  onEnterLab: () => void;
  audioMuted: boolean;
  onToggleAudio: () => void;
}

export const IntroSessionGate: React.FC<IntroSessionGateProps> = ({
  onEnterLab,
  audioMuted,
  onToggleAudio,
}) => {
  const [inserting, setInserting] = useState(false);
  const [bootStep, setBootStep] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setBootStep(1), 300);
    const t2 = setTimeout(() => setBootStep(2), 800);
    const t3 = setTimeout(() => setBootStep(3), 1400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  const handleInsertTape = () => {
    retroAudio.playCassetteInsert();
    setInserting(true);
    setTimeout(() => {
      onEnterLab();
    }, 850);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#05060d] overflow-hidden select-none">
      {/* Grid background matching Tokyo Night */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage:
            'linear-gradient(rgba(120,220,255,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(120,220,255,0.14) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
        }}
      />

      {/* Cyberpunk radial aura */}
      <div className="absolute inset-0 pointer-events-none opacity-50 bg-[radial-gradient(circle_at_50%_35%,rgba(34,211,238,0.18),transparent_55%),radial-gradient(circle_at_20%_80%,rgba(240,171,252,0.15),transparent_45%)]" />

      {/* CRT scanlines effect */}
      <div className="absolute inset-0 pointer-events-none opacity-30 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.7)_3px,rgba(0,0,0,0.7)_4px)]" />

      {/* Retro VHS OSD Status */}
      <div className="absolute top-6 left-6 sm:top-10 sm:left-12 font-['VT323',monospace] text-xl sm:text-2xl text-[var(--a)] tracking-widest flex items-center gap-3">
        <span className="w-3.5 h-3.5 rounded-full bg-[#ef4444] animate-pulse inline-block" />
        <span>[ TOKYO DECK v88 · STANDBY ]</span>
      </div>

      <div className="absolute top-6 right-6 sm:top-10 sm:right-12 flex items-center gap-4 z-20">
        {AUDIO_ENABLED && (
          <button
            type="button"
            onClick={onToggleAudio}
            className="flex items-center gap-2 px-4 py-1.5 rounded text-xs font-mono bg-[#0b1020]/90 border border-[rgba(120,220,255,0.2)] text-[var(--mu)] hover:text-[var(--fg)] hover:border-[var(--a)] transition-all cursor-pointer backdrop-blur-md"
          >
            {audioMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-[var(--a)]" />}
            <span>{audioMuted ? 'AUDIO: OFF' : 'AUDIO: ON'}</span>
          </button>
        )}
      </div>

      {/* Main Intro Stage */}
      <div
        className={`relative z-10 w-full max-w-2xl px-6 flex flex-col items-center text-center transition-all duration-700 ${
          inserting ? 'scale-90 opacity-0 -translate-y-12' : 'scale-100 opacity-100 translate-y-0'
        }`}
      >
        <div className="mb-4 inline-flex items-center gap-2 px-4 py-1 rounded bg-[#0b1020] border border-[rgba(34,211,238,0.3)] text-[var(--a)] text-xs font-mono tracking-widest uppercase">
          <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
          <span>ANALOG LAB v88 // INITIALIZING SESSION</span>
        </div>

        <h1
          className="font-['Space_Grotesk',sans-serif] text-5xl sm:text-7xl font-bold tracking-tight uppercase mb-4 text-[#e8f6ff]"
          style={{ textShadow: '3px 0 var(--b), -3px 0 var(--a)' }}
        >
          Cine<span style={{ color: 'var(--a)' }}>Stock</span>
        </h1>

        <p className="font-['Space_Grotesk',sans-serif] text-sm sm:text-base text-[var(--mu)] max-w-md mb-8">
          Neon, tape hiss and rain on the lens. Insert your tape to enter twenty-four film stocks in real time.
        </p>

        {/* 📼 Tokyo Night VHS Cassette Tape Graphic */}
        <div className="relative group w-full max-w-[430px] aspect-[16/10] bg-[#080b16] rounded-xl border-2 border-[rgba(120,220,255,0.22)] p-4 shadow-[0_30px_90px_-20px_rgba(0,0,0,0.95),inset_0_1px_2px_rgba(255,255,255,0.12)] mb-8 transition-transform duration-300 hover:scale-[1.02] hover:border-[var(--a)]">
          <div className="flex justify-between items-center px-4 py-1 border-b border-[rgba(120,220,255,0.12)] mb-3 font-['VT323',monospace] text-base text-[var(--mu)] tracking-widest">
            <span>VHS HQ · TOKYO NIGHT SPECIAL</span>
            <div className="flex gap-1.5">
              <span className="w-2.5 h-1.5 rounded-sm bg-[#22d3ee]" />
              <span className="w-2.5 h-1.5 rounded-sm bg-[#f0abfc]" />
            </div>
          </div>

          <div className="relative mx-auto w-[92%] h-[58%] rounded bg-gradient-to-b from-[#141d36] to-[#0a1020] text-[#e8f6ff] p-3 shadow-inner flex flex-col justify-between overflow-hidden border border-[rgba(120,220,255,0.25)]">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-['VT323',monospace] text-2xl font-bold tracking-wider text-[var(--a)] leading-none">
                  CINESTOCK // TAPE #88
                </p>
                <p className="font-mono text-[10px] text-[var(--mu)] tracking-widest uppercase mt-0.5">
                  TOKYO NIGHT · 24 ANALOG STOCKS
                </p>
              </div>
              <span className="font-['VT323',monospace] text-lg text-[var(--b)] font-bold">
                SP-CADENCE
              </span>
            </div>

            {/* Tape spools */}
            <div className="relative my-auto w-[82%] mx-auto h-12 bg-[#05070f] rounded border border-[#1b2648] flex items-center justify-around px-3 shadow-inner">
              <div className="relative w-8 h-8 rounded-full border-2 border-dashed border-[var(--a)]/60 flex items-center justify-center animate-spin" style={{ animationDuration: '4s' }}>
                <Disc className="w-5 h-5 text-[var(--a)]" />
              </div>
              <div className="h-2 w-16 bg-[#16223f] rounded border-t border-[#233560]" />
              <div className="relative w-8 h-8 rounded-full border-2 border-dashed border-[var(--b)]/60 flex items-center justify-center animate-spin" style={{ animationDuration: '3.6s' }}>
                <Disc className="w-5 h-5 text-[var(--b)]" />
              </div>
            </div>

            <div className="flex justify-between items-end text-[10px] font-['VT323',monospace] text-[var(--mu)] border-t border-[rgba(120,220,255,0.15)] pt-1 text-sm">
              <span>DATE: 1998-11-16</span>
              <span className="text-[var(--a)]">REC ONLINE</span>
              <span>INDEX: 088</span>
            </div>
          </div>

          <div className="mt-2.5 flex justify-between items-center px-6 font-['VT323',monospace] text-sm text-[var(--mu)] tracking-widest">
            <span className="w-5 h-2 rounded bg-[#10172e]" />
            <span>DOLBY B-NR · HI-FI STEREO</span>
            <span className="w-5 h-2 rounded bg-[#10172e]" />
          </div>
        </div>

        {/* Boot diagnostics in VT323 */}
        <div className="w-full max-w-md font-['VT323',monospace] text-base text-[var(--mu)] text-left bg-[#0b1020]/80 border border-[rgba(120,220,255,0.18)] rounded p-3 mb-6">
          <div className="flex items-center justify-between text-[var(--a)] mb-1">
            <span>&gt; DIAGNOSTICS:</span>
            <span>24/24 STOCKS LOADED</span>
          </div>
          {bootStep >= 1 && <div className="text-[#34d399]">&gt; CHROMATIC SMEAR &amp; CRT SCAN: OK</div>}
          {bootStep >= 2 && <div className="text-[var(--a)]">&gt; TOKYO RAIN &amp; NEON PRO-MIST: CALIBRATED</div>}
          {bootStep >= 3 && <div className="text-[var(--b)]">&gt; READY TO LOAD TAPE...</div>}
        </div>

        {/* Primary Action Button */}
        <div className="w-full max-w-md">
          <button
            type="button"
            onClick={handleInsertTape}
            disabled={inserting}
            className="btn pri big w-full justify-center text-base uppercase font-bold tracking-wider"
          >
            <Play className="w-4 h-4 fill-current mr-2" />
            <span>{inserting ? 'LOADING TAPE INTO DECK…' : 'LOAD A TAPE & OPEN LAB'}</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>
      </div>

      {inserting && (
        <div className="absolute inset-0 bg-[#22d3ee] z-40 animate-ping opacity-25 pointer-events-none" />
      )}
    </div>
  );
};
