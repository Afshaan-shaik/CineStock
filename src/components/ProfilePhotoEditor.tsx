import React, { useEffect, useRef, useState } from 'react';
import {
  Upload,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Minimize2,
  RotateCcw,
  Check,
  X,
  Circle,
  Square,
  AlertCircle,
  Eye,
} from 'lucide-react';

interface ProfilePhotoEditorProps {
  currentImageUrl: string;
  initialDisplayMode: 'round' | 'square';
  ownerToken: string;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (updatedProfile: any) => void;
}

export const ProfilePhotoEditor: React.FC<ProfilePhotoEditorProps> = ({
  currentImageUrl,
  initialDisplayMode,
  ownerToken,
  isOpen,
  onClose,
  onSaved,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const tempObjectUrlRef = useRef<string | null>(null);

  // Image and transform state
  const [imageSrc, setImageSrc] = useState<string>(currentImageUrl);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number }>({
    width: 400,
    height: 400,
  });
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0); // degrees (0, 90, 180, 270)
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [displayMode, setDisplayMode] = useState<'round' | 'square'>(initialDisplayMode);

  // UI state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<boolean>(false);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (tempObjectUrlRef.current) {
        URL.revokeObjectURL(tempObjectUrlRef.current);
        tempObjectUrlRef.current = null;
      }
    };
  }, []);

  // When currentImageUrl or initialDisplayMode changes
  useEffect(() => {
    setImageSrc(currentImageUrl);
    setDisplayMode(initialDisplayMode);
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
    setErrorMsg(null);
  }, [currentImageUrl, initialDisplayMode, isOpen]);

  // Read natural image dimensions whenever source changes
  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setNaturalSize({ width: img.naturalWidth || 400, height: img.naturalHeight || 400 });
    };
    img.src = imageSrc;
  }, [imageSrc]);

  if (!isOpen) return null;

  // Handle local file selection (Desktop, iOS, Android, tablets)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);

    // Validate image format
    const validTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/avif',
      'image/heic',
      'image/heif',
      'image/svg+xml',
    ];
    const isImage = validTypes.includes(file.type) || file.name.match(/\.(jpg|jpeg|png|webp|avif|heic|heif|svg)$/i);

    if (!isImage) {
      setErrorMsg('Please select a valid image file (JPG, PNG, WebP, AVIF, HEIC, etc.)');
      return;
    }

    // Revoke previous temp URL
    if (tempObjectUrlRef.current) {
      URL.revokeObjectURL(tempObjectUrlRef.current);
      tempObjectUrlRef.current = null;
    }

    // Create fresh object URL
    const objectUrl = URL.createObjectURL(file);
    tempObjectUrlRef.current = objectUrl;
    setImageSrc(objectUrl);

    // Reset view transforms for newly selected photo
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  };

  // Drag / pan reposition handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {
      // Ignored
    }
  };

  // Tool 5: Rotate 90 degrees clockwise
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Tool 6: Fit whole photo inside frame
  const handleFit = () => {
    const frameSize = 280;
    const isRotated90or270 = rotation % 180 !== 0;
    const w = isRotated90or270 ? naturalSize.height : naturalSize.width;
    const h = isRotated90or270 ? naturalSize.width : naturalSize.height;
    const scale = Math.min(frameSize / w, frameSize / h);
    setZoom(Math.max(0.4, Math.min(3.0, scale * (w / frameSize))));
    setPan({ x: 0, y: 0 });
  };

  // Tool 7: Fill frame without black borders
  const handleFill = () => {
    const frameSize = 280;
    const isRotated90or270 = rotation % 180 !== 0;
    const w = isRotated90or270 ? naturalSize.height : naturalSize.width;
    const h = isRotated90or270 ? naturalSize.width : naturalSize.height;
    const scale = Math.max(frameSize / w, frameSize / h);
    setZoom(Math.max(0.8, Math.min(3.0, scale * (w / frameSize))));
    setPan({ x: 0, y: 0 });
  };

  // Tool 8: Reset to defaults
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  };

  // Tool 10: Save Changes to persistent server storage
  const handleSaveChanges = async () => {
    setIsSaving(true);
    setErrorMsg(null);

    try {
      // Render the final photo onto a 600x600 high-res offscreen canvas
      const canvas = document.createElement('canvas');
      const exportDim = 600;
      canvas.width = exportDim;
      canvas.height = exportDim;
      const ctx = canvas.getContext('2d');

      if (!ctx) throw new Error('Could not initialize rendering context');

      // Create Image from current source
      const img = new Image();
      img.crossOrigin = 'anonymous';

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image for rendering'));
        img.src = imageSrc;
      });

      // Clear & fill dark background
      ctx.fillStyle = '#090a10';
      ctx.fillRect(0, 0, exportDim, exportDim);

      // Translate to center
      ctx.save();
      ctx.translate(exportDim / 2, exportDim / 2);

      // Pan & Zoom
      // Scale pan from viewport size (280px) to export size (600px)
      const scaleFactor = exportDim / 280;
      ctx.translate(pan.x * scaleFactor, pan.y * scaleFactor);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(zoom, zoom);

      // Draw image centered
      const drawW = exportDim;
      const drawH = (img.naturalHeight / img.naturalWidth) * exportDim;
      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      // Convert to optimized WebP (or PNG fallback)
      const optimizedDataUrl = canvas.toDataURL('image/webp', 0.92);

      const updatedProfile = {
        imageUrl: optimizedDataUrl,
        displayMode: displayMode,
      };

      // Persist across browser sessions and refreshes
      try {
        localStorage.setItem('cinestock_published_profile', JSON.stringify(updatedProfile));
      } catch (storageErr) {
        console.warn('Storage limit warning:', storageErr);
      }

      // Revoke temp object URL
      if (tempObjectUrlRef.current) {
        URL.revokeObjectURL(tempObjectUrlRef.current);
        tempObjectUrlRef.current = null;
      }

      // Notify parent AboutModal of updated profile
      onSaved(updatedProfile);
      onClose();
    } catch (err: any) {
      console.error('Save failed:', err);
      setErrorMsg(err.message || 'Failed to save photo. Check network or server configuration.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (tempObjectUrlRef.current) {
      URL.revokeObjectURL(tempObjectUrlRef.current);
      tempObjectUrlRef.current = null;
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] bg-[#05060d]/90 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6 overflow-y-auto select-none">
      <div className="relative w-full max-w-lg bg-[#0e121d] border border-[rgba(120,220,255,0.22)] rounded-2xl shadow-[0_24px_70px_rgba(0,0,0,0.85)] p-4 sm:p-6 text-[#eaf4ff] overflow-hidden my-auto">
        {/* Subtle Tokyo Night Grid Header Accent */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[rgba(120,220,255,0.12)]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--a)] animate-pulse" />
            <h3 className="font-['Space_Grotesk',sans-serif] font-bold text-base sm:text-lg tracking-wider text-white">
              PROFILE PHOTO EDITOR
            </h3>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--mu)] hover:text-white hover:bg-white/10 transition-colors"
            title="Cancel and close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error notification banner */}
        {errorMsg && (
          <div className="mb-4 p-2.5 rounded-lg bg-red-500/15 border border-red-500/40 text-red-300 text-xs flex items-center gap-2 font-mono">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Upper Action: File Upload Button */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.heic,.heif,.jpg,.jpeg,.png,.webp,.avif"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 min-h-[40px] px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#f5a623] to-[#ef4444] text-[#090a10] font-['Space_Mono',monospace] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.98] transition-all shadow-md shadow-amber-500/10"
          >
            <Upload className="w-4 h-4" />
            <span>Upload New Photo</span>
          </button>

          {/* Display Mode: Round vs Square */}
          <div className="flex items-center gap-1 bg-[#141926] p-1 rounded-xl border border-[rgba(120,220,255,0.1)]">
            <button
              type="button"
              onClick={() => setDisplayMode('round')}
              className={`p-1.5 rounded-lg transition-all ${
                displayMode === 'round'
                  ? 'bg-[var(--a)] text-[#090a10]'
                  : 'text-[var(--mu)] hover:text-white'
              }`}
              title="Circular portrait"
            >
              <Circle className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setDisplayMode('square')}
              className={`p-1.5 rounded-lg transition-all ${
                displayMode === 'square'
                  ? 'bg-[var(--a)] text-[#090a10]'
                  : 'text-[var(--mu)] hover:text-white'
              }`}
              title="Rounded-square portrait"
            >
              <Square className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Interactive Viewport Frame (280x280px) */}
        <div className="relative flex justify-center items-center my-3">
          <div
            ref={containerRef}
            className={`relative w-[280px] h-[280px] bg-[#090a10] border-2 border-[var(--a)] shadow-[0_0_30px_rgba(245,166,35,0.2)] overflow-hidden cursor-grab active:cursor-grabbing touch-none select-none transition-all ${
              displayMode === 'round' ? 'rounded-full' : 'rounded-3xl'
            }`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            {/* The draggable, scaled, rotated image */}
            <img
              src={imageSrc}
              alt="Profile crop target"
              draggable={false}
              className="absolute pointer-events-none select-none max-w-none transition-transform duration-75"
              style={{
                width: '100%',
                height: 'auto',
                left: '50%',
                top: '50%',
                transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) rotate(${rotation}deg) scale(${zoom})`,
                transformOrigin: 'center center',
              }}
            />

            {/* Subtle Alignment Crosshair (dimmed) */}
            <div className="absolute inset-0 pointer-events-none border border-white/10 opacity-30">
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/20 -translate-x-1/2" />
              <div className="absolute top-1/2 left-0 right-0 h-px bg-white/20 -translate-y-1/2" />
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] font-mono text-[var(--mu)] mb-3">
          Drag to reposition · Scroll or slide to zoom
        </p>

        {/* Toolbar: Zoom Controls */}
        <div className="bg-[#141926]/90 border border-[rgba(120,220,255,0.12)] rounded-xl p-3 mb-4 flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-xs font-mono text-[var(--mu)]">
            <span className="flex items-center gap-1.5">
              <ZoomIn className="w-3.5 h-3.5 text-[var(--a)]" />
              <span>ZOOM: {Math.round(zoom * 100)}%</span>
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.4, Number((z - 0.1).toFixed(2))))}
                className="w-6 h-6 rounded flex items-center justify-center bg-white/5 hover:bg-white/15 text-white text-xs font-bold"
                title="Zoom Out"
              >
                -
              </button>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(3.0, Number((z + 0.1).toFixed(2))))}
                className="w-6 h-6 rounded flex items-center justify-center bg-white/5 hover:bg-white/15 text-white text-xs font-bold"
                title="Zoom In"
              >
                +
              </button>
            </div>
          </div>

          <input
            type="range"
            min="0.4"
            max="3.0"
            step="0.05"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="w-full accent-[var(--a)] cursor-pointer"
          />

          {/* Action Tools: Rotate, Fit, Fill, Reset */}
          <div className="grid grid-cols-4 gap-1.5 pt-1 text-[11px] font-mono">
            <button
              type="button"
              onClick={handleRotate}
              className="py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/15 flex flex-col items-center gap-1 transition-colors"
              title="Rotate 90 degrees"
            >
              <RotateCw className="w-3.5 h-3.5 text-[var(--a)]" />
              <span>Rotate</span>
            </button>
            <button
              type="button"
              onClick={handleFit}
              className="py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/15 flex flex-col items-center gap-1 transition-colors"
              title="Fit whole photo"
            >
              <Minimize2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Fit</span>
            </button>
            <button
              type="button"
              onClick={handleFill}
              className="py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/15 flex flex-col items-center gap-1 transition-colors"
              title="Fill frame"
            >
              <Maximize2 className="w-3.5 h-3.5 text-purple-400" />
              <span>Fill</span>
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/15 flex flex-col items-center gap-1 transition-colors"
              title="Reset view"
            >
              <RotateCcw className="w-3.5 h-3.5 text-red-400" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Footer: Cancel vs Save Changes */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-[rgba(120,220,255,0.12)]">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSaving}
            className="min-h-[42px] px-4 rounded-xl font-mono text-xs text-[var(--mu)] hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveChanges}
            disabled={isSaving}
            className="min-h-[42px] px-5 rounded-xl bg-[var(--a)] text-[#090a10] font-['Space_Mono',monospace] font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-[#ffb638] active:scale-[0.98] transition-all disabled:opacity-50 shadow-md shadow-amber-500/20"
          >
            {isSaving ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-[#090a10] border-t-transparent rounded-full animate-spin" />
                <span>Saving Photo…</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
