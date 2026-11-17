export const HEARING_TEXT = '请记住验证码七四一九，并点击三号窗口。';
// Digital gain limits, not a guarantee of safe headphone/device loudness.
export const MASTER_GAIN_LIMIT = 0.08;
export const TINNITUS_GAIN = 0.015;

type Version = 'normal' | 'impaired';
type Clip = 'hearing' | 'hospital' | 'payment' | 'escape';
type PlaybackStatus = {
  phase: 'idle' | 'loading' | 'playing' | 'stopped' | 'ended' | 'error';
  message: string;
  version?: Version;
};

const CLIPS: Record<Clip, string> = {
  hearing: 'hearing.wav', hospital: 'hospital.wav',
  payment: 'payment.wav', escape: 'escape.wav',
};
const STOPPED = '已停止播放。';

export class HearingAudio {
  private context: AudioContext | null = null;
  private nodes = new Set<AudioNode>();
  private sources = new Set<AudioScheduledSourceNode>();
  private buffers = new Map<Clip, AudioBuffer>();
  private tinnitus: GainNode | null = null;
  private tinnitusEndsAt = 0;
  private sequence = 0;
  private pending: AbortController | null = null;
  private muted = false;
  private listeners = new Set<() => void>();
  private status: PlaybackStatus = {
    phase: 'idle', message: '点击试听才会播放；更改选项不会自动播放。',
  };

