// Web Audio API Retro Analog Synthesizer
// Provides tape hiss, mechanical clicks, cassette motor hum, and camcorder beeps

class RetroAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = true; // default muted to be polite
  private humGain: GainNode | null = null;
  private noiseNode: AudioNode | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.humGain) {
      this.humGain.gain.setValueAtTime(muted ? 0 : 0.04, this.ctx?.currentTime ?? 0);
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // Tape cassette insertion sound: mechanical spring clunk + motor spool spin
  public playCassetteInsert() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;

    // Heavy mechanical clunk 1
    const osc1 = ctx.createOscillator();
    const g1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(160, t);
    osc1.frequency.exponentialRampToValueAtTime(35, t + 0.12);
    g1.gain.setValueAtTime(0.25, t);
    g1.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
    osc1.connect(g1);
    g1.connect(ctx.destination);
    osc1.start(t);
    osc1.stop(t + 0.15);

    // Secondary latch click
    setTimeout(() => {
      if (this.isMuted || !this.ctx) return;
      const t2 = this.ctx.currentTime;
      const osc2 = this.ctx.createOscillator();
      const g2 = this.ctx.createGain();
      osc2.type = 'square';
      osc2.frequency.setValueAtTime(680, t2);
      osc2.frequency.exponentialRampToValueAtTime(120, t2 + 0.08);
      g2.gain.setValueAtTime(0.18, t2);
      g2.gain.exponentialRampToValueAtTime(0.001, t2 + 0.09);
      osc2.connect(g2);
      g2.connect(this.ctx.destination);
      osc2.start(t2);
      osc2.stop(t2 + 0.1);
    }, 120);
  }

  // Camcorder confirmation beep
  public playCamcorderBeep() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1760, t); // high A pitch
    g.gain.setValueAtTime(0.08, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.09);
  }

  // Tactile knob/chip click
  public playClick() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(540, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.03);
    g.gain.setValueAtTime(0.06, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.045);
  }
}

export const retroAudio = new RetroAudioEngine();

