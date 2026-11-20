import React, { useEffect, useRef, useState } from 'react';
import {
  PRESETS,
  PRESET_CATEGORIES,
  PRESET_LIST,
  ASPECT_OPTIONS,
  DEMO_REELS,
  type AspectRatioMode,
  type DemoMode,
  type PresetCategory,
  type PresetKey,
  type ShaderParams,
  type SourceType,
} from '../types/lab';
import { retroAudio } from '../engine/audioSynthesizer';
import {
  Sparkles,
  Sliders,
  Film,
  Crop,
  Download,
  Columns2,
  RotateCcw,
  Upload,
  Type,
  Shuffle,
  Calendar,
  ChevronUp,
  Check,
} from 'lucide-react';

interface MobileSnapSheetProps {
  activePreset: PresetKey;
  onSelectPreset: (key: PresetKey) => void;
  onSurpriseStock: () => void;
  params: ShaderParams;
  onChangeParam: (
    key: Exclude<keyof ShaderParams, 'tintShadow' | 'tintHighlight' | 'mono'>,
    value: number
  ) => void;
  osdEnabled: boolean;
  onToggleOsd: (enabled: boolean) => void;
  cinema24fps: boolean;
  onToggleCinema24fps: (enabled: boolean) => void;
  osdDate: string;
  onRandomizeDate: () => void;
  customCaption: string;
  onChangeCustomCaption: (text: string) => void;
  aspect: AspectRatioMode;
  onAspectChange: (aspect: AspectRatioMode) => void;
  demoMode: DemoMode;
  onSelectDemo: (mode: DemoMode) => void;
  sourceType: SourceType;
  compareSplit: boolean;
  onToggleCompareSplit: () => void;
  onReset: () => void;
  onExport: () => void;
  onAddFile: () => void;
  accentColor: string;
  accentSecondary: string;
}

type SnapPoint = 'peek' | 'half' | 'full';
type SheetTab = 'stocks' | 'dials' | 'frame' | 'export';

const DIALS: {
  key: Exclude<keyof ShaderParams, 'tintShadow' | 'tintHighlight' | 'mono'>;
  label: string;
  min: number;
  max: number;
  step: number;
  thumbColor: string;
}[] = [
  { key: 'bloom', label: 'Dream glow & pro-mist', min: 0, max: 1, step: 0.01, thumbColor: '#f472b6' },
  { key: 'chroma', label: 'Chroma bleed & RGB shift', min: 0, max: 1, step: 0.01, thumbColor: '#38bdf8' },
  { key: 'tracking', label: 'VHS tracking & gate weave', min: 0, max: 1, step: 0.01, thumbColor: '#f59e0b' },
  { key: 'grain', label: 'Analog grain & dust', min: 0, max: 1, step: 0.01, thumbColor: '#a78bfa' },
  { key: 'scanlines', label: 'CRT scanlines', min: 0, max: 1, step: 0.01, thumbColor: '#34d399' },
  { key: 'fade', label: 'Matte fade & film tone', min: 0, max: 1, step: 0.01, thumbColor: '#fbbf24' },
  { key: 'warmth', label: 'Warmth & split tone', min: -1, max: 1, step: 0.01, thumbColor: '#fb7185' },
  { key: 'vignette', label: 'Optical vignette', min: 0, max: 1, step: 0.01, thumbColor: '#818cf8' },
];

