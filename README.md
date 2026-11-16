# CineStock — Tokyo Night Analog VHS & Film Lab

A real-time WebGL analog film, VHS, and dream camcorder emulation darkroom built with React, TypeScript, and custom GLSL fragment shaders.

![CineStock Preview](https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80)

## Features

- **24 Vintage Emulsions & Stocks:**
  - *Cam & Tape:* VHS Cam ’94, Dazz D-Classic, Hi-8 Nocturne, Betamax ’82, MiniDV Skate ’03, QuickSnap Flash ’99.
  - *Cinema & Neon:* Super 8 Dream, Tokyo ’98 Mist, CineStill 800T, Blade Neon 2049, Sunset Boulevard ’86, Chungking Express, Technicolor IV.
  - *35mm & Instant:* Portra 400 Haze, Kodachrome 64, Polaroid 600, Kodak Ektar 100, Fuji Velvia 50, AgfaPhoto Vista 200, Fujicolor Pro 400H.
  - *Experimental:* Kodak Aerochrome (Infrared), LomoChrome Purple, Silver Gelatin 400 (Monochrome), Ethereal Vapor Prism.
- **Custom WebGL Shader Engine:**
  - Dream glow & pro-mist bloom (12-tap circular soft glow).
  - VHS tracking wobble, horizontal waves, and head-switching glitch tears.
  - Chromatic aberration, chroma smear, and RGB split.
  - Organic analog film grain and CRT scanlines.
  - Matte fade, split-toning, warmth, and optical vignette.
- **Real-Time Video Reels:**
  - *Aesthetic Nature:* Cascading mountain waterfalls and lush emerald forest.
  - *Lambo / Bugatti Drive:* High-speed supercar road drive.
  - *Famous Person:* Marilyn Monroe in 1950s golden age Hollywood cinema.
- **Interactive Tools & Stage:**
  - Draggable Before / After split-screen slider (`ORIGINAL` vs `CINESTOCK`).
  - Camcorder OSD deck with live timestamp, 24 fps cinema cadence, and custom typo/title generator.
  - MediaRecorder reel export (WebM/MP4) and instant high-res PNG snapshot capture.
  - Ambient cursor-tracking bokeh light trail and analog audio synthesizer.

## Quick Start

### Prerequisites
- Node.js (v18+)
- npm

### Installation & Run

```bash
# Clone the repository
git clone https://github.com/Afshaan-shaik/CineStock.git
cd CineStock

# Install dependencies
npm install --legacy-peer-deps

# Start the local development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to open the lab.

## Scripts

- `npm run dev`: Launch Vite local development server on port 3000.
- `npm run build`: Compile TypeScript and bundle production assets.
- `npm run lint`: Run TypeScript static type checking (`tsc --noEmit`).

## License

MIT
