// IPA Pronunciation Stylizer — content script

const VOWEL_COLORS = {
  AH: { c: 'var(--ipa-purple)', t: 'color_u_alt' }, AA: { c: 'var(--ipa-purple)', t: 'color_u_alt' }, AE: { c: 'var(--ipa-pink)', t: 'color_a' },
  EH: { c: 'var(--ipa-red)', t: 'color_e' }, ER: { c: 'var(--ipa-red)', t: 'color_e' },
  IH: { c: 'var(--ipa-green)', t: 'color_i' }, IY: { c: 'var(--ipa-green)', t: 'color_i' },
  UH: { c: 'var(--ipa-teal)', t: 'color_u' }, UW: { c: 'var(--ipa-teal)', t: 'color_u' },
  AO: { c: 'var(--ipa-orange)', t: 'color_o' },
  AY: { c: 'var(--ipa-pink)', t: 'color_a' }, EY: { c: 'var(--ipa-red)', t: 'color_e' }, OY: { c: 'var(--ipa-orange)', t: 'color_o' }, OW: { c: 'var(--ipa-orange)', t: 'color_o' }, AW: { c: 'var(--ipa-purple)', t: 'color_u_alt' },
  AX: { c: 'var(--ipa-purple)', t: 'color_u_alt' }
};
const ARPA_IPA = {
  IY: 'iː', IH: 'ɪ', EH: 'ɛ', AE: 'æ', AH: 'ʌ', AA: 'ɑː', AO: 'ɔː',
  UH: 'ʊ', UW: 'uː', ER: 'ɜː', AX: 'ə',
  AY: 'aɪ', EY: 'eɪ', OY: 'ɔɪ', AW: 'aʊ', OW: 'oʊ',
  P: 'p', B: 'b', T: 't', D: 'd', K: 'k', G: 'ɡ', F: 'f', V: 'v',
  TH: 'θ', DH: 'ð', S: 's', Z: 'z', SH: 'ʃ', ZH: 'ʒ',
  HH: 'h', M: 'm', N: 'n', NG: 'ŋ', L: 'l', R: 'r', W: 'w', Y: 'j',
  CH: 'tʃ', JH: 'dʒ',
  KW: 'kw', KS: 'ks', KSH: 'kʃ', KZ: 'kz', GZ: 'ɡz', GZH: 'ɡʒ', JHD: 'dʒ', CCC: 'k', HHH: 'h'
};
const ACUTE = { a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú', y: 'ý', A: 'Á', E: 'É', I: 'Í', O: 'Ó', U: 'Ú', Y: 'Ý' };
const LONG_VOWELS = new Set(['IY', 'UW', 'ER', 'AO']);
const DIPH_SUPER = { AY: 'ᵃ', EY: 'ⁱ', OW: 'ᵘ', AW: 'ᵃ', OY: 'ᵒ' };
const TH_SUPER = { TH: 'ᵗ', DH: 'ᵈ' };
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'SELECT', 'CODE', 'PRE', 'KBD', 'SAMP', 'MATH', 'SVG', 'NOSCRIPT', 'RP-W', 'READPRONUNCIATION-WORD']);

let dict = null;
let opts = {
  silent: true, color_e: true, color_i: true, color_u_alt: true, color_a: true, color_u: true, color_o: true,
  stress: true, tmark: true, th_t: true, zmark: true, diph_ai: true, diph_ei_oi: true, phonemes: true, th_d: true, diph_ou_au: true, length: true
};
let enabled = true;
let hasProcessed = false;

// ── ARPAbet helpers ──────────────────────────────────────────────

function parseArpabet(str) {
  return str.trim().split(/\s+/).map(raw => {
    if (raw === '-' || raw === '--') return { phoneme: null, base: null, silent: true, ghost: false, stress: 0 };
    if (raw.startsWith('+')) {
      const clean = raw.replace(/^\+/, '').replace(/^\.+/, '');
      const stress = parseInt(clean.match(/([012])$/)?.[1] ?? '0');
      const phoneme = clean.replace(/[012]$/, '');
      const base = phoneme.replace(/[^A-Z]/gi, '').toUpperCase();
      return { phoneme, base, silent: false, ghost: true, stress };
    }
    if (raw.startsWith('-r')) return { phoneme: null, base: null, silent: false, ghost: false, stress: 0 };
    const clean = raw.replace(/^\.+/, '');
    const stress = parseInt(clean.match(/([012])$/)?.[1] ?? '0');
    const phoneme = clean.replace(/[012]$/, '');
    const base = phoneme.replace(/[^A-Z]/gi, '').toUpperCase();
    return { phoneme, base, silent: false, ghost: false, stress };
  });
}

