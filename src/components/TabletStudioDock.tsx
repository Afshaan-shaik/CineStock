import React from 'react';
import { Columns2, Sparkles, Download, Upload } from 'lucide-react';
import { retroAudio } from '../engine/audioSynthesizer';

interface TabletStudioDockProps {
  compareSplit: boolean;
  onToggleCompareSplit: () => void;
  onSurpriseStock: () => void;
  onAddFile: () => void;
  onExport: () => void;
  sourceType: string;
}

export const TabletStudioDock: React.FC<TabletStudioDockProps> = ({
  compareSplit,
  onToggleCompareSplit,
  onSurpriseStock,
  onAddFile,
  onExport,
  sourceType,
}) => {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 px-4 py-2.5 rounded-full bg-[#121722]/90 backdrop-blur-xl border border-[var(--ln)] shadow-[0_12px_40px_rgba(0,0,0,0.7)] flex items-center gap-3 select-none">
      <button
        type="button"
        onClick={() => {
          retroAudio.playClick();
          onToggleCompareSplit();
        }}
        aria-pressed={compareSplit}
        className={`px-3.5 py-2 rounded-full text-xs font-mono font-medium flex items-center gap-1.5 transition-all min-h-[44px] ${
          compareSplit
            ? 'bg-white/20 border border-[#f59e0b] text-white shadow-sm'
            : 'text-[var(--mu)] hover:text-white bg-transparent border border-transparent'
        }`}
      >
        <Columns2 className="w-3.5 h-3.5 text-[#f0abfc]" />
        <span>Before / After</span>
      </button>

      <button
        type="button"
        onClick={() => {
          retroAudio.playClick();
          onSurpriseStock();
        }}
        className="px-3.5 py-2 rounded-full text-xs font-mono font-medium text-[var(--a)] hover:text-white flex items-center gap-1.5 transition-all min-h-[44px]"
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span>Surprise</span>
      </button>

      <button
        type="button"
        onClick={() => {
          retroAudio.playClick();
          onAddFile();
        }}
        className="px-3.5 py-2 rounded-full text-xs font-mono font-medium text-[var(--mu)] hover:text-white flex items-center gap-1.5 transition-all min-h-[44px]"
      >
        <Upload className="w-3.5 h-3.5 text-[#22d3ee]" />
        <span>Upload</span>
      </button>

      <button
        type="button"
        onClick={() => {
          retroAudio.playClick();
          onExport();
        }}
        className="px-5 py-2 rounded-full text-xs font-mono font-bold tracking-wider uppercase text-black bg-gradient-to-r from-[#f59e0b] to-[#ef4444] shadow-[0_0_20px_rgba(245,158,11,0.4)] flex items-center gap-1.5 min-h-[44px] active:scale-95 transition-all"
      >
        <Download className="w-3.5 h-3.5 stroke-[2.5]" />
        <span>{sourceType === 'image' ? 'Export PNG' : 'Export'}</span>
      </button>
    </div>
  );
};
