import React, { useState } from 'react';
import {
  PRESETS,
  PRESET_CATEGORIES,
  PRESET_LIST,
  type PresetCategory,
  type PresetKey,
} from '../types/lab';
import { retroAudio } from '../engine/audioSynthesizer';
import { Sparkles } from 'lucide-react';

interface StockRailProps {
  activePreset: PresetKey;
  onSelectPreset: (key: PresetKey) => void;
  onSurpriseStock: () => void;
}

export const StockRail: React.FC<StockRailProps> = ({
  activePreset,
  onSelectPreset,
  onSurpriseStock,
}) => {
  const [activeCategory, setActiveCategory] = useState<PresetCategory>('all');
  const currentStock = PRESETS[activePreset];

  const filteredPresets = PRESET_LIST.filter(
    (p) => activeCategory === 'all' || p.category === activeCategory
  );

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