function alignWord(word, arpa) {
  const allTokens = parseArpabet(arpa);
  const chars = [...word];
  const aligned = [];

  let charIdx = 0;
  for (let i = 0; i < allTokens.length; i++) {
    const t = allTokens[i];
    if (t.ghost) {
      aligned.push({ char: null, ...t });
    } else {
      aligned.push({ char: chars[charIdx] || null, ...t });
      charIdx++;
    }
  }

  for (let i = charIdx; i < chars.length; i++) {
    aligned.push({ char: chars[i], phoneme: null, base: null, silent: true, stress: 0, ghost: false });
  }

  return aligned;
}

function toIPA(arpaStr) {
  const toks = arpaStr.trim().split(/\s+/)
    .filter(t => t !== '-' && t !== '--' && !t.startsWith('+'))
    .map(tok => {
      const clean = tok.replace(/^-r/, '').replace(/^\.+/, '');
      const syllableStart = tok.replace(/^-r/, '').startsWith('.') && tok.includes('.');
      const stress = parseInt(clean.match(/([012])$/)?.[1] ?? '0');
      const phon = clean.replace(/[012]$/, '');
      const base = phon.replace(/[^A-Z]/gi, '').toUpperCase();
      return { phon, base, stress, syllableStart };
    });

  const syllStress = (from) => {
    for (let i = from; i < toks.length; i++) {
      if (i > from && toks[i].syllableStart) break;
      if (toks[i].stress > 0) return toks[i].stress;
    }
    return 0;
  };

  let ipa = '';
  for (let i = 0; i < toks.length; i++) {
    const { phon, base, stress, syllableStart } = toks[i];
    if (syllableStart) { const s = syllStress(i); ipa += s === 1 ? 'ˈ' : s === 2 ? 'ˌ' : '.'; }
    else if (i === 0 && stress > 0) { ipa += stress === 1 ? 'ˈ' : 'ˌ'; }
    ipa += ARPA_IPA[base] ?? base.toLowerCase();
  }
  return '/' + ipa + '/';
}

// ── Word renderer (DOM) ──────────────────────────────────────────

function renderWordFrag(word, arpa) {
  const wEl = document.createElement('rp-w');
  wEl.setAttribute('data-word', word);
  wEl.setAttribute('data-arpa', arpa);
  wEl.style.cursor = 'pointer';

  const aligned = alignWord(word, arpa);
  for (let i = 0; i < aligned.length; i++) {
    const { char, phoneme, base, silent, stress, ghost } = aligned[i];

    if (ghost) {
      if (opts.phonemes && base && ARPA_IPA[base]) {
        const sup = document.createElement('rp-sup');
        sup.textContent = ARPA_IPA[base];
        const vColor = VOWEL_COLORS[base];
        if (vColor && opts[vColor.t]) {
          sup.style.color = vColor.c;
        } else if (!vColor) {
          sup.style.color = 'var(--accent, #ff3e88)';
        }
        wEl.appendChild(sup);
      }
      continue;
    }

    const sEl = document.createElement('rp-s');
    let display = char;
    let after = null;

    const isFirstInSequence = (i === 0 || aligned[i - 1]?.base !== base);
    const isLastInSequence = (i === aligned.length - 1 || aligned[i + 1]?.base !== base);

    if (silent && opts.silent) {
      sEl.style.opacity = '0.25';
    } else if (base) {
      const vColor = VOWEL_COLORS[base];
      if (vColor && opts[vColor.toggle !== undefined ? vColor.toggle : vColor.t]) {
        sEl.style.color = vColor.c || vColor.color;
        if (opts.stress && stress === 1 && isFirstInSequence && ACUTE[char]) {
          display = ACUTE[char];
        }
        if (isLastInSequence) {
          if (opts.length && LONG_VOWELS.has(base)) {
            const c = document.createElement('rp-c');
            c.textContent = ':';
            after = after ?? document.createDocumentFragment();
            after.appendChild(c);
          }
          if (DIPH_SUPER[base]) {
            let showDiph = false;
            if (base === 'AY' && opts.diph_ai) showDiph = true;
            if ((base === 'EY' || base === 'OY') && opts.diph_ei_oi) showDiph = true;
            if ((base === 'OW' || base === 'AW') && opts.diph_ou_au) showDiph = true;

            if (showDiph) {
              const c = document.createElement('rp-sup');
              c.textContent = DIPH_SUPER[base];
              after = after ?? document.createDocumentFragment();
              after.appendChild(c);
            }
          }
        }
      }
      if (isLastInSequence) {
        if (TH_SUPER[base] && ((base === 'TH' && opts.th_t) || (base === 'DH' && opts.th_d))) {
          const c = document.createElement('rp-sup');
          c.textContent = TH_SUPER[base];
          after = after ?? document.createDocumentFragment();
          after.appendChild(c);
        } else if (opts.tmark && (base === 'T') && !['t', 'T'].includes(char)) {
          const s = document.createElement('rp-sup');
          s.textContent = 'ᵗ';
          after = after ?? document.createDocumentFragment();
          after.appendChild(s);
        }
      }
      if (opts.zmark && (base === 'Z' || base === 'ZH')) {
        sEl.style.textDecoration = 'underline dotted';
        sEl.style.textUnderlineOffset = '2px';
      }
    }
    sEl.textContent = display;
    if (after) sEl.appendChild(after);
    wEl.appendChild(sEl);
  }
  return wEl;
}

