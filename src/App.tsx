import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Columns2, Download, RotateCcw, Upload, Sparkles, Volume2, VolumeX, Info } from 'lucide-react';
import { BackgroundBokeh } from './components/BackgroundBokeh';
import { DialsRail } from './components/DialsRail';
import { CineStockIntro } from './components/CineStockIntro';
import { AboutModal } from './components/AboutModal';
import { ExportModal } from './components/ExportModal';
import { MarqueeBanner } from './components/MarqueeBanner';
import { MonitorStage } from './components/MonitorStage';
import { StockRail } from './components/StockRail';
import { MobileSnapSheet } from './components/MobileSnapSheet';
import { TabletStudioDock } from './components/TabletStudioDock';
import { drawOSDOverlay, formatTimecode, renderDemoFrame } from './engine/demoReels';
import { retroAudio, AUDIO_ENABLED } from './engine/audioSynthesizer';
import { WebGLFilmPipeline } from './engine/webglPipeline';
import {
  DEMO_REELS,
  PRESETS,
  PRESET_LIST,
  RETRO_DATES,
  type AspectRatioMode,
  type DemoMode,
  type PresetKey,
  type ShaderParams,
  type SourceType,
} from './types/lab';

type CapturableVideo = HTMLVideoElement & {
  captureStream?: () => MediaStream;
  mozCaptureStream?: () => MediaStream;
};

function paramsFromPreset(key: PresetKey): ShaderParams {
  const p = PRESETS[key];
  return {
    bloom: p.bloom,
    chroma: p.chroma,
    tracking: p.tracking,
    grain: p.grain,
    scanlines: p.scanlines,
    fade: p.fade,
    warmth: p.warmth,
    vignette: p.vignette,
    tintShadow: [...p.tintShadow],
    tintHighlight: [...p.tintHighlight],
    mono: p.mono ?? 0,
  };
}

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const m = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    setMatches(m.matches);
    m.addEventListener('change', handler);
    return () => m.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

