// IPA Pronunciation Stylizer — content script

const VOWEL_COLORS: Record<string, { c: string; t: string }> = {
  AH: { c: 'var(--ipa-purple)', t: 'color_u_alt' }, AA: { c: 'var(--ipa-purple)', t: 'color_u_alt' },
  AE: { c: 'var(--ipa-pink)', t: 'color_a' },
  EH: { c: 'var(--ipa-red)', t: 'color_e' }, ER: { c: 'var(--ipa-red)', t: 'color_e' },
  IH: { c: 'var(--ipa-green)', t: 'color_i' }, IY: { c: 'var(--ipa-green)', t: 'color_i' },
  UH: { c: 'var(--ipa-teal)', t: 'color_u' }, UW: { c: 'var(--ipa-teal)', t: 'color_u' },
  AO: { c: 'var(--ipa-orange)', t: 'color_o' },
  AY: { c: 'var(--ipa-pink)', t: 'color_a' }, EY: { c: 'var(--ipa-red)', t: 'color_e' },
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

let dict: Record<string, string> = {};
let baseforms: Record<string, string> | null = null;
let activeDialect: 'nAmE' | 'brE' | null = null;
let activeBaseformsSetting: boolean | null = null;
let isInit = false;
let mainObserver: MutationObserver | null = null;
let spaInterval: ReturnType<typeof setInterval> | null = null;

function isContextValid(): boolean {
  try { return !!chrome.runtime?.id; } catch { return false; }
}

function teardown(): void {
  if (spaInterval) { clearInterval(spaInterval); spaInterval = null; }
  if (mainObserver) { mainObserver.disconnect(); mainObserver = null; }
}

let opts: IpaOpts = {
  silent: true, color_e: true, color_i: true, color_u_alt: true, color_a: true,
  color_u: true, color_o: true, stress: true, tmark: true, th_t: true,
  zmark: true, diph_ai: true, diph_ei_oi: true, phonemes: true, th_d: true,
  diph_ou_au: true, length: true,
};
let targetLanguage = 'id';
let translatePerSentence = true;
let pauseOnHover = false;
let ankiEnabled = false;
let hasProcessed = false;
let videoShortcuts = { rewind: 'a', forward: 'd', playPause: 's' };

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
  if (!arpaStr) return '';
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
      if (arpa) sEl.setAttribute('data-silent', '1');
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
        for (const child of Array.from(el.childNodes)) traverse(child);
      }
    }
  }
  for (const child of Array.from(container.childNodes)) traverse(child);
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
  mainTranslation?: string;
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

    let mainTranslation = (data[0] as unknown[][])?.map(c => (c as unknown[])[0]).filter(Boolean).join('') ?? '';

    // If main translation is empty or matches original word, try prefix-based hyphenated fallback
    const queryWord = word.toLowerCase().trim();
    const transWord = mainTranslation.toLowerCase().trim();
    if (!posList.length && (transWord === queryWord || !transWord)) {
      const PREFIXES = [
        'non', 'un', 're', 'dis', 'anti', 'post', 'pre', 'co', 'sub', 'super',
        'de', 'mis', 'over', 'under', 'semi', 'micro', 'macro', 'multi', 'inter',
        'infra', 'ultra', 'counter', 'extra', 'hyper', 'hypo', 'mega', 'mini',
        'mono', 'poly', 'pro', 'bi', 'tri'
      ];
      for (const prefix of PREFIXES) {
        if (queryWord.startsWith(prefix) && queryWord.length > prefix.length + 2) {
          const hyphenated = prefix + '-' + word.slice(prefix.length);
          try {
            const hUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${encodeURIComponent(lang)}&dt=t&q=${encodeURIComponent(hyphenated)}`;
            const hr = await fetch(hUrl);
            if (hr.ok) {
              const hData = await hr.json() as unknown[][];
              const hTrans = (hData[0] as unknown[][])?.map(c => (c as unknown[])[0]).filter(Boolean).join('') ?? '';
              const hTransLower = hTrans.toLowerCase().trim();
              if (hTransLower && hTransLower !== hyphenated.toLowerCase().trim() && hTransLower !== queryWord) {
                mainTranslation = hTrans;
                break;
              }
            }
          } catch (e) {
            console.error('[IPA Stylizer] Prefix translation error:', e);
          }
        }
      }
    }

    wordDataCache[key] = { posList, mainTranslation };
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
  tab: 'flex:1;padding:6px 2px;border:none;background:none;cursor:pointer;font-size:.62rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;transition:color .1s,border-color .1s;',
  tabOn: 'color:#e8a351;border-bottom:2px solid #e8a351;',
  tabOff: 'color:#8c887a;border-bottom:2px solid transparent;',
};

let tip: HTMLDivElement | null = null;
let hoverTimer: ReturnType<typeof setTimeout> | null = null;
let currentWord: string | null = null;
const defCache: Record<string, unknown> = {};
let activeRenderContent: ((word: string, arpa: string) => void) | null = null;
let lastMoveX = 0, lastMoveY = 0;
let lastClickTime = 0;

let mouseInTip = false;

function isOwnEl(node: Node | null): boolean {
  if (!node) return false;
  const el = node as Element;
  return !!(el.id && IPA_ROOT_IDS.has(el.id)) || !!el.closest?.('[data-ipa-ui]');
}

// ── Phrasal Verbs Detection ──────────────────────────────────────

const PHRASAL_PARTICLES = new Set([
  'up', 'down', 'in', 'out', 'on', 'off', 'away', 'back', 'over', 'through',
  'about', 'around', 'across', 'along', 'by', 'forward', 'to', 'with', 'into', 'onto', 'for', 'after', 'aside'
]);

const EXCLUDED_FIRST_WORDS = new Set([
  'the', 'a', 'an', 'and', 'but', 'or', 'nor', 'for', 'yet', 'so',
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
  'my', 'your', 'his', 'its', 'our', 'their', 'mine', 'yours', 'hers', 'ours', 'theirs',
  'this', 'that', 'these', 'those', 'who', 'whom', 'whose', 'which', 'what',
  'in', 'on', 'at', 'to', 'for', 'with', 'by', 'about', 'like', 'through', 'over', 'before', 'between', 'after', 'since', 'without', 'under', 'within', 'along', 'following', 'against', 'during',
  'very', 'too', 'so', 'not', 'no', 'yes', 'oh', 'ah', 'well'
]);

const COMMON_PHRASAL_VERBS = new Set([
  'add up', 'ask around', 'back up', 'blow up', 'break down', 'break in', 'break up', 'bring up', 'call off', 'calm down',
  'catch up', 'check in', 'check out', 'clean up', 'come across', 'cut off', 'drop off', 'end up', 'fall apart', 'figure out',
  'find out', 'get along', 'get over', 'give up', 'go on', 'grow up', 'hang out', 'hold on', 'look after', 'look forward to',
  'make up', 'pick up', 'put off', 'put up with', 'run out of', 'set up', 'show up', 'take off', 'turn down', 'work out',
  'bring about', 'bring down', 'bring on', 'carry out', 'carry on', 'cheer up', 'close down', 'come along', 'come back', 'come down',
  'come in', 'come out', 'come up', 'draw up', 'fall down', 'fall out', 'fill in', 'fill out', 'get away', 'get back',
  'get down', 'get in', 'get off', 'get out', 'get up', 'give away', 'give back', 'give in', 'go back', 'go down',
  'go in', 'go off', 'go out', 'go up', 'grow old', 'hand in', 'hand out', 'hang up', 'hold up', 'keep up',
  'let down', 'look back', 'look down', 'look for', 'look forward', 'look in', 'look out', 'look up', 'make out', 'pass out',
  'point out', 'pull off', 'pull through', 'put back', 'put down', 'put in', 'put on', 'put out', 'put up', 'run away',
  'run into', 'run over', 'send back', 'set off', 'set out', 'shut down', 'take back', 'take in', 'take on', 'take out',
  'take over', 'take up', 'throw away', 'turn back', 'turn in', 'turn off', 'turn on', 'turn out', 'turn up', 'wake up',
  'walk away', 'walk in', 'walk out', 'warm up', 'watch out', 'wear off', 'wear out', 'wipe out', 'write down',
  'look into', 'work around', 'narrow down', 'sort out', 'roll out', 'hand off', 'come up with', 'log in', 'log out', 'log on', 'log off',
  'boot up', 'plug in'
]);

function findNextRpw(el: Element, maxDistance = 3): Element | null {
  let curr: Node | null = el;
  let textBetween = '';
  while (curr && maxDistance > 0) {
    curr = curr.nextSibling;
    if (!curr) break;
    if (curr.nodeType === Node.ELEMENT_NODE) {
      const cel = curr as Element;
      if (cel.tagName === 'RP-W') return cel;
      const found = cel.querySelector('rp-w');
      if (found) return found;
      maxDistance--;
    } else if (curr.nodeType === Node.TEXT_NODE) {
      textBetween += curr.textContent || '';
      if (/[.?!;]/.test(textBetween)) return null;
    }
  }
  return null;
}

function getPhrasalCandidates(wordEl: Element): string[] {
  const result: string[] = [];
  const base = wordEl.getAttribute('data-word') || wordEl.textContent?.trim() || '';
  const cleanBase = base.replace(/^'+|'+$/g, '').toLowerCase();
  if (!cleanBase) return [];

  const nextEl = findNextRpw(wordEl);
  if (!nextEl) return [];
  const nextWord = (nextEl.getAttribute('data-word') || nextEl.textContent?.trim() || '').replace(/^'+|'+$/g, '').toLowerCase();
  if (!nextWord) return [];

  const baseWordInflection = (baseforms && baseforms[cleanBase]) ? baseforms[cleanBase].toLowerCase() : cleanBase;

  result.push(`${baseWordInflection} ${nextWord}`);
  if (baseWordInflection !== cleanBase) {
    result.push(`${cleanBase} ${nextWord}`);
  }

  const next2El = findNextRpw(nextEl);
  if (next2El) {
    const next2Word = (next2El.getAttribute('data-word') || next2El.textContent?.trim() || '').replace(/^'+|'+$/g, '').toLowerCase();
    if (next2Word) {
      result.push(`${baseWordInflection} ${nextWord} ${next2Word}`);
      if (baseWordInflection !== cleanBase) {
        result.push(`${cleanBase} ${nextWord} ${next2Word}`);
      }
    }
  }

  return result;
}

function detectPhrasalVerb(wordEl: Element): string | null {
  const candidates = getPhrasalCandidates(wordEl);
  if (!candidates.length) return null;

  // 1. Check if the candidate exists in the loaded .txt dictionary (e.g. "take in")
  for (const cand of [...candidates].reverse()) {
    if (dict && dict[cand]) {
      return cand;
    }
  }

  // 2. Check if the candidate matches our common phrasal verbs list
  for (const cand of [...candidates].reverse()) {
    if (COMMON_PHRASAL_VERBS.has(cand)) {
      return cand;
    }
  }

  // 3. Dynamic pattern matching: [not EXCLUDED_FIRST_WORDS] + particle
  for (const cand of [...candidates].reverse()) {
    const parts = cand.split(' ');
    const firstWord = parts[0];
    if (EXCLUDED_FIRST_WORDS.has(firstWord)) continue;

    if (parts.length === 3) {
      if (PHRASAL_PARTICLES.has(parts[1]) && PHRASAL_PARTICLES.has(parts[2])) {
        return cand;
      }
    } else if (parts.length === 2) {
      if (PHRASAL_PARTICLES.has(parts[1])) {
        return cand;
      }
    }
  }

  return null;
}

function getRelatedForms(word: string): string[] {
  const wLower = word.toLowerCase();
  const formsSet = new Set<string>();
  formsSet.add(wLower);
  if (baseforms) {
    const baseWord = baseforms[wLower] || wLower;
    formsSet.add(baseWord);
    for (const key in baseforms) {
      if (Object.prototype.hasOwnProperty.call(baseforms, key)) {
        if (baseforms[key] === baseWord) {
          formsSet.add(key);
        }
      }
    }
  }
  return Array.from(formsSet).sort();
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
    'background:#22211c', 'border:1px solid #3e3c33',
    'border-radius:14px',
    'box-shadow:0 16px 48px rgba(0,0,0,.7),0 2px 8px rgba(0,0,0,.4)',
    `width:${TIP_W}px`, 'font-family:system-ui,sans-serif',
    'color:#fdfbf6', 'display:none', 'overflow:hidden',
    'transition:opacity .15s,transform .15s',
    'opacity:0', 'transform:translateY(6px)', 'pointer-events:none',
  ].join(';');
  tip.addEventListener('mouseenter', () => {
    mouseInTip = true;
    if (hoverTimer) clearTimeout(hoverTimer);
  });
  tip.addEventListener('mouseleave', e => {
    mouseInTip = false;
    const rel = e.relatedTarget as Element | null;
    if (rel && (rel.closest?.('rp-w') || (tip && tip.contains(rel)))) return;

    const timePassed = Date.now() - lastClickTime;
    if (timePassed < 500) {
      setTimeout(() => {
        if (!mouseInTip && currentWord) {
          hideTip();
        }
      }, 500 - timePassed);
      return;
    }

    hideTip();
  });
  tip.addEventListener('click', e => {
    lastClickTime = Date.now();
    const pill = (e.target as Element).closest('.__ipa_form_pill__');
    if (pill && activeRenderContent) {
      const targetWord = pill.getAttribute('data-word');
      if (targetWord) {
        const targetArpa = dict[targetWord.toLowerCase()] || '';
        activeRenderContent(targetWord, targetArpa);
      }
    }
  }, { capture: true });
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
  if (v && v.paused) v.play().catch(() => { });
}

async function playPronunciation(word: string): Promise<void> {
  const btn = document.getElementById('__ipa_speak_btn__') as HTMLButtonElement | null;

  if (ttsActive) {
    stopCurrent();
    ttsActive = false;
    if (btn) { btn.style.color = '#8c887a'; btn.style.transform = 'scale(1)'; }
    return;
  }

  // Resume AudioContext inside user gesture
  const ctx = getAudioCtx();
  if (ctx.state === 'suspended') await ctx.resume();

  if (btn) { btn.style.color = '#e8a351'; btn.style.transform = 'scale(1.15)'; btn.style.opacity = '0.6'; }

  if (!isContextValid()) { if (btn) { btn.style.color = '#8c887a'; btn.style.transform = 'scale(1)'; btn.style.opacity = '1'; } return; }
  chrome.runtime.sendMessage({ type: 'TTS_FETCH', word }, (response: { base64?: string; mimeType?: string; error?: string } | undefined) => {
    if (!response?.base64) {
      if (btn) { btn.style.color = '#8c887a'; btn.style.transform = 'scale(1)'; btn.style.opacity = '1'; }
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
      if (btn) { btn.style.color = '#e8a351'; btn.style.transform = 'scale(1.2)'; btn.style.opacity = '1'; }
      src.onended = () => {
        ttsActive = false;
        currentSource = null;
        if (btn) { btn.style.color = '#8c887a'; btn.style.transform = 'scale(1)'; btn.style.opacity = '1'; }
      };
      src.start(0);
    }, () => {
      ttsActive = false;
      if (btn) { btn.style.color = '#8c887a'; btn.style.transform = 'scale(1)'; btn.style.opacity = '1'; }
    });
  });
}

function buildTipHTML(word: string, ipa: string, baseWord: string | null = null, phrasalVerb: string | null = null, activeTab = 'definition'): string {
  return (
    // Style block for scrollbars
    `<style>` +
    `#__ipa_body__::-webkit-scrollbar{width:6px}` +
    `#__ipa_body__::-webkit-scrollbar-track{background:transparent}` +
    `#__ipa_body__::-webkit-scrollbar-thumb{background:#3e3c33;border-radius:3px}` +
    `#__ipa_body__::-webkit-scrollbar-thumb:hover{background:#e8a351}` +
    `</style>` +
    // Header
    `<div style="padding:14px 16px 0">` +
    `<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px">` +
    // Left: speaker + word + optionally baseform
    `<div style="display:flex;flex-direction:column;gap:2px">` +
    `<div style="display:flex;align-items:center;gap:8px">` +
    `<button id="__ipa_speak_btn__" title="Play pronunciation" style="background:none;border:none;cursor:pointer;color:#8c887a;padding:2px;display:flex;align-items:center;transition:color .15s,transform .15s;flex-shrink:0">${SPEAK_ICON}</button>` +
    `<span style="font-size:1.25rem;font-weight:800;color:#fdfbf6;letter-spacing:.01em;font-family:'Fraunces', Georgia, serif">${word.toLowerCase()}</span>` +
    `</div>` +
    (baseWord ? `<div style="font-size:.72rem;color:#8c887a;margin-left:25px">Base: <span id="__ipa_baseform_link__" style="text-decoration:underline dotted;text-decoration-color:#e8a351;text-underline-offset:3px;cursor:pointer;color:#e8a351;font-weight:600">${baseWord.toLowerCase()}</span></div>` : '') +
    (phrasalVerb ? `<div style="font-size:.72rem;color:#8c887a;margin-left:25px">Phrase: <span id="__ipa_phrasal_link__" style="text-decoration:underline dotted;text-decoration-color:#e8a351;text-underline-offset:3px;cursor:pointer;color:#e8a351;font-weight:600">${phrasalVerb.toLowerCase()}</span></div>` : '') +
    `</div>` +
    // Right: IPA & Anki
    `<div style="display:flex;align-items:center;gap:6px;justify-content:flex-end">` +
    `<span id="__ipa_header_ipa__" style="font-size:.9rem;color:#c7c3b5;font-style:italic;letter-spacing:.02em;white-space:nowrap;padding-top:4px">${ipa}</span>` +
    (ankiEnabled ? `<button id="__ipa_anki_btn__" title="Save to Anki" style="background:none;border:none;cursor:pointer;color:#8c887a;padding:2px;display:flex;align-items:center;transition:color .15s,transform .15s;margin-top:2px"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg></button>` : '') +
    `</div>` +
    `</div>` +
    // POS translations area
    `<div id="__ipa_pos_area__" style="margin-top:8px;min-height:32px;font-size:.84rem;line-height:1.65">` +
    `<span style="color:#8c887a">Loading…</span>` +
    `</div>` +
    // Sentence translation
    `<div id="__ipa_sent__" style="margin:8px 0 14px;font-size:.8rem;color:#e8a351;font-style:italic;min-height:14px"></div>` +
    `</div>` +
    // Tabs
    `<div style="display:flex;border-top:1px solid #3e3c33;border-bottom:1px solid #3e3c33;background:#1a1915">` +
    `<button data-tab="definition" style="${S.tab}${activeTab === 'definition' ? S.tabOn : S.tabOff}">Definition</button>` +
    `<button data-tab="forms"      style="${S.tab}${activeTab === 'forms' ? S.tabOn : S.tabOff}">Forms</button>` +
    `<button data-tab="examples"   style="${S.tab}${activeTab === 'examples' ? S.tabOn : S.tabOff}">Examples</button>` +
    `<button data-tab="slang"      style="${S.tab}${activeTab === 'slang' ? S.tabOn : S.tabOff}">Slang</button>` +
    `<button data-tab="search"     style="${S.tab}${activeTab === 'search' ? S.tabOn : S.tabOff}">Search</button>` +
    `</div>` +
    // Body
    `<div id="__ipa_body__" style="padding:10px 16px;min-height:42px;max-height:200px;overflow-y:auto;font-size:.84rem;color:#c7c3b5;line-height:1.55">` +
    `<span style="color:#8c887a">Loading…</span>` +
    `</div>`
  );
}

function renderPosArea(posList: Array<{ pos: string; translations: string[] }>, lang: string, mainTranslation?: string): void {
  const area = document.getElementById('__ipa_pos_area__');
  if (!area) return;
  if (lang === 'none') { area.innerHTML = ''; return; }

  if (posList && posList.length > 0) {
    area.innerHTML = posList.map(({ pos, translations }) =>
      `<div style="display:flex;gap:10px;align-items:baseline">` +
      `<span style="font-size:.72rem;font-weight:700;color:#8c887a;text-transform:uppercase;letter-spacing:.06em;min-width:32px;flex-shrink:0">${posAbbr(pos)}</span>` +
      `<span style="color:#c7c3b5">${translations.join(', ')}</span>` +
      `</div>`
    ).join('');
    return;
  }

  // Fallback if posList is empty
  const queryWord = currentWord ? currentWord.toLowerCase().trim() : '';
  const transWord = mainTranslation ? mainTranslation.toLowerCase().trim() : '';
  if (transWord && transWord !== queryWord) {
    area.innerHTML = `<div style="display:flex;gap:10px;align-items:baseline">` +
      `<span style="font-size:.72rem;font-weight:700;color:#8c887a;text-transform:uppercase;letter-spacing:.06em;min-width:32px;flex-shrink:0">tr</span>` +
      `<span style="color:#c7c3b5">${mainTranslation}</span>` +
      `</div>`;
    return;
  }

  area.innerHTML = '';
}

function renderSentence(translated: string): void {
  const el = document.getElementById('__ipa_sent__');
  if (!el) return;
  el.textContent = translated ? `"${translated.toUpperCase()}"` : '';
}

async function renderTab(tab: string, word: string, data: unknown, forceTranslate = false): Promise<void> {
  const body = document.getElementById('__ipa_body__');
  if (!body) return;

  const canTranslate = targetLanguage && targetLanguage !== 'none' && targetLanguage !== 'en';
  const shouldTranslate = canTranslate && forceTranslate;

  if (tab === 'definition') {
    if (!data) { body.innerHTML = '<span style="color:#8c887a">No definition found.</span>'; return; }
    const arr = data as Array<{ meanings?: Array<{ partOfSpeech?: string; definitions?: Array<{ definition?: string; example?: string }> }> }>;
    const meanings = arr[0]?.meanings ?? [];
    if (!meanings.length) { body.innerHTML = '<span style="color:#8c887a">—</span>'; return; }

    // removed: if (shouldTranslate) body.innerHTML = '<span style="color:#8c887a">Translating...</span>';

    let html = '';
    for (const m of meanings.slice(0, 3)) {
      let pos = m.partOfSpeech ?? '';
      let def = m.definitions?.[0]?.definition ?? '';
      let ex = m.definitions?.[0]?.example ?? '';

      if (shouldTranslate) {
        if (pos) { const tPos = await translate(pos, targetLanguage); if (tPos) pos = tPos; }
        if (def) { const tDef = await translate(def, targetLanguage); if (tDef) def = tDef; }
        if (ex) { const tEx = await translate(ex, targetLanguage); if (tEx) ex = tEx; }
      }

      html += `<div style="margin-bottom:8px">` +
        `<span style="font-size:.7rem;font-weight:700;color:#8c887a;text-transform:uppercase;letter-spacing:.06em">${pos}</span>` +
        `<p style="color:#fdfbf6;margin:2px 0">${def}</p>` +
        (ex ? `<p style="color:#c7c3b5;font-style:italic;font-size:.8rem">"${ex}"</p>` : '') +
        `</div>`;
    }

    if (canTranslate && !shouldTranslate) {
      html += `<button id="__ipa_tab_translate_btn__" style="margin-top:4px;background:none;color:#e8a351;border:1px solid #e8a351;border-radius:4px;padding:4px 8px;font-size:.75rem;cursor:pointer;font-weight:600;transition:all .15s" onmouseover="this.style.background='#e8a351';this.style.color='#1a1915'" onmouseout="this.style.background='none';this.style.color='#e8a351'">Translate</button>`;
    }

    if (currentWord === word) {
      body.innerHTML = html;
      if (canTranslate && !shouldTranslate) {
        const btn = document.getElementById('__ipa_tab_translate_btn__');
        if (btn) btn.addEventListener('click', () => {
          btn.textContent = 'Translating...';
          btn.style.pointerEvents = 'none';
          btn.style.opacity = '0.7';
          void renderTab(tab, word, data, true);
        });
      }
    }
  } else if (tab === 'examples') {
    const arr = data as Array<{ meanings?: Array<{ definitions?: Array<{ example?: string }> }> }>;
    const exs = arr?.[0]?.meanings?.flatMap(m => m.definitions ?? []).map(d => d.example).filter(Boolean).slice(0, 4);

    if (!exs?.length) {
      body.innerHTML = '<span style="color:#8c887a">No examples.</span>';
      return;
    }

    // removed: if (shouldTranslate) body.innerHTML = '<span style="color:#8c887a">Translating...</span>';

    let html = '';
    for (const ex of exs) {
      let text = ex;
      if (shouldTranslate && text) {
        const tText = await translate(text, targetLanguage);
        if (tText) text = tText;
      }
      html += `<p style="margin-bottom:8px;border-left:2px solid #504d41;padding-left:10px;font-style:italic;color:#c7c3b5">${text}</p>`;
    }

    if (canTranslate && !shouldTranslate) {
      html += `<button id="__ipa_tab_translate_btn__" style="margin-top:4px;background:none;color:#e8a351;border:1px solid #e8a351;border-radius:4px;padding:4px 8px;font-size:.75rem;cursor:pointer;font-weight:600;transition:all .15s" onmouseover="this.style.background='#e8a351';this.style.color='#1a1915'" onmouseout="this.style.background='none';this.style.color='#e8a351'">Translate</button>`;
    }

    if (currentWord === word) {
      body.innerHTML = html;
      if (canTranslate && !shouldTranslate) {
        const btn = document.getElementById('__ipa_tab_translate_btn__');
        if (btn) btn.addEventListener('click', () => {
          btn.textContent = 'Translating...';
          btn.style.pointerEvents = 'none';
          btn.style.opacity = '0.7';
          void renderTab(tab, word, data, true);
        });
      }
    }
  } else if (tab === 'forms') {
    body.innerHTML = '<span style="color:#8c887a">Loading forms...</span>';
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_RELATED_FORMS',
        word: word,
        dialect: activeDialect || 'nAmE'
      }) as { forms?: string[]; dict?: Record<string, string>; error?: string } | undefined;

      if (currentWord !== word) return;

      if (response && response.forms) {
        if (response.dict) {
          Object.assign(dict, response.dict);
        }

        const forms = response.forms;
        if (!forms.length) {
          body.innerHTML = '<span style="color:#8c887a">No related forms found.</span>';
          return;
        }
        let html = '<div style="display:flex;flex-wrap:wrap;margin:-4px;">';
        for (const f of forms) {
          const fLower = f.toLowerCase();
          const arpa = dict[fLower] || '';
          const ipa = toIPA(arpa);
          const isActive = fLower === word.toLowerCase();

          const pillStyle = isActive
            ? `background:#3e3c33;border:1px solid #e8a351;border-radius:20px;padding:6px 12px;margin:4px;color:#e8a351;cursor:default;font-size:.8rem;display:inline-flex;align-items:center;gap:6px;`
            : `background:#2d2a22;border:1px solid #3e3c33;border-radius:20px;padding:6px 12px;margin:4px;color:#fdfbf6;cursor:pointer;font-size:.8rem;transition:all .15s;display:inline-flex;align-items:center;gap:6px;`;

          const hoverEvents = isActive
            ? ''
            : ` onmouseover="this.style.background='#3e3c33';this.style.borderColor='#e8a351'" onmouseout="this.style.background='#2d2a22';this.style.borderColor='#3e3c33'"`;

          html += `<button class="__ipa_form_pill__" data-word="${f}" style="${pillStyle}"${hoverEvents}>` +
            `<span style="font-weight:600;border-bottom:1px dotted #e8a351;">${f}</span>` +
            (ipa ? `<span style="font-size:.7rem;color:#8c887a;font-style:italic;">${ipa}</span>` : '') +
            `</button>`;
        }
        html += '</div>';
        body.innerHTML = html;
      } else {
        body.innerHTML = '<span style="color:#8c887a">No related forms found.</span>';
      }
    } catch (e) {
      console.error('[IPA Stylizer] Error fetching forms:', e);
      body.innerHTML = '<span style="color:#8c887a">Error loading forms.</span>';
    }
  } else if (tab === 'slang') {
    const udUrl = `https://www.urbandictionary.com/define.php?term=${encodeURIComponent(word)}`;
    body.innerHTML = `<a href="${udUrl}" target="_blank" style="color:#e8a351;text-decoration:none;display:block;margin-bottom:8px">&#x1F4AC; Urban Dictionary: "${word}"</a>` +
      `<p style="color:#8c887a;font-size:.8rem">Slang, informal, and colloquial meanings.</p>`;
  } else {
    const gUrl = `https://www.google.com/search?q=${encodeURIComponent(word + ' pronunciation')}`;
    const mUrl = `https://www.merriam-webster.com/dictionary/${encodeURIComponent(word)}`;
    body.innerHTML =
      `<a href="${gUrl}" target="_blank" style="color:#e8a351;text-decoration:none;display:block;margin-bottom:8px">&#x1F50D; Google: "${word} pronunciation"</a>` +
      `<a href="${mUrl}" target="_blank" style="color:#e8a351;text-decoration:none;display:block">&#x1F4D6; Merriam-Webster</a>`;
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
  if (currentWord === word) {
    let activeTabName = 'definition';
    if (tip) {
      const activeBtn = Array.from(tip.querySelectorAll('button[data-tab]')).find(
        btn => (btn as HTMLElement).style.color === 'rgb(232, 163, 81)' || (btn as HTMLElement).style.color === '#e8a351'
      ) as HTMLElement | null;
      if (activeBtn) {
        activeTabName = activeBtn.dataset.tab || 'definition';
      }
    }
    if (activeTabName === 'definition' || activeTabName === 'examples') {
      void renderTab(activeTabName, word, defCache[key]);
    }
    const data = defCache[key];
    if (data) {
      const arr = data as Array<{ phonetic?: string; phonetics?: Array<{ text?: string }> }>;
      let fetchedIpa = arr[0]?.phonetic || '';
      if (!fetchedIpa && arr[0]?.phonetics) {
        const found = arr[0].phonetics.find(p => p.text);
        if (found) fetchedIpa = found.text || '';
      }
      if (fetchedIpa) {
        if (!fetchedIpa.startsWith('/')) fetchedIpa = '/' + fetchedIpa + '/';
        const ipaSpan = document.getElementById('__ipa_header_ipa__');
        if (ipaSpan && !ipaSpan.textContent) {
          ipaSpan.textContent = fetchedIpa;
        }
      }
    }
  }
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
  const originalWord = wordEl.getAttribute('data-word');
  const originalArpa = wordEl.getAttribute('data-arpa');
  if (!originalWord) return;

  maybePauseVideo();

  const detectedPhrasal = detectPhrasalVerb(wordEl);

  const renderContent = (displayWord: string, displayArpa: string) => {
    currentWord = displayWord;
    activeRenderContent = renderContent;
    const t = getTip();

    const wLower = displayWord.toLowerCase();
    const baseWord = (baseforms && baseforms[wLower]) ? baseforms[wLower] : null;
    const hasBaseForm = baseWord && baseWord.toLowerCase() !== wLower;
    const phrasalVerb = (displayWord.toLowerCase() === originalWord.toLowerCase()) ? detectedPhrasal : null;

    let activeTabName = 'definition';
    const activeBtn = Array.from(t.querySelectorAll('button[data-tab]')).find(
      btn => (btn as HTMLElement).style.color === 'rgb(232, 163, 81)' || (btn as HTMLElement).style.color === '#e8a351'
    ) as HTMLElement | null;
    if (activeBtn) {
      activeTabName = activeBtn.dataset.tab || 'definition';
    }

    t.innerHTML = buildTipHTML(displayWord, toIPA(displayArpa ?? ''), hasBaseForm ? baseWord : null, phrasalVerb, activeTabName);
    t.style.pointerEvents = 'auto';

    // Wire up speaker button
    const speakBtn = t.querySelector('#__ipa_speak_btn__') as HTMLButtonElement | null;
    if (speakBtn) {
      speakBtn.addEventListener('click', e => { e.stopPropagation(); playPronunciation(displayWord); });
    }

    // Wire up Anki button
    const ankiBtn = t.querySelector('#__ipa_anki_btn__') as HTMLButtonElement | null;
    if (ankiBtn) {
      ankiBtn.addEventListener('click', e => {
        e.stopPropagation();
        const ipaSpan = t.querySelector('#__ipa_header_ipa__');
        const ipaVal = ipaSpan?.textContent || '';
        void saveToAnki(displayWord, ipaVal, defCache[displayWord.toLowerCase()]);
      });
    }

    // Wire up tabs
    t.querySelectorAll('[data-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        t.querySelectorAll('[data-tab]').forEach(b => ((b as HTMLElement).style.cssText = S.tab + S.tabOff));
        (btn as HTMLElement).style.cssText = S.tab + S.tabOn;
        void renderTab((btn as HTMLElement).dataset.tab!, displayWord, defCache[displayWord.toLowerCase()]);
      });
    });

    // Wire up baseform link if present
    const baseformLink = t.querySelector('#__ipa_baseform_link__') as HTMLElement | null;
    if (baseformLink && baseWord) {
      baseformLink.addEventListener('click', e => {
        e.stopPropagation();
        const baseArpa = dict[baseWord.toLowerCase()] || '';
        renderContent(baseWord, baseArpa);
      });
    }

    // Wire up phrasal verb link if present
    const phrasalLink = t.querySelector('#__ipa_phrasal_link__') as HTMLElement | null;
    if (phrasalLink && phrasalVerb) {
      phrasalLink.addEventListener('click', e => {
        e.stopPropagation();
        renderContent(phrasalVerb, '');
      });
    }

    // Ensure tip is in correct parent (body or fullscreen element)
    const parent = tipParent();
    if (tip && tip.parentElement !== parent) parent.appendChild(tip);

    posTip(mouseX, mouseY);
    t.style.display = 'block';

    // Parallel fetches
    const lang = targetLanguage;

    // Render active tab immediately if possible
    if (activeTabName !== 'definition' && activeTabName !== 'examples') {
      void renderTab(activeTabName, displayWord, defCache[wLower]);
    } else if (wLower in defCache) {
      void renderTab(activeTabName, displayWord, defCache[wLower]);
    }

    // 1. Definition (always)
    void fetchDictDef(displayWord);

    // 2. Word POS translations
    if (lang && lang !== 'none') {
      void fetchWordData(displayWord, lang).then(data => {
        if (currentWord !== displayWord) return;
        renderPosArea(data.posList, lang, data.mainTranslation);
      });
    }
  };

  const t = getTip();
  renderContent(originalWord, originalArpa ?? '');

  t.style.transform = 'translateY(6px)'; t.style.opacity = '0';
  requestAnimationFrame(() => { t.style.opacity = '1'; t.style.transform = 'translateY(0)'; });

  // 3. Sentence from DOM → translate (always based on original wordEl)
  const lang = targetLanguage;
  if (lang && lang !== 'none') {
    const sentence = extractSentence(wordEl);
    if (sentence) {
      void translate(sentence, lang).then(result => {
        if (!currentWord) return;
        renderSentence(result);
      });
    }
  }
}