// ── Tooltip ──────────────────────────────────────────────────────

const TIP_W = 300;
const TIP_BASE = 'flex:1;padding:7px 4px;border:none;background:none;cursor:pointer;' +
  'font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.07em;';
const TIP_ON = 'color:#a78bfa;border-bottom:2px solid #a78bfa';
const TIP_OFF = 'color:#445;border-bottom:2px solid transparent';

let tip = null;
let hoverTimer = null;
let currentWord = null;
let defCache = {};

function getTip() {
  if (tip) return tip;
  tip = document.createElement('div');
  tip.id = '__ipa_tip__';
  tip.style.cssText = [
    'position:fixed', 'z-index:2147483647',
    'background:#16172a', 'border:1px solid #2e2f50',
    'border-radius:12px',
    'box-shadow:0 12px 40px rgba(0,0,0,.6),0 2px 8px rgba(0,0,0,.4)',
    `width:${TIP_W}px`,
    'font-family:system-ui,sans-serif', 'font-size:13px', 'color:#d8d8f0',
    'display:none', 'overflow:hidden',
    'transition:opacity .15s,transform .15s',
    'opacity:0', 'transform:translateY(4px)',
    'pointer-events:none',
  ].join(';');
  tip.addEventListener('mouseenter', () => clearTimeout(hoverTimer));
  tip.addEventListener('mouseleave', e => {
    if (!e.relatedTarget?.closest?.('rp-w')) hideTip();
  });
  document.body.appendChild(tip);
  return tip;
}

function buildTipHTML(word, ipa) {
  return (
    `<div style="padding:13px 14px 9px">` +
    `<div style="display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;margin-bottom:3px">` +
    `<span style="font-size:1.05rem;font-weight:700;color:#eeeeff">${word}</span>` +
    `<span id="__ipa_pos__" style="font-size:.68rem;font-weight:600;color:#7b61ff;` +
    `text-transform:uppercase;letter-spacing:.07em;background:#1e1840;padding:1px 6px;border-radius:4px"></span>` +
    `</div>` +
    `<div style="font-size:.82rem;color:#8899cc;font-style:italic;letter-spacing:.02em">${ipa}</div>` +
    `</div>` +
    `<div style="display:flex;border-top:1px solid #22233a;border-bottom:1px solid #22233a;background:#12131f">` +
    `<button data-tab="definition" style="${TIP_BASE}${TIP_ON}">Definition</button>` +
    `<button data-tab="examples"   style="${TIP_BASE}${TIP_OFF}">Examples</button>` +
    `<button data-tab="search"     style="${TIP_BASE}${TIP_OFF}">Search</button>` +
    `</div>` +
    `<div id="__ipa_body__" style="padding:11px 14px;min-height:44px;font-size:.84rem;color:#aab;line-height:1.55">` +
    `<span style="color:#445">Loading…</span></div>`
  );
}

