import React, { useState } from 'react';
import {
  PRESETS,
  PRESET_CATEGORIES,
  PRESET_LIST,
  type PresetCategory,
  type PresetKey,
} from '../types/lab';
import { retroAudio } from '../engine/audioSynthesizer';
import { Sparkles, Check } from 'lucide-react';

interface StockRailProps {
  activePreset: PresetKey;
  onSelectPreset: (key: PresetKey) => void;
  onSurpriseStock: () => void;
  layout?: 'rail' | 'carousel' | 'auto';
}

export const StockRail: React.FC<StockRailProps> = ({
  activePreset,
  onSelectPreset,
  onSurpriseStock,
  layout = 'rail',
}) => {
  const [activeCategory, setActiveCategory] = useState<PresetCategory>('all');
  const currentStock = PRESETS[activePreset];

  const filteredPresets = PRESET_LIST.filter(
    (p) => activeCategory === 'all' || p.category === activeCategory
  );

  // If explicitly in carousel mode (e.g. for Tablet Portrait)
  if (layout === 'carousel') {
    return (
      <div className="pn p-4 sm:p-5 w-full">
        <div className="flex items-baseline justify-between mb-2">
          <div>
            <h3 className="h3">Film stocks</h3>
            <p className="sub text-xs text-[var(--mu)]">
              {currentStock.label} · {currentStock.description}
            </p>
          </div>
          <button
            type="button"
            onClick={onSurpriseStock}
            className="text-xs text-[var(--a)] hover:underline flex items-center gap-1 cursor-pointer font-['VT323',monospace] text-base shrink-0"
            title="Randomize stock"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>SURPRISE</span>
          </button>
        </div>

        {/* Category tags */}
        <div className="cats flex gap-2 overflow-x-auto pb-1 mb-3 scrollbar-none" style={{ touchAction: 'pan-x' }}>
          {PRESET_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => {
                retroAudio.playClick();
                setActiveCategory(cat.value);
              }}
              aria-pressed={activeCategory === cat.value}
              className="tag whitespace-nowrap min-h-[38px] px-3.5 shrink-0"
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Horizontal Carousel */}
        <div
          className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory"
          style={{ touchAction: 'pan-x' }}
        >
          {filteredPresets.map((p) => {
            const isSelected = p.key === activePreset;
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => {
                  retroAudio.playClick();
                  onSelectPreset(p.key);
                }}
                className={`snap-center shrink-0 w-[130px] h-[134px] rounded-2xl p-3 flex flex-col justify-between text-left border transition-all cursor-pointer relative overflow-hidden ${
                  isSelected
                    ? 'bg-[#1b1920] border-[#f59e0b] shadow-[0_0_20px_rgba(245,158,11,0.35)] scale-[1.02]'
                    : 'bg-[#101420] border-[var(--ln)] hover:border-white/30'
                }`}
              >
                <div
                  className="w-full h-1.5 rounded-full mb-2"
                  style={{
                    background: `linear-gradient(90deg, ${p.accent}, ${p.accentSecondary})`,
                  }}
                />

                {isSelected && (
                  <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-[#f59e0b] text-black flex items-center justify-center">
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
    );
  }

  // Standard vertical rail (for Desktop and Tablet Landscape)
  return (
    <aside className="pn rail">
      <div className="flex items-baseline justify-between mb-1">
        <h3 className="h3">Film stocks</h3>
        <button
          type="button"
          onClick={onSurpriseStock}
          className="text-xs text-[var(--a)] hover:underline flex items-center gap-1 cursor-pointer font-['VT323',monospace] text-base"
          title="Randomize stock"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>SURPRISE</span>
        </button>
      </div>

      <p className="sub" id="sd">
        {currentStock.label} · {currentStock.description}
      </p>

      {/* Category selector tags */}
      <div className="cats" id="cats">
        {PRESET_CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            type="button"
            onClick={() => {
              retroAudio.playClick();
              setActiveCategory(cat.value);
            }}
            aria-pressed={activeCategory === cat.value}
            className="tag"
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Preset Stock Chips in 1-column scrollable list on desktop */}
      <div className="chips" id="chips">
        {filteredPresets.map((p) => {
          const isSelected = p.key === activePreset;
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => {
                retroAudio.playClick();
                onSelectPreset(p.key);
              }}
              aria-pressed={isSelected}
              style={{
                ['--ca' as string]: p.accent,
              }}
              className="chip"
            >
              <i
                style={{
                  background: `linear-gradient(90deg, ${p.accent}, ${p.accentSecondary})`,
                }}
              />
              <span className="font-medium truncate block">{p.label}</span>
              <small className="truncate">{p.era}</small>
            </button>
          );
        })}
      </div>
    </aside>
  );
};