export const MobileSnapSheet: React.FC<MobileSnapSheetProps> = ({
  activePreset,
  onSelectPreset,
  onSurpriseStock,
  params,
  onChangeParam,
  osdEnabled,
  onToggleOsd,
  cinema24fps,
  onToggleCinema24fps,
  osdDate,
  onRandomizeDate,
  customCaption,
  onChangeCustomCaption,
  aspect,
  onAspectChange,
  demoMode,
  onSelectDemo,
  sourceType,
  compareSplit,
  onToggleCompareSplit,
  onReset,
  onExport,
  onAddFile,
  accentColor,
  accentSecondary,
}) => {
  const [snap, setSnap] = useState<SnapPoint>('peek');
  const [activeTab, setActiveTab] = useState<SheetTab>('stocks');
  const [activeCategory, setActiveCategory] = useState<PresetCategory>('all');
  const [hapticPulse, setHapticPulse] = useState(false);
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartYRef = useRef<number | null>(null);
  const dragCurrentYRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);

  const currentStock = PRESETS[activePreset];
  const filteredPresets = PRESET_LIST.filter(
    (p) => activeCategory === 'all' || p.category === activeCategory
  );

  // Keyboard avoidance on mobile devices using visualViewport
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const handleResize = () => {
      const vv = window.visualViewport;
      if (!vv) return;
      const offset = window.innerHeight - vv.height;
      setKeyboardOffset(offset > 50 ? offset : 0);
      if (offset > 50 && snap !== 'full') {
        setSnap('full');
      }
    };

    window.visualViewport.addEventListener('resize', handleResize);
    window.visualViewport.addEventListener('scroll', handleResize);

    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('scroll', handleResize);
    };
  }, [snap]);

  // Handle stock selection with micro-animation & sound
  const handleSelect = (key: PresetKey) => {
    retroAudio.playClick();
    onSelectPreset(key);
    setHapticPulse(true);
    setTimeout(() => setHapticPulse(false), 240);
  };

  // Drag handlers for grabber & header
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only drag from handle or header
    isDraggingRef.current = true;
    dragStartYRef.current = e.clientY;
    dragCurrentYRef.current = e.clientY;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || dragStartYRef.current === null) return;
    dragCurrentYRef.current = e.clientY;
    const deltaY = dragCurrentYRef.current - dragStartYRef.current;

    // Apply direct translation for 60fps tracking
    if (sheetRef.current) {
      sheetRef.current.style.transition = 'none';
      sheetRef.current.style.transform = `translateY(${Math.max(-20, deltaY)}px)`;
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || dragStartYRef.current === null || dragCurrentYRef.current === null) {
      isDraggingRef.current = false;
      return;
    }

    const deltaY = dragCurrentYRef.current - dragStartYRef.current;
    isDraggingRef.current = false;
    dragStartYRef.current = null;
    dragCurrentYRef.current = null;

    if (sheetRef.current) {
      sheetRef.current.style.transition = '';
      sheetRef.current.style.transform = '';
    }

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Safe release
    }

    // Determine snap transition based on drag direction and magnitude
    if (deltaY < -40) {
      // Dragged up
      if (snap === 'peek') setSnap('half');
      else if (snap === 'half') setSnap('full');
    } else if (deltaY > 40) {
      // Dragged down
      if (snap === 'full') setSnap('half');
      else if (snap === 'half') setSnap('peek');
    }
  };

  // Height styles per snap point
  const getSnapHeight = () => {
    switch (snap) {
      case 'peek':
        return '150px';
      case 'half':
        return '54dvh';
      case 'full':
        return '90dvh';
    }
  };

  const handleTabClick = (tab: SheetTab) => {
    retroAudio.playClick();
    setActiveTab(tab);
    // If sheet is in peek mode, expand to half so user can view tab content
    if (snap === 'peek') {
      setSnap('half');
    }
  };

  return (
    <>
      {/* Full Sheet Backdrop Dim Overlay */}
      {snap === 'full' && (
        <div
          onClick={() => setSnap('half')}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 pointer-events-auto"
          aria-hidden="true"
        />
      )}

      {/* Snap Sheet Container */}
      <section
        ref={sheetRef}
        aria-label="CineStock Controls Sheet"
        className="mobile-snap-sheet fixed left-0 right-0 z-50 rounded-t-3xl border-t border-[var(--ln)] bg-[#0d121f]/95 backdrop-blur-xl shadow-[0_-12px_40px_rgba(0,0,0,0.85)] flex flex-col will-change-transform"
        style={{
          bottom: `${keyboardOffset}px`,
          height: getSnapHeight(),
          paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
          transition: isDraggingRef.current ? 'none' : 'height 0.32s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
      >
        {/* Grabber Handle & Drag Zone */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="sheet-drag-handle w-full pt-3 pb-2 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing select-none shrink-0"
        >
          <div className="w-10 h-1.5 rounded-full bg-white/25 hover:bg-white/40 transition-colors" />
        </div>

        {/* Tab Navigation Header */}
        <div
          role="tablist"
          className="sheet-tabs px-3 flex items-center justify-between gap-1.5 border-b border-[var(--ln)] pb-2.5 shrink-0 select-none"
        >
          {[
            { id: 'stocks' as SheetTab, label: 'Stocks', icon: Film },
            { id: 'dials' as SheetTab, label: 'Dials', icon: Sliders },
            { id: 'frame' as SheetTab, label: 'Frame', icon: Crop },
            { id: 'export' as SheetTab, label: 'Export', icon: Download },
          ].map((t) => {
            const Icon = t.icon;
            const isTabActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                role="tab"
                type="button"
                aria-selected={isTabActive}
                onClick={() => handleTabClick(t.id)}
                className={`flex-1 py-2 px-1 rounded-xl text-xs font-['Space_Mono',monospace] font-bold tracking-wider flex items-center justify-center gap-1.5 transition-all min-h-[44px] cursor-pointer ${
                  isTabActive
                    ? 'bg-gradient-to-r from-[#f59e0b]/20 to-[#ef4444]/20 text-[#eaf3ff] border border-[#f59e0b]/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                    : 'text-[var(--mu)] hover:text-white bg-transparent border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isTabActive ? 'text-[#f59e0b]' : 'text-[var(--mu)]'}`} />
                <span>{t.label}</span>
              </button>
            );
          })}

          {/* Quick Snap Expand / Collapse Button */}
          <button
            type="button"
            onClick={() => {
              retroAudio.playClick();
              setSnap((prev) => (prev === 'peek' ? 'half' : prev === 'half' ? 'full' : 'peek'));
            }}
            className="w-10 h-10 rounded-xl bg-white/5 border border-[var(--ln)] flex items-center justify-center text-[var(--mu)] hover:text-white shrink-0 cursor-pointer"
            aria-label={`Toggle sheet height. Current: ${snap}`}
          >
            <ChevronUp
              className={`w-4 h-4 transition-transform duration-300 ${
                snap === 'full' ? 'rotate-180' : snap === 'half' ? 'rotate-0' : '-rotate-90'
              }`}
            />
          </button>
        </div>

        {/* Peek Quick Row (Shown when in Peek Mode) */}
        {snap === 'peek' && (
          <div className="px-4 py-3 flex items-center justify-between gap-3 overflow-hidden animate-fadeIn">
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                style={{
                  background: `linear-gradient(135deg, ${currentStock.accent}, ${currentStock.accentSecondary})`,
                }}
              />
              <div className="truncate">
                <span className="text-xs font-bold text-white truncate block">
                  {currentStock.label}
                </span>
                <span className="text-[10px] text-[var(--mu)] font-mono truncate block">
                  {currentStock.era}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onSurpriseStock}
                className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-[var(--ln)] text-xs text-[var(--a)] font-mono flex items-center gap-1 active:scale-95"
              >
                <Sparkles className="w-3 h-3" />
                <span>RANDOM</span>
              </button>
              <button
                type="button"
                onClick={() => setSnap('half')}
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#f59e0b] to-[#ef4444] text-black font-bold text-xs uppercase tracking-wider active:scale-95 shadow-sm"
              >
                OPEN
              </button>
            </div>
          </div>
        )}

        {/* Scrollable Tab Panels (Shown when Half or Full) */}
        {snap !== 'peek' && (
          <div
            className="sheet-body flex-1 overflow-y-auto px-4 py-3 overscroll-contain select-none"
            style={{
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-y',
            }}
          >
            {/* TAB 1: STOCKS */}
            {activeTab === 'stocks' && (
              <div className="space-y-4">
                {/* Active stock banner */}
                <div className="flex items-center justify-between bg-black/40 border border-[var(--ln)] p-3 rounded-xl">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{currentStock.label}</span>
                      <span className="text-[10px] font-mono font-normal text-[var(--mu)] px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
                        {currentStock.era}
                      </span>
                    </h4>
                    <p className="text-xs text-[var(--mu)] mt-0.5 line-clamp-1">
                      {currentStock.description}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onSurpriseStock}
                    className="p-2 rounded-xl bg-gradient-to-r from-[#f59e0b]/20 to-[#ef4444]/20 border border-[#f59e0b]/40 text-[#f59e0b] hover:text-white shrink-0 active:scale-95"
                    title="Randomize film stock"
                  >
                    <Sparkles className="w-4 h-4" />
                  </button>
                </div>

                {/* Horizontal Category Chips */}
                <div
                  className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none"
                  style={{ touchAction: 'pan-x' }}
                >
                  {PRESET_CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => {
                        retroAudio.playClick();
                        setActiveCategory(cat.value);
                      }}
                      className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium border min-h-[36px] transition-all shrink-0 ${
                        activeCategory === cat.value
                          ? 'bg-white text-black border-white font-bold'
                          : 'bg-white/5 text-[var(--mu)] border-white/10 hover:border-white/25'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Horizontal Canister Cards Carousel */}
                <div
                  className={`flex gap-3 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-none snap-x snap-mandatory ${
                    hapticPulse ? 'scale-[1.01]' : ''
                  }`}
                  style={{ touchAction: 'pan-x' }}
                >
                  {filteredPresets.map((p) => {
                    const isSelected = p.key === activePreset;
                    return (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => handleSelect(p.key)}
                        className={`canister-card snap-center shrink-0 w-[124px] h-[132px] rounded-2xl p-3 flex flex-col justify-between text-left border transition-all cursor-pointer relative overflow-hidden ${
                          isSelected
                            ? 'bg-[#1b1920] border-[#f59e0b] shadow-[0_0_20px_rgba(245,158,11,0.35)] scale-[1.03]'
                            : 'bg-[#101420] border-[var(--ln)] hover:border-white/30'
                        }`}
                      >
                        {/* Film accent stripe */}
                        <div
                          className="w-full h-1.5 rounded-full mb-2"
                          style={{
                            background: `linear-gradient(90deg, ${p.accent}, ${p.accentSecondary})`,
                          }}
                        />

                        {isSelected && (
                          <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#f59e0b] text-black flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}

                        <div>
                          <b className="text-xs font-bold text-white block leading-tight truncate">
                            {p.label}
                          </b>
                          <small className="text-[10px] text-[var(--mu)] font-mono block mt-1 truncate">
                            {p.era}
                          </small>
                        </div>

                        <div className="mt-auto">
                          <span className="text-[9px] uppercase font-mono tracking-wider text-[var(--mu)]">
                            {p.category}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: DIALS & CAMCORDER DECK */}
            {activeTab === 'dials' && (
              <div className="space-y-5">
                {/* Dials List */}
                <div className="space-y-4">
                  {DIALS.map((d) => {
                    const val = params[d.key];
                    return (
                      <div key={d.key} className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <label htmlFor={`ms-${d.key}`} className="font-medium text-white/90">
                            {d.label}
                          </label>
                          <output
                            htmlFor={`ms-${d.key}`}
                            className="font-mono text-[var(--mu)] tabular-nums"
                          >
                            {val.toFixed(2)}
                          </output>
                        </div>
                        <div className="py-1">
                          <input
                            type="range"
                            id={`ms-${d.key}`}
                            min={d.min}
                            max={d.max}
                            step={d.step}
                            value={val}
                            style={{ ['--tc' as string]: d.thumbColor }}
                            onChange={(e) => onChangeParam(d.key, parseFloat(e.target.value))}
                            className="w-full h-2 rounded-lg bg-[var(--ln)] cursor-pointer"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Camcorder Deck Toggles */}
                <div className="pt-4 border-t border-[var(--ln)] space-y-3">
                  <h4 className="text-xs font-mono uppercase tracking-widest text-[#f59e0b] font-bold">
                    Camcorder Deck
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <label className="flex items-center gap-3 p-3 rounded-xl bg-black/40 border border-[var(--ln)] cursor-pointer min-h-[44px]">
                      <input
                        type="checkbox"
                        checked={osdEnabled}
                        onChange={(e) => {
                          retroAudio.playCamcorderBeep();
                          onToggleOsd(e.target.checked);
                        }}
                        className="w-5 h-5 accent-[#f59e0b] rounded"
                      />
                      <span className="text-xs text-white">Date &amp; REC stamp</span>
                    </label>

                    <label className="flex items-center gap-3 p-3 rounded-xl bg-black/40 border border-[var(--ln)] cursor-pointer min-h-[44px]">
                      <input
                        type="checkbox"
                        checked={cinema24fps}
                        onChange={(e) => {
                          retroAudio.playClick();
                          onToggleCinema24fps(e.target.checked);
                        }}
                        className="w-5 h-5 accent-[#f59e0b] rounded"
                      />
                      <span className="text-xs text-white">24 fps cinema cadence</span>
                    </label>
                  </div>

                  {/* Stamp Date with Randomizer */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-[var(--ln)]">
                    <div className="flex items-center gap-2 text-xs font-mono text-[var(--mu)]">
                      <Calendar className="w-4 h-4 text-[#f59e0b]" />
                      <span>DATE: {osdDate}</span>
                    </div>
                    <button
                      type="button"
                      onClick={onRandomizeDate}
                      className="px-3 py-1.5 rounded-lg bg-white/5 border border-[var(--ln)] text-xs text-white hover:border-[#f59e0b] min-h-[36px]"
                    >
                      New date
                    </button>
                  </div>

                  {/* Custom OSD Typo Input */}
                  <div className="p-3 rounded-xl bg-black/40 border border-[var(--ln)] space-y-2">
                    <label htmlFor="ms-typo" className="text-xs font-mono text-[#f59e0b] block">
                      CUSTOM OSD TITLE:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        id="ms-typo"
                        value={customCaption}
                        maxLength={26}
                        onChange={(e) => onChangeCustomCaption(e.target.value)}
                        placeholder="CUSTOM TITLE..."
                        className="flex-1 bg-black/60 border border-[var(--ln)] rounded-lg px-3 py-2 text-sm font-['VT323',monospace] text-white outline-none focus:border-[#f59e0b] min-h-[40px]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          retroAudio.playClick();
                          const captions = [
                            "TOKYO '98",
                            "NEON DREAMS",
                            "SHIBUYA RAIN",
                            "LOST IN TAPE",
                            "MIDNIGHT RUN",
                            "ROPPONGI 3AM",
                            "CYBER VAPOR",
                          ];
                          const other = captions.filter((c) => c !== customCaption);
                          onChangeCustomCaption(
                            other[Math.floor(Math.random() * other.length)] || captions[0]
                          );
                        }}
                        className="px-3 py-2 rounded-lg bg-white/5 border border-[var(--ln)] text-xs font-mono text-white flex items-center gap-1 hover:border-[#f59e0b] min-h-[40px]"
                      >
                        <Shuffle className="w-3.5 h-3.5" />
                        <span>Random</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: FRAME & DEMOS */}
            {activeTab === 'frame' && (
              <div className="space-y-5">
                {/* Aspect Ratios */}
                <div>
                  <h4 className="text-xs font-mono uppercase tracking-widest text-[#f59e0b] font-bold mb-3">
                    Aspect Ratio
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {ASPECT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          retroAudio.playClick();
                          onAspectChange(opt.value);
                        }}
                        className={`p-3 rounded-xl border text-xs font-mono font-bold flex items-center justify-center min-h-[44px] transition-all ${
                          aspect === opt.value
                            ? 'bg-white text-black border-white shadow-sm'
                            : 'bg-black/40 text-[var(--mu)] border-[var(--ln)] hover:border-white/30'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Demo Scene Reels */}
                <div>
                  <h4 className="text-xs font-mono uppercase tracking-widest text-[#f59e0b] font-bold mb-3">
                    Demo Video Scenes
                  </h4>
                  <div className="space-y-2">
                    {DEMO_REELS.map((dm) => (
                      <button
                        key={dm.key}
                        type="button"
                        onClick={() => {
                          retroAudio.playClick();
                          onSelectDemo(dm.key);
                        }}
                        className={`w-full p-3 rounded-xl border text-left flex items-center justify-between min-h-[50px] transition-all ${
                          sourceType === 'video' && demoMode === dm.key
                            ? 'bg-[#1b1920] border-[#f59e0b] shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                            : 'bg-black/40 border-[var(--ln)] hover:border-white/20'
                        }`}
                      >
                        <div>
                          <b className="text-xs text-white block">{dm.label}</b>
                          <small className="text-[11px] text-[var(--mu)] block mt-0.5">
                            {dm.desc}
                          </small>
                        </div>
                        {sourceType === 'video' && demoMode === dm.key && (
                          <span className="w-2 h-2 rounded-full bg-[#f59e0b] animate-ping" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: EXPORT & TOOLS */}
            {activeTab === 'export' && (
              <div className="space-y-4">
                {/* Primary Export CTA */}
                <button
                  type="button"
                  onClick={() => {
                    retroAudio.playClick();
                    onExport();
                  }}
                  className="w-full py-4 rounded-2xl font-['Space_Mono',monospace] font-bold text-sm tracking-wider uppercase text-black bg-gradient-to-r from-[#f59e0b] to-[#ef4444] shadow-[0_0_35px_rgba(245,158,11,0.5)] flex items-center justify-center gap-2 min-h-[54px] active:scale-[0.98] transition-transform"
                >
                  <Download className="w-4 h-4 stroke-[2.5]" />
                  <span>{sourceType === 'image' ? 'Export PNG Frame' : 'Export Reel (Video)'}</span>
                </button>

                {/* Secondary Quick Action Buttons */}
                <div className="grid grid-cols-2 gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      retroAudio.playClick();
                      onToggleCompareSplit();
                    }}
                    className={`p-3 rounded-xl border text-xs font-mono font-medium flex items-center justify-center gap-2 min-h-[46px] ${
                      compareSplit
                        ? 'bg-white/20 border-[#f59e0b] text-white'
                        : 'bg-black/40 border-[var(--ln)] text-[var(--mu)]'
                    }`}
                  >
                    <Columns2 className="w-4 h-4 text-[#f0abfc]" />
                    <span>Before / After</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      retroAudio.playClick();
                      onReset();
                    }}
                    className="p-3 rounded-xl bg-black/40 border border-[var(--ln)] text-xs font-mono font-medium text-[var(--mu)] hover:text-white flex items-center justify-center gap-2 min-h-[46px]"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Reset Dials</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      retroAudio.playClick();
                      onAddFile();
                    }}
                    className="col-span-2 p-3.5 rounded-xl bg-black/40 border border-[var(--ln)] text-xs font-mono font-medium text-white hover:border-[#22d3ee] flex items-center justify-center gap-2 min-h-[48px]"
                  >
                    <Upload className="w-4 h-4 text-[#22d3ee]" />
                    <span>Upload your own Video or Photo</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </>
  );
};