function renderTab(tab, word, data) {
  const body = document.getElementById('__ipa_body__');
  if (!body) return;
  if (tab === 'definition') {
    if (!data) { body.innerHTML = '<span style="color:#445">No definition found.</span>'; return; }
    const m = data[0]?.meanings?.[0];
    const pos = m?.partOfSpeech ?? '';
    const d = m?.definitions?.[0]?.definition ?? '';
    const posEl = document.getElementById('__ipa_pos__');
    if (posEl) posEl.textContent = pos;
    body.innerHTML = d ? `<p style="color:#c8c8e8">${d}</p>` : '<span style="color:#445">—</span>';
  } else if (tab === 'examples') {
    const exs = data?.[0]?.meanings?.flatMap(m => m.definitions).map(d => d.example).filter(Boolean).slice(0, 3);
    body.innerHTML = exs?.length
      ? exs.map(ex => `<p style="margin-bottom:6px;border-left:2px solid #7b61ff;padding-left:8px;font-style:italic;color:#aab">${ex}</p>`).join('')
      : '<span style="color:#445">No examples.</span>';
  } else {
    const gUrl = `https://www.google.com/search?q=${encodeURIComponent(word + ' pronunciation')}`;
    const mUrl = `https://www.merriam-webster.com/dictionary/${encodeURIComponent(word)}`;
    body.innerHTML =
      `<a href="${gUrl}" target="_blank" style="color:#7b9fff;text-decoration:none;display:block;margin-bottom:8px">🔍 Google: "${word} pronunciation"</a>` +
      `<a href="${mUrl}" target="_blank" style="color:#7b9fff;text-decoration:none;display:block">📖 Merriam-Webster</a>`;
  }
}

