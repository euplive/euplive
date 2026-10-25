// 只用浏览器自带的 speechSynthesis，挑选普通中文女声。
// 不仿任何明星，也不接第三方付费音色。没有女声时调用方退回蜂鸣。

export const KEGEL_PHASE_LINE = {
  inhale: '收缩',
  hold: '保持',
  exhale: '放松',
} as const;

export type KegelSpokenPhase = keyof typeof KEGEL_PHASE_LINE;

export const STAND_UP_LINE = '该站起来了，去做冥想';

export interface VoiceLike {
  name: string;
  lang: string;
  localService?: boolean;
}

const FEMALE_NAME_MARKERS = [
  'xiaoxiao', 'xiaoyi', 'xiaochen', 'xiaohan', 'xiaomeng', 'xiaomo',
  'xiaorui', 'xiaoshuang', 'xiaoxuan', 'xiaoyan', 'xiaozhen', 'xiaobei',
  'xiaoyou',
  'yaoyao', 'huihui', 'hanhan',
  'ting-ting', 'tingting', 'ting ting',
  'mei-jia', 'meijia',
  'sin-ji', 'sinji',
  '女声',
];

const MALE_NAME_MARKERS = [
  'kangkang', 'yunyang', 'yunxi', 'yunjian', 'yunhao', 'yunze',
  'yunfeng', 'yunjie', 'yunye', 'yunxia',
  '男声',
];

let voiceCache: VoiceLike[] = [];
let watching = false;
let speechToken = 0;

function normalize(value: string): string {
  return value.toLowerCase().replace(/_/g, '-');
}

function isChineseVoice(voice: VoiceLike): boolean {
  const lang = normalize(voice.lang);
  if (lang.startsWith('zh') || lang.startsWith('cmn') || lang.startsWith('yue')) return true;
  return /中文|普通话|国语|國語|汉语|漢語|粤语|粵語/.test(voice.name);
}

function isMainland(lang: string): boolean {
  return lang.startsWith('zh-cn') || lang.startsWith('cmn-hans') || lang === 'zh';
}

function hasMarker(name: string, markers: string[]): boolean {
  const normalized = name.toLowerCase();
  return markers.some((marker) => normalized.includes(marker));
}

function isNamedFemale(name: string): boolean {
  return hasMarker(name, FEMALE_NAME_MARKERS) || /\bfemale\b/i.test(name);
}

function isNamedMale(name: string): boolean {
  if (isNamedFemale(name)) return false;
  return hasMarker(name, MALE_NAME_MARKERS) || /\bmale\b/i.test(name);
}

/** Google 普通话是系统自带女声，名字里通常不写 female。 */
function isGoogleChinese(voice: VoiceLike): boolean {
  if (!/google/i.test(voice.name)) return false;
  const lang = normalize(voice.lang);
  return isChineseVoice(voice) && (lang.startsWith('zh') || lang.startsWith('cmn') || /普通话|中文|国语|國語/.test(voice.name));
}

export function scoreChineseFemaleVoice(voice: VoiceLike): number {
  if (!isChineseVoice(voice) || isNamedMale(voice.name)) return 0;
  const lang = normalize(voice.lang);
  let score = 10;
  if (isMainland(lang)) score += 20;
  else if (lang.startsWith('zh') || lang.startsWith('cmn')) score += 8;
  if (isNamedFemale(voice.name)) score += 40;
  if (isGoogleChinese(voice)) score += 25;
  if (voice.localService) score += 3;
  return score;
}

export function pickChineseFemaleVoice<T extends VoiceLike>(voices: readonly T[]): T | null {
  let best: T | null = null;
  let bestScore = 0;
  for (const voice of voices) {
    const score = scoreChineseFemaleVoice(voice);
    if (score > bestScore) {
      best = voice;
      bestScore = score;
    }
  }
  return best;
}

function rememberVoices(voices: VoiceLike[]) {
  if (voices.length > 0) voiceCache = voices.slice();
}

function availableVoices(): VoiceLike[] {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    rememberVoices(window.speechSynthesis.getVoices());
  }
  return voiceCache;
}

export function primeChineseVoice() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  if (!watching) {
    watching = true;
    window.speechSynthesis.addEventListener('voiceschanged', () => {
      rememberVoices(window.speechSynthesis.getVoices());
    });
  }
  rememberVoices(window.speechSynthesis.getVoices());
  try {
    window.speechSynthesis.resume();
  } catch {
    // 个别浏览器在未解锁时 resume 会抛错
  }
}

export function cancelChineseVoice() {
  speechToken += 1;
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
}

/**
 * 说出一句普通中文。返回 false 表示当前没有可用女声，调用方应立刻蜂鸣。
 * 若 speak 发出去但迟迟没开口，onFail 会补一声，避免手机静默失败。
 */
export function speakChinese(text: string, onFail?: () => void): boolean {
  if (typeof window === 'undefined' || !window.speechSynthesis) return false;
  primeChineseVoice();
  const voice = pickChineseFemaleVoice(availableVoices());
  if (!voice || !text.trim()) return false;

  const synth = window.speechSynthesis;
  const token = ++speechToken;
  const utterance = new SpeechSynthesisUtterance(text);
  try {
    utterance.voice = voice as SpeechSynthesisVoice;
  } catch {
    // 声线对象不被这次朗读接受时，仍用 zh-CN 朗读这句。
  }
  utterance.lang = voice.lang || 'zh-CN';
  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.volume = 1;

  let settled = false;
  const fail = () => {
    if (settled || token !== speechToken) return;
    settled = true;
    onFail?.();
  };
  const succeed = () => {
    settled = true;
  };

  utterance.onstart = succeed;
  utterance.onend = succeed;
  utterance.onerror = (event) => {
    if (event.error === 'canceled' || event.error === 'interrupted') return;
    fail();
  };

  const run = () => {
    if (token !== speechToken) return;
    try {
      synth.resume();
      synth.speak(utterance);
    } catch {
      fail();
      return;
    }
    window.setTimeout(() => {
      if (!settled) fail();
    }, 2000);
  };

  try {
    if (synth.speaking || synth.pending) {
      synth.cancel();
      window.setTimeout(run, 60);
    } else {
      run();
    }
  } catch {
    return false;
  }
  return true;
}