export default function App() {
  // Responsive Breakpoints
  const isPhone = useMediaQuery('(max-width: 767px)');
  const isTabletPortrait = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');

  // Introduction landing screen state (supports ?intro=false for direct lab view)
  const [showIntro, setShowIntro] = useState(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get('intro') === 'false' || window.location.hash === '#lab') {
        return false;
      }
    }
    return true;
  });
  const [audioMuted, setAudioMuted] = useState(true);
  const [aboutOpen, setAboutOpen] = useState(false);

  // Core State
  const [activePreset, setActivePreset] = useState<PresetKey>('vhs94');
  const [params, setParams] = useState<ShaderParams>(() => paramsFromPreset('vhs94'));
  const [sourceType, setSourceType] = useState<SourceType>('video');
  const [demoMode, setDemoMode] = useState<DemoMode>('nature');
  const [aspect, setAspect] = useState<AspectRatioMode>('native');
  const [compareSplit, setCompareSplit] = useState(false);
  const [splitPos, setSplitPos] = useState(0.5);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true); // Muted by default
  const [cinema24fps, setCinema24fps] = useState(true);
  const [osdEnabled, setOsdEnabled] = useState(true);
  const [osdDate, setOsdDate] = useState("NOV 16 '94");
  const [customCaption, setCustomCaption] = useState("TOKYO '98");
  const [resolution, setResolution] = useState({ width: 1280, height: 720 });
  const [seekPercent, setSeekPercent] = useState(0);
  const [timecodeText, setTimecodeText] = useState('00:00 / LOOP');

  // Export modal state
  const [exportOpen, setExportOpen] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatusText, setExportStatusText] = useState('Initializing encoder…');
  const [exportErrorText, setExportErrorText] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFilename, setDownloadFilename] = useState('cinestock-vhs94.webm');

  const outputCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Offscreen resources
  const pipelineRef = useRef<WebGLFilmPipeline | null>(null);
  const demoCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<CapturableVideo | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const mediaObjectUrlRef = useRef<string | null>(null);
  const exportUrlRef = useRef<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const exportCancelledRef = useRef(false);

  // Mutable live state ref for zero-jitter RAF rendering
  const liveRef = useRef({
    activePreset,
    params,
    sourceType,
    demoMode,
    aspect,
    compareSplit,
    splitPos,
    isPlaying,
    cinema24fps,
    osdEnabled,
    osdDate,
    customCaption,
    time: 0,
    lastFrameTime: 0,
    width: 1280,
    height: 720,
  });

  liveRef.current.activePreset = activePreset;
  liveRef.current.params = params;
  liveRef.current.sourceType = sourceType;
  liveRef.current.demoMode = demoMode;
  liveRef.current.aspect = aspect;
  liveRef.current.compareSplit = compareSplit;
  liveRef.current.splitPos = splitPos;
  liveRef.current.isPlaying = isPlaying;
  liveRef.current.cinema24fps = cinema24fps;
  liveRef.current.osdEnabled = osdEnabled;
  liveRef.current.osdDate = osdDate;
  liveRef.current.customCaption = customCaption;

  const currentStock = PRESETS[activePreset];

  // Update dynamic CSS custom variables on root
  useEffect(() => {
    const root = document.documentElement.style;
    root.setProperty('--a', currentStock.accent);
    root.setProperty('--b', currentStock.accentSecondary);
  }, [currentStock]);

  const computeTargetDimensions = useCallback(() => {
    const live = liveRef.current;
    const videoEl = videoRef.current;
    const imageEl = imageRef.current;

    let srcW = 1280;
    let srcH = 720;
    if (live.sourceType === 'video' && videoEl && videoEl.videoWidth) {
      srcW = videoEl.videoWidth;
      srcH = videoEl.videoHeight;
    } else if (live.sourceType === 'image' && imageEl && imageEl.naturalWidth) {
      srcW = imageEl.naturalWidth;
      srcH = imageEl.naturalHeight;
    }

    const maxDim = 1280;
    const scale = Math.min(1, maxDim / Math.max(srcW, srcH));
    let outW = Math.round(srcW * scale);
    let outH = Math.round(srcH * scale);

    if (live.aspect === '4:3') {
      outW = 1080;
      outH = 810;
    } else if (live.aspect === '16:9') {
      outW = 1280;
      outH = 720;
    } else if (live.aspect === '9:16') {
      outW = 720;
      outH = 1280;
    } else if (live.aspect === '1:1') {
      outW = 960;
      outH = 960;
    }

    const outCanvas = outputCanvasRef.current;
    if (outCanvas && (outCanvas.width !== outW || outCanvas.height !== outH)) {
      outCanvas.width = outW;
      outCanvas.height = outH;
      live.width = outW;
      live.height = outH;
      setResolution({ width: outW, height: outH });
    }

    const srcRatio = srcW / srcH;
    const outRatio = outW / outH;
    let sx = 1.0;
    let sy = 1.0;
    if (srcRatio > outRatio) {
      sx = outRatio / srcRatio;
    } else {
      sy = srcRatio / outRatio;
    }
    return [sx, sy] as [number, number];
  }, []);

  const renderSingleFrame = useCallback(
    (forceSplit?: boolean) => {
      const live = liveRef.current;
      const outCanvas = outputCanvasRef.current;
      const pipeline = pipelineRef.current;
      const demoCanvas = demoCanvasRef.current;
      const videoEl = videoRef.current;
      const imageEl = imageRef.current;

      if (!outCanvas || !pipeline || !pipeline.isReady() || !demoCanvas) return;

      let sourceElement: TexImageSource = demoCanvas;
      if (live.sourceType === 'demo') {
        const dCtx = demoCanvas.getContext('2d');
        if (dCtx) {
          renderDemoFrame(dCtx, demoCanvas.width, demoCanvas.height, live.demoMode, live.time);
        }
        sourceElement = demoCanvas;
      } else if (live.sourceType === 'video') {
        if (!videoEl || videoEl.readyState < 2) return;
        sourceElement = videoEl;
        if (videoEl.duration && !Number.isNaN(videoEl.duration)) {
          setSeekPercent((videoEl.currentTime / videoEl.duration) * 100);
          setTimecodeText(
            `${formatTimecode(videoEl.currentTime)} / ${formatTimecode(videoEl.duration)}`
          );
        }
      } else if (live.sourceType === 'image') {
        if (!imageEl || !imageEl.complete || !imageEl.naturalWidth) return;
        sourceElement = imageEl;
      }

      const aspectScale = computeTargetDimensions();
      const splitActive = forceSplit !== undefined ? forceSplit : live.compareSplit;

      pipeline.render(
        sourceElement,
        outCanvas.width,
        outCanvas.height,
        aspectScale,
        live.time,
        live.params,
        splitActive,
        live.splitPos,
        live.activePreset === 'ilford'
      );

      const outCtx = outCanvas.getContext('2d');
      if (!outCtx) return;

      outCtx.clearRect(0, 0, outCanvas.width, outCanvas.height);
      outCtx.drawImage(pipeline.canvas, 0, 0);
      drawOSDOverlay(outCtx, outCanvas.width, outCanvas.height, live.time, {
        enabled: live.osdEnabled,
        compareSplit: splitActive,
        splitPos: live.splitPos,
        isPlaying: live.isPlaying,
        osdDate: live.osdDate,
        customCaption: live.customCaption,
      });
    },
    [computeTargetDimensions]
  );

  // WebGL initialization & RAF loop
  useEffect(() => {
    const pipeline = new WebGLFilmPipeline();
    pipelineRef.current = pipeline;

    const demoCanvas = document.createElement('canvas');
    demoCanvas.width = 1280;
    demoCanvas.height = 720;
    demoCanvasRef.current = demoCanvas;

    const videoEl = document.createElement('video') as CapturableVideo;
    videoEl.crossOrigin = 'anonymous';
    videoEl.loop = true;
    videoEl.playsInline = true;
    videoEl.muted = true;
    videoEl.defaultMuted = true;
    videoEl.volume = 0;
    videoEl.src = '/videos/nature.webm';
    videoEl.onloadedmetadata = () => {
      videoEl.play().catch(() => {});
    };
    videoRef.current = videoEl;

    const imageEl = new Image();
    imageRef.current = imageEl;

    let rafId = 0;
    const loop = (now: number) => {
      rafId = requestAnimationFrame(loop);
      const live = liveRef.current;
      const targetInterval = live.cinema24fps ? 1000 / 24 : 1000 / 60;
      const delta = now - live.lastFrameTime;
      if (delta < targetInterval - 2) return;
      live.lastFrameTime = now;

      if (live.isPlaying) {
        live.time += delta / 1000;
      }
      renderSingleFrame();
    };

    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      pipeline.dispose();
      videoEl.pause();
      if (mediaObjectUrlRef.current) URL.revokeObjectURL(mediaObjectUrlRef.current);
      if (exportUrlRef.current) URL.revokeObjectURL(exportUrlRef.current);
    };
  }, [renderSingleFrame]);

  const handleSelectPreset = (key: PresetKey) => {
    setActivePreset(key);
    setParams(paramsFromPreset(key));
    setOsdEnabled(PRESETS[key].osd);
  };

  const handleSurpriseStock = () => {
    retroAudio.playClick();
    const candidates = PRESET_LIST.filter((p) => p.key !== activePreset);
    const pick = candidates[Math.floor(Math.random() * candidates.length)] ?? PRESET_LIST[0];
    handleSelectPreset(pick.key);
  };

  const handleParamChange = (
    key: Exclude<keyof ShaderParams, 'tintShadow' | 'tintHighlight' | 'mono'>,
    value: number
  ) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    retroAudio.playClick();
    setParams(paramsFromPreset(activePreset));
    setOsdEnabled(PRESETS[activePreset].osd);
  };

  const handleSelectDemo = (mode: DemoMode) => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    setSourceType('video');
    setDemoMode(mode);
    const reel = DEMO_REELS.find((r) => r.key === mode);
    if (reel) {
      videoEl.pause();
      videoEl.src = reel.videoSrc;
      videoEl.currentTime = 0;
      videoEl.muted = true;
      videoEl.volume = 0;
      videoEl.onloadedmetadata = () => {
        videoEl
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => {
            videoEl.muted = true;
            setIsMuted(true);
            videoEl.play().catch(() => {});
            setIsPlaying(true);
          });
      };
      setIsPlaying(true);
      setSeekPercent(0);
    }
  };

  const loadUserMedia = (file: File) => {
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) return;

    if (mediaObjectUrlRef.current) {
      URL.revokeObjectURL(mediaObjectUrlRef.current);
    }
    const url = URL.createObjectURL(file);
    mediaObjectUrlRef.current = url;

    const videoEl = videoRef.current;
    const imageEl = imageRef.current;

    if (file.type.startsWith('image/') && imageEl) {
      videoEl?.pause();
      setSourceType('image');
      imageEl.onload = () => {
        setIsPlaying(true);
        setSeekPercent(0);
        setTimecodeText('STILL PHOTO');
      };
      imageEl.src = url;
    } else if (file.type.startsWith('video/') && videoEl) {
      setSourceType('video');
      videoEl.muted = true;
      videoEl.volume = 0;
      videoEl.src = url;
      videoEl.onloadedmetadata = () => {
        videoEl
          .play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch(() => {
            videoEl.muted = true;
            setIsMuted(true);
            videoEl.play().catch(() => {});
            setIsPlaying(true);
          });
      };
    }
  };

  const handleTogglePlay = () => {
    const next = !isPlaying;
    setIsPlaying(next);
    if (sourceType === 'video' && videoRef.current) {
      if (next) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  };

  const handleToggleMute = () => {
    if (!AUDIO_ENABLED) {
      setIsMuted(true);
      if (videoRef.current) {
        videoRef.current.muted = true;
        videoRef.current.volume = 0;
      }
      return;
    }
    const next = !isMuted;
    setIsMuted(next);
    if (videoRef.current) {
      videoRef.current.muted = next;
    }
  };

  const handleSeek = (pct: number) => {
    setSeekPercent(pct);
    const videoEl = videoRef.current;
    if (sourceType === 'video' && videoEl && videoEl.duration) {
      videoEl.currentTime = (pct / 100) * videoEl.duration;
    }
  };

  const handleRandomizeDate = () => {
    retroAudio.playClick();
    const others = RETRO_DATES.filter((d) => d !== osdDate);
    const pick = others[Math.floor(Math.random() * others.length)] ?? RETRO_DATES[0];
    setOsdDate(pick);
  };

  const handleExport = async () => {
    const outCanvas = outputCanvasRef.current;
    if (!outCanvas) return;

    retroAudio.playCamcorderBeep();

    if (sourceType === 'image') {
      renderSingleFrame(false);
      outCanvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cinestock-${activePreset}.png`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        renderSingleFrame(compareSplit);
      }, 'image/png');
      return;
    }

    if (typeof MediaRecorder === 'undefined' || !outCanvas.captureStream) {
      setExportErrorText(
        'Your browser does not support MediaRecorder canvas capture. Try Chrome, Edge, or Firefox.'
      );
      setExportComplete(false);
      setExportOpen(true);
      return;
    }

    exportCancelledRef.current = false;
    if (exportUrlRef.current) {
      URL.revokeObjectURL(exportUrlRef.current);
      exportUrlRef.current = null;
    }
    setDownloadUrl(null);
    setExportErrorText(null);
    setExportComplete(false);
    setExportProgress(0);
    setExportStatusText('Initializing encoder…');
    setExportOpen(true);

    const prevSplit = compareSplit;
    setCompareSplit(false);
    liveRef.current.compareSplit = false;

    const fps = cinema24fps ? 24 : 30;
    const stream = outCanvas.captureStream(fps);

    const videoEl = videoRef.current;
    if (sourceType === 'video' && videoEl) {
      try {
        const vidStream = videoEl.captureStream
          ? videoEl.captureStream()
          : videoEl.mozCaptureStream
            ? videoEl.mozCaptureStream()
            : null;
        if (vidStream) {
          vidStream.getAudioTracks().forEach((track) => stream.addTrack(track));
        }
      } catch {
        // Fallback
      }
    }

    const mimeTypes = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4',
    ];
    const chosenMime = mimeTypes.find((m) => MediaRecorder.isTypeSupported(m)) || '';

    const chunks: Blob[] = [];
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, {
        mimeType: chosenMime || undefined,
        videoBitsPerSecond: 6_500_000,
      });
    } catch {
      setCompareSplit(prevSplit);
      setExportErrorText('Failed to initialize MediaRecorder for this video codec.');
      return;
    }

    recorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      setCompareSplit(prevSplit);
      liveRef.current.compareSplit = prevSplit;
      if (exportCancelledRef.current) return;

      const ext = chosenMime.includes('mp4') ? 'mp4' : 'webm';
      const blob = new Blob(chunks, { type: chosenMime || 'video/webm' });
      const url = URL.createObjectURL(blob);
      exportUrlRef.current = url;

      setDownloadUrl(url);
      setDownloadFilename(`cinestock-${activePreset}.${ext}`);
      setExportStatusText(`${(blob.size / (1024 * 1024)).toFixed(2)} MB · ${ext.toUpperCase()}`);
      setExportProgress(100);
      setExportComplete(true);
    };

    let durationMs = 6000;
    if (sourceType === 'video' && videoEl && videoEl.duration && !Number.isNaN(videoEl.duration)) {
      durationMs = videoEl.duration * 1000;
      videoEl.loop = false;
      videoEl.currentTime = 0;
      try {
        await videoEl.play();
      } catch {
        // Fallback
      }
    }
    setIsPlaying(true);

    recorder.start(250);
    const startTime = performance.now();

    const tickProgress = () => {
      if (exportCancelledRef.current || recorder.state !== 'recording') return;

      const elapsed =
        sourceType === 'video' && videoEl
          ? videoEl.currentTime * 1000
          : performance.now() - startTime;

      const pct = Math.min(99, Math.round((elapsed / durationMs) * 100));
      setExportProgress(pct);
      setExportStatusText(
        sourceType === 'video' && videoEl
          ? `Encoding ${formatTimecode(videoEl.currentTime)} / ${formatTimecode(videoEl.duration)}`
          : `Capturing 6s loop (${(elapsed / 1000).toFixed(1)}s)`
      );

      const finished =
        sourceType === 'video' && videoEl
          ? videoEl.ended || elapsed >= durationMs - 60
          : elapsed >= durationMs;

      if (finished) {
        if (sourceType === 'video' && videoEl) videoEl.loop = true;
        recorder.stop();
      } else {
        requestAnimationFrame(tickProgress);
      }
    };

    requestAnimationFrame(tickProgress);
  };

  const handleCloseOrCancelExport = () => {
    exportCancelledRef.current = true;
    const rec = recorderRef.current;
    if (rec && rec.state === 'recording') {
      rec.stop();
    }
    if (sourceType === 'video' && videoRef.current) {
      videoRef.current.loop = true;
    }
    setExportOpen(false);
  };

  const handleToggleGlobalAudio = () => {
    if (!AUDIO_ENABLED) return;
    const next = !audioMuted;
    setAudioMuted(next);
    retroAudio.setMuted(next);
  };

  return (
    <>
      {/* Session Introduction Landing Screen */}
      {showIntro && (
        <CineStockIntro
          onEnterLab={() => {
            setShowIntro(false);
          }}
          onOpenAbout={() => setAboutOpen(true)}
        />
      )}

      {/* Atmospheric Film Grain Overlay */}
      <div className="grain" />

      {/* Cursor Interactive Bokeh Light Trail */}
      <BackgroundBokeh
        primaryColor={currentStock.accent}
        secondaryColor={currentStock.accentSecondary}
      />

      <div className="wrap">
        {/* Navigation */}
        <nav className="flex justify-between items-center px-4 sm:px-8 lg:px-14 py-4 sm:py-6">
          <b className="text-base sm:text-xl font-bold tracking-[0.2em] select-none">
            CINE<i>STOCK</i>
          </b>
          <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-base font-mono">
            <span className="text-[var(--mu)] hidden min-[440px]:inline">
              REC <span className="text-red-400">●</span> {isPhone ? '24 STOCKS' : '24 STOCKS ONLINE'}
            </span>
            <span className="text-red-400 min-[440px]:hidden text-sm">
              REC ●
            </span>
            <button
              type="button"
              onClick={() => setShowIntro(true)}
              className="tag inline-flex items-center justify-center gap-1 min-h-[38px] px-2.5 sm:px-3 text-xs sm:text-sm"
              title="Return to Intro Landing Screen"
            >
              <span>INTRO</span>
            </button>
            <button
              type="button"
              onClick={() => setAboutOpen(true)}
              className="tag inline-flex items-center justify-center gap-1.5 min-h-[38px] px-2.5 sm:px-3 text-xs sm:text-sm text-[var(--tx)] hover:text-white transition-colors cursor-pointer"
              title="About the Creator"
            >
              <Info className="w-3.5 h-3.5 text-[var(--a)]" />
              <span>ABOUT</span>
            </button>
          </div>
        </nav>

        {/* Tokyo Night Hero */}
        <section className="hero">
          <small>[ ANALOG LAB v88 ]</small>
          <h1>
            Rewind
            <br />
            the city
          </h1>
          <p>
            Neon, tape hiss and rain on the lens. Add your footage and push it through twenty-four
            stocks in real time.
          </p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 sm:gap-4 max-w-md sm:max-w-none">
            <button
              type="button"
              id="go"
              onClick={() => {
                retroAudio.playClick();
                document.getElementById('lab')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="btn pri big text-center justify-center"
            >
              Load a tape
            </button>
            <button
              type="button"
              onClick={() => {
                retroAudio.playClick();
                fileInputRef.current?.click();
              }}
              className="btn big text-center justify-center"
            >
              <Upload className="w-4 h-4 text-[var(--a)] mr-1" />
              Upload file
            </button>
          </div>
        </section>

        {/* Marquee Banner */}
        <MarqueeBanner />

        {/* Studio Darkroom Lab Section */}
        <section className="lab" id="lab">
          {/* Action Toolbar File Input */}
          <input
            ref={fileInputRef}
            type="file"
            id="file"
            accept="video/*,image/*"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) loadUserMedia(file);
              e.target.value = '';
            }}
          />

          {isPhone ? (
            /* =========================================================
               PHONES (<768px): Viewfinder + Snap Sheet Layout
               ========================================================= */
            <div className="phone-lab-layout w-full">
              {/* Sticky Top Viewfinder Stage */}
              <MonitorStage
                canvasRef={outputCanvasRef}
                aspect={aspect}
                onAspectChange={setAspect}
                compareSplit={compareSplit}
                splitPos={splitPos}
                onSplitPosChange={setSplitPos}
                isPlaying={isPlaying}
                onTogglePlay={handleTogglePlay}
                sourceType={sourceType}
                demoMode={demoMode}
                onSelectDemo={handleSelectDemo}
                seekPercent={seekPercent}
                onSeek={handleSeek}
                timecodeText={timecodeText}
                isMuted={isMuted}
                onToggleMute={handleToggleMute}
                onFileDrop={loadUserMedia}
                customCaption={customCaption}
                onChangeCustomCaption={setCustomCaption}
                showSubControls={false}
                className="phone-viewfinder"
              />

              {/* Bottom Snap Sheet with 3 Snap Points (Peek/Half/Full) & 4 Tabs */}
              <MobileSnapSheet
                activePreset={activePreset}
                onSelectPreset={handleSelectPreset}
                onSurpriseStock={handleSurpriseStock}
                params={params}
                onChangeParam={handleParamChange}
                osdEnabled={osdEnabled}
                onToggleOsd={setOsdEnabled}
                cinema24fps={cinema24fps}
                onToggleCinema24fps={setCinema24fps}
                osdDate={osdDate}
                onRandomizeDate={handleRandomizeDate}
                customCaption={customCaption}
                onChangeCustomCaption={setCustomCaption}
                aspect={aspect}
                onAspectChange={setAspect}
                demoMode={demoMode}
                onSelectDemo={handleSelectDemo}
                sourceType={sourceType}
                compareSplit={compareSplit}
                onToggleCompareSplit={() => setCompareSplit((prev) => !prev)}
                onReset={handleReset}
                onExport={handleExport}
                onAddFile={() => fileInputRef.current?.click()}
                accentColor={currentStock.accent}
                accentSecondary={currentStock.accentSecondary}
              />
            </div>
          ) : isTabletPortrait ? (
            /* =========================================================
               TABLET PORTRAIT (768px - 1023px): Tablet Studio Portrait
               ========================================================= */
            <div className="tablet-portrait-layout space-y-6 w-full max-w-[920px] mx-auto pb-24">
              {/* Sticky Stage on Top */}
              <MonitorStage
                canvasRef={outputCanvasRef}
                aspect={aspect}
                onAspectChange={setAspect}
                compareSplit={compareSplit}
                splitPos={splitPos}
                onSplitPosChange={setSplitPos}
                isPlaying={isPlaying}
                onTogglePlay={handleTogglePlay}
                sourceType={sourceType}
                demoMode={demoMode}
                onSelectDemo={handleSelectDemo}
                seekPercent={seekPercent}
                onSeek={handleSeek}
                timecodeText={timecodeText}
                isMuted={isMuted}
                onToggleMute={handleToggleMute}
                onFileDrop={loadUserMedia}
                customCaption={customCaption}
                onChangeCustomCaption={setCustomCaption}
                showSubControls={true}
                className="tablet-portrait-stage"
              />

              {/* Film Stocks Horizontal Canister Carousel */}
              <StockRail
                activePreset={activePreset}
                onSelectPreset={handleSelectPreset}
                onSurpriseStock={handleSurpriseStock}
                layout="carousel"
              />

              {/* Dials in 2-Column Grid */}
              <DialsRail
                params={params}
                onChangeParam={handleParamChange}
                osdEnabled={osdEnabled}
                onToggleOsd={setOsdEnabled}
                cinema24fps={cinema24fps}
                onToggleCinema24fps={setCinema24fps}
                osdDate={osdDate}
                onRandomizeDate={handleRandomizeDate}
                layout="grid2"
              />

              {/* Floating Glass Action Dock */}
              <TabletStudioDock
                compareSplit={compareSplit}
                onToggleCompareSplit={() => setCompareSplit((prev) => !prev)}
                onSurpriseStock={handleSurpriseStock}
                onAddFile={() => fileInputRef.current?.click()}
                onExport={handleExport}
                sourceType={sourceType}
              />
            </div>
          ) : (
            /* =========================================================
               TABLET LANDSCAPE (>=1024px) & DESKTOP (>1366px): 3-Column
               ========================================================= */
            <>
              {/* Action Toolbar */}
              <div className="bar">
                <button
                  type="button"
                  id="add"
                  onClick={() => {
                    retroAudio.playClick();
                    fileInputRef.current?.click();
                  }}
                  className="btn"
                >
                  <Upload className="w-4 h-4 text-[var(--a)]" />
                  Add video / photo
                </button>

                <button
                  type="button"
                  id="cmp"
                  onClick={() => {
                    retroAudio.playClick();
                    setCompareSplit((prev) => !prev);
                  }}
                  aria-pressed={compareSplit}
                  className="btn"
                >
                  <Columns2 className="w-4 h-4 text-[var(--b)]" />
                  Before / after
                </button>

                <button
                  type="button"
                  id="sur"
                  onClick={handleSurpriseStock}
                  className="btn"
                >
                  <Sparkles className="w-4 h-4 text-[var(--a)]" />
                  Surprise me
                </button>

                <button
                  type="button"
                  id="rst"
                  onClick={handleReset}
                  className="btn"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </button>

                <button
                  type="button"
                  id="exp"
                  onClick={handleExport}
                  className="btn pri ml-auto"
                >
                  <Download className="w-4 h-4" />
                  {sourceType === 'image' ? 'Export PNG' : 'Export reel'}
                </button>
              </div>

              {/* 3-Column Tokyo Grid */}
              <div className="tk">
                {/* Left Rail: Film Stocks */}
                <StockRail
                  activePreset={activePreset}
                  onSelectPreset={handleSelectPreset}
                  onSurpriseStock={handleSurpriseStock}
                  layout="rail"
                />

                {/* Center: Stage Monitor */}
                <MonitorStage
                  canvasRef={outputCanvasRef}
                  aspect={aspect}
                  onAspectChange={setAspect}
                  compareSplit={compareSplit}
                  splitPos={splitPos}
                  onSplitPosChange={setSplitPos}
                  isPlaying={isPlaying}
                  onTogglePlay={handleTogglePlay}
                  sourceType={sourceType}
                  demoMode={demoMode}
                  onSelectDemo={handleSelectDemo}
                  seekPercent={seekPercent}
                  onSeek={handleSeek}
                  timecodeText={timecodeText}
                  isMuted={isMuted}
                  onToggleMute={handleToggleMute}
                  onFileDrop={loadUserMedia}
                  customCaption={customCaption}
                  onChangeCustomCaption={setCustomCaption}
                  showSubControls={true}
                />

                {/* Right Rail: Dials & Camcorder Deck */}
                <DialsRail
                  params={params}
                  onChangeParam={handleParamChange}
                  osdEnabled={osdEnabled}
                  onToggleOsd={setOsdEnabled}
                  cinema24fps={cinema24fps}
                  onToggleCinema24fps={setCinema24fps}
                  osdDate={osdDate}
                  onRandomizeDate={handleRandomizeDate}
                  layout="rail"
                />
              </div>
            </>
          )}
        </section>

        {/* Footer */}
        <footer>CINESTOCK — PLAY ►</footer>
      </div>

      {/* About Profile Modal */}
      <AboutModal isOpen={aboutOpen} onClose={() => setAboutOpen(false)} />

      {/* Export Progress & Download Modal */}
      <ExportModal
        isOpen={exportOpen}
        isComplete={exportComplete}
        progress={exportProgress}
        statusText={exportStatusText}
        errorText={exportErrorText}
        downloadUrl={downloadUrl}
        downloadFilename={downloadFilename}
        onCloseOrCancel={handleCloseOrCancelExport}
        accentColor={currentStock.accent}
        secondaryColor={currentStock.accentSecondary}
      />
    </>
  );
}