async function fetchAndRender(word) {
  const key = word.toLowerCase();
  if (key in defCache) { renderTab('definition', word, defCache[key]); return; }
  try {
    const r = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(key)}`);
    defCache[key] = r.ok ? await r.json() : null;
  } catch { defCache[key] = null; }
  if (currentWord === word) renderTab('definition', word, defCache[key]);
}

function posTip(mouseX, mouseY) {
  const PAD = 10, H = 220;
  let left = mouseX + 14, top = mouseY + 18;
  if (left + TIP_W > window.innerWidth - PAD) left = mouseX - TIP_W - 14;
  if (top + H > window.innerHeight - PAD) top = mouseY - H - 10;
  tip.style.left = Math.max(PAD, left) + 'px';
  tip.style.top = Math.max(PAD, top) + 'px';
}

function showTip(wordEl, mouseX, mouseY) {
  const t = getTip();
  const word = wordEl.getAttribute('data-word');
  const arpa = wordEl.getAttribute('data-arpa');
  if (!word || !arpa) return;
  currentWord = word;
  t.innerHTML = buildTipHTML(word, toIPA(arpa));
  t.style.pointerEvents = 'auto';
  t.querySelectorAll('[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      t.querySelectorAll('[data-tab]').forEach(b => b.style.cssText = TIP_BASE + TIP_OFF);
      btn.style.cssText = TIP_BASE + TIP_ON;
      renderTab(btn.dataset.tab, word, defCache[word.toLowerCase()]);
    });
  });
  posTip(mouseX, mouseY);
  t.style.display = 'block';
  t.style.transform = 'translateY(4px)';
  t.style.opacity = '0';
  requestAnimationFrame(() => { t.style.opacity = '1'; t.style.transform = 'translateY(0)'; });
  fetchAndRender(word);
}

function hideTip() {
  if (!tip) return;
  currentWord = null;
  tip.style.opacity = '0';
  tip.style.transform = 'translateY(4px)';
  tip.style.pointerEvents = 'none';
  setTimeout(() => { if (!currentWord && tip) tip.style.display = 'none'; }, 150);
}

// ── Morphological Fallback (G2P Heuristics) ──────────────────────

const PREFIXES = [
  { p: 're', t: 'R IY1' }, { p: 'un', t: 'AH1 N' }, { p: 'in', t: 'IH1 N' }, { p: 'im', t: 'IH1 M' },
  { p: 'dis', t: 'D IH1 S' }, { p: 'mis', t: 'M IH1 S' }, { p: 'pre', t: 'P R IY1' }, { p: 'pro', t: 'P R OW1' },
  { p: 'non', t: 'N AA1 N' }, { p: 'over', t: 'OW1 V ER0 -rER0' }, { p: 'under', t: 'AH1 N D ER0 -rER0' },
  { p: 'anti', t: 'AE1 N T IY0' }
];

const SUFFIXES = [
  { s: 'ing', t: 'IH0 NG -' }, { s: 'ness', t: 'N EH0 S S' }, { s: 'ment', t: 'M EH0 N T' },
  { s: 'est', t: 'IH0 S T' }, { s: 'ed', t: '- D' }, { s: 'es', t: 'IH0 Z' },
  { s: 'er', t: 'ER0 -rER0' }, { s: 'ly', t: 'L IY0' }, { s: 's', t: 'Z' },
  { s: 'ism', t: 'IH0 Z M' }, { s: 'ist', t: 'IH0 S T' }, { s: 'ful', t: 'F UH0 L' },
  { s: 'less', t: 'L EH0 S S' }, { s: 'tion', t: 'SH - AX0 N' },
  { s: 'able', t: 'AX0 B L -' }, { s: 'ible', t: 'IH0 B L -' },
  { s: "'s", t: '- Z' }, { s: "'ve", t: '- V' }, { s: "'re", t: '- ER0' },
  { s: "'ll", t: '- L' }, { s: "'d", t: '- D' }
];

function guessPronunciation(word, depth = 0) {
  if (depth > 2) return null;
  const w = word.toLowerCase();

  const getStem = (stem) => dict[stem] || guessPronunciation(stem, depth + 1);

  // 1.1 Try smart suffixes (-ization -> -ize)
  if (w.endsWith('ization')) {
    const stem = w.slice(0, -7) + 'ize';
    const dictStem = getStem(stem);
    if (dictStem) return dictStem.replace(/\s+-\s*$/, ' EY1 SH - AX0 N');
  }

  // 1.2 Try smart suffixes (-ation -> -ate)
  if (w.endsWith('ation')) {
    const stem = w.slice(0, -5) + 'ate';
    const dictStem = getStem(stem);
    if (dictStem) return dictStem.replace(/\s+-\s*$/, ' EY1 SH - AX0 N');
  }

  // 1.3 Try smart suffixes (-ing -> drop e)
  if (w.endsWith('ing')) {
    const stem = w.slice(0, -3) + 'e';
    const dictStem = getStem(stem);
    if (dictStem) return dictStem.replace(/\s+-\s*$/, ' IH0 NG -');
  }

  // 1.4 Try smart suffixes (-ed -> drop e)
  if (w.endsWith('ed')) {
    const stem = w.slice(0, -2) + 'e';
    const dictStem = getStem(stem);
    if (dictStem) return dictStem + ' D';
  }

  // 1.5 Try smart suffixes (-ies -> -y)
  if (w.endsWith('ies')) {
    const stem = w.slice(0, -3) + 'y';
    const dictStem = getStem(stem);
    if (dictStem) {
      const toks = dictStem.split(/\s+/);
      const last = toks.pop();
      return toks.join(' ') + ' ' + last + ' - Z';
    }
  }

  // 1.6 Try smart suffixes (-ily -> -y)
  if (w.endsWith('ily')) {
    const stem = w.slice(0, -3) + 'y';
    const dictStem = getStem(stem);
    if (dictStem) {
      const toks = dictStem.split(/\s+/);
      const last = toks.pop();
      return toks.join(' ') + ' ' + last + ' L IY0';
    }
  }

  // 1.7 Try smart suffixes (-able -> drop e)
  if (w.endsWith('able')) {
    const stem = w.slice(0, -4) + 'e';
    const dictStem = getStem(stem);
    if (dictStem) return dictStem.replace(/\s+-\s*$/, ' AX0 B L -');
  }

  // 1.8 Try smart suffixes (-ible -> drop e)
  if (w.endsWith('ible')) {
    const stem = w.slice(0, -4) + 'e';
    const dictStem = getStem(stem);
    if (dictStem) return dictStem.replace(/\s+-\s*$/, ' IH0 B L -');
  }

  // 2. Try simple suffixes
  for (const suf of SUFFIXES) {
    if (w.endsWith(suf.s)) {
      const stem = w.slice(0, -suf.s.length);
      const dictStem = getStem(stem);
      if (dictStem) return dictStem + ' ' + suf.t;
    }
  }

  // 3. Try prefixes
  for (const pref of PREFIXES) {
    if (w.startsWith(pref.p)) {
      const stem = w.slice(pref.p.length);
      const dictStem = getStem(stem);
      if (dictStem) return pref.t + ' ' + dictStem;
    }
  }

  // 4. Try prefix + suffix
  for (const pref of PREFIXES) {
    if (w.startsWith(pref.p)) {
      const remaining = w.slice(pref.p.length);
      for (const suf of SUFFIXES) {
        if (remaining.endsWith(suf.s)) {
          const stem = remaining.slice(0, -suf.s.length);
          const dictStem = getStem(stem);
          if (dictStem) return pref.t + ' ' + dictStem + ' ' + suf.t;
        }
      }
    }
  }

  return null;
} // ── DOM Walker ───────────────────────────────────────────────────

function processTextNode(node) {
  const text = node.textContent;
  if (!text.trim() || !/[a-zA-Z]/.test(text)) return;
  const tokens = text.match(/[a-zA-Z']+|[^a-zA-Z']+/g) ?? [];
  const frag = document.createDocumentFragment();
  let changed = false;
  for (const token of tokens) {
    if (/^[a-zA-Z']+$/i.test(token)) {
      const clean = token.replace(/^'+|'+$/g, '');
      let arpa = clean ? (dict?.[clean.toLowerCase()] ?? null) : null;

      // Morphological Fallback
      if (!arpa && clean && clean.length > 4) {
        arpa = guessPronunciation(clean);
      }

      if (arpa) {
        const pre = token.match(/^'+/)?.[0] ?? '';
        const post = token.match(/'+$/)?.[0] ?? '';
        if (pre) frag.appendChild(document.createTextNode(pre));
        frag.appendChild(renderWordFrag(clean, arpa));
        if (post) frag.appendChild(document.createTextNode(post));
        changed = true;
      } else {
        frag.appendChild(document.createTextNode(token));
      }
    } else {
      frag.appendChild(document.createTextNode(token));
    }
  }
  if (changed && node.parentNode) node.parentNode.replaceChild(frag, node);
}

function walk(node) {
  if (node.nodeType === Node.TEXT_NODE) { processTextNode(node); return; }
  if (node.nodeType !== Node.ELEMENT_NODE) return;
  if (SKIP_TAGS.has(node.tagName)) return;
  if (node.isContentEditable) return;
  for (const child of [...node.childNodes]) walk(child);
}

// ── Hover handler for tooltip ────────────────────────────────────

document.addEventListener('mouseover', e => {
  const rpw = e.target.closest('rp-w');
  if (!rpw) return;
  clearTimeout(hoverTimer);
  hoverTimer = setTimeout(() => showTip(rpw, e.clientX, e.clientY), 250);
});

document.addEventListener('mouseout', e => {
  const rpw = e.target.closest('rp-w');
  if (!rpw) return;
  const t = getTip();
  if (t && t.contains(e.relatedTarget)) return;
  clearTimeout(hoverTimer);
  hoverTimer = setTimeout(hideTip, 80);
});

document.addEventListener('keydown', e => { if (e.key === 'Escape') hideTip(); });

// ── Activation Logic ─────────────────────────────────────────────

chrome.storage.onChanged.addListener(() => {
  checkActivation();
});

async function checkActivation() {
  const stored = await chrome.storage.sync.get(['enabled', 'blacklist']);
  const isEnabled = stored.enabled !== false;
  const host = window.location.hostname;
  const isBlacklisted = (stored.blacklist ?? []).includes(host);

  if (!isEnabled || isBlacklisted) {
    document.body.classList.add('ipa-disabled');
  } else {
    document.body.classList.remove('ipa-disabled');
    if (!hasProcessed) init();
  }
}

async function init() {
  if (hasProcessed) return;

  const stored = await chrome.storage.sync.get(['enabled', 'opts', 'blacklist']);
  const isEnabled = stored.enabled !== false;
  const isBlacklisted = (stored.blacklist ?? []).includes(window.location.hostname);

  if (!isEnabled || isBlacklisted) {
    document.body.classList.add('ipa-disabled');
    return;
  }

  hasProcessed = true;
  if (stored.opts) opts = { ...opts, ...stored.opts };

  try {
    const r = await fetch(chrome.runtime.getURL('pronunciation.json'));
    dict = await r.json();

    walk(document.body);

    new MutationObserver(mutations => {
      for (const m of mutations) for (const node of m.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE && !SKIP_TAGS.has(node.tagName)) walk(node);
        else if (node.nodeType === Node.TEXT_NODE) processTextNode(node);
      }
    }).observe(document.body, { childList: true, subtree: true });
  } catch (e) {
    console.error('[IPA Stylizer] Error:', e);
  }
}

init();
