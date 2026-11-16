import type { ShaderParams } from '../types/lab';

const VERT_SRC = `
  attribute vec2 a_pos;
  varying vec2 v_uv;
  void main() {
    v_uv = a_pos * 0.5 + 0.5;
    v_uv.y = 1.0 - v_uv.y;
    gl_Position = vec4(a_pos, 0.0, 1.0);
  }
`;

const FRAG_SRC = `
  precision highp float;
  varying vec2 v_uv;
  uniform sampler2D u_tex;
  uniform vec2 u_res;
  uniform vec2 u_srcAspectScale;
  uniform float u_time;

  uniform float u_bloom;
  uniform float u_chroma;
  uniform float u_tracking;
  uniform float u_grain;
  uniform float u_scanlines;
  uniform float u_fade;
  uniform float u_warmth;
  uniform float u_vignette;
  uniform float u_splitActive;
  uniform float u_splitPos;
  uniform float u_mono;

  uniform vec3 u_tintShadow;
  uniform vec3 u_tintHighlight;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  vec2 fitUV(vec2 uv) {
    return (uv - 0.5) * u_srcAspectScale + 0.5;
  }

  vec3 sampleSafe(vec2 uv) {
    vec2 c = clamp(uv, 0.001, 0.999);
    return texture2D(u_tex, c).rgb;
  }

  void main() {
    vec2 rawUV = fitUV(v_uv);

    if (u_splitActive > 0.5 && v_uv.x < u_splitPos) {
      gl_FragColor = vec4(sampleSafe(rawUV), 1.0);
      return;
    }

    // 1. Subtle barrel curvature + Super 8 / VHS gate weave jitter
    vec2 centered = rawUV - 0.5;
    float r2 = dot(centered, centered);
    vec2 lensUV = rawUV + centered * r2 * 0.045;

    float weaveX = (noise(vec2(u_time * 9.0, 1.0)) - 0.5) * 0.004 * u_tracking;
    float weaveY = (noise(vec2(1.0, u_time * 12.0)) - 0.5) * 0.004 * u_tracking;

    // VHS horizontal tracking wave & head-switching tear at bottom
    float waveBand = sin(lensUV.y * 24.0 + u_time * 6.5) * 0.0018 * u_tracking;
    float glitchLine = step(0.985 - u_tracking * 0.03, noise(vec2(floor(lensUV.y * 120.0), floor(u_time * 18.0))));
    float tear = glitchLine * (hash(vec2(u_time, lensUV.y)) - 0.5) * 0.035 * u_tracking;
    float bottomSwitch = smoothstep(0.94, 0.995, v_uv.y) * sin(u_time * 40.0 + v_uv.y * 100.0) * 0.014 * u_tracking;

    vec2 uv = lensUV + vec2(weaveX + waveBand + tear + bottomSwitch, weaveY);

    // 2. Chromatic Aberration & VHS Chroma Smear
    float ca = (0.0015 + u_chroma * 0.0085) * (0.4 + 1.2 * length(centered));
    float smear = u_chroma * 0.012;

    float r = sampleSafe(uv + vec2(ca, 0.0)).r;
    float g = sampleSafe(uv).g;
    float b = sampleSafe(uv - vec2(ca, 0.0)).b;

    vec3 smearSample = (
      sampleSafe(uv + vec2(smear, 0.0)) +
      sampleSafe(uv - vec2(smear, 0.0)) +
      sampleSafe(uv + vec2(smear * 2.0, 0.0))
    ) / 3.0;

    vec3 col = vec3(r, g, b);
    float luma = dot(col, vec3(0.299, 0.587, 0.114));
    float smearLuma = dot(smearSample, vec3(0.299, 0.587, 0.114));
    vec3 chromaSmear = smearSample - smearLuma + luma;
    col = mix(col, chromaSmear, u_chroma * 0.55);

    // 3. Dreamy Pro-Mist Bloom & Halation (12-tap circular soft glow)
    if (u_bloom > 0.01) {
      vec3 bloomAcc = vec3(0.0);
      float radius = 0.008 + u_bloom * 0.022;
      for (int i = 0; i < 12; i++) {
        float ang = float(i) * 0.523598;
        vec2 off = vec2(cos(ang), sin(ang)) * radius;
        vec3 s1 = sampleSafe(uv + off);
        vec3 s2 = sampleSafe(uv + off * 0.45);
        float b1 = smoothstep(0.38, 1.0, dot(s1, vec3(0.3, 0.59, 0.11)));
        float b2 = smoothstep(0.30, 1.0, dot(s2, vec3(0.3, 0.59, 0.11)));
        bloomAcc += s1 * b1 * 0.65 + s2 * b2 * 0.45;
      }
      bloomAcc /= 12.0;
      vec3 halation = bloomAcc * mix(vec3(1.0), vec3(1.18, 0.92, 0.78), max(u_warmth, 0.0));
      col = 1.0 - (1.0 - col) * (1.0 - halation * u_bloom * 1.15);
    }

    // 4. Analog Color Grading: Matte Lift, S-Curve, Split Toning & Warmth
    float lift = u_fade * 0.11;
    col = col * (1.0 - lift * 1.4) + lift;
    col = mix(col, smoothstep(0.0, 1.0, col), 0.25);

    // Monochrome conversion for black & white emulsion
    col = mix(col, vec3(dot(col, vec3(0.299, 0.587, 0.114))), u_mono);

    float lum = dot(col, vec3(0.299, 0.587, 0.114));
    col += u_tintShadow * (1.0 - smoothstep(0.0, 0.55, lum)) * 0.45;
    col *= mix(vec3(1.0), u_tintHighlight, smoothstep(0.35, 1.0, lum) * 0.45);

    col.r += u_warmth * 0.085;
    col.b -= u_warmth * 0.085;
    col.g += u_warmth * 0.015;

    // 5. CRT Scanlines & Phosphor Glow
    if (u_scanlines > 0.01) {
      float scan = sin(v_uv.y * u_res.y * 1.15) * 0.5 + 0.5;
      float scanMask = mix(1.0, 0.72 + 0.28 * scan, u_scanlines);
      col *= scanMask;
    }

    // 6. Organic Film Grain & Tape Speckles
    if (u_grain > 0.01) {
      float gNoise = hash(v_uv * u_res * 0.65 + fract(u_time * 37.0) * 100.0);
      float grainAmt = (gNoise - 0.5) * (0.04 + u_grain * 0.16);
      col += grainAmt;

      float speck = step(0.9992 - u_grain * 0.0012, hash(vec2(floor(v_uv.y * 280.0), floor(u_time * 24.0 + v_uv.x * 80.0))));
      col += speck * 0.28 * u_grain;
    }

    // 7. Optical Vignette
    float dist = length(v_uv - 0.5);
    float vig = smoothstep(0.88 - u_vignette * 0.35, 0.22, dist);
    col *= mix(1.0, vig, u_vignette * 0.85);

    gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
  }
`;

