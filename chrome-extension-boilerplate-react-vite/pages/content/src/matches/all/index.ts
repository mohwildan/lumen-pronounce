// IPA Pronunciation Stylizer — content script

const VOWEL_COLORS: Record<string, { c: string; t: string }> = {
  AH: { c: 'var(--ipa-purple)', t: 'color_u_alt' }, AA: { c: 'var(--ipa-purple)', t: 'color_u_alt' },
  AE: { c: 'var(--ipa-pink)',   t: 'color_a' },
  EH: { c: 'var(--ipa-red)',    t: 'color_e' }, ER: { c: 'var(--ipa-red)',    t: 'color_e' },
  IH: { c: 'var(--ipa-green)',  t: 'color_i' }, IY: { c: 'var(--ipa-green)',  t: 'color_i' },
  UH: { c: 'var(--ipa-teal)',   t: 'color_u' }, UW: { c: 'var(--ipa-teal)',   t: 'color_u' },
  AO: { c: 'var(--ipa-orange)', t: 'color_o' },
  AY: { c: 'var(--ipa-pink)',   t: 'color_a' }, EY: { c: 'var(--ipa-red)',    t: 'color_e' },
  OY: { c: 'var(--ipa-orange)', t: 'color_o' }, OW: { c: 'var(--ipa-orange)', t: 'color_o' },
  AW: { c: 'var(--ipa-purple)', t: 'color_u_alt' }, AX: { c: 'var(--ipa-purple)', t: 'color_u_alt' },
};

const ARPA_IPA: Record<string, string> = {
  IY: 'iː', IH: 'ɪ', EH: 'ɛ', AE: 'æ', AH: 'ʌ', AA: 'ɑː', AO: 'ɔː',
  UH: 'ʊ', UW: 'uː', ER: 'ɜː', AX: 'ə',
  AY: 'aɪ', EY: 'eɪ', OY: 'ɔɪ', AW: 'aʊ', OW: 'oʊ',
  P: 'p', B: 'b', T: 't', D: 'd', K: 'k', G: 'ɡ', F: 'f', V: 'v',
  TH: 'θ', DH: 'ð', S: 's', Z: 'z', SH: 'ʃ', ZH: 'ʒ',
  HH: 'h', M: 'm', N: 'n', NG: 'ŋ', L: 'l', R: 'r', W: 'w', Y: 'j',
  CH: 'tʃ', JH: 'dʒ', KW: 'kw', KS: 'ks', KSH: 'kʃ', KZ: 'kz',
  GZ: 'ɡz', GZH: 'ɡʒ', JHD: 'dʒ', CCC: 'k', HHH: 'h',
};

const ACUTE: Record<string, string> = {
  a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú', y: 'ý',
  A: 'Á', E: 'É', I: 'Í', O: 'Ó', U: 'Ú', Y: 'Ý',
};

const LONG_VOWELS = new Set(['IY', 'UW', 'ER', 'AO']);
const DIPH_SUPER: Record<string, string> = { AY: 'ᵃ', EY: 'ⁱ', OW: 'ᵘ', AW: 'ᵃ', OY: 'ᵒ' };
const TH_SUPER: Record<string, string> = { TH: 'ᵗ', DH: 'ᵈ' };

const IPA_ROOT_IDS = new Set(['__ipa_tip__', '__ipa_sel_tip__', '__ipa_sel_btn__']);

const SKIP_TAGS = new Set([
  'SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'SELECT', 'CODE', 'PRE',
  'KBD', 'SAMP', 'MATH', 'SVG', 'NOSCRIPT', 'RP-W', 'READPRONUNCIATION-WORD',
]);

const BLOCK_TAGS = new Set([
  'P', 'LI', 'DIV', 'ARTICLE', 'SECTION', 'TD', 'TH',
  'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'FIGCAPTION',
  'CAPTION', 'SUMMARY', 'DT', 'DD',
]);

type IpaOpts = {
  silent: boolean; color_e: boolean; color_i: boolean; color_u_alt: boolean;
  color_a: boolean; color_u: boolean; color_o: boolean; stress: boolean;
  tmark: boolean; th_t: boolean; zmark: boolean; diph_ai: boolean;
  diph_ei_oi: boolean; phonemes: boolean; th_d: boolean; diph_ou_au: boolean; length: boolean;
};

let dict: Record<string, string> | null = null;
let opts: IpaOpts = {
  silent: true, color_e: true, color_i: true, color_u_alt: true, color_a: true,
  color_u: true, color_o: true, stress: true, tmark: true, th_t: true,
  zmark: true, diph_ai: true, diph_ei_oi: true, phonemes: true, th_d: true,
  diph_ou_au: true, length: true,
};
let targetLanguage = 'id';
let translatePerSentence = true;
let pauseOnHover = false;
let hasProcessed = false;

// ── ARPAbet ──────────────────────────────────────────────────────

type Token = { phoneme: string | null; base: string | null; silent: boolean; ghost: boolean; stress: number };
type AlignedToken = Token & { char: string | null };

function parseArpabet(str: string): Token[] {
  return str.trim().split(/\s+/).map(raw => {
    if (raw === '-' || raw === '--') return { phoneme: null, base: null, silent: true, ghost: false, stress: 0 };
    if (raw.startsWith('+')) {
      const clean = raw.replace(/^\+/, '').replace(/^\.+/, '');
      const stress = parseInt(clean.match(/([012])$/)?.[1] ?? '0');
      const phoneme = clean.replace(/[012]$/, '');
      return { phoneme, base: phoneme.replace(/[^A-Z]/gi, '').toUpperCase(), silent: false, ghost: true, stress };
    }
    if (raw.startsWith('-r')) return { phoneme: null, base: null, silent: false, ghost: false, stress: 0 };
    const clean = raw.replace(/^\.+/, '');
    const stress = parseInt(clean.match(/([012])$/)?.[1] ?? '0');
    const phoneme = clean.replace(/[012]$/, '');
    return { phoneme, base: phoneme.replace(/[^A-Z]/gi, '').toUpperCase(), silent: false, ghost: false, stress };
  });
}

