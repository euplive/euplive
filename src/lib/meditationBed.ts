// Rest Now（meditation-rest-now.mp3）文件本身是好的：约 9.2MB、256kbps、5 分钟。
// 但开头约 11 秒低于 -40dB，手机上会像完全没声音。从第 12 秒起播。
// 点击当下先垫一层 WebAudio 铺底，曲目真正出声后再让位；曲目失败就留下铺底。

export const MEDITATION_TRACK_SRC = '/audio/meditation-rest-now.mp3';
export const MEDITATION_AUDIBLE_START_SEC = 12;
const TRACK_TAKEOVER_MS = 8000;

export type MeditationBedMode = 'track' | 'pad';

export function meditationPlayhead(currentTime: number): number {
  if (!Number.isFinite(currentTime) || currentTime < MEDITATION_AUDIBLE_START_SEC) {
    return MEDITATION_AUDIBLE_START_SEC;
  }
  return currentTime;
}

type AudioContextCtor = typeof AudioContext;

function contextCtor(): AudioContextCtor | null {
  if (typeof window === 'undefined') return null;
  const legacy = window as unknown as { webkitAudioContext?: AudioContextCtor };
  return window.AudioContext || legacy.webkitAudioContext || null;
}

export class MeditationBed {
  private audio: HTMLAudioElement | null = null;
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private oscillators: OscillatorNode[] = [];
  private fading: OscillatorNode[] = [];
  private volume = 0.5;
  private want = false;
  private disposed = false;
  private trackBroken = false;
  private seeking = false;
  private trackTimer = 0;
  private mode: MeditationBedMode = 'track';
  private onMode?: (mode: MeditationBedMode) => void;

  constructor(onMode?: (mode: MeditationBedMode) => void) {
    this.onMode = onMode;
  }

  mount() {
    this.ensureAudio();
  }

  setVolume(volume: number) {
    const next = clampVolume(volume);
    if (this.audio) this.audio.volume = next;
    if (this.ctx && this.master) {
      this.master.gain.setValueAtTime(padGain(next), this.ctx.currentTime);
    }
    this.volume = next;
  }

  /** 必须从「开始 / 继续 / 试听」的点击里调用，手机才允许出声。 */
  play() {
    if (this.disposed) return;
    this.want = true;
    if (this.trackBroken) {
      this.startPad();
      this.publish('pad');
      return;
    }
    const audio = this.ensureAudio();
    if (!audio) {
      this.failTrack();
      return;
    }
    const alreadyAudible = !audio.paused
      && audio.readyState >= 2
      && audio.currentTime >= MEDITATION_AUDIBLE_START_SEC - 0.05;
    if (alreadyAudible) {
      this.publish('track');
      return;
    }
    this.startPad();
    this.jumpToAudible(audio);
    let pending: Promise<void>;
    try {
      pending = audio.play();
    } catch {
      this.failTrack();
      return;
    }
    pending.then(() => {
      this.noteTrackProgress();
    }).catch((error: unknown) => {
      if (!this.want) return;
      if (isAbortError(error)) return;
      this.failTrack();
    });
    window.clearTimeout(this.trackTimer);
    this.trackTimer = window.setTimeout(() => {
      if (!this.want || this.disposed || this.trackBroken) return;
      const current = this.audio;
      if (!current || current.paused || current.currentTime < MEDITATION_AUDIBLE_START_SEC - 0.05) {
        this.failTrack();
      }
    }, TRACK_TAKEOVER_MS);
  }

  pause() {
    this.want = false;
    window.clearTimeout(this.trackTimer);
    this.audio?.pause();
    this.stopPad(true);
    void this.ctx?.suspend().catch(() => {});
  }

  dispose() {
    this.disposed = true;
    this.onMode = undefined;
    this.pause();
    if (this.audio) {
      this.audio.onerror = null;
      this.audio.removeAttribute('src');
      this.audio.load();
      this.audio = null;
    }
    const ctx = this.ctx;
    this.ctx = null;
    ctx?.close().catch(() => {});
  }

  private publish(mode: MeditationBedMode) {
    if (this.mode === mode) return;
    this.mode = mode;
    this.onMode?.(mode);
  }

