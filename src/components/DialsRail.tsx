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

export const DialsRail: React.FC<DialsRailProps> = ({
  params,
  onChangeParam,
  osdEnabled,
  onToggleOsd,
  cinema24fps,
  onToggleCinema24fps,
  osdDate,
  onRandomizeDate,
}) => {
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