function alignWord(word: string, arpa: string): AlignedToken[] {
  const tokens = parseArpabet(arpa);
  const chars = [...word];
  const aligned: AlignedToken[] = [];
  let ci = 0;
  for (const t of tokens) {
    if (t.ghost) { aligned.push({ char: null, ...t }); }
    else { aligned.push({ char: chars[ci] || null, ...t }); ci++; }
  }
  for (let i = ci; i < chars.length; i++) {
    aligned.push({ char: chars[i], phoneme: null, base: null, silent: true, stress: 0, ghost: false });
  }
  return aligned;
}

function toIPA(arpaStr: string): string {
  const toks = arpaStr.trim().split(/\s+/)
    .filter(t => t !== '-' && t !== '--' && !t.startsWith('+'))
    .map(tok => {
      const clean = tok.replace(/^-r/, '').replace(/^\.+/, '');
      const syllableStart = tok.replace(/^-r/, '').startsWith('.') && tok.includes('.');
      const stress = parseInt(clean.match(/([012])$/)?.[1] ?? '0');
      const base = clean.replace(/[012]$/, '').replace(/[^A-Z]/gi, '').toUpperCase();
      return { base, stress, syllableStart };
    });

  const syllStress = (from: number) => {
    for (let i = from; i < toks.length; i++) {
      if (i > from && toks[i].syllableStart) break;
      if (toks[i].stress > 0) return toks[i].stress;
    }
    return 0;
  };

  let ipa = '';
  for (let i = 0; i < toks.length; i++) {
    const { base, stress, syllableStart } = toks[i];
    if (syllableStart) { const s = syllStress(i); ipa += s === 1 ? 'ˈ' : s === 2 ? 'ˌ' : '.'; }
    else if (i === 0 && stress > 0) { ipa += stress === 1 ? 'ˈ' : 'ˌ'; }
    ipa += ARPA_IPA[base] ?? base.toLowerCase();
  }
  return '/' + ipa + '/';
}

// ── Word renderer ────────────────────────────────────────────────

function renderWordFrag(word: string, arpa: string): HTMLElement {
  const wEl = document.createElement('rp-w');
  wEl.setAttribute('data-word', word);
  wEl.setAttribute('data-arpa', arpa);

  const aligned = alignWord(word, arpa);
  for (let i = 0; i < aligned.length; i++) {
    const { char, base, silent, stress, ghost } = aligned[i];

    if (ghost) {
      if (base && ARPA_IPA[base]) {
        const sup = document.createElement('rp-sup');
        sup.textContent = ARPA_IPA[base];
        sup.setAttribute('data-ghost', '1');
        const vColor = VOWEL_COLORS[base];
        if (vColor) sup.setAttribute('data-gvc', vColor.t);
        wEl.appendChild(sup);
      }
      continue;
    }

    const sEl = document.createElement('rp-s');
    const isFirst = i === 0 || aligned[i - 1]?.base !== base;
    const isLast = i === aligned.length - 1 || aligned[i + 1]?.base !== base;

    if (silent) {
      sEl.setAttribute('data-silent', '1');
    } else if (base) {
      const vColor = VOWEL_COLORS[base];
      if (vColor) {
        sEl.setAttribute('data-vc', vColor.t);
        if (stress === 1 && isFirst && char && ACUTE[char]) sEl.setAttribute('data-st', '1');
        if (isLast) {
          if (LONG_VOWELS.has(base)) {
            const c = document.createElement('rp-c');
            c.textContent = ':';
            c.setAttribute('data-type', 'length');
            sEl.appendChild(c);
          }
          if (DIPH_SUPER[base]) {
            const c = document.createElement('rp-sup');
            c.textContent = DIPH_SUPER[base];
            c.setAttribute('data-type', base);
            sEl.appendChild(c);
          }
        }
      }
      if (isLast) {
        if (TH_SUPER[base]) {
          const c = document.createElement('rp-sup');
          c.textContent = TH_SUPER[base];
          c.setAttribute('data-type', base);
          sEl.appendChild(c);
        } else if (base === 'T' && char && !['t', 'T'].includes(char)) {
          const s = document.createElement('rp-sup');
          s.textContent = 'ᵗ';
          s.setAttribute('data-type', 'tmark');
          sEl.appendChild(s);
        }
      }
      if (base === 'Z' || base === 'ZH') {
        sEl.setAttribute('data-zm', '1');
      }
    }

    // Prepend the display char as text node so appended children follow it
    sEl.insertBefore(document.createTextNode(char ?? ''), sEl.firstChild);
    wEl.appendChild(sEl);
  }
  return wEl;
}

// ── Sentence extraction ──────────────────────────────────────────

// Reconstruct plain text from IPA-processed container (rp-w → data-word)
function getContainerText(container: Element): string {
  let text = '';
  function traverse(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.textContent || '';
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      if (el.getAttribute?.('data-ipa-ui')) return;
      if (el.tagName === 'RP-W') {
        text += el.getAttribute('data-word') || '';
      } else if (!SKIP_TAGS.has(el.tagName)) {
        for (const child of el.childNodes) traverse(child);
      }
    }
  }
  for (const child of container.childNodes) traverse(child);
  return text;
}

function extractSentence(wordEl: Element): string {
  const word = wordEl.getAttribute('data-word') || '';

  // Walk up to nearest block container
  let container: Element | null = wordEl.parentElement;
  while (container && !BLOCK_TAGS.has(container.tagName)) {
    container = container.parentElement;
  }
  if (!container) return '';

  const fullText = getContainerText(container).replace(/\s+/g, ' ').trim();
  const wordIdx = fullText.toLowerCase().indexOf(word.toLowerCase());
  if (wordIdx === -1) return '';

  // Find sentence start (after last sentence ender before wordIdx)
  let sentStart = 0;
  const startRe = /[.!?…]+\s*/g;
  let m: RegExpExecArray | null;
  while ((m = startRe.exec(fullText)) !== null && m.index < wordIdx) {
    sentStart = m.index + m[0].length;
  }

  // Find sentence end (next sentence ender after word)
  const endRe = /[.!?…]+/g;
  endRe.lastIndex = wordIdx + word.length;
  const endMatch = endRe.exec(fullText);
  const sentEnd = endMatch ? endMatch.index + endMatch[0].length : fullText.length;

  const sentence = fullText.slice(sentStart, sentEnd).trim();
  if (sentence.length < 5 || sentence.length > 500) return '';
  return sentence;
}

