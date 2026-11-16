import React from 'react';
import { Download } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  isComplete: boolean;
  progress: number;
  statusText: string;
  errorText: string | null;
  downloadUrl: string | null;
  downloadFilename: string;
  onCloseOrCancel: () => void;
  accentColor?: string;
  secondaryColor?: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  isComplete,
  progress,
  statusText,
  errorText,
  downloadUrl,
  downloadFilename,
  onCloseOrCancel,
  accentColor = '#f59e0b',
  secondaryColor = '#ec4899',
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="modal on fixed inset-0 z-50 bg-[rgba(5,3,10,0.85)] backdrop-blur-md grid place-items-center p-6"
      role="dialog"
      aria-modal="true"
    >
      <div className="pn max-w-[460px] w-full p-8 text-center bg-[#0e0c13] border border-[rgba(255,244,224,0.12)] rounded-[26px] shadow-[0_30px_90px_-20px_rgba(0,0,0,0.9)]">
        <h3 className="font-['Cormorant_Garamond',serif] text-3xl font-medium text-[#faf5ee] mb-2">
          {errorText
            ? 'Encoding halted'
            : isComplete
              ? 'Your reel is ready'
              : 'Encoding your reel'}
        </h3>

        <p className="text-sm text-[#b5aba0] mb-6">
          {errorText || statusText || 'Initializing encoder…'}
        </p>

        {!errorText && (
          <div className="pg h-1 bg-[rgba(255,244,224,0.1)] rounded-full overflow-hidden mb-6">
            <div
              className="h-full transition-all duration-150"
              style={{
                width: `${progress}%`,
                backgroundImage: `linear-gradient(90deg, ${accentColor}, ${secondaryColor})`,
              }}
            />
          </div>
        )}

        <div className="flex gap-3 justify-center">
          {isComplete && downloadUrl && (
            <a
              href={downloadUrl}
              download={downloadFilename}
              className="btn pri inline-flex items-center gap-2 py-3 px-6 rounded-xl font-medium text-xs text-[#070609] transition-all cursor-pointer"
              style={{
                backgroundImage: `linear-gradient(135deg, ${accentColor}, ${secondaryColor})`,
                boxShadow: `0 8px 25px -6px ${accentColor}`,
              }}
            >
              <Download className="w-4 h-4" />
              Download Reel
            </a>
          )}
          <button
            type="button"
            onClick={onCloseOrCancel}
            className="btn py-3 px-5 rounded-xl border border-[rgba(255,244,224,0.12)] bg-[#16131f] text-xs font-medium text-[#faf5ee] hover:border-[#f59e0b] transition-all cursor-pointer"
          >
            {isComplete || errorText ? 'Close' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
};