  // The same status also reflects playback/stop requests from scene controls.
  getSnapshot = (): PlaybackStatus => this.status;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };

  private report(status: PlaybackStatus) {
    this.status = status;
    this.listeners.forEach(listener => listener());
  }

  private clearNodes() {
    for (const source of this.sources) {
      source.onended = null;
      try { source.stop(); } catch { /* Already ended or never started. */ }
    }
    for (const node of this.nodes) node.disconnect();
    this.sources.clear();
    this.nodes.clear();
    this.tinnitus = null;
    this.tinnitusEndsAt = 0;
  }

  stop() {
    this.sequence++;
    this.pending?.abort();
    this.pending = null;
    this.clearNodes();
    this.report({ phase: 'stopped', message: STOPPED });
  }

  setTinnitusMuted(muted: boolean) {
    this.muted = muted;
    if (!this.tinnitus || !this.context) return;
    const now = this.context.currentTime;
    const remaining = this.tinnitusEndsAt - now;
    if (remaining <= 0) return;
    const gain = this.tinnitus.gain;
    gain.cancelScheduledValues(now);
    // A short fade avoids a click; keep the original finite end envelope.
    gain.setValueAtTime(gain.value, now);
    const fade = Math.min(0.02, remaining / 3);
    gain.linearRampToValueAtTime(muted ? 0 : TINNITUS_GAIN, now + fade);
    gain.setValueAtTime(muted ? 0 : TINNITUS_GAIN, this.tinnitusEndsAt - fade);
    gain.linearRampToValueAtTime(0, this.tinnitusEndsAt);
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined' || typeof window.AudioContext !== 'function') return null;
    if (!this.context || this.context.state === 'closed') this.context = new window.AudioContext();
    return this.context;
  }

  private track<T extends AudioNode>(node: T): T {
    this.nodes.add(node);
    return node;
  }

  private master(ctx: AudioContext) {
    const gain = this.track(ctx.createGain());
    gain.gain.value = MASTER_GAIN_LIMIT;
    gain.connect(ctx.destination);
    return gain;
  }

  private envelope(ctx: AudioContext, target: AudioNode, start: number, end: number, level: number) {
    const gain = this.track(ctx.createGain());
    const fade = Math.min(0.02, (end - start) / 3);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(level, start + fade);
    gain.gain.setValueAtTime(level, end - fade);
    gain.gain.linearRampToValueAtTime(0, end);
    gain.connect(target);
    return gain;
  }

  private schedule(source: AudioScheduledSourceNode, start: number, end: number, sequence: number) {
    this.sources.add(source);
    source.onended = () => {
      source.onended = null;
      source.disconnect();
      this.nodes.delete(source);
      this.sources.delete(source);
      if (sequence === this.sequence && this.sources.size === 0) {
        this.clearNodes();
        this.report({ phase: 'ended', message: '播放完毕；可再次试听。' });
      }
    };
    source.start(start);
    source.stop(end);
  }

  private chime(ctx: AudioContext, target: AudioNode, start: number, sequence: number) {
    const end = start + 0.2;
    const gain = this.envelope(ctx, target, start, end, 0.22);
    const oscillator = this.track(ctx.createOscillator());
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(660, start);
    oscillator.frequency.linearRampToValueAtTime(880, start + 0.15);
    oscillator.connect(gain);
    this.schedule(oscillator, start, end, sequence);
  }

  async play(version: Version, clip: Clip = 'hearing'): Promise<string> {
    this.stop();
    const sequence = this.sequence;
    this.report({ phase: 'loading', message: '正在准备随应用打包的中文录音…', version });
    let stage = '初始化音频';
    try {
      const ctx = this.getContext();
      if (!ctx || typeof fetch !== 'function' || typeof ctx.decodeAudioData !== 'function') {
        const message = '当前浏览器不支持 Web Audio 录音播放；请阅读屏幕原文。不会以提示音代替语音。';
        this.report({ phase: 'error', message });
        return message;
      }
      // Resume directly within the user gesture, before the first fetch/await.
      stage = '启用音频';
      await ctx.resume();
      if (sequence !== this.sequence) return STOPPED;
      if (ctx.state !== 'running') throw new Error('Audio context is not running');

      let buffer = this.buffers.get(clip);
      if (!buffer) {
        stage = '加载本地录音';
        const controller = new AbortController();
        this.pending = controller;
        // Vite BASE_URL supports deployments beneath a path as well as '/'.
        const base = (import.meta as ImportMeta & { env?: { BASE_URL?: string } }).env?.BASE_URL ?? '/';
        const url = new URL(`${base.replace(/\/?$/, '/')}audio/${CLIPS[clip]}`, window.location.href);
        if (url.origin !== window.location.origin) throw new Error('Only same-origin packaged audio is allowed');
        const response = await fetch(url, { signal: controller.signal, mode: 'same-origin', redirect: 'error', credentials: 'omit' });
        if (sequence !== this.sequence) return STOPPED;
        if (!response.ok) throw new Error(`Audio HTTP ${response.status}`);
        const bytes = await response.arrayBuffer();
        if (sequence !== this.sequence) return STOPPED;
        stage = '解码本地录音';
        buffer = await ctx.decodeAudioData(bytes);
        if (sequence !== this.sequence) return STOPPED;
        // Only short, finite packaged clips are allowed to schedule playback.
        if (!Number.isFinite(buffer.duration) || buffer.duration <= 0 || buffer.duration > 30) {
          throw new Error('Invalid clip duration');
        }
        this.buffers.set(clip, buffer);
        this.pending = null;
      }
      if (sequence !== this.sequence) return STOPPED;
      stage = '播放录音';
      if (ctx.state !== 'running') throw new Error('Audio context was suspended');
      const master = this.master(ctx);
      const start = ctx.currentTime + 0.03;
      const speechStart = start + 0.25;
      const end = speechStart + buffer.duration;
      // Both versions use the exact same cached AudioBuffer and gain.
      const speech = this.track(ctx.createBufferSource());
      speech.buffer = buffer;
      const envelope = this.envelope(ctx, master, speechStart, end, 0.9);
      if (version === 'impaired') {
        const lowpass = this.track(ctx.createBiquadFilter());
        lowpass.type = 'lowpass';
        lowpass.frequency.value = 1500;
        lowpass.Q.value = 0.707;
        speech.connect(lowpass);
        lowpass.connect(envelope);
        this.tinnitus = this.envelope(ctx, master, speechStart, end, this.muted ? 0 : TINNITUS_GAIN);
        this.tinnitusEndsAt = end;
        const oscillator = this.track(ctx.createOscillator());
        oscillator.type = 'sine';
        oscillator.frequency.value = 6000;
        oscillator.connect(this.tinnitus);
        this.schedule(oscillator, speechStart, end, sequence);
      } else {
        speech.connect(envelope);
      }
      this.chime(ctx, master, start, sequence);
      this.schedule(speech, speechStart, end, sequence);
      const message = version === 'impaired'
        ? '正在播放受损版：同一中文录音经过 1500 Hz 低通滤波；耳鸣可单独静音。'
        : '正在播放正常版：随应用打包的中文录音，未经过低通滤波。';
      this.report({ phase: 'playing', message, version });
      return message;
    } catch {
      if (sequence !== this.sequence) return STOPPED;
      this.pending?.abort();
      this.pending = null;
      this.clearNodes();
      const message = `${stage}失败或被浏览器阻止；请重试或阅读屏幕原文。未用提示音冒充语音。`;
      this.report({ phase: 'error', message });
      return message;
    }
  }

  // A separate, explicitly requested emergency cue, never a narration fallback.
  async cue(): Promise<void> {
    this.stop();
    const sequence = this.sequence;
    this.report({ phase: 'loading', message: '正在准备短提示音…' });
    try {
      const ctx = this.getContext();
      if (!ctx) throw new Error('Web Audio is unavailable');
      await ctx.resume();
      if (sequence !== this.sequence) return;
      if (ctx.state !== 'running') throw new Error('Audio context is not running');
      const master = this.master(ctx);
      this.chime(ctx, master, ctx.currentTime + 0.03, sequence);
      this.chime(ctx, master, ctx.currentTime + 0.63, sequence);
      this.report({ phase: 'playing', message: '正在播放短提示音（非语音）；请同时阅读应急文字。' });
    } catch {
      if (sequence !== this.sequence) return;
      this.clearNodes();
      this.report({ phase: 'error', message: '浏览器无法播放提示音；请阅读应急文字。' });
    }
  }

  dispose() {
    this.stop();
    const ctx = this.context;
    this.context = null;
    this.buffers.clear();
    if (ctx && ctx.state !== 'closed') void ctx.close().catch(() => { /* Context already closing. */ });
  }
}

export const hearingAudio = new HearingAudio();