function hideTip(): void {
  if (!tip) return;
  mouseInTip = false;
  currentWord = null;
  activeRenderContent = null;
  stopCurrent();
  ttsActive = false;
  maybeResumeVideo();
  tip.style.opacity = '0'; tip.style.transform = 'translateY(6px)'; tip.style.pointerEvents = 'none';
  setTimeout(() => { if (!currentWord && tip) tip.style.display = 'none'; }, 150);
}

async function saveToAnki(word: string, ipa: string, data: unknown): Promise<void> {
  const ankiBtn = document.getElementById('__ipa_anki_btn__') as HTMLButtonElement | null;
  if (ankiBtn) {
    ankiBtn.style.color = '#e8a351';
    ankiBtn.style.transform = 'scale(1.15)';
  }

  let defText = '';
  if (data) {
    const arr = data as Array<{ meanings?: Array<{ definitions?: Array<{ definition?: string; example?: string }> }> }>;
    defText = arr[0]?.meanings?.[0]?.definitions?.[0]?.definition ?? '';
  }

  if (!isContextValid()) return;
  chrome.runtime.sendMessage({ type: 'ANKI_ADD_CARD', word, ipa, definition: defText }, (response: { error?: string; ok?: boolean; isDuplicate?: boolean } | undefined) => {
    if (ankiBtn) {
      if (response?.ok) {
        if (response.isDuplicate) {
          ankiBtn.style.color = '#da892b';
          ankiBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>`;
          ankiBtn.title = 'Saved to Anki (Duplicate card)';
        } else {
          ankiBtn.style.color = '#a3e851';
          ankiBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>`;
          ankiBtn.title = 'Saved to Anki';
        }
      } else {
        ankiBtn.style.color = '#e34d52';
        ankiBtn.title = response?.error ?? 'Error saving to Anki';
      }
      setTimeout(() => { ankiBtn.style.transform = 'scale(1)'; }, 200);
    }
  });
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
    'background:#da892b', 'color:#fff',
    'font-family:system-ui,sans-serif', 'font-size:12px', 'font-weight:700',
    'padding:5px 12px', 'border-radius:6px', 'cursor:pointer',
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
    'background:#22211c', 'border:1px solid #3e3c33',
    'border-radius:10px', 'box-shadow:0 8px 30px rgba(0,0,0,.5)',
    'font-family:system-ui,sans-serif', 'font-size:14px', 'color:#fdfbf6',
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
  st.innerHTML = `<div style="color:#8c887a;font-size:.75rem;margin-bottom:6px;text-transform:uppercase;letter-spacing:.05em">Translating…</div>`;

  const result = await translate(text, targetLanguage);
  st.innerHTML = result
    ? `<div style="color:#8c887a;font-size:.75rem;margin-bottom:6px;text-transform:uppercase;letter-spacing:.05em">Translation</div>` +
    `<div style="color:#fdfbf6">${result}</div>` +
    `<div style="color:#8c887a;font-size:.75rem;margin-top:6px;font-style:italic">"${text.length > 60 ? text.slice(0, 60) + '…' : text}"</div>`
    : `<div style="color:#e34d52">Translation failed.</div>`;
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

document.addEventListener('mousedown', e => {
  if (!isOwnEl(e.target as Node)) {
    hideSelUI();
    const rpw = (e.target as Element).closest?.('rp-w');
    if (!rpw) hideTip();
  }
});

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
  if (depth > 2 || !isInit) return null;
  const w = word.toLowerCase();
  if (baseforms) {
    const base = baseforms[w];
    if (base && dict[base.toLowerCase()]) {
      return dict[base.toLowerCase()];
    }
  }
  const getStem = (s: string) => dict![s] || (baseforms?.[s] && dict![baseforms[s].toLowerCase()]) || guessPronunciation(s, depth + 1);
  if (w.endsWith('ization')) { const s = getStem(w.slice(0, -7) + 'ize'); if (s) return s.replace(/\s+-\s*$/, ' EY1 SH - AX0 N'); }
  if (w.endsWith('ation')) { const s = getStem(w.slice(0, -5) + 'ate'); if (s) return s.replace(/\s+-\s*$/, ' EY1 SH - AX0 N'); }
  if (w.endsWith('ing')) { const s = getStem(w.slice(0, -3) + 'e'); if (s) return s.replace(/\s+-\s*$/, ' IH0 NG -'); }
  if (w.endsWith('ed')) { const s = getStem(w.slice(0, -2) + 'e'); if (s) return s + ' D'; }
  if (w.endsWith('ies')) { const s = getStem(w.slice(0, -3) + 'y'); if (s) { const t = s.split(/\s+/); const l = t.pop(); return t.join(' ') + ' ' + l + ' - Z'; } }
  if (w.endsWith('ily')) { const s = getStem(w.slice(0, -3) + 'y'); if (s) { const t = s.split(/\s+/); const l = t.pop(); return t.join(' ') + ' ' + l + ' L IY0'; } }
  if (w.endsWith('able')) { const s = getStem(w.slice(0, -4) + 'e'); if (s) return s.replace(/\s+-\s*$/, ' AX0 B L -'); }
  if (w.endsWith('ible')) { const s = getStem(w.slice(0, -4) + 'e'); if (s) return s.replace(/\s+-\s*$/, ' IH0 B L -'); }
  for (const suf of SUFFIXES) { if (w.endsWith(suf.s)) { const s = getStem(w.slice(0, -suf.s.length)); if (s) return s + ' ' + suf.t; } }
  for (const pre of PREFIXES) { if (w.startsWith(pre.p)) { const s = getStem(w.slice(pre.p.length)); if (s) return pre.t + ' ' + s; } }
  for (const pre of PREFIXES) {
    if (w.startsWith(pre.p)) {
      const rem = w.slice(pre.p.length);
      for (const suf of SUFFIXES) { if (rem.endsWith(suf.s)) { const s = getStem(rem.slice(0, -suf.s.length)); if (s) return pre.t + ' ' + s + ' ' + suf.t; } }
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
    if (!arpa && clean && baseforms) {
      const base = baseforms[clean.toLowerCase()];
      if (base) arpa = dict?.[base.toLowerCase()] ?? null;
    }
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
    // General fallback: if the word is alphabetical and has length >= 2, we still wrap it with an empty arpa
    // so it is hoverable, has a dictionary definition, and can be saved to Anki.
    if (clean && /^[a-zA-Z]+$/.test(clean) && clean.length >= 2) {
      const pre = token.match(/^'+/)?.[0] ?? '';
      if (pre) frag.appendChild(document.createTextNode(pre));
      const post = token.match(/'+$/)?.[0] ?? '';
      frag.appendChild(renderWordFrag(clean, ''));
      if (post) frag.appendChild(document.createTextNode(post));
      changed = true;
      continue;
    }

    frag.appendChild(document.createTextNode(token));
  }
  if (changed && node.parentNode) node.parentNode.replaceChild(frag, node);
}

function unwalkAll(): void {
  for (const rpw of Array.from(document.querySelectorAll('rp-w'))) {
    const text = rpw.getAttribute('data-word') ?? rpw.textContent ?? '';
    if (rpw.parentNode) rpw.parentNode.replaceChild(document.createTextNode(text), rpw);
  }
  document.body.normalize();
}

function gatherWords(node: Node): Set<string> {
  const words = new Set<string>();

  function traverse(n: Node) {
    if (n.nodeType === Node.TEXT_NODE) {
      const text = n.textContent;
      if (!text?.trim() || !/[a-zA-Z]/.test(text)) return;
      const norm = text.replace(/[’ʼ]/g, "'");
      const tokens = norm.match(/[a-zA-Z']+/g) ?? [];
      for (const token of tokens) {
        const clean = token.replace(/^'+|'+$/g, '').toLowerCase();
        if (clean && !dict[clean]) {
          words.add(clean);
          gatherGuesses(clean);
        }
      }
      return;
    }
    if (n.nodeType !== Node.ELEMENT_NODE) return;
    const el = n as Element;
    if (SKIP_TAGS.has(el.tagName)) return;
    if (el.getAttribute('data-ipa-ui')) return;
    if (el.id && IPA_ROOT_IDS.has(el.id)) return;
    if ((el as HTMLElement).isContentEditable) return;
    for (const child of Array.from(n.childNodes)) traverse(child);
  }

  function gatherGuesses(w: string) {
    if (w.endsWith('ization')) words.add(w.slice(0, -7) + 'ize');
    if (w.endsWith('ation')) words.add(w.slice(0, -5) + 'ate');
    if (w.endsWith('ing')) words.add(w.slice(0, -3) + 'e');
    if (w.endsWith('ed')) words.add(w.slice(0, -2) + 'e');
    if (w.endsWith('ies')) words.add(w.slice(0, -3) + 'y');
    if (w.endsWith('ily')) words.add(w.slice(0, -3) + 'y');
    if (w.endsWith('able')) words.add(w.slice(0, -4) + 'e');
    if (w.endsWith('ible')) words.add(w.slice(0, -4) + 'e');
    for (const suf of SUFFIXES) {
      if (w.endsWith(suf.s)) {
        const stem = w.slice(0, -suf.s.length);
        words.add(stem);
        if (stem.endsWith('ing')) words.add(stem.slice(0, -3) + 'e');
        if (stem.endsWith('ed')) words.add(stem.slice(0, -2) + 'e');
      }
    }
    for (const pre of PREFIXES) {
      if (w.startsWith(pre.p)) {
        const rem = w.slice(pre.p.length);
        words.add(rem);
        for (const suf of SUFFIXES) {
          if (rem.endsWith(suf.s)) words.add(rem.slice(0, -suf.s.length));
        }
      }
    }
  }

  traverse(node);
  return words;
}

function walkSync(node: Node): void {
  if (node.nodeType === Node.TEXT_NODE) { processTextNode(node as Text); return; }
  if (node.nodeType !== Node.ELEMENT_NODE) return;
  const el = node as Element;
  if (SKIP_TAGS.has(el.tagName)) return;
  if (el.getAttribute('data-ipa-ui')) return;
  if (el.id && IPA_ROOT_IDS.has(el.id)) return;
  if ((el as HTMLElement).isContentEditable) return;
  for (const child of Array.from(node.childNodes)) walkSync(child);
}

function updateContainerPronunciations(container: Node): void {
  if (container.nodeType !== Node.ELEMENT_NODE && container.nodeType !== Node.DOCUMENT_NODE && container.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return;
  const el = container as Element;
  const rpws = el.querySelectorAll('rp-w');
  for (const rpw of Array.from(rpws)) {
    const word = rpw.getAttribute('data-word');
    if (!word) continue;

    const oldArpa = rpw.getAttribute('data-arpa') ?? '';
    const clean = word.replace(/^'+|'+$/g, '').toLowerCase();

    let newArpa = dict?.[clean] ?? null;
    if (!newArpa && baseforms) {
      const base = baseforms[clean];
      if (base) newArpa = dict?.[base.toLowerCase()] ?? null;
    }

    if (word.includes("'")) {
      const apostIdx = word.indexOf("'");
      const base = word.slice(0, apostIdx);
      const suffix = word.slice(apostIdx);

      let baseArpa = dict?.[base.toLowerCase()] ?? null;
      if (!baseArpa && base.length > 2 && base.endsWith('n')) {
        baseArpa = dict?.[base.slice(0, -1).toLowerCase()] ?? null;
      }

      const resolvedBaseArpa = baseArpa || '';
      if (resolvedBaseArpa !== oldArpa) {
        const newRpw = renderWordFrag(base || word, resolvedBaseArpa);
        newRpw.setAttribute('data-word', word);
        if (suffix) newRpw.appendChild(document.createTextNode(suffix));

        if (rpw.parentNode) {
          rpw.parentNode.replaceChild(newRpw, rpw);
        }
      }
    } else {
      if (!newArpa && (clean.length > 4 || clean.includes("'"))) {
        newArpa = guessPronunciation(clean);
      }
      const resolvedArpa = newArpa || '';
      if (resolvedArpa !== oldArpa) {
        const newRpw = renderWordFrag(word, resolvedArpa);
        if (rpw.parentNode) {
          rpw.parentNode.replaceChild(newRpw, rpw);
        }
      }
    }
  }
}

async function walk(node: Node): Promise<void> {
  if (!isContextValid()) { teardown(); return; }
  if (!isInit) return;

  const container = node.nodeType === Node.ELEMENT_NODE ? node : node.parentNode;
  const words = gatherWords(node);

  // Synchronous-first rendering (zero flicker)
  walkSync(node);

  if (words.size > 0) {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'DICT_LOOKUP',
        words: Array.from(words),
        dialect: activeDialect,
        includeBaseforms: activeBaseformsSetting
      });
      if (response && !response.error) {
        Object.assign(dict, response.dict);
        if (response.baseforms && baseforms) {
          Object.assign(baseforms, response.baseforms);
        }
        if (container && container.isConnected) {
          updateContainerPronunciations(container);
        }
      }
    } catch (e: any) {
      const msg = e?.message || String(e);
      if (msg.includes('context invalidated')) {
        teardown();
        return;
      }
      console.error('[IPA Stylizer] Dict lookup message failed:', e);
    }
  }
}

// ── Hover events ─────────────────────────────────────────────────

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
  for (const el of Array.from(container.querySelectorAll('rp-w[data-word]'))) {
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

    // Check if mouse is hovering over the tooltip itself
    if (mouseInTip) {
      return; // keep it visible while mouse is inside
    }

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

function matchesShortcut(e: KeyboardEvent, shortcutStr: string): boolean {
  if (!shortcutStr) return false;

  const ctrl = shortcutStr.includes('Ctrl+');
  const alt = shortcutStr.includes('Alt+');
  const shift = shortcutStr.includes('Shift+');
  const meta = shortcutStr.includes('Meta+');

  let mainKey = shortcutStr;
  if (ctrl) mainKey = mainKey.replace('Ctrl+', '');
  if (alt) mainKey = mainKey.replace('Alt+', '');
  if (shift) mainKey = mainKey.replace('Shift+', '');
  if (meta) mainKey = mainKey.replace('Meta+', '');

  if (e.ctrlKey !== ctrl) return false;
  if (e.altKey !== alt) return false;
  if (e.shiftKey !== shift) return false;
  if (e.metaKey !== meta) return false;

  return e.key.toLowerCase() === mainKey.toLowerCase();
}

// Video control shortcuts (rewind, forward, play/pause support combined/modifiers keys)
document.addEventListener('keydown', e => {
  const target = e.target as HTMLElement;
  if (!target) return;

  if (
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.isContentEditable
  ) {
    return;
  }

  const video = document.querySelector('video');
  if (!video) return;

  if (matchesShortcut(e, videoShortcuts.rewind)) {
    e.preventDefault();
    video.currentTime = Math.max(0, video.currentTime - 10);
  } else if (matchesShortcut(e, videoShortcuts.forward)) {
    e.preventDefault();
    video.currentTime = Math.min(video.duration, video.currentTime + 10);
  } else if (matchesShortcut(e, videoShortcuts.playPause)) {
    e.preventDefault();
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  }
});

// ── Activation ───────────────────────────────────────────────────


function syncBodyClasses(): void {
  const b = document.body;
  const enabled = !b.classList.contains('ipa-disabled');
  const map: [keyof IpaOpts, string][] = [
    ['silent', 'ipa-silent'],
    ['color_e', 'ipa-color-e'],
    ['color_i', 'ipa-color-i'],
    ['color_u_alt', 'ipa-color-u-alt'],
    ['color_a', 'ipa-color-a'],
    ['color_u', 'ipa-color-u'],
    ['color_o', 'ipa-color-o'],
    ['stress', 'ipa-st'],
    ['length', 'ipa-length'],
    ['diph_ai', 'ipa-diph-ai'],
    ['diph_ei_oi', 'ipa-diph-ei-oi'],
    ['diph_ou_au', 'ipa-diph-ou-au'],
    ['th_t', 'ipa-th-t'],
    ['th_d', 'ipa-th-d'],
    ['tmark', 'ipa-tmark'],
    ['zmark', 'ipa-zmark'],
    ['phonemes', 'ipa-phonemes'],
  ];
  for (const [key, cls] of map) b.classList.toggle(cls, enabled && opts[key]);
}

chrome.storage.onChanged.addListener(() => {
  if (!isContextValid()) { teardown(); return; }
  void checkActivation();
});

const PRO_OPTS = new Set([
  'stress', 'length', 'diph_ai', 'diph_ei_oi', 'diph_ou_au',
  'th_t', 'th_d', 'tmark', 'zmark', 'phonemes',
]);

async function getUserTier(): Promise<'free' | 'pro'> {
  try {
    const stored = await chrome.storage.local.get('ipa-auth');
    return (stored['ipa-auth']?.user?.tier as 'free' | 'pro') ?? 'free';
  } catch { return 'free'; }
}

function applyTierGating(rawOpts: Record<string, boolean>, tier: 'free' | 'pro'): Record<string, boolean> {
  if (tier === 'pro') return rawOpts;
  return Object.fromEntries(
    Object.entries(rawOpts).map(([k, v]) => [k, PRO_OPTS.has(k) ? false : v]),
  );
}

async function checkActivation(): Promise<void> {
  if (!isContextValid()) { teardown(); return; }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let stored: Record<string, any>;
  try { stored = await chrome.storage.sync.get(['ipa-settings']); } catch { teardown(); return; }
  const s = stored['ipa-settings'];

  if (s?.opts) {
    const tier = await getUserTier();
    opts = { ...opts, ...applyTierGating({ ...opts, ...s.opts }, tier) };
  }
  if (s?.targetLanguage !== undefined) targetLanguage = s.targetLanguage;
  if (s?.ankiEnabled !== undefined) ankiEnabled = s.ankiEnabled;
  if (s?.translatePerSentence !== undefined) translatePerSentence = s.translatePerSentence;
  if (s?.pauseOnHover !== undefined) pauseOnHover = s.pauseOnHover;
  if (s?.shortcuts !== undefined) videoShortcuts = s.shortcuts;

  const globalEnabled = s?.enabled !== false;
  const overrides = s?.siteOverrides ?? {};
  let isActive = globalEnabled;

  if (overrides[window.location.hostname] !== undefined) {
    isActive = overrides[window.location.hostname];
  } else if (window.location.ancestorOrigins) {
    for (let i = 0; i < window.location.ancestorOrigins.length; i++) {
      try {
        const host = new URL(window.location.ancestorOrigins[i]).hostname;
        if (overrides[host] !== undefined) {
          isActive = overrides[host];
          break;
        }
      } catch (e) { }
    }
  }

  if (!isActive) {
    document.body.classList.add('ipa-disabled');
    hideTip();
    unwalkAll();
    hasProcessed = false;
  } else {
    document.body.classList.remove('ipa-disabled');
    const dialect = s?.pronunciationDialect ?? 'nAmE';
    const enableBaseforms = true;
    if (hasProcessed && (dialect !== activeDialect || enableBaseforms !== activeBaseformsSetting)) {
      unwalkAll();
      hasProcessed = false;
    }
    if (!hasProcessed) { void init(); return; }
  }
  syncBodyClasses();
}

// ── DOM mutation handler (shared) ────────────────────────────────

function handleMutations(mutations: MutationRecord[]): void {
  if (!isContextValid()) { teardown(); return; }
  for (const m of mutations) {
    for (const node of Array.from(m.addedNodes)) {
      if (!isInit) continue;
      const el = node as Element;
      if (el.getAttribute?.('data-ipa-ui')) continue;
      if (el.id && IPA_ROOT_IDS.has(el.id)) continue;
      if ((node as Node).parentElement?.closest?.('[data-ipa-ui]')) continue;
      if (node.nodeType === Node.ELEMENT_NODE && !SKIP_TAGS.has(el.tagName)) {
        void walk(node);
      } else if (node.nodeType === Node.TEXT_NODE) {
        void walk(node);
      }
    }
  }
}

async function init(): Promise<void> {
  if (hasProcessed) return;
  // Set immediately — prevents concurrent init() calls from racing past this guard
  hasProcessed = true;

  if (!document.body) { hasProcessed = false; return; }
  if (!isContextValid()) { hasProcessed = false; return; }

  let stored: Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  try { stored = await chrome.storage.sync.get(['ipa-settings']); } catch { hasProcessed = false; return; }
  const s = stored['ipa-settings'];
  const _globalOn = s?.enabled !== false;
  const overrides = s?.siteOverrides ?? {};
  let _isActive = _globalOn;

  if (overrides[window.location.hostname] !== undefined) {
    _isActive = overrides[window.location.hostname];
  } else if (window.location.ancestorOrigins) {
    for (let i = 0; i < window.location.ancestorOrigins.length; i++) {
      try {
        const host = new URL(window.location.ancestorOrigins[i]).hostname;
        if (overrides[host] !== undefined) {
          _isActive = overrides[host];
          break;
        }
      } catch (e) { }
    }
  }
  if (!_isActive) {
    // Extension disabled — reset so checkActivation() can re-init on next enable
    hasProcessed = false;
    document.body.classList.add('ipa-disabled'); return;
  }
  if (s?.opts) {
    const tier = await getUserTier();
    opts = { ...opts, ...applyTierGating({ ...opts, ...s.opts }, tier) };
  }
  if (s?.targetLanguage) targetLanguage = s.targetLanguage;
  if (s?.translatePerSentence !== undefined) translatePerSentence = s.translatePerSentence;
  if (s?.pauseOnHover !== undefined) pauseOnHover = s.pauseOnHover;
  if (s?.ankiEnabled !== undefined) ankiEnabled = s.ankiEnabled;
  if (s?.shortcuts !== undefined) videoShortcuts = s.shortcuts;
  syncBodyClasses();

  // Observer starts BEFORE dict fetch so mutations during loading are queued
  mainObserver = new MutationObserver(handleMutations);
  mainObserver.observe(document.body, { childList: true, subtree: true });

  try {
    if (!isContextValid()) return;
    const dialect = s?.pronunciationDialect ?? 'nAmE';
    const enableBaseforms = true;

    activeDialect = dialect as 'nAmE' | 'brE';
    activeBaseformsSetting = enableBaseforms;

    dict = {};
    baseforms = enableBaseforms ? {} : null;
    isInit = true;

    void walk(document.body);
  } catch (e) { console.error('[IPA Stylizer]', e); }
}

// ── SPA navigation re-walk ────────────────────────────────────────

function reprocess(): void {
  if (!isInit || !hasProcessed) return;
  void walk(document.body);
}

// YouTube-specific SPA event
document.addEventListener('yt-navigate-finish', () => {
  if (!isContextValid()) { teardown(); return; }
  setTimeout(reprocess, 300);
});

// Generic SPA: detect URL change via polling (avoids heavy URL-observer overhead)
let _lastHref = location.href;
spaInterval = setInterval(() => {
  if (!isContextValid()) { teardown(); return; }
  if (location.href !== _lastHref) {
    _lastHref = location.href;
    setTimeout(reprocess, 400);
  }
}, 1000);

if (isContextValid()) void checkActivation();
