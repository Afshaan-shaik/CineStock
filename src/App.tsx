import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Columns2, Download, RotateCcw, Upload, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { BackgroundBokeh } from './components/BackgroundBokeh';
import { DialsRail } from './components/DialsRail';
import { ExportModal } from './components/ExportModal';
import { IntroSessionGate } from './components/IntroSessionGate';
import { MarqueeBanner } from './components/MarqueeBanner';
import { MonitorStage } from './components/MonitorStage';
import { StockRail } from './components/StockRail';
import { drawOSDOverlay, formatTimecode, renderDemoFrame } from './engine/demoReels';
import { retroAudio } from './engine/audioSynthesizer';
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

export default function App() {
  // Introduction page state (temporarily disabled)
  const [showIntro, setShowIntro] = useState(false);
  const [audioMuted, setAudioMuted] = useState(true);

  // Core State
  const [activePreset, setActivePreset] = useState<PresetKey>('vhs94');
  const [params, setParams] = useState<ShaderParams>(() => paramsFromPreset('vhs94'));
  const [sourceType, setSourceType] = useState<SourceType>('video');
  const [demoMode, setDemoMode] = useState<DemoMode>('nature');
  const [aspect, setAspect] = useState<AspectRatioMode>('native');
  const [compareSplit, setCompareSplit] = useState(false);
  const [splitPos, setSplitPos] = useState(0.5);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
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
    videoEl.muted = false;
    videoEl.src = '/videos/nature.webm';
    videoEl.onloadedmetadata = () => {
      videoEl.play().catch(() => {
        videoEl.muted = true;
        setIsMuted(true);
        videoEl.play().catch(() => {});
      });
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
      videoEl.muted = isMuted;
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
    const next = !audioMuted;
    setAudioMuted(next);
    retroAudio.setMuted(next);
  };

  return (
    <>
      {/* Session Introduction Gate Page (temporarily disabled) */}
      {showIntro && (
        <IntroSessionGate
          onEnterLab={() => {
            setShowIntro(false);
            const labEl = document.getElementById('lab');
            labEl?.scrollIntoView({ behavior: 'smooth' });
          }}
          audioMuted={audioMuted}
          onToggleAudio={handleToggleGlobalAudio}
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
        <nav>
          <b>
            CINE<i>STOCK</i>
          </b>
          <div className="flex items-center gap-4">
            <span>REC ● 24 STOCKS ONLINE</span>
            <button
              type="button"
              onClick={handleToggleGlobalAudio}
              className="tag hidden sm:inline-flex items-center gap-1.5"
              style={{ fontSize: '15px', padding: '4px 10px' }}
              title={audioMuted ? 'Turn Sound FX ON' : 'Turn Sound FX OFF'}
            >
              {audioMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-[var(--a)]" />}
              <span>{audioMuted ? 'MUTE' : 'AUDIO'}</span>
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
          <div className="flex items-center gap-4 flex-wrap">
            <button
              type="button"
              id="go"
              onClick={() => {
                retroAudio.playClick();
                document.getElementById('lab')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="btn pri big"
            >
              Load a tape
            </button>
            <button
              type="button"
              onClick={() => {
                retroAudio.playClick();
                fileInputRef.current?.click();
              }}
              className="btn big"
            >
              <Upload className="w-4 h-4 text-[var(--a)] mr-1" />
              Upload file
            </button>
          </div>
        </section>

        {/* Marquee Banner */}
        <MarqueeBanner />

        {/* The 3-Column Darkroom Lab Section */}
        <section className="lab" id="lab">
          {/* Action Toolbar */}
          <div className="bar">
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
            />
          </div>
        </section>

        {/* Footer */}
        <footer>CINESTOCK — PLAY ►</footer>
      </div>

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