const UNIFORM_NAMES = [
  'u_tex',
  'u_res',
  'u_srcAspectScale',
  'u_time',
  'u_bloom',
  'u_chroma',
  'u_tracking',
  'u_grain',
  'u_scanlines',
  'u_fade',
  'u_warmth',
  'u_vignette',
  'u_splitActive',
  'u_splitPos',
  'u_mono',
  'u_tintShadow',
  'u_tintHighlight',
] as const;

type UniformName = (typeof UNIFORM_NAMES)[number];

export class WebGLFilmPipeline {
  public readonly canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private texture: WebGLTexture | null = null;
  private buffer: WebGLBuffer | null = null;
  private uniforms: Partial<Record<UniformName, WebGLUniformLocation | null>> = {};

  constructor() {
    this.canvas = document.createElement('canvas');
    this.init();
  }

  private init() {
    const gl = this.canvas.getContext('webgl', {
      preserveDrawingBuffer: true,
      premultipliedAlpha: false,
    });
    if (!gl) return;
    this.gl = gl;

    const compile = (type: number, src: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
      }
      return shader;
    };

    const vert = compile(gl.VERTEX_SHADER, VERT_SRC);
    const frag = compile(gl.FRAGMENT_SHADER, FRAG_SRC);
    if (!vert || !frag) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);
    gl.useProgram(program);
    this.program = program;

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );
    this.buffer = buf;

    const loc = gl.getAttribLocation(program, 'a_pos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    this.texture = tex;

    for (const name of UNIFORM_NAMES) {
      this.uniforms[name] = gl.getUniformLocation(program, name);
    }
  }

  public isReady(): boolean {
    return Boolean(this.gl && this.program && this.texture);
  }

  public render(
    source: TexImageSource,
    width: number,
    height: number,
    aspectScale: [number, number],
    time: number,
    params: ShaderParams,
    splitActive: boolean,
    splitPos: number,
    isMono: boolean = false
  ) {
    const gl = this.gl;
    if (!gl || !this.program || !this.texture) return;

    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }

    gl.viewport(0, 0, width, height);
    gl.useProgram(this.program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);

    gl.uniform1i(this.uniforms.u_tex ?? null, 0);
    gl.uniform2f(this.uniforms.u_res ?? null, width, height);
    gl.uniform2f(this.uniforms.u_srcAspectScale ?? null, aspectScale[0], aspectScale[1]);
    gl.uniform1f(this.uniforms.u_time ?? null, time);

    gl.uniform1f(this.uniforms.u_bloom ?? null, params.bloom);
    gl.uniform1f(this.uniforms.u_chroma ?? null, params.chroma);
    gl.uniform1f(this.uniforms.u_tracking ?? null, params.tracking);
    gl.uniform1f(this.uniforms.u_grain ?? null, params.grain);
    gl.uniform1f(this.uniforms.u_scanlines ?? null, params.scanlines);
    gl.uniform1f(this.uniforms.u_fade ?? null, params.fade);
    gl.uniform1f(this.uniforms.u_warmth ?? null, params.warmth);
    gl.uniform1f(this.uniforms.u_vignette ?? null, params.vignette);
    gl.uniform1f(this.uniforms.u_splitActive ?? null, splitActive ? 1.0 : 0.0);
    gl.uniform1f(this.uniforms.u_splitPos ?? null, splitPos);
    gl.uniform1f(this.uniforms.u_mono ?? null, isMono || (params.mono ?? 0) > 0.5 ? 1.0 : 0.0);
    gl.uniform3fv(this.uniforms.u_tintShadow ?? null, params.tintShadow);
    gl.uniform3fv(this.uniforms.u_tintHighlight ?? null, params.tintHighlight);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  public dispose() {
    const gl = this.gl;
    if (!gl) return;
    if (this.texture) gl.deleteTexture(this.texture);
    if (this.buffer) gl.deleteBuffer(this.buffer);
    if (this.program) gl.deleteProgram(this.program);
    this.gl = null;
    this.program = null;
    this.texture = null;
    this.buffer = null;
  }
}