// ── Translation API ──────────────────────────────────────────────

const transCache: Record<string, string> = {};
const wordDataCache: Record<string, WordData> = {};

type WordData = {
  posList: Array<{ pos: string; translations: string[] }>;
};

async function translate(text: string, lang: string): Promise<string> {
  if (!lang || lang === 'none') return '';
  const key = `${lang}:${text}`;
  if (transCache[key] !== undefined) return transCache[key];
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${encodeURIComponent(lang)}&dt=t&q=${encodeURIComponent(text)}`;
    const r = await fetch(url);
    if (!r.ok) return '';
    const data = await r.json() as unknown[][];
    const result = (data[0] as unknown[][])?.map(c => (c as unknown[])[0]).filter(Boolean).join('') ?? '';
    transCache[key] = result;
    return result;
  } catch { return ''; }
}

async function fetchWordData(word: string, lang: string): Promise<WordData> {
  const key = `${lang}:${word}`;
  if (wordDataCache[key]) return wordDataCache[key];

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${encodeURIComponent(lang)}&dt=t&dt=bd&q=${encodeURIComponent(word)}`;
    const r = await fetch(url);
    if (!r.ok) { wordDataCache[key] = { posList: [] }; return wordDataCache[key]; }
    const data = await r.json() as unknown[];

    // data[1] = bilingual dict: [[pos, [trans...], ...], ...]
    const bd = data[1] as Array<[string, string[]]> | null;
    const posList = bd?.map(entry => ({
      pos: entry[0],
      translations: (entry[1] as string[]).slice(0, 5),
    })) ?? [];

    wordDataCache[key] = { posList };
    return wordDataCache[key];
  } catch {
    wordDataCache[key] = { posList: [] };
    return wordDataCache[key];
  }
}

// ── Tooltip ──────────────────────────────────────────────────────

const TIP_W = 320;
const S = {
  // Shared inline style fragments
  tab: 'flex:1;padding:6px 4px;border:none;background:none;cursor:pointer;font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;transition:color .1s,border-color .1s;',
  tabOn: 'color:#a78bfa;border-bottom:2px solid #a78bfa;',
  tabOff: 'color:#445;border-bottom:2px solid transparent;',
};

let tip: HTMLDivElement | null = null;
let hoverTimer: ReturnType<typeof setTimeout> | null = null;
let currentWord: string | null = null;
const defCache: Record<string, unknown> = {};

function isOwnEl(node: Node | null): boolean {
  if (!node) return false;
  const el = node as Element;
  return !!(el.id && IPA_ROOT_IDS.has(el.id)) || !!el.closest?.('[data-ipa-ui]');
}

function tipParent(): Element {
  const fs = document.fullscreenElement;
  return (fs && fs.tagName !== 'VIDEO') ? fs : document.body;
}

function getTip(): HTMLDivElement {
  if (tip) return tip;
  tip = document.createElement('div');
  tip.id = '__ipa_tip__';
  tip.setAttribute('data-ipa-ui', '1');
  tip.style.cssText = [
    'position:fixed', 'z-index:2147483647',
    'background:#0e0f1e', 'border:1px solid #252650',
    'border-radius:14px',
    'box-shadow:0 16px 48px rgba(0,0,0,.7),0 2px 8px rgba(0,0,0,.4)',
    `width:${TIP_W}px`, 'font-family:system-ui,sans-serif',
    'color:#d0d0ee', 'display:none', 'overflow:hidden',
    'transition:opacity .15s,transform .15s',
    'opacity:0', 'transform:translateY(6px)', 'pointer-events:none',
  ].join(';');
  tip.addEventListener('mouseenter', () => { if (hoverTimer) clearTimeout(hoverTimer); });
  tip.addEventListener('mouseleave', e => {
    if (!(e.relatedTarget as Element)?.closest?.('rp-w')) hideTip();
  });
  tipParent().appendChild(tip);
  return tip;
}

function posAbbr(pos: string): string {
  return { verb: 'verb', noun: 'noun', adjective: 'adj', adverb: 'adv', preposition: 'prep', conjunction: 'conj', pronoun: 'pron', interjection: 'int' }[pos.toLowerCase()] ?? pos;
}

// ── Text-to-Speech ───────────────────────────────────────────────

const SPEAK_ICON = `<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>`;

let ttsActive = false;
let currentAudio: HTMLAudioElement | null = null;
let audioCtx: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;

function getAudioCtx(): AudioContext {
  if (!audioCtx || audioCtx.state === 'closed') audioCtx = new AudioContext();
  return audioCtx;
}

function stopCurrent() {
  try { currentSource?.stop(); } catch { /* already stopped */ }
  currentSource = null;
  currentAudio?.pause();
  currentAudio = null;
}

// ── Video pause-on-hover ──────────────────────────────────────────
let videoPausedByUs = false;

function getActiveVideo(): HTMLVideoElement | null {
  const fs = document.fullscreenElement;
  const v = (fs?.querySelector('video') ?? document.querySelector('video')) as HTMLVideoElement | null;
  return v;
}

function maybePauseVideo(): void {
  if (!pauseOnHover) return;
  const v = getActiveVideo();
  if (v && !v.paused) { v.pause(); videoPausedByUs = true; }
}

function maybeResumeVideo(): void {
  if (!videoPausedByUs) return;
  videoPausedByUs = false;
  const v = getActiveVideo();
  if (v && v.paused) v.play().catch(() => {});
}

