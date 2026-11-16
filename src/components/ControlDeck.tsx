import React, { useState } from 'react';
import {
  PRESETS,
  PRESET_CATEGORIES,
  PRESET_LIST,
  RETRO_DATES,
  type PresetCategory,
  type PresetKey,
  type ShaderParams,
} from '../types/lab';
import { retroAudio } from '../engine/audioSynthesizer';
import { Sparkles, Calendar } from 'lucide-react';

interface ControlDeckProps {
  activePreset: PresetKey;
  onSelectPreset: (key: PresetKey) => void;
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
  onChangeOsdDate: (date: string) => void;
  onRandomizeDate: () => void;
  onSurpriseStock: () => void;
}

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
  { key: 'fade', label: 'Matte fade & nostalgia', min: 0, max: 1, step: 0.01, thumbColor: '#fbbf24' },
  { key: 'warmth', label: 'Warmth & split tone', min: -1, max: 1, step: 0.01, thumbColor: '#fb7185' },
  { key: 'vignette', label: 'Optical vignette', min: 0, max: 1, step: 0.01, thumbColor: '#818cf8' },
];

export const ControlDeck: React.FC<ControlDeckProps> = ({
  activePreset,
  onSelectPreset,
  params,
  onChangeParam,
  osdEnabled,
  onToggleOsd,
  cinema24fps,
  onToggleCinema24fps,
  osdDate,
  onRandomizeDate,
  onSurpriseStock,
}) => {
  const [activeCategory, setActiveCategory] = useState<PresetCategory>('all');
  const currentStock = PRESETS[activePreset];

  const filteredPresets = PRESET_LIST.filter(
    (p) => activeCategory === 'all' || p.category === activeCategory
  );

  return (
    <aside className="pn side bg-[#16131f]/78 border border-[rgba(255,244,224,0.1)] rounded-[26px] p-[26px] backdrop-blur-[20px] shadow-[0_30px_80px_-24px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.06)] flex flex-col gap-[30px]">
      {/* 1. Film Stocks Section */}
      <div>
        <div className="flex items-baseline justify-between mb-1">
          <h3 className="font-['Cormorant_Garamond',serif] text-2xl font-medium text-[#faf5ee]">
            Film stocks
          </h3>
          <button
            type="button"
            onClick={onSurpriseStock}
            className="text-xs text-[#f59e0b] hover:text-[#faf5ee] transition-colors flex items-center gap-1 cursor-pointer"
            title="Randomize stock"
          >
            <Sparkles className="w-3 h-3" />
            <span>Surprise</span>
          </button>
        </div>

        <p id="sd" className="sub text-[#b5aba0] text-[13.5px] mb-4">
          {currentStock.label} · {currentStock.description}
        </p>

        {/* Category Filters */}
        <div className="cats flex gap-[7px] flex-wrap mb-4" id="cats">
          {PRESET_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => {
                retroAudio.playClick();
                setActiveCategory(cat.value);
              }}
              aria-pressed={activeCategory === cat.value}
              className={`tag border rounded-full px-3 py-1 text-xs font-medium cursor-pointer transition-all ${
                activeCategory === cat.value
                  ? 'bg-[#faf5ee] text-[#070609] border-[#faf5ee]'
                  : 'border-[rgba(255,244,224,0.1)] text-[#b5aba0] hover:text-[#faf5ee]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Preset Chips Grid */}
        <div className="chips grid grid-cols-2 gap-[9px] max-h-[360px] overflow-y-auto pr-1">
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
                  borderColor: isSelected ? p.accent : undefined,
                  backgroundColor: isSelected ? `${p.accent}20` : undefined,
                }}
                className="chip text-left border border-[rgba(255,244,224,0.1)] rounded-2xl p-3 cursor-pointer text-[#faf5ee] font-medium text-[13px] leading-[1.3] transition-all hover:-translate-y-0.5 hover:border-[rgba(255,244,224,0.3)]"
              >
                <i
                  className="block h-[5px] rounded-full mb-2.5"
                  style={{
                    backgroundImage: `linear-gradient(90deg, ${p.accent}, ${p.accentSecondary})`,
                  }}
                />
                <span className="block font-medium truncate">{p.label}</span>
                <small className="block text-[#b5aba0] font-normal text-[11.5px] mt-0.5 truncate">
                  {p.era}
                </small>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Dials Section */}
      <div>
        <h3 className="font-['Cormorant_Garamond',serif] text-2xl font-medium text-[#faf5ee] mb-1">
          Dials
        </h3>
        <p className="sub text-[#b5aba0] text-[13.5px] mb-4">
          Every stock is only a starting point.
        </p>

        <div id="sls" className="flex flex-col gap-3.5">
          {DIALS.map((d) => {
            const val = params[d.key];
            return (
              <div key={d.key} className="sl text-[13.5px]">
                <div className="flex justify-between mb-1.5">
                  <label htmlFor={`s-${d.key}`} className="text-[#faf5ee]">
                    {d.label}
                  </label>
                  <output id={`o-${d.key}`} className="text-[#b5aba0] font-mono tabular-nums">
                    {val.toFixed(2)}
                  </output>
                </div>
                <input
                  type="range"
                  id={`s-${d.key}`}
                  min={d.min}
                  max={d.max}
                  step={d.step}
                  value={val}
                  style={
                    {
                      '--thumb-color': d.thumbColor,
                    } as React.CSSProperties
                  }
                  onChange={(e) => onChangeParam(d.key, parseFloat(e.target.value))}
                  className="analog-range"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Camcorder Deck Section */}
      <div>
        <h3 className="font-['Cormorant_Garamond',serif] text-2xl font-medium text-[#faf5ee] mb-3">
          Camcorder deck
        </h3>

        <div className="tg flex flex-col gap-3 text-sm text-[#faf5ee] mb-4">
          <label className="flex gap-2.5 items-center cursor-pointer select-none">
            <input
              type="checkbox"
              id="t-osd"
              checked={osdEnabled}
              onChange={(e) => {
                retroAudio.playCamcorderBeep();
                onToggleOsd(e.target.checked);
              }}
              className="accent-[#f59e0b] w-[17px] h-[17px] rounded"
            />
            <span>Date stamp and REC overlay</span>
          </label>

          <label className="flex gap-2.5 items-center cursor-pointer select-none">
            <input
              type="checkbox"
              id="t-24"
              checked={cinema24fps}
              onChange={(e) => {
                retroAudio.playClick();
                onToggleCinema24fps(e.target.checked);
              }}
              className="accent-[#f59e0b] w-[17px] h-[17px] rounded"
            />
            <span>24 fps cinema cadence</span>
          </label>
        </div>

        <div className="row2 flex items-center gap-3 flex-wrap">
          <small id="dt" className="text-[#b5aba0] font-mono text-xs">
            Stamp date: {osdDate}
          </small>
          <button
            type="button"
            id="rd"
            onClick={onRandomizeDate}
            className="tag border border-[rgba(255,244,224,0.1)] rounded-full px-3 py-1 text-xs text-[#b5aba0] hover:text-[#faf5ee] transition-all cursor-pointer flex items-center gap-1"
          >
            <Calendar className="w-3 h-3" />
            <span>New date</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
