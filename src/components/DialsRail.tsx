import React from 'react';
import type { ShaderParams } from '../types/lab';
import { retroAudio } from '../engine/audioSynthesizer';
import { Calendar } from 'lucide-react';

interface DialsRailProps {
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
  layout?: 'rail' | 'grid2';
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
  { key: 'fade', label: 'Matte fade & film tone', min: 0, max: 1, step: 0.01, thumbColor: '#fbbf24' },
  { key: 'warmth', label: 'Warmth & split tone', min: -1, max: 1, step: 0.01, thumbColor: '#fb7185' },
  { key: 'vignette', label: 'Optical vignette', min: 0, max: 1, step: 0.01, thumbColor: '#818cf8' },
];

export const DialsRail: React.FC<DialsRailProps> = ({
  params,
  onChangeParam,
  osdEnabled,
  onToggleOsd,
  cinema24fps,
  onToggleCinema24fps,
  osdDate,
  onRandomizeDate,
  layout = 'rail',
}) => {
  if (layout === 'grid2') {
    return (
      <div className="pn p-5 w-full">
        <h3 className="h3">Dials</h3>
        <p className="sub" style={{ marginBottom: '18px' }}>
          Every stock is only a starting point.
        </p>

        {/* 2-Column Grid of Dials */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-6">
          {DIALS.map((d) => {
            const val = params[d.key];
            return (
              <div key={d.key} className="sl mb-0">
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor={`g2-${d.key}`} className="text-xs font-medium text-white/90">
                    {d.label}
                  </label>
                  <output id={`og2-${d.key}`} className="text-xs font-mono text-[var(--mu)] tabular-nums">
                    {val.toFixed(2)}
                  </output>
                </div>
                <input
                  type="range"
                  id={`g2-${d.key}`}
                  min={d.min}
                  max={d.max}
                  step={d.step}
                  value={val}
                  style={{ ['--tc' as string]: d.thumbColor }}
                  onChange={(e) => onChangeParam(d.key, parseFloat(e.target.value))}
                  className="w-full h-2 rounded-lg bg-[var(--ln)] cursor-pointer"
                />
              </div>
            );
          })}
        </div>

        {/* Camcorder Deck Side-by-Side */}
        <div className="pt-4 border-t border-[var(--ln)]">
          <h3 className="h3">Camcorder deck</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
            <div className="tg mt-0 space-y-2.5">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={osdEnabled}
                  onChange={(e) => {
                    retroAudio.playCamcorderBeep();
                    onToggleOsd(e.target.checked);
                  }}
                  className="w-4 h-4 accent-[#f59e0b] rounded"
                />{' '}
                Date stamp and REC overlay
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={cinema24fps}
                  onChange={(e) => {
                    retroAudio.playClick();
                    onToggleCinema24fps(e.target.checked);
                  }}
                  className="w-4 h-4 accent-[#f59e0b] rounded"
                />{' '}
                24 fps cinema cadence
              </label>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-[var(--ln)]">
              <small className="font-mono text-xs text-[var(--mu)] flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#f59e0b]" />
                <span>Stamp date: {osdDate}</span>
              </small>
              <button
                type="button"
                onClick={onRandomizeDate}
                className="tag text-xs"
              >
                New date
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Standard vertical rail for Desktop and Tablet Landscape
  return (
    <aside className="pn rail">
      <div>
        <h3 className="h3">Dials</h3>
        <p className="sub" style={{ marginBottom: '18px' }}>
          Every stock is only a starting point.
        </p>

        <div id="sls">
          {DIALS.map((d) => {
            const val = params[d.key];
            return (
              <div key={d.key} className="sl">
                <div>
                  <label htmlFor={`s-${d.key}`}>{d.label}</label>
                  <output id={`o-${d.key}`}>{val.toFixed(2)}</output>
                </div>
                <input
                  type="range"
                  id={`s-${d.key}`}
                  min={d.min}
                  max={d.max}
                  step={d.step}
                  value={val}
                  style={{ ['--tc' as string]: d.thumbColor }}
                  onChange={(e) => onChangeParam(d.key, parseFloat(e.target.value))}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3 className="h3">Camcorder deck</h3>
        <div className="tg">
          <label>
            <input
              type="checkbox"
              id="t-osd"
              checked={osdEnabled}
              onChange={(e) => {
                retroAudio.playCamcorderBeep();
                onToggleOsd(e.target.checked);
              }}
            />{' '}
            Date stamp and REC overlay
          </label>
          <label>
            <input
              type="checkbox"
              id="t-24"
              checked={cinema24fps}
              onChange={(e) => {
                retroAudio.playClick();
                onToggleCinema24fps(e.target.checked);
              }}
            />{' '}
            24 fps cinema cadence
          </label>
        </div>

        <div className="row2" style={{ marginTop: '14px' }}>
          <small id="dt">Stamp date: {osdDate}</small>
          <button
            type="button"
            id="rd"
            onClick={onRandomizeDate}
            className="tag"
          >
            New date
          </button>
        </div>
      </div>
    </aside>
  );
};