async function playPronunciation(word: string): Promise<void> {
  const btn = document.getElementById('__ipa_speak_btn__') as HTMLButtonElement | null;

  if (ttsActive) {
    stopCurrent();
    ttsActive = false;
    if (btn) { btn.style.color = '#556'; btn.style.transform = 'scale(1)'; }
    return;
  }

  // Resume AudioContext inside user gesture
  const ctx = getAudioCtx();
  if (ctx.state === 'suspended') await ctx.resume();

  if (btn) { btn.style.color = '#a78bfa'; btn.style.transform = 'scale(1.15)'; btn.style.opacity = '0.6'; }

  chrome.runtime.sendMessage({ type: 'TTS_FETCH', word }, (response: { base64?: string; mimeType?: string; error?: string } | undefined) => {
    if (!response?.base64) {
      if (btn) { btn.style.color = '#556'; btn.style.transform = 'scale(1)'; btn.style.opacity = '1'; }
      return;
    }

    const binary = atob(response.base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    ctx.decodeAudioData(bytes.buffer, (buffer) => {
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.connect(ctx.destination);
      currentSource = src;
      ttsActive = true;
      if (btn) { btn.style.color = '#a78bfa'; btn.style.transform = 'scale(1.2)'; btn.style.opacity = '1'; }
      src.onended = () => {
        ttsActive = false;
        currentSource = null;
        if (btn) { btn.style.color = '#556'; btn.style.transform = 'scale(1)'; btn.style.opacity = '1'; }
      };
      src.start(0);
    }, () => {
      ttsActive = false;
      if (btn) { btn.style.color = '#556'; btn.style.transform = 'scale(1)'; btn.style.opacity = '1'; }
    });
  });
}

function buildTipHTML(word: string, ipa: string): string {
  return (
    // Header
    `<div style="padding:14px 16px 0">` +
    `<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px">` +
    // Left: speaker + word
    `<div style="display:flex;align-items:center;gap:8px">` +
    `<button id="__ipa_speak_btn__" title="Play pronunciation" style="background:none;border:none;cursor:pointer;color:#556;padding:2px;display:flex;align-items:center;transition:color .15s,transform .15s;flex-shrink:0">${SPEAK_ICON}</button>` +
    `<span style="font-size:1.25rem;font-weight:800;color:#fff;letter-spacing:.01em">${word.toUpperCase()}</span>` +
    `</div>` +
    // Right: IPA
    `<span style="font-size:.9rem;color:#8899cc;font-style:italic;letter-spacing:.02em;white-space:nowrap;padding-top:4px">${ipa}</span>` +
    `</div>` +
    // POS translations area
    `<div id="__ipa_pos_area__" style="margin-top:8px;min-height:32px;font-size:.84rem;line-height:1.65">` +
    `<span style="color:#334">Loading…</span>` +
    `</div>` +
    // Sentence translation
    `<div id="__ipa_sent__" style="margin:8px 0 14px;font-size:.8rem;color:#a78bfa;font-style:italic;min-height:14px"></div>` +
    `</div>` +
    // Tabs
    `<div style="display:flex;border-top:1px solid #1a1a30;border-bottom:1px solid #1a1a30;background:#0a0b18">` +
    `<button data-tab="definition" style="${S.tab}${S.tabOn}">Definition</button>` +
    `<button data-tab="examples"   style="${S.tab}${S.tabOff}">Examples</button>` +
    `<button data-tab="slang"      style="${S.tab}${S.tabOff}">Slang</button>` +
    `<button data-tab="search"     style="${S.tab}${S.tabOff}">Search</button>` +
    `</div>` +
    // Body
    `<div id="__ipa_body__" style="padding:10px 16px;min-height:42px;font-size:.82rem;color:#99a;line-height:1.55">` +
    `<span style="color:#334">Loading…</span>` +
    `</div>`
  );
}

function renderPosArea(posList: Array<{ pos: string; translations: string[] }>, lang: string): void {
  const area = document.getElementById('__ipa_pos_area__');
  if (!area) return;
  if (!posList.length || lang === 'none') { area.innerHTML = ''; return; }
  area.innerHTML = posList.map(({ pos, translations }) =>
    `<div style="display:flex;gap:10px;align-items:baseline">` +
    `<span style="font-size:.72rem;font-weight:700;color:#556;text-transform:uppercase;letter-spacing:.06em;min-width:32px;flex-shrink:0">${posAbbr(pos)}</span>` +
    `<span style="color:#ccd">${translations.join(', ')}</span>` +
    `</div>`
  ).join('');
}

function renderSentence(translated: string): void {
  const el = document.getElementById('__ipa_sent__');
  if (!el) return;
  el.textContent = translated ? `"${translated.toUpperCase()}"` : '';
}

function renderTab(tab: string, word: string, data: unknown): void {
  const body = document.getElementById('__ipa_body__');
  if (!body) return;
  if (tab === 'definition') {
    if (!data) { body.innerHTML = '<span style="color:#334">No definition found.</span>'; return; }
    const arr = data as Array<{ meanings?: Array<{ partOfSpeech?: string; definitions?: Array<{ definition?: string; example?: string }> }> }>;
    const meanings = arr[0]?.meanings ?? [];
    if (!meanings.length) { body.innerHTML = '<span style="color:#334">—</span>'; return; }
    body.innerHTML = meanings.slice(0, 3).map(m =>
      `<div style="margin-bottom:8px">` +
      `<span style="font-size:.7rem;font-weight:700;color:#556;text-transform:uppercase;letter-spacing:.06em">${m.partOfSpeech ?? ''}</span>` +
      `<p style="color:#c8c8e8;margin:2px 0">${m.definitions?.[0]?.definition ?? ''}</p>` +
      (m.definitions?.[0]?.example ? `<p style="color:#778;font-style:italic;font-size:.78rem">"${m.definitions[0].example}"</p>` : '') +
      `</div>`
    ).join('');
  } else if (tab === 'examples') {
    const arr = data as Array<{ meanings?: Array<{ definitions?: Array<{ example?: string }> }> }>;
    const exs = arr?.[0]?.meanings?.flatMap(m => m.definitions ?? []).map(d => d.example).filter(Boolean).slice(0, 4);
    body.innerHTML = exs?.length
      ? exs.map(ex => `<p style="margin-bottom:8px;border-left:2px solid #2e2060;padding-left:10px;font-style:italic;color:#99a">${ex}</p>`).join('')
      : '<span style="color:#334">No examples.</span>';
  } else if (tab === 'slang') {
    const udUrl = `https://www.urbandictionary.com/define.php?term=${encodeURIComponent(word)}`;
    body.innerHTML = `<a href="${udUrl}" target="_blank" style="color:#a78bfa;text-decoration:none;display:block;margin-bottom:8px">&#x1F4AC; Urban Dictionary: "${word}"</a>` +
      `<p style="color:#445;font-size:.78rem">Slang, informal, and colloquial meanings.</p>`;
  } else {
    const gUrl = `https://www.google.com/search?q=${encodeURIComponent(word + ' pronunciation')}`;
    const mUrl = `https://www.merriam-webster.com/dictionary/${encodeURIComponent(word)}`;
    body.innerHTML =
      `<a href="${gUrl}" target="_blank" style="color:#7b9fff;text-decoration:none;display:block;margin-bottom:8px">&#x1F50D; Google: "${word} pronunciation"</a>` +
      `<a href="${mUrl}" target="_blank" style="color:#7b9fff;text-decoration:none;display:block">&#x1F4D6; Merriam-Webster</a>`;
  }
}

async function fetchDictDef(word: string): Promise<void> {
  const key = word.toLowerCase();
  if (!(key in defCache)) {
    try {
      const r = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(key)}`);
      defCache[key] = r.ok ? await r.json() : null;
    } catch { defCache[key] = null; }
  }
  if (currentWord === word) renderTab('definition', word, defCache[key]);
}

function posTip(mouseX: number, mouseY: number): void {
  if (!tip) return;
  const PAD = 10, H = 280;
  const fs = document.fullscreenElement;
  if (fs && fs.tagName !== 'VIDEO') {
    // Inside fullscreen el: use absolute coords relative to its bounding rect
    const r = fs.getBoundingClientRect();
    const W = r.width || window.innerWidth;
    const Ht = r.height || window.innerHeight;
    let left = mouseX - r.left + 14, top = mouseY - r.top + 18;
    if (left + TIP_W > W - PAD) left = mouseX - r.left - TIP_W - 14;
    if (top + H > Ht - PAD) top = mouseY - r.top - H - 10;
    tip.style.position = 'absolute';
    tip.style.left = Math.max(PAD, left) + 'px';
    tip.style.top = Math.max(PAD, top) + 'px';
  } else {
    tip.style.position = 'fixed';
    let left = mouseX + 14, top = mouseY + 18;
    if (left + TIP_W > window.innerWidth - PAD) left = mouseX - TIP_W - 14;
    if (top + H > window.innerHeight - PAD) top = mouseY - H - 10;
    tip.style.left = Math.max(PAD, left) + 'px';
    tip.style.top = Math.max(PAD, top) + 'px';
  }
}

function showTip(wordEl: Element, mouseX: number, mouseY: number): void {
  const t = getTip();
  const word = wordEl.getAttribute('data-word');
  const arpa = wordEl.getAttribute('data-arpa');
  if (!word || !arpa) return;
  currentWord = word;

  stopCurrent();
  ttsActive = false;
  maybePauseVideo();

  t.innerHTML = buildTipHTML(word, toIPA(arpa));
  t.style.pointerEvents = 'auto';

  // Wire up speaker button
  const speakBtn = t.querySelector('#__ipa_speak_btn__') as HTMLButtonElement | null;
  if (speakBtn) {
    speakBtn.addEventListener('click', e => { e.stopPropagation(); playPronunciation(word); });
  }

  // Wire up tabs
  t.querySelectorAll('[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      t.querySelectorAll('[data-tab]').forEach(b => ((b as HTMLElement).style.cssText = S.tab + S.tabOff));
      (btn as HTMLElement).style.cssText = S.tab + S.tabOn;
      renderTab((btn as HTMLElement).dataset.tab!, word, defCache[word.toLowerCase()]);
    });
  });

  // Ensure tip is in correct parent (body or fullscreen element)
  const parent = tipParent();
  if (tip.parentElement !== parent) parent.appendChild(tip);

  posTip(mouseX, mouseY);
  t.style.display = 'block';
  t.style.transform = 'translateY(6px)'; t.style.opacity = '0';
  requestAnimationFrame(() => { t.style.opacity = '1'; t.style.transform = 'translateY(0)'; });

  // Parallel fetches
  const lang = targetLanguage;

  // 1. Definition (always)
  void fetchDictDef(word);

  // 2. Word POS translations
  if (lang && lang !== 'none') {
    void fetchWordData(word, lang).then(data => {
      if (currentWord !== word) return;
      renderPosArea(data.posList, lang);
    });

    // 3. Sentence from DOM → translate
    const sentence = extractSentence(wordEl);
    if (sentence) {
      void translate(sentence, lang).then(result => {
        if (currentWord !== word) return;
        renderSentence(result);
      });
    }
  }
}

function hideTip(): void {
  if (!tip) return;
  currentWord = null;
  stopCurrent();
  ttsActive = false;
  maybeResumeVideo();
  tip.style.opacity = '0'; tip.style.transform = 'translateY(6px)'; tip.style.pointerEvents = 'none';
  setTimeout(() => { if (!currentWord && tip) tip.style.display = 'none'; }, 150);
}

// ── Selection Translate ──────────────────────────────────────────

let selBtn: HTMLDivElement | null = null;
let selTip: HTMLDivElement | null = null;

function getSelBtn(): HTMLDivElement {
  if (selBtn) return selBtn;
  selBtn = document.createElement('div');
  selBtn.id = '__ipa_sel_btn__';
  selBtn.setAttribute('data-ipa-ui', '1');
  selBtn.style.cssText = [
    'position:fixed', 'z-index:2147483646',
    'background:#7b61ff', 'color:#fff',
    'font-family:system-ui,sans-serif', 'font-size:11px', 'font-weight:700',
    'padding:4px 10px', 'border-radius:6px', 'cursor:pointer',
    'display:none', 'box-shadow:0 4px 12px rgba(0,0,0,.4)',
    'user-select:none',
  ].join(';');
  selBtn.textContent = 'Translate';
  selBtn.addEventListener('mousedown', e => { e.preventDefault(); e.stopPropagation(); });
  selBtn.addEventListener('click', handleSelTranslate);
  document.body.appendChild(selBtn);
  return selBtn;
}

function getSelTip(): HTMLDivElement {
  if (selTip) return selTip;
  selTip = document.createElement('div');
  selTip.id = '__ipa_sel_tip__';
  selTip.setAttribute('data-ipa-ui', '1');
  selTip.style.cssText = [
    'position:fixed', 'z-index:2147483646',
    'background:#0e0f1e', 'border:1px solid #252650',
    'border-radius:10px', 'box-shadow:0 8px 30px rgba(0,0,0,.5)',
    'font-family:system-ui,sans-serif', 'font-size:13px', 'color:#d0d0ee',
    'padding:12px 14px', 'max-width:380px', 'display:none', 'line-height:1.55',
  ].join(';');
  document.body.appendChild(selTip);
  return selTip;
}

async function handleSelTranslate(): Promise<void> {
  const sel = window.getSelection();
  const text = sel?.toString().trim() ?? '';
  if (!text || !targetLanguage || targetLanguage === 'none') return;

  const btn = getSelBtn();
  const st = getSelTip();
  const btnLeft = parseInt(btn.style.left);
  const btnTop = parseInt(btn.style.top) + 32;

  btn.style.display = 'none';
  st.style.left = Math.min(btnLeft, window.innerWidth - 400) + 'px';
  st.style.top = Math.min(btnTop, window.innerHeight - 120) + 'px';
  st.style.display = 'block';
  st.innerHTML = `<div style="color:#445;font-size:.72rem;margin-bottom:6px;text-transform:uppercase;letter-spacing:.05em">Translating…</div>`;

  const result = await translate(text, targetLanguage);
  st.innerHTML = result
    ? `<div style="color:#445;font-size:.72rem;margin-bottom:6px;text-transform:uppercase;letter-spacing:.05em">Translation</div>` +
      `<div style="color:#d0d0ee">${result}</div>` +
      `<div style="color:#445;font-size:.7rem;margin-top:6px;font-style:italic">"${text.length > 60 ? text.slice(0, 60) + '…' : text}"</div>`
    : `<div style="color:#e06060">Translation failed.</div>`;
}

function hideSelUI(): void {
  if (selBtn) selBtn.style.display = 'none';
  if (selTip) selTip.style.display = 'none';
}

document.addEventListener('mouseup', e => {
  if (!translatePerSentence || isOwnEl(e.target as Node)) return;
  setTimeout(() => {
    const sel = window.getSelection();
    const text = sel?.toString().trim() ?? '';
    if (text.length < 3) { hideSelUI(); return; }
    const range = sel?.getRangeAt(0);
    if (!range) return;
    const rect = range.getBoundingClientRect();
    const btn = getSelBtn();
    const PAD = 10;
    let left = rect.right + 6, top = rect.top - 32;
    if (left + 90 > window.innerWidth - PAD) left = rect.left - 90;
    if (top < PAD) top = rect.bottom + 6;
    btn.style.left = Math.max(PAD, left) + 'px';
    btn.style.top = Math.max(PAD, top) + 'px';
    btn.style.display = 'block';
  }, 10);
});

document.addEventListener('mousedown', e => { if (!isOwnEl(e.target as Node)) hideSelUI(); });

// ── Morphological Fallback ───────────────────────────────────────

const PREFIXES = [
  { p: 're', t: 'R IY1' }, { p: 'un', t: 'AH1 N' }, { p: 'in', t: 'IH1 N' }, { p: 'im', t: 'IH1 M' },
  { p: 'dis', t: 'D IH1 S' }, { p: 'mis', t: 'M IH1 S' }, { p: 'pre', t: 'P R IY1' }, { p: 'pro', t: 'P R OW1' },
  { p: 'non', t: 'N AA1 N' }, { p: 'over', t: 'OW1 V ER0 -rER0' }, { p: 'under', t: 'AH1 N D ER0 -rER0' },
  { p: 'anti', t: 'AE1 N T IY0' },
];
const SUFFIXES = [
  { s: 'ing', t: 'IH0 NG -' }, { s: 'ness', t: 'N EH0 S S' }, { s: 'ment', t: 'M EH0 N T' },
  { s: 'est', t: 'IH0 S T' }, { s: 'ed', t: '- D' }, { s: 'es', t: 'IH0 Z' },
  { s: 'er', t: 'ER0 -rER0' }, { s: 'ly', t: 'L IY0' }, { s: 's', t: 'Z' },
  { s: 'ism', t: 'IH0 Z M' }, { s: 'ist', t: 'IH0 S T' }, { s: 'ful', t: 'F UH0 L' },
  { s: 'less', t: 'L EH0 S S' }, { s: 'tion', t: 'SH - AX0 N' },
  { s: 'able', t: 'AX0 B L -' }, { s: 'ible', t: 'IH0 B L -' },
  { s: "'s", t: '- Z' }, { s: "'ve", t: '- V' }, { s: "'re", t: '- ER0' },
  { s: "'ll", t: '- L' }, { s: "'d", t: '- D' }, { s: "'m", t: 'M' }, { s: "'t", t: 'T' },
];

function guessPronunciation(word: string, depth = 0): string | null {
  if (depth > 2 || !dict) return null;
  const w = word.toLowerCase();
  const getStem = (s: string) => dict![s] || guessPronunciation(s, depth + 1);
  if (w.endsWith('ization')) { const s = getStem(w.slice(0,-7)+'ize'); if(s) return s.replace(/\s+-\s*$/,' EY1 SH - AX0 N'); }
  if (w.endsWith('ation'))   { const s = getStem(w.slice(0,-5)+'ate'); if(s) return s.replace(/\s+-\s*$/,' EY1 SH - AX0 N'); }
  if (w.endsWith('ing'))     { const s = getStem(w.slice(0,-3)+'e');   if(s) return s.replace(/\s+-\s*$/,' IH0 NG -'); }
  if (w.endsWith('ed'))      { const s = getStem(w.slice(0,-2)+'e');   if(s) return s+' D'; }
  if (w.endsWith('ies'))     { const s = getStem(w.slice(0,-3)+'y');   if(s){ const t=s.split(/\s+/);const l=t.pop();return t.join(' ')+' '+l+' - Z';} }
  if (w.endsWith('ily'))     { const s = getStem(w.slice(0,-3)+'y');   if(s){ const t=s.split(/\s+/);const l=t.pop();return t.join(' ')+' '+l+' L IY0';} }
  if (w.endsWith('able'))    { const s = getStem(w.slice(0,-4)+'e');   if(s) return s.replace(/\s+-\s*$/,' AX0 B L -'); }
  if (w.endsWith('ible'))    { const s = getStem(w.slice(0,-4)+'e');   if(s) return s.replace(/\s+-\s*$/,' IH0 B L -'); }
  for (const suf of SUFFIXES) { if(w.endsWith(suf.s)){ const s=getStem(w.slice(0,-suf.s.length)); if(s) return s+' '+suf.t; } }
  for (const pre of PREFIXES) { if(w.startsWith(pre.p)){ const s=getStem(w.slice(pre.p.length)); if(s) return pre.t+' '+s; } }
  for (const pre of PREFIXES) {
    if(w.startsWith(pre.p)) {
      const rem = w.slice(pre.p.length);
      for (const suf of SUFFIXES) { if(rem.endsWith(suf.s)){ const s=getStem(rem.slice(0,-suf.s.length)); if(s) return pre.t+' '+s+' '+suf.t; } }
    }
  }
  return null;
}

// ── DOM Walker ───────────────────────────────────────────────────

function processTextNode(node: Text): void {
  const text = node.textContent;
  if (!text?.trim() || !/[a-zA-Z]/.test(text)) return;
  // Normalize curly apostrophes (U+2019) and modifier letter apostrophe (U+02BC) → straight
  const norm = text.replace(/[’ʼ]/g, "'");
  const tokens = norm.match(/[a-zA-Z']+|[^a-zA-Z']+/g) ?? [];
  const frag = document.createDocumentFragment();
  let changed = false;

  for (const token of tokens) {
    if (!/^[a-zA-Z']+$/i.test(token)) { frag.appendChild(document.createTextNode(token)); continue; }

    const clean = token.replace(/^'+|'+$/g, ''); // strip leading/trailing apostrophes
    let arpa = clean ? (dict?.[clean.toLowerCase()] ?? null) : null;
    if (!arpa && clean && (clean.length > 4 || clean.includes("'"))) arpa = guessPronunciation(clean);

    // Helper: build rp-w for a contraction — base gets IPA, suffix appended as plain text INSIDE rp-w
    const makeContractionEl = (base: string, baseArpa: string, suffix: string, fullWord: string): HTMLElement => {
      const wEl = renderWordFrag(base || fullWord, baseArpa);
      wEl.setAttribute('data-word', fullWord); // tooltip shows full word e.g. "I'M"
      if (suffix) wEl.appendChild(document.createTextNode(suffix));
      return wEl;
    };

    if (arpa) {
      const pre = token.match(/^'+/)?.[0] ?? '';
      if (pre) frag.appendChild(document.createTextNode(pre));

      if (clean.includes("'")) {
        // Contraction: IPA the base word only, suffix lives as text inside same rp-w
        // → hover on "'m" / "'ve" etc. still triggers popup for the whole word
        const apostIdx = clean.indexOf("'");
        const base = clean.slice(0, apostIdx);
        const suffix = clean.slice(apostIdx);
        const baseArpa = (base && dict?.[base.toLowerCase()]) ?? arpa;
        frag.appendChild(makeContractionEl(base, baseArpa, suffix, clean));
      } else {
        const post = token.match(/'+$/)?.[0] ?? '';
        frag.appendChild(renderWordFrag(clean, arpa));
        if (post) frag.appendChild(document.createTextNode(post));
      }
      changed = true;
      continue;
    }

    // Contraction fallback (guessPronunciation also failed)
    if (clean.includes("'")) {
      const apostIdx = clean.indexOf("'");
      const base = clean.slice(0, apostIdx);
      const suffix = clean.slice(apostIdx);
      if (base.length > 0) {
        let baseArpa = dict?.[base.toLowerCase()] ?? null;
        if (!baseArpa && base.length > 2 && base.endsWith('n')) {
          baseArpa = dict?.[base.slice(0, -1).toLowerCase()] ?? null;
        }
        if (baseArpa) {
          const pre = token.match(/^'+/)?.[0] ?? '';
          if (pre) frag.appendChild(document.createTextNode(pre));
          frag.appendChild(makeContractionEl(base, baseArpa, suffix, clean)); // suffix inside rp-w
          changed = true;
          continue;
        }
      }
    }

    frag.appendChild(document.createTextNode(token));
  }
  if (changed && node.parentNode) node.parentNode.replaceChild(frag, node);
}

function unwalkAll(): void {
  for (const rpw of [...document.querySelectorAll('rp-w')]) {
    const text = rpw.getAttribute('data-word') ?? rpw.textContent ?? '';
    if (rpw.parentNode) rpw.parentNode.replaceChild(document.createTextNode(text), rpw);
  }
  document.body.normalize();
}

function walk(node: Node): void {
  if (node.nodeType === Node.TEXT_NODE) { processTextNode(node as Text); return; }
  if (node.nodeType !== Node.ELEMENT_NODE) return;
  const el = node as Element;
  if (SKIP_TAGS.has(el.tagName)) return;
  if (el.getAttribute('data-ipa-ui')) return;
  if (el.id && IPA_ROOT_IDS.has(el.id)) return;
  if ((el as HTMLElement).isContentEditable) return;
  for (const child of [...node.childNodes]) walk(child);
}

// ── Hover events ─────────────────────────────────────────────────

let lastMoveX = 0, lastMoveY = 0;
let fsHoverInterval: ReturnType<typeof setInterval> | null = null;

// Track mouse at all times (needed for interval-based fullscreen detection)
document.addEventListener('mousemove', e => {
  lastMoveX = (e as MouseEvent).clientX;
  lastMoveY = (e as MouseEvent).clientY;
}, { capture: true, passive: true });

function findRpwAtPoint(x: number, y: number, container: Element): Element | null {
  // caretRangeFromPoint gives exact text node under cursor — more accurate than bbox scan
  const range = document.caretRangeFromPoint?.(x, y);
  if (range) {
    const node = range.startContainer;
    const el = node.nodeType === Node.TEXT_NODE ? node.parentElement : node as Element;
    const rpw = el?.closest?.('rp-w');
    if (rpw && container.contains(rpw)) return rpw;
  }
  // Fallback: bounding rect scan within container
  for (const el of container.querySelectorAll('rp-w[data-word]')) {
    const r = el.getBoundingClientRect();
    if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return el;
  }
  return null;
}

// Fullscreen: poll every 120ms. Only show after hovering same word 400ms (anti-jitter).
let fsHoverWord: string | null = null;
let fsHoverSince = 0;

function startFsHover(): void {
  if (fsHoverInterval) return;
  fsHoverInterval = setInterval(() => {
    const fs = document.fullscreenElement;
    if (!fs) { stopFsHover(); return; }
    const x = lastMoveX, y = lastMoveY;
    const found = findRpwAtPoint(x, y, fs);
    const word = found?.getAttribute('data-word') ?? null;

    if (word !== fsHoverWord) {
      // Mouse moved to different word — reset timer
      fsHoverWord = word;
      fsHoverSince = Date.now();
      if (hoverTimer) clearTimeout(hoverTimer);
      if (!word) hoverTimer = setTimeout(hideTip, 150);
    } else if (word && word !== currentWord && Date.now() - fsHoverSince >= 400) {
      // Stayed on same word for 400ms — show
      showTip(found!, x, y);
      fsHoverSince = Infinity; // prevent re-triggering until word changes
    }
  }, 120);
}

function stopFsHover(): void {
  if (fsHoverInterval) { clearInterval(fsHoverInterval); fsHoverInterval = null; }
}

document.addEventListener('fullscreenchange', () => {
  const fs = document.fullscreenElement;
  if (fs) {
    startFsHover();
    // Re-walk CC in case fullscreen recreated subtitle elements
    if (dict) setTimeout(() => walk(fs), 400);
  } else {
    stopFsHover();
    hideTip();
    // Return tip to body
    if (tip && tip.parentElement !== document.body) {
      document.body.appendChild(tip);
      tip.style.position = 'fixed';
    }
  }
});

// Normal mode: standard event-driven hover
document.addEventListener('mouseover', e => {
  if (document.fullscreenElement) return; // handled by interval above
  const rpw = (e.target as Element).closest?.('rp-w');
  if (!rpw) return;
  if (hoverTimer) clearTimeout(hoverTimer);
  hoverTimer = setTimeout(() => showTip(rpw, (e as MouseEvent).clientX, (e as MouseEvent).clientY), 380);
}, { capture: true });

document.addEventListener('mouseout', e => {
  if (document.fullscreenElement) return;
  const rpw = (e.target as Element).closest?.('rp-w');
  if (!rpw) return;
  const rel = e.relatedTarget as Element | null;
  if (rel?.closest?.('[data-ipa-ui]')) return;
  if (hoverTimer) clearTimeout(hoverTimer);
  hoverTimer = setTimeout(hideTip, 80);
}, { capture: true });

document.addEventListener('keydown', e => { if (e.key === 'Escape') { hideTip(); hideSelUI(); } });

// ── Activation ───────────────────────────────────────────────────


function syncBodyClasses(): void {
  const b = document.body;
  const enabled = !b.classList.contains('ipa-disabled');
  const map: [keyof IpaOpts, string][] = [
    ['silent',      'ipa-silent'],
    ['color_e',     'ipa-color-e'],
    ['color_i',     'ipa-color-i'],
    ['color_u_alt', 'ipa-color-u-alt'],
    ['color_a',     'ipa-color-a'],
    ['color_u',     'ipa-color-u'],
    ['color_o',     'ipa-color-o'],
    ['stress',      'ipa-st'],
    ['length',      'ipa-length'],
    ['diph_ai',     'ipa-diph-ai'],
    ['diph_ei_oi',  'ipa-diph-ei-oi'],
    ['diph_ou_au',  'ipa-diph-ou-au'],
    ['th_t',        'ipa-th-t'],
    ['th_d',        'ipa-th-d'],
    ['tmark',       'ipa-tmark'],
    ['zmark',       'ipa-zmark'],
    ['phonemes',    'ipa-phonemes'],
  ];
  for (const [key, cls] of map) b.classList.toggle(cls, enabled && opts[key]);
}

chrome.storage.onChanged.addListener(() => { void checkActivation(); });

async function checkActivation(): Promise<void> {
  const stored = await chrome.storage.sync.get(['ipa-settings']);
  const s = stored['ipa-settings'];

  if (s?.opts) opts = { ...opts, ...s.opts };
  if (s?.targetLanguage !== undefined) targetLanguage = s.targetLanguage;
  if (s?.translatePerSentence !== undefined) translatePerSentence = s.translatePerSentence;
  if (s?.pauseOnHover !== undefined) pauseOnHover = s.pauseOnHover;

  const isEnabled = s?.enabled !== false;
  const isBlacklisted = (s?.blacklist ?? []).includes(window.location.hostname);

  if (!isEnabled || isBlacklisted) {
    document.body.classList.add('ipa-disabled');
    hideTip();
  } else {
    document.body.classList.remove('ipa-disabled');
    if (!hasProcessed) { void init(); return; }
  }
  syncBodyClasses();
}

async function init(): Promise<void> {
  if (hasProcessed) return;
  // In sub-frames, only run if the frame actually contains a video player
  if (window !== window.top && !document.querySelector('video, [class*="caption"], [class*="subtitle"], [class*="transcript"]')) return;
  if (!document.body) return;

  const stored = await chrome.storage.sync.get(['ipa-settings']);
  const s = stored['ipa-settings'];
  if (s?.enabled === false || (s?.blacklist ?? []).includes(window.location.hostname)) {
    document.body.classList.add('ipa-disabled'); return;
  }
  hasProcessed = true;
  if (s?.opts) opts = { ...opts, ...s.opts };
  if (s?.targetLanguage) targetLanguage = s.targetLanguage;
  if (s?.translatePerSentence !== undefined) translatePerSentence = s.translatePerSentence;
  if (s?.pauseOnHover !== undefined) pauseOnHover = s.pauseOnHover;
  syncBodyClasses();
  try {
    const r = await fetch(chrome.runtime.getURL('pronunciation.json'));
    dict = await r.json() as Record<string, string>;
    walk(document.body);
    new MutationObserver(mutations => {
      for (const m of mutations) for (const node of m.addedNodes) {
        const el = node as Element;
        if (el.getAttribute?.('data-ipa-ui')) continue;
        if (el.id && IPA_ROOT_IDS.has(el.id)) continue;
        if ((node as Node).parentElement?.closest?.('[data-ipa-ui]')) continue;
        if (node.nodeType === Node.ELEMENT_NODE && !SKIP_TAGS.has(el.tagName)) walk(node);
        else if (node.nodeType === Node.TEXT_NODE) processTextNode(node as Text);
      }
    }).observe(document.body, { childList: true, subtree: true });
  } catch (e) { console.error('[IPA Stylizer]', e); }
}

void init();