  private ensureAudio(): HTMLAudioElement | null {
    if (this.audio) return this.audio;
    if (typeof Audio === 'undefined') return null;
    const audio = new Audio(`${MEDITATION_TRACK_SRC}#t=${MEDITATION_AUDIBLE_START_SEC}`);
    audio.preload = 'metadata';
    audio.loop = false;
    audio.volume = this.volume;
    audio.setAttribute('playsinline', 'true');
    audio.addEventListener('loadedmetadata', () => this.jumpToAudible(audio));
    audio.addEventListener('playing', () => this.noteTrackProgress());
    audio.addEventListener('timeupdate', () => this.noteTrackProgress());
    audio.addEventListener('seeked', () => {
      this.seeking = false;
      if (this.want && !this.trackBroken && audio.paused) {
        audio.play().catch((error: unknown) => {
          if (!this.want || isAbortError(error)) return;
          this.failTrack();
        });
      }
      this.noteTrackProgress();
    });
    audio.addEventListener('ended', () => {
      if (!this.want || this.trackBroken) return;
      this.seeking = true;
      audio.currentTime = MEDITATION_AUDIBLE_START_SEC;
      audio.play().catch((error: unknown) => {
        if (!this.want || isAbortError(error)) return;
        this.failTrack();
      });
    });
    audio.addEventListener('error', () => {
      if (this.disposed) return;
      this.trackBroken = true;
      if (this.want) this.failTrack();
    });
    this.audio = audio;
    return audio;
  }

  private jumpToAudible(audio: HTMLAudioElement) {
    if (!this.want || this.seeking || audio.readyState < 1) return;
    const next = meditationPlayhead(audio.currentTime);
    if (next - audio.currentTime <= 0.25) return;
    this.seeking = true;
    try {
      audio.currentTime = next;
    } catch {
      this.seeking = false;
      return;
    }
    if (audio.currentTime < MEDITATION_AUDIBLE_START_SEC - 0.25) {
      this.seeking = false;
    }
  }

  private noteTrackProgress() {
    const audio = this.audio;
    if (!this.want || !audio || this.trackBroken || audio.paused) return;
    if (audio.currentTime < MEDITATION_AUDIBLE_START_SEC - 0.05) {
      this.jumpToAudible(audio);
      return;
    }
    if (audio.readyState < 2) return;
    window.clearTimeout(this.trackTimer);
    this.stopPad(false);
    this.publish('track');
  }

  private failTrack() {
    this.trackBroken = true;
    window.clearTimeout(this.trackTimer);
    try {
      this.audio?.pause();
    } catch {
      // 曲目已经不可用
    }
    if (this.oscillators.length === 0) this.startPad();
    this.publish('pad');
  }

  private ensureCtx(): AudioContext | null {
    if (this.ctx) return this.ctx;
    const Ctor = contextCtor();
    if (!Ctor) return null;
    try {
      this.ctx = new Ctor();
    } catch {
      return null;
    }
    return this.ctx;
  }

  private startPad() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    void ctx.resume().catch(() => {});
    if (this.oscillators.length > 0) {
      if (this.master) this.master.gain.setValueAtTime(padGain(this.volume), ctx.currentTime);
      return;
    }
    const master = ctx.createGain();
    master.gain.value = padGain(this.volume);
    master.connect(ctx.destination);
    this.master = master;
    const freqs = [130.81, 164.81, 196, 261.63];
    this.oscillators = freqs.map((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.value = 0.28 / (1 + index * 0.2);
      osc.connect(gain);
      gain.connect(master);
      osc.start();
      return osc;
    });
  }

  private stopPad(immediate: boolean) {
    const fading = this.oscillators;
    this.oscillators = [];
    const master = this.master;
    this.master = null;
    if (fading.length === 0) return;
    if (!immediate && this.ctx && master) {
      const now = this.ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(master.gain.value, now);
      master.gain.linearRampToValueAtTime(0, now + 0.25);
      this.fading.push(...fading);
      window.setTimeout(() => this.stopNodes(fading), 280);
      return;
    }
    this.stopNodes(fading);
  }

  private stopNodes(nodes: OscillatorNode[]) {
    for (const osc of nodes) {
      try {
        osc.stop();
      } catch {
        // 已经停过
      }
    }
    this.fading = this.fading.filter((osc) => !nodes.includes(osc));
  }
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

function clampVolume(volume: number): number {
  if (!Number.isFinite(volume)) return 0.5;
  return Math.min(1, Math.max(0, volume));
}

function padGain(volume: number): number {
  return clampVolume(volume) * 0.42;
}
