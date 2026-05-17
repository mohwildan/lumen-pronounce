import './chrome-mock.js';
import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

const C = {
  paper: '#FBF7EC', cream: '#F4EEE1', card: '#FFFDF5',
  ink: '#1B1A17', ink2: '#3B3832', ink3: '#6B6659', ink4: '#A39D8C', line: '#E4DDCB',
  amber: '#C97A1E', amberSoft: '#F1D7A8', moss: '#5B7A4B', mossSoft: '#C6D4B3',
  red: '#e53935', green: '#2e7d32', blue: '#00838f', yellow: '#e65100',
  ultra: '#8e24aa', rasp: '#d81b60', schwa: '#A39D8C',
};

let TWEAKS = {
  wordmark: 'Lumen',
  tagline: 'Pronunciation',
  small1: 'Hear what you',
  small2: 'read.',
  url: 'LUMENVERSE.APP/PRONUNCIATION',
};

const FRAUNCES = `'Fraunces', Georgia, serif`;
const INTER = `'Inter', system-ui, sans-serif`;
const MONO = `'JetBrains Mono', ui-monospace, Menlo, monospace`;

function squircle(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawRun(ctx, parts, x, y, baseSize, baseFamily, baseWeight = 500, baseColor = C.ink) {
  let cur = x;
  for (const p of parts) {
    const wt = p.w || baseWeight, it = p.italic ? 'italic ' : '';
    ctx.font = `${it}${wt} ${baseSize}px ${p.f || baseFamily}`;
    ctx.fillStyle = p.c || baseColor;
    ctx.globalAlpha = p.faded ? 0.32 : (p.opacity != null ? p.opacity : 1);
    
    if (p.sup) {
      ctx.font = `600 ${baseSize * 0.65}px ${p.f || baseFamily}`;
      ctx.fillStyle = p.supc || p.c || baseColor;
      ctx.fillText(p.sup, cur, y - baseSize * 0.4);
      cur += ctx.measureText(p.sup).width + 1;
      ctx.font = `${it}${wt} ${baseSize}px ${p.f || baseFamily}`;
      ctx.fillStyle = p.c || baseColor;
    }

    ctx.fillText(p.t, cur, y);
    const tw = ctx.measureText(p.t).width;
    if (p.underdot) {
      ctx.globalAlpha = 0.55;
      ctx.strokeStyle = C.amber; ctx.lineWidth = 1.5;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(cur, y + baseSize * 0.18);
      ctx.lineTo(cur + tw, y + baseSize * 0.18);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    cur += tw;
  }
  ctx.globalAlpha = 1;
  return cur - x;
}

const F = (t) => ({ t, faded: true });

function drawBadge(ctx, x, y) {
  ctx.save();
  ctx.shadowColor = 'rgba(20,18,12,0.2)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 8;
  squircle(ctx, x, y, 220, 48, 24);
  ctx.fillStyle = '#1e1c18'; ctx.fill();
  ctx.restore();
  squircle(ctx, x, y, 220, 48, 24);
  ctx.strokeStyle = '#3e3c33'; ctx.lineWidth = 1; ctx.stroke();

  const badgeRun = [
    {t: 'All ', c: '#fdfbf6', w: 600},
    {t: 'á', c: C.rasp, w: 700}, {t: 'ss', c: '#c7c3b5', w: 600}, {t: 'é', c: C.red, w: 700}, {t: 'ts ', c: '#c7c3b5', w: 600},
    {t: 'r', c: '#c7c3b5', w: 600}, {t: 'é', c: C.red, w: 700}, {t: 'nd', c: '#c7c3b5', w: 600}, {t: 'e', c: C.schwa, w: 700}, {t: 'r', c: '#c7c3b5', w: 600}, {t: 'e', c: C.schwa, w: 700}, {t: 'd', c: '#c7c3b5', w: 600}
  ];
  drawRun(ctx, badgeRun, x + 24, y + 28, 14, INTER);
}

function drawModificationsBox(ctx, mx, my) {
  let mw = 320, mh = 390;
  ctx.save();
  ctx.shadowColor = 'rgba(20,18,12,0.15)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 12;
  squircle(ctx, mx, my, mw, mh, 16); 
  ctx.fillStyle = '#1e1c18'; ctx.fill(); // dark warm background
  ctx.restore();
  squircle(ctx, mx, my, mw, mh, 16); 
  ctx.strokeStyle = '#3e3c33'; ctx.lineWidth = 1; ctx.stroke();

  // Title
  ctx.fillStyle = '#8c887a'; ctx.font = `600 11px ${INTER}`;
  ctx.letterSpacing = '1px';
  ctx.fillText('✨ MODIFICATIONS', mx + 20, my + 30);
  ctx.letterSpacing = '0px';

  // Rows
  const mRows = [
    [{t: 'Stress Accents ', c: '#c7c3b5', w: 500}, {t: '(upd', c: '#8c887a', w: 400}, {t: 'á', c: '#fdfbf6', w: 700}, {t: 'te)', c: '#8c887a', w: 400}],
    [{t: 'Long Vowels ', c: '#c7c3b5', w: 500}, {t: '(s', c: '#8c887a', w: 400}, {t: 'oo', c: '#fdfbf6', w: 700}, {t: ':', c: '#8c887a', w: 400}, {t: 'n)', c: '#8c887a', w: 400}],
    [{t: 'Diphthong /aɪ/ ', c: '#c7c3b5', w: 500}, {t: '(i', c: '#8c887a', w: 400}, {t: 'tem)', c: '#8c887a', w: 400, sup: 'i'}],
    [{t: 'Diphthongs /eɪ ɔɪ/ ', c: '#c7c3b5', w: 500}, {t: '(gre', c: '#8c887a', w: 400}, {t: 'at)', c: '#8c887a', w: 400, sup: 'i'}],
    [{t: 'Diphthongs /oʊ aʊ/ ', c: '#c7c3b5', w: 500}, {t: '(ro', c: '#8c887a', w: 400}, {t: 'ad)', c: '#8c887a', w: 400, sup: 'u'}],
    [{t: 'TH /θ/ ', c: '#c7c3b5', w: 500}, {t: '(th', c: '#8c887a', w: 400}, {t: 'in)', c: '#8c887a', w: 400, sup: 't'}],
    [{t: 'DH /ð/ ', c: '#c7c3b5', w: 500}, {t: '(th', c: '#8c887a', w: 400}, {t: 'is)', c: '#8c887a', w: 400, sup: 'd'}],
    [{t: 'T-Sound Morph ', c: '#c7c3b5', w: 500}, {t: '(ask', c: '#8c887a', w: 400}, {t: 'e', c: '#504d41', w: 400}, {t: 'd', c: '#8c887a', w: 400}, {t: ')', c: '#8c887a', w: 400, sup: 't'}],
    [{t: 'Z-Sound Lines ', c: '#c7c3b5', w: 500}, {t: '(vi', c: '#8c887a', w: 400}, {t: 's', c: '#c7c3b5', underdot: true, w: 400}, {t: 'it)', c: '#8c887a', w: 400}],
    [{t: 'Hidden Phonemes ', c: '#c7c3b5', w: 500}, {t: '(', c: '#8c887a', w: 400}, {t: 'one)', c: '#8c887a', w: 400, sup: 'w', supc: '#db6a8f'}],
  ];

  let ry = my + 64;
  for (const row of mRows) {
    drawRun(ctx, row, mx + 20, ry, 14, INTER, 500);
    ry += 32;
  }
}

const Vr = (t, w = 700) => ({ t, c: C.red, w });
const Vg = (t, w = 700) => ({ t, c: C.green, w });
const Vb = (t, w = 700) => ({ t, c: C.blue, w });
const Vy = (t, w = 700) => ({ t, c: C.yellow, w });
const Vu = (t, w = 700) => ({ t, c: C.ultra, w });
const Va = (t, w = 700) => ({ t, c: C.rasp, w });
const Vs = (t, w = 600) => ({ t, c: C.schwa, w });

function markSvg({ size = 320, fg = C.moss, bg = C.ink, glow = C.mossSoft, transparent = false } = {}) {
  const bgr = transparent ? '' : `<rect width="64" height="64" rx="16" fill="${bg}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64">
    <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${glow}"/><stop offset="100%" stop-color="${fg}"/>
    </linearGradient></defs>${bgr}
    <path d="M32 16 L50 46 L14 46 Z" fill="url(#g)"/>
    <text x="32" y="42" text-anchor="middle" font-family="Georgia, serif" font-size="18" font-weight="700" font-style="italic" fill="${bg}">a</text>
    <path d="M30 9 L34 9" stroke="${glow}" stroke-width="2" stroke-linecap="round"/>
    <line x1="20" y1="49" x2="44" y2="49" stroke="${glow}" stroke-width="2" stroke-linecap="round" opacity="0.85"/>
  </svg>`;
}

async function svgToImage(svgStr) {
  return new Promise((res, rej) => {
    const blob = new Blob([svgStr], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = url;
  });
}

// --------------------------------------------------------------------------
// 1. Marquee Promo
// --------------------------------------------------------------------------
async function buildMarquee(cv) {
  const W = 1400, H = 560;
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = C.paper; ctx.fillRect(0, 0, W, H);

  const g1 = ctx.createRadialGradient(W * 0.9, H * 0.2, 50, W * 0.9, H * 0.2, W * 0.6);
  g1.addColorStop(0, 'rgba(241,215,168,0.5)');
  g1.addColorStop(1, 'rgba(241,215,168,0)');
  ctx.fillStyle = g1; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = C.line; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(W * 0.48, 60); ctx.lineTo(W * 0.48, H - 60); ctx.stroke();

  const markImg = await svgToImage(markSvg({ size: 160, fg: C.moss, bg: C.ink, glow: C.mossSoft }));
  ctx.save();
  ctx.shadowColor = 'rgba(20,18,12,0.18)'; ctx.shadowBlur = 28; ctx.shadowOffsetY = 12;
  squircle(ctx, 80, 90, 130, 130, 30);
  ctx.fillStyle = '#fff'; ctx.fill();
  ctx.restore();
  ctx.save();
  squircle(ctx, 80, 90, 130, 130, 30); ctx.clip();
  ctx.drawImage(markImg, 80, 90, 130, 130);
  ctx.restore();

  ctx.fillStyle = C.ink; ctx.font = `700 78px ${FRAUNCES}`; ctx.textBaseline = 'alphabetic';
  ctx.fillText(TWEAKS.wordmark, 80, 304);
  ctx.fillStyle = C.moss; ctx.font = `italic 700 56px ${FRAUNCES}`;
  ctx.fillText(TWEAKS.tagline, 80, 360);
  ctx.fillStyle = C.ink3; ctx.font = `600 13px ${MONO}`;
  ctx.fillText('FOR ENGLISH · BROWSER EXTENSION', 82, 396);

  const chips = [
    { ic: '◉', l: 'Phoneme colorization' },
    { ic: '⚡', l: 'AI explanations' },
    { ic: '↗', l: 'Sync to Anki' },
  ];
  let cx = 80;
  for (const ch of chips) {
    ctx.font = `600 13px ${INTER}`;
    const lw = ctx.measureText(ch.l).width, cw = lw + 42;
    squircle(ctx, cx, 430, cw, 36, 18);
    ctx.fillStyle = C.card; ctx.fill();
    ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = C.moss; ctx.font = `700 14px ${INTER}`;
    ctx.fillText(ch.ic, cx + 14, 454);
    ctx.fillStyle = C.ink2; ctx.font = `600 13px ${INTER}`;
    ctx.fillText(ch.l, cx + 34, 454);
    cx += cw + 8;
  }

  const cardX = W * 0.52, cardY = 80, cardW = W - cardX - 60, cardH = H - 160;
  ctx.save();
  ctx.shadowColor = 'rgba(20,18,12,0.18)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 16;
  squircle(ctx, cardX, cardY, cardW, cardH, 22);
  ctx.fillStyle = C.card; ctx.fill();
  ctx.restore();
  squircle(ctx, cardX, cardY, cardW, cardH, 22);
  ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.stroke();

  ctx.fillStyle = C.cream;
  squircle(ctx, cardX, cardY, cardW, 44, 22); ctx.fill();
  ctx.fillRect(cardX, cardY + 22, cardW, 22);
  [['#FF5F57', 0], ['#FEBC2E', 16], ['#28C840', 32]].forEach(([col, off]) => {
    ctx.beginPath(); ctx.arc(cardX + 20 + off, cardY + 22, 5, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill();
  });
  squircle(ctx, cardX + 90, cardY + 11, cardW - 180, 22, 11);
  ctx.fillStyle = '#fff'; ctx.fill();
  ctx.strokeStyle = C.line; ctx.stroke();
  ctx.fillStyle = C.ink3; ctx.font = `500 11px ${MONO}`;
  ctx.fillText('🔒  en.wikipedia.org/wiki/Phonetics', cardX + 100, cardY + 27);

  const cpX = cardX + 38, cpY = cardY + 88;
  ctx.fillStyle = C.moss; ctx.font = `700 11px ${MONO}`;
  ctx.fillText('LUMEN · LIVE ON THIS PAGE', cpX, cpY);

  drawRun(ctx, [{ t: 'Why every ' }, { t: 'w', w: 600 }, Vu('o'), { t: 'rd in this' }], cpX, cpY + 60, 40, FRAUNCES, 500);
  drawRun(ctx, [
    { t: 's' }, { t: 'á', c: C.red }, { t: 'nt' }, Vr('e'), { t: 'nce is ' },
    { t: 'c', c: C.amber }, { t: 'o', c: C.yellow, w: 700 },
    { t: 'l', c: C.amber }, { t: 'o', c: C.schwa },
    { t: 'r', c: C.amber }, { t: 'i', c: C.green, w: 700 },
    { t: 'z', c: C.amber, underdot: true }, { t: 'ed.', c: C.amber, italic: true },
  ], cpX, cpY + 108, 40, FRAUNCES, 500);

  ctx.fillStyle = C.ink2; ctx.font = `400 18px ${FRAUNCES}`;
  ctx.fillText("Vowel colors map to IPA sounds. Silent letters fade.", cpX, cpY + 160);
  ctx.fillText("Hover any word for an AI explanation. That's the whole product.", cpX, cpY + 188);

  const legY = cpY + 230;
  const legends = [{ c: C.red, l: '/e/' }, { c: C.green, l: '/i/' }, { c: C.blue, l: '/u/' }, { c: C.yellow, l: '/ɔ/' }, { c: C.ultra, l: '/ʌ/' }, { c: C.rasp, l: '/æ/' }];
  let lx = cpX;
  for (const it of legends) {
    ctx.beginPath(); ctx.arc(lx + 7, legY, 7, 0, Math.PI * 2); ctx.fillStyle = it.c; ctx.fill();
    ctx.fillStyle = C.ink3; ctx.font = `600 12px ${MONO}`;
    ctx.fillText(it.l, lx + 20, legY + 4);
    lx += 70;
  }

  const modLegends = [
    { s: '´', l: 'Stress' },
    { s: 'ː', l: 'Long' },
    { s: 'ᵗ', l: 'Morph' },
    { s: 'ʷ', l: 'Hidden' },
  ];
  let mlx = cpX;
  const mLegY = legY + 26;
  for (const it of modLegends) {
    ctx.fillStyle = C.moss; ctx.font = `700 14px ${MONO}`;
    ctx.fillText(it.s, mlx, mLegY + 2);
    ctx.fillStyle = C.ink3; ctx.font = `600 11px ${INTER}`;
    ctx.fillText(it.l, mlx + 14, mLegY);
    mlx += 75;
  }

  ctx.fillStyle = C.ink; ctx.fillRect(0, H - 56, W, 56);
  ctx.fillStyle = C.paper; ctx.font = `600 14px ${INTER}`;
  ctx.fillText('FREE  ·  Chrome  ·  Edge  ·  Brave  ·  Arc', 80, H - 22);
  ctx.fillStyle = C.amber; ctx.font = `700 14px ${MONO}`;
  ctx.fillText(TWEAKS.url, W - 410, H - 22);
}

// --------------------------------------------------------------------------
// 2. Small Promo
// --------------------------------------------------------------------------
async function buildSmallPromo(cv) {
  const W = 440, H = 280;
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = C.ink; ctx.fillRect(0, 0, W, H);
  const g = ctx.createRadialGradient(W * 0.2, H * 0.2, 20, W * 0.2, H * 0.2, 280);
  g.addColorStop(0, 'rgba(198,212,179,0.18)'); g.addColorStop(1, 'rgba(198,212,179,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

  const markImg = await svgToImage(markSvg({ size: 64, fg: C.moss, bg: C.ink, glow: C.mossSoft }));
  ctx.save(); squircle(ctx, 30, 28, 64, 64, 14); ctx.clip();
  ctx.drawImage(markImg, 30, 28, 64, 64); ctx.restore();
  ctx.strokeStyle = 'rgba(198,212,179,0.2)'; ctx.lineWidth = 1; ctx.stroke();

  ctx.fillStyle = C.paper; ctx.font = `700 22px ${FRAUNCES}`; ctx.textBaseline = 'alphabetic';
  ctx.fillText(TWEAKS.wordmark, 110, 56);
  ctx.fillStyle = C.mossSoft; ctx.font = `italic 700 16px ${FRAUNCES}`;
  ctx.fillText(TWEAKS.tagline, 110, 78);

  drawRun(ctx, [
    { t: TWEAKS.small1.charAt(0), c: C.paper },
    Vg('ea'),
    { t: TWEAKS.small1.slice(3), c: C.paper },
  ], 30, 156, 36, FRAUNCES, 500);

  ctx.fillStyle = C.amber; ctx.font = `italic 500 36px ${FRAUNCES}`;
  ctx.fillText(TWEAKS.small2, 30, 198);

  ctx.fillStyle = C.ink4; ctx.font = `500 12px ${INTER}`;
  ctx.fillText('IPA colorization on every webpage. Powered by AI.', 30, 226);

  squircle(ctx, 30, 244, 156, 28, 14);
  ctx.fillStyle = C.amber; ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = `700 12px ${INTER}`;
  ctx.fillText('+  Add to Chrome', 56, 262);
  ctx.fillStyle = 'rgba(251,247,236,0.5)'; ctx.font = `600 10px ${MONO}`;
  ctx.fillText('v1.0  ·  FREE  ·  4.8★', 200, 261);
}

// --------------------------------------------------------------------------
// 3. Screenshot 1 (Before/After)
// --------------------------------------------------------------------------
async function buildScreenshot1(cv) {
  const W = 1280, H = 800;
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = C.paper; ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = C.moss; ctx.font = `700 13px ${MONO}`;
  ctx.fillText('LUMEN  ·  ENGLISH PRONUNCIATION', 60, 60);
  ctx.fillStyle = C.ink; ctx.font = `500 56px ${FRAUNCES}`;
  ctx.fillText('What Lumen does to', 60, 130);
  ctx.fillText('your ', 60, 196);
  const off = 60 + ctx.measureText('your ').width;
  ctx.fillStyle = C.amber; ctx.font = `italic 500 56px ${FRAUNCES}`;
  ctx.fillText('reading.', off, 196);
  ctx.fillStyle = C.ink3; ctx.font = `400 18px ${FRAUNCES}`;
  ctx.fillText('Same text. Same page. Now you can hear it.', 60, 234);

  const colY = 290, colW = 540, colH = 440, beforeX = 60;
  squircle(ctx, beforeX, colY, colW, colH, 16);
  ctx.fillStyle = C.card; ctx.fill();
  ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = C.ink4; ctx.font = `700 11px ${MONO}`;
  ctx.fillText('BEFORE', beforeX + 24, colY + 32);
  const beforeLines = [
    'Reading English is harder than it looks.',
    'About forty percent of common words contain',
    'a silent letter or a vowel that doesn\'t sound',
    'the way it\'s spelled. That\'s why receipt',
    'rhymes with feet, why solution hides an /e/,',
    'and why no one can agree on how to say',
    'caramel.',
  ];
  ctx.fillStyle = C.ink; ctx.font = `400 19px ${FRAUNCES}`;
  beforeLines.forEach((l, i) => ctx.fillText(l, beforeX + 24, colY + 76 + i * 32));
  ctx.fillStyle = C.amber; ctx.font = `700 22px ${MONO}`;
  ctx.fillText('→', 615, colY + 230);

  const afterX = 680;
  squircle(ctx, afterX, colY, colW, colH, 16);
  ctx.fillStyle = C.card; ctx.fill();
  ctx.strokeStyle = C.amber; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = C.amber;
  ctx.beginPath();
  ctx.moveTo(afterX, colY);
  ctx.lineTo(afterX + 80, colY);
  ctx.lineTo(afterX + 80, colY + 22);
  ctx.lineTo(afterX + 16, colY + 22);
  ctx.arcTo(afterX, colY + 22, afterX, colY + 6, 16);
  ctx.lineTo(afterX, colY);
  ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = `700 10px ${MONO}`;
  ctx.fillText('LUMEN ON', afterX + 14, colY + 15);

  let ly = colY + 76;
  drawRun(ctx, [{ t: 'R' }, { t: 'ea', c: C.green, sup: '´' }, { t: 'ding ' }, { t: 'Engl' }, { t: 'i', c: C.schwa }, { t: 'sh is h' }, { t: 'á', c: C.rasp }, { t: 'rder th' }, { t: 'a', c: C.rasp }, { t: 'n it l' }, { t: 'oo', c: C.blue, sup: 'ː' }, { t: 'ks.' }], afterX + 24, ly, 19, FRAUNCES); ly += 32;
  drawRun(ctx, [{ t: 'About ' }, { t: 'f' }, { t: 'o', c: C.amber }, { t: 'rty percent of common w' }, { t: 'o', c: C.schwa }, { t: 'rds c' }, { t: 'o', c: C.schwa }, { t: 'nt' }, { t: 'a', c: C.rasp, sup: 'i' }, { t: 'in' }], afterX + 24, ly, 19, FRAUNCES); ly += 32;
  drawRun(ctx, [{ t: 'a ' }, { t: 's' }, { t: 'í', c: C.rasp }, { t: 'l' }, { t: 'e', c: C.schwa }, { t: 'nt l' }, { t: 'é', c: C.red }, { t: 'tt' }, { t: 'e', c: C.schwa }, { t: 'r or a v' }, { t: 'o', c: C.amber }, { t: 'w' }, { t: 'e', c: C.schwa }, { t: 'l that d' }, { t: 'o', c: C.schwa }, { t: 'esn\'t s' }, { t: 'ou', c: C.blue }, { t: 'nd' }], afterX + 24, ly, 19, FRAUNCES); ly += 32;
  drawRun(ctx, [{ t: 'the way it\'s spelled. That\'s why r' }, { t: 'e', c: C.schwa }, { t: 'c' }, { t: 'ei', c: C.green }, { t: 'p', faded: true }, { t: 't' }], afterX + 24, ly, 19, FRAUNCES); ly += 32;
  drawRun(ctx, [{ t: 'rhymes with ' }, { t: 'f' }, { t: 'ee', c: C.green }, { t: 't, why ' }, { t: 's' }, { t: 'o', c: C.schwa }, { t: 'l' }, { t: 'ú', c: C.blue }, { t: 't' }, { t: 'i', c: C.schwa }, { t: 'o', c: C.schwa }, { t: 'n hides an /e/,' }], afterX + 24, ly, 19, FRAUNCES); ly += 32;
  drawRun(ctx, [{ t: 'and why n' }, { t: 'o', c: C.amber }, { t: ' ' }, { t: 'one', sup: 'w', supc: C.rasp }, { t: ' can ' }, { t: 'a', c: C.schwa }, { t: 'gr' }, { t: 'ee', c: C.green }, { t: ' on h' }, { t: 'o', c: C.amber }, { t: 'w to s' }, { t: 'ay' }], afterX + 24, ly, 19, FRAUNCES); ly += 32;
  drawRun(ctx, [{ t: 'c' }, { t: 'á', c: C.rasp }, { t: 'r' }, { t: 'a', c: C.rasp }, { t: 'm' }, { t: 'e', c: C.schwa }, { t: 'l.' }], afterX + 24, ly, 19, FRAUNCES);

  ctx.fillStyle = C.ink3; ctx.font = `500 13px ${INTER}`; ctx.textAlign = 'center';
  ctx.fillText('Hover any underlined word for the AI explanation', W / 2, 760);
  ctx.textAlign = 'left';
}

// --------------------------------------------------------------------------
// 4. Screenshot 2 (Six colors)
// --------------------------------------------------------------------------
async function buildScreenshot2(cv) {
  const W = 1280, H = 800;
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = C.paper; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = C.moss; ctx.font = `700 13px ${MONO}`;
  ctx.fillText('THE SYSTEM', 60, 60);
  ctx.fillStyle = C.ink; ctx.font = `500 56px ${FRAUNCES}`;
  ctx.fillText('Six colors.', 60, 130);
  ctx.fillText('Six sounds.', 60, 192);
  ctx.fillStyle = C.amber; ctx.font = `italic 500 56px ${FRAUNCES}`;
  ctx.fillText('One system.', 60, 254);
  ctx.fillStyle = C.ink3; ctx.font = `400 17px ${FRAUNCES}`;
  ctx.fillText('Every English vowel sound maps to a color you', 60, 296);
  ctx.fillText('can see at a glance. No memorizing IPA needed.', 60, 320);

  const grid = [
    { c: C.red, ipa: '/ɛ/', name: 'red', ex1: ['s', Vr('e'), 'cond'], ex2: ['s', 'o', 'l', Vr('u'), 't', 'i', 'o', 'n'] },
    { c: C.green, ipa: '/i/', name: 'green', ex1: ['r', Vg('ea'), 'd'], ex2: ['r', 'e', 'c', Vg('ei'), F('p'), 't'] },
    { c: C.blue, ipa: '/u/', name: 'teal', ex1: ['t', Vb('o'), 'mb'], ex2: ['s', 'ch', Vb('oo'), 'l'] },
    { c: C.yellow, ipa: '/ɔ/', name: 'amber', ex1: ['q', 'u', Vy('a'), 'r', 't', 'e', 'r'], ex2: ['c', Vy('au'), 'gh', 't'] },
    { c: C.ultra, ipa: '/ʌ/', name: 'purple', ex1: ['s', Vu('o'), 'm', 'e'], ex2: ['c', Vu('u'), 'p'] },
    { c: C.rasp, ipa: '/æ/', name: 'pink', ex1: ['c', Va('a'), 't'], ex2: ['l', Va('a'), F('u'), 'gh'] },
  ];
  const gridX = 560, gridY = 70, gw = 330, gh = 215, gap = 14;
  for (let i = 0; i < 6; i++) {
    const row = Math.floor(i / 2), col = i % 2;
    const x = gridX + col * (gw + gap), y = gridY + row * (gh + gap);
    const it = grid[i];
    squircle(ctx, x, y, gw, gh, 14);
    ctx.fillStyle = C.card; ctx.fill();
    ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = it.c;
    ctx.beginPath();
    ctx.moveTo(x + 14, y); ctx.lineTo(x + gw - 14, y);
    ctx.arcTo(x + gw, y, x + gw, y + 7, 7);
    ctx.lineTo(x + gw, y + 7); ctx.lineTo(x, y + 7);
    ctx.arcTo(x, y, x + 14, y, 7); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 24, y + 36, 9, 0, Math.PI * 2); ctx.fillStyle = it.c; ctx.fill();
    ctx.fillStyle = C.ink; ctx.font = `700 22px ${MONO}`;
    ctx.fillText(it.ipa, x + 42, y + 42);
    ctx.fillStyle = C.ink4; ctx.font = `700 10px ${MONO}`;
    ctx.fillText(it.name.toUpperCase(), x + gw - 20 - ctx.measureText(it.name.toUpperCase()).width, y + 42);
    const wp1 = it.ex1.map(s => typeof s === 'string' ? { t: s } : s);
    const wp2 = it.ex2.map(s => typeof s === 'string' ? { t: s } : s);
    drawRun(ctx, wp1, x + 22, y + 110, 42, FRAUNCES, 500, C.ink);
    drawRun(ctx, wp2, x + 22, y + 175, 36, FRAUNCES, 500, C.ink);
  }

  drawBadge(ctx, W - 260, H - 90);
}

// --------------------------------------------------------------------------
// 5. Screenshot 3 (Popup)
// --------------------------------------------------------------------------
async function buildScreenshot3(cv) {
  const W = 1280, H = 800;
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = C.paper; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = C.moss; ctx.font = `700 13px ${MONO}`;
  ctx.fillText('THE POP-UP', 60, 60);
  ctx.fillStyle = C.ink; ctx.font = `500 48px ${FRAUNCES}`;
  ctx.fillText('Click a word.', 60, 124);
  ctx.fillText('The AI tells', 60, 180);
  ctx.fillStyle = C.amber; ctx.font = `italic 500 48px ${FRAUNCES}`;
  ctx.fillText('you why.', 60, 236);
  ctx.fillStyle = C.ink3; ctx.font = `400 16px ${FRAUNCES}`;
  ctx.fillText('Not just a definition — a contextual', 60, 274);
  ctx.fillText('explanation of why this exact word.', 60, 296);

  const feats = [
    { l: 'Native-speaker audio', s: 'tap the speaker for IPA pronunciation' },
    { l: 'AI contextual definition', s: 'meaning fitted to this exact sentence' },
    { l: 'Why this word', s: 'choice vs alternatives, explained' },
    { l: 'Save to Anki', s: 'one-click push with audio + IPA' },
  ];
  let fy = 348;
  for (const f of feats) {
    ctx.fillStyle = C.amber; ctx.font = `700 11px ${MONO}`;
    ctx.fillText('◉', 60, fy + 4);
    ctx.fillStyle = C.ink; ctx.font = `600 14px ${INTER}`;
    ctx.fillText(f.l, 78, fy + 4);
    ctx.fillStyle = C.ink3; ctx.font = `400 12px ${INTER}`;
    ctx.fillText(f.s, 78, fy + 22);
    fy += 44;
  }

  const artX = 600, artY = 60, artW = 620, artH = 680;
  ctx.save();
  ctx.shadowColor = 'rgba(20,18,12,0.18)'; ctx.shadowBlur = 32; ctx.shadowOffsetY = 16;
  squircle(ctx, artX, artY, artW, artH, 14); ctx.fillStyle = C.card; ctx.fill();
  ctx.restore();
  squircle(ctx, artX, artY, artW, artH, 14); ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.stroke();

  ctx.fillStyle = C.cream;
  ctx.beginPath();
  ctx.moveTo(artX + 14, artY); ctx.lineTo(artX + artW - 14, artY);
  ctx.arcTo(artX + artW, artY, artX + artW, artY + 14, 14);
  ctx.lineTo(artX + artW, artY + 40); ctx.lineTo(artX, artY + 40);
  ctx.lineTo(artX, artY + 14); ctx.arcTo(artX, artY, artX + 14, artY, 14);
  ctx.closePath(); ctx.fill();
  [['#FF5F57', 0], ['#FEBC2E', 16], ['#28C840', 32]].forEach(([c, o]) => {
    ctx.beginPath(); ctx.arc(artX + 16 + o, artY + 20, 5, 0, Math.PI * 2); ctx.fillStyle = c; ctx.fill();
  });
  ctx.fillStyle = C.ink3; ctx.font = `500 11px ${MONO}`;
  ctx.fillText('🔒  en.wikipedia.org/wiki/Browser_extension', artX + 86, artY + 24);
  ctx.fillStyle = C.line; ctx.fillRect(artX, artY + 40, artW, 1);
  ctx.fillStyle = C.ink4; ctx.font = `700 10px ${MONO}`;
  ctx.fillText('WIKIPEDIA · BROWSER EXTENSION', artX + 30, artY + 76);
  ctx.fillStyle = C.ink; ctx.font = `500 28px ${FRAUNCES}`;
  ctx.fillText('Browser extension', artX + 30, artY + 114);

  let ay = artY + 152;
  [
    [{ t: 'A browser ' }, { t: 'extension', c: C.amber }, { t: ' is a small software' }],
    [{ t: 'module for customizing a web browser.' }],
    [{ t: 'Browsers typically allow a variety of' }],
    [{ t: 'extensions, including user interface' }],
    [{ t: 'modifications, ad blocking, and more.' }],
  ].forEach(ln => { drawRun(ctx, ln, artX + 30, ay, 16, FRAUNCES, 400); ay += 26; });

  const popX = artX + 80, popY = artY + 165;
  try {
    const img = await new Promise((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = '/word-popup.png';
    });

    const popW_actual = 410;
    const popH_actual = popW_actual * (img.height / img.width);

    ctx.beginPath();
    ctx.moveTo(popX + 36, popY); ctx.lineTo(popX + 44, popY - 8); ctx.lineTo(popX + 52, popY);
    ctx.fillStyle = C.card; ctx.fill();

    ctx.save();
    ctx.shadowColor = 'rgba(20,18,12,0.18)'; ctx.shadowBlur = 60; ctx.shadowOffsetY = 22;
    squircle(ctx, popX, popY, popW_actual, popH_actual, 12); ctx.fillStyle = C.paper; ctx.fill();
    ctx.restore();
    squircle(ctx, popX, popY, popW_actual, popH_actual, 12); ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.stroke();
    
    ctx.save();
    squircle(ctx, popX, popY, popW_actual, popH_actual, 12); ctx.clip();
    ctx.drawImage(img, popX, popY, popW_actual, popH_actual);
    ctx.restore();

    // Draw mouse pointer
    const mx = artX + 130;
    const my = artY + 145;
    ctx.save();
    ctx.translate(mx, my);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 16);
    ctx.lineTo(4, 13);
    ctx.lineTo(7, 20);
    ctx.lineTo(10, 19);
    ctx.lineTo(7, 12);
    ctx.lineTo(12, 12);
    ctx.closePath();
    ctx.fillStyle = '#000';
    ctx.fill();
    ctx.strokeStyle = '#FFF';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

  } catch (e) {
    console.error('Failed to load word-popup.png', e);
  }
}

// --------------------------------------------------------------------------
// 6. Screenshot 4 (Settings) - USING REAL IMAGE
// --------------------------------------------------------------------------
async function buildScreenshot4(cv) {
  const W = 1280, H = 800;
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = C.paper; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = C.moss; ctx.font = `700 13px ${MONO}`;
  ctx.fillText('YOUR RULES', 60, 60);
  ctx.fillStyle = C.ink; ctx.font = `500 48px ${FRAUNCES}`;
  ctx.fillText('Customize', 60, 124);
  ctx.fillText('every', 60, 180);
  ctx.fillStyle = C.amber; ctx.font = `italic 500 48px ${FRAUNCES}`;
  ctx.fillText('detail.', 60, 236);
  ctx.fillStyle = C.ink3; ctx.font = `400 16px ${FRAUNCES}`;
  ctx.fillText('Toggle any color, change the popup', 60, 274);
  ctx.fillText('trigger, switch per-site or universal —', 60, 296);
  ctx.fillText('Lumen is yours.', 60, 318);

  drawModificationsBox(ctx, 60, 350);

  try {
    const img = await new Promise((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = '/real-popup.png';
    });

    const pH = 680;
    const pW = pH * (img.width / img.height);
    const pX = 560;
    const pY = 60; // Top-align with the text on the left

    ctx.save();
    ctx.shadowColor = 'rgba(20,18,12,0.18)'; ctx.shadowBlur = 36; ctx.shadowOffsetY = 16;
    squircle(ctx, pX, pY, pW, pH, 14); ctx.fillStyle = C.card; ctx.fill();
    ctx.restore();
    squircle(ctx, pX, pY, pW, pH, 14); ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.stroke();
    
    ctx.save();
    squircle(ctx, pX, pY, pW, pH, 14); ctx.clip();
    ctx.drawImage(img, pX, pY, pW, pH);
    ctx.restore();
  } catch (e) {
    console.error('Failed to load real-popup.png', e);
  }

  drawBadge(ctx, W - 260, H - 90);
}

// --------------------------------------------------------------------------
// 7. Screenshot 5 (Works everywhere)
// --------------------------------------------------------------------------
async function buildScreenshot5(cv) {
  const W = 1280, H = 800;
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = C.paper; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = C.moss; ctx.font = `700 13px ${MONO}`;
  ctx.fillText('WORKS EVERYWHERE', 60, 60);
  ctx.fillStyle = C.ink; ctx.font = `500 48px ${FRAUNCES}`;
  ctx.fillText('Wikipedia. The Times.', 60, 124);
  ctx.fillStyle = C.amber; ctx.font = `italic 500 48px ${FRAUNCES}`;
  ctx.fillText('Your favorite blog.', 60, 180);
  ctx.fillStyle = C.ink3; ctx.font = `400 17px ${FRAUNCES}`;
  ctx.fillText('Lumen runs on every page you open. Same colors, same AI, no setup.', 60, 220);

  const sites = [
    { brand: 'Wikipedia', url: 'en.wikipedia.org', accent: '#3366CC', title: 'Photosynthesis', body: [
        [{ t: 'P' }, { t: 'h' }, Vb('o'), { t: 'tosynthesis is the bi' }, Vu('o'), { t: 'l' }, Vs('o'), { t: 'g' }, Vs('i'), { t: 'cal pr' }, Vu('o'), { t: 'cess' }],
        [{ t: 'used by ' }, { t: 'plants' }, { t: ' and other ' }, { t: 'organ' }, { t: 'isms to c' }, Vs('o'), { t: 'nv' }, Vs('e'), { t: 'rt l' }, Vg('i'), { t: 'ght' }],
        [{ t: 'energy into ch' }, Vr('e'), { t: 'm' }, Vs('i'), { t: 'cal energy.' }],
    ]},
    { brand: 'The Times', url: 'nytimes.com', accent: '#000', title: 'Markets shrug off rate fears', body: [
        [{ t: 'Wall Street ' }, { t: 'r' }, Vs('e'), { t: 'c' }, Vs('o'), { t: 'v' }, Vs('e'), { t: 'red ground on Tuesday' }],
        [{ t: 'aft' }, Vs('e'), { t: 'r f' }, Va('e'), { t: 'derl reserve minutes su' }, Vs('gg'), { t: 'gested' }],
        [{ t: 'p' }, Va('a'), { t: 'tience on ' }, Vr('e'), { t: 'c' }, Vs('o'), { t: 'n' }, Vu('o'), { t: 'mic policy.' }],
    ]},
    { brand: 'Substack', url: 'someone.substack.com', accent: '#FF6719', title: 'Why I quit reading newsletters', body: [
        [{ t: 'I ' }, { t: 's' }, Vs('u'), { t: 'bs' }, Vr('c'), { t: 'r' }, Va('i'), { t: 'bed to 47 of them. The avg.' }],
        [{ t: 'r' }, Vg('ea'), { t: 'd t' }, Va('i'), { t: 'me w' }, Vu('o'), { t: 'rks out to a year of my life.' }],
        [{ t: 'I' }, { t: 'm ' }, { t: 'd' }, Vu('o'), { t: 'ne. Here\'s what I do ' }, { t: 'i' }, Vu('n'), { t: 'st' }, Vr('ea'), { t: 'd.' }],
    ]},
  ];
  const cardW = 380, cardH = 460, gap = 16;
  const startX = (W - (cardW * 3 + gap * 2)) / 2;
  for (let i = 0; i < 3; i++) {
    const x = startX + i * (cardW + gap), y = 260;
    ctx.save();
    ctx.shadowColor = 'rgba(20,18,12,0.12)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 10;
    squircle(ctx, x, y, cardW, cardH, 12); ctx.fillStyle = C.card; ctx.fill();
    ctx.restore();
    squircle(ctx, x, y, cardW, cardH, 12); ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.stroke();

    ctx.fillStyle = C.cream;
    ctx.beginPath();
    ctx.moveTo(x + 12, y); ctx.lineTo(x + cardW - 12, y);
    ctx.arcTo(x + cardW, y, x + cardW, y + 12, 12);
    ctx.lineTo(x + cardW, y + 32); ctx.lineTo(x, y + 32);
    ctx.lineTo(x, y + 12); ctx.arcTo(x, y, x + 12, y, 12);
    ctx.closePath(); ctx.fill();
    [['#FF5F57', 0], ['#FEBC2E', 12], ['#28C840', 24]].forEach(([c, o]) => {
      ctx.beginPath(); ctx.arc(x + 14 + o, y + 16, 4, 0, Math.PI * 2); ctx.fillStyle = c; ctx.fill();
    });
    ctx.fillStyle = C.ink3; ctx.font = `500 10px ${MONO}`;
    ctx.fillText('🔒 ' + sites[i].url, x + 60, y + 20);
    ctx.beginPath(); ctx.arc(x + cardW - 18, y + 16, 5, 0, Math.PI * 2);
    ctx.fillStyle = C.moss; ctx.fill();
    ctx.fillStyle = C.line; ctx.fillRect(x, y + 32, cardW, 1);

    ctx.fillStyle = sites[i].accent; ctx.font = `700 13px ${INTER}`;
    ctx.fillText(sites[i].brand.toUpperCase(), x + 22, y + 60);
    ctx.fillStyle = C.ink; ctx.font = `600 22px ${FRAUNCES}`;
    const words = sites[i].title.split(' ');
    let line = '', ty = y + 96;
    for (const w of words) {
      const test = line + w + ' ';
      if (ctx.measureText(test).width > cardW - 44 && line) {
        ctx.fillText(line.trim(), x + 22, ty); ty += 28; line = w + ' ';
      } else line = test;
    }
    ctx.fillText(line.trim(), x + 22, ty);

    let by = ty + 50;
    for (const ln of sites[i].body) { drawRun(ctx, ln, x + 22, by, 16, FRAUNCES, 400); by += 26; }

    squircle(ctx, x + 22, y + cardH - 50, cardW - 44, 32, 16);
    ctx.fillStyle = C.cream; ctx.fill();
    ctx.fillStyle = C.moss; ctx.font = `700 10px ${MONO}`;
    ctx.fillText('● LUMEN ACTIVE  ·  COLORIZING IN REAL TIME', x + 38, y + cardH - 30);
  }

  ctx.fillStyle = C.ink3; ctx.font = `500 13px ${INTER}`;
  ctx.textAlign = 'center';
  ctx.fillText('No site is special. If it has English, Lumen reads it.', W / 2, 760);
  ctx.textAlign = 'left';
}

// --------------------------------------------------------------------------
// 8. Screenshot 6 (Modifications)
// --------------------------------------------------------------------------
async function buildScreenshot6(cv) {
  const W = 1280, H = 800;
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = C.paper; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = C.moss; ctx.font = `700 13px ${MONO}`;
  ctx.fillText('MODIFICATIONS', 60, 60);
  ctx.fillStyle = C.ink; ctx.font = `500 48px ${FRAUNCES}`;
  ctx.fillText('Phonetic', 60, 124);
  ctx.fillStyle = C.amber; ctx.font = `italic 500 48px ${FRAUNCES}`;
  ctx.fillText('Adjustments.', 260, 124);
  ctx.fillStyle = C.ink3; ctx.font = `400 17px ${FRAUNCES}`;
  ctx.fillText('Lumen handles the complex edge cases of English orthography.', 60, 170);

  const modGrid = [
    { c: C.moss, ipa: '´', name: 'stress', ex1: [{t: 'upd'}, {t: 'á', c: '#1e1c18', w: 700}, {t: 'te'}], ex2: [{t: 'h'}, {t: 'ó', c: '#1e1c18', w: 700}, {t: 'tel'}] },
    { c: C.amber, ipa: 'ː', name: 'long', ex1: [{t: 's'}, {t: 'oo', c: '#1e1c18', w: 700}, {t: ':', c: '#8c887a'}, {t: 'n'}], ex2: [{t: 'm'}, {t: 'oo', c: '#1e1c18', w: 700}, {t: ':', c: '#8c887a'}, {t: 'n'}] },
    { c: C.rasp, ipa: 'ʷ', name: 'hidden', ex1: [{t: 'one', sup: 'w', supc: '#db6a8f'}], ex2: [{t: 'once', sup: 'w', supc: '#db6a8f'}] },
    { c: C.ultra, ipa: 'ᵗ', name: 'morph', ex1: [{t: 'ask'}, {t: 'e', c: '#504d41'}, {t: 'd', sup: 't'}], ex2: [{t: 'stopp'}, {t: 'e', c: '#504d41'}, {t: 'd', sup: 't'}] },
    { c: C.green, ipa: 'ⁱ', name: 'diphthong', ex1: [{t: 'i', sup: 'i'}, {t: 'tem'}], ex2: [{t: 'l'}, {t: 'i', sup: 'i'}, {t: 'ke'}] },
    { c: C.red, ipa: 'ⁱ', name: 'diphthong', ex1: [{t: 'gr'}, {t: 'e'}, {t: 'at', sup: 'i'}], ex2: [{t: 'v'}, {t: 'e'}, {t: 'in', sup: 'i'}] },
    { c: C.blue, ipa: 'ᵘ', name: 'diphthong', ex1: [{t: 'r'}, {t: 'o'}, {t: 'ad', sup: 'u'}], ex2: [{t: 'l'}, {t: 'o'}, {t: 'w', sup: 'u'}] },
    { c: C.yellow, ipa: 'ᵗ', name: 'TH', ex1: [{t: 'th', sup: 't'}, {t: 'in'}], ex2: [{t: 'th', sup: 't'}, {t: 'ick'}] },
    { c: C.card, ipa: 'ᵈ', name: 'DH', ex1: [{t: 'th', sup: 'd'}, {t: 'is'}], ex2: [{t: 'th', sup: 'd'}, {t: 'at'}] },
    { c: C.mossSoft, ipa: '_', name: 'lines', ex1: [{t: 'vi'}, {t: 's', underdot: true}, {t: 'it'}], ex2: [{t: 'ha'}, {t: 's', underdot: true}] },
  ];

  const mGridX = 60, mGridY = 220, mgw = 220, mgh = 220, mgap = 16;
  for (let i = 0; i < 10; i++) {
    const row = Math.floor(i / 5), col = i % 5;
    const x = mGridX + col * (mgw + mgap), y = mGridY + row * (mgh + mgap);
    const it = modGrid[i];
    
    // Card background
    squircle(ctx, x, y, mgw, mgh, 14);
    ctx.fillStyle = C.card; ctx.fill();
    ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.stroke();
    
    // Top colored bar
    ctx.fillStyle = it.c;
    ctx.beginPath();
    ctx.moveTo(x + 14, y); ctx.lineTo(x + mgw - 14, y);
    ctx.arcTo(x + mgw, y, x + mgw, y + 7, 7);
    ctx.lineTo(x + mgw, y + 7); ctx.lineTo(x, y + 7);
    ctx.arcTo(x, y, x + 14, y, 7); ctx.closePath(); ctx.fill();
    
    // Dot and IPA
    ctx.beginPath(); ctx.arc(x + 24, y + 36, 9, 0, Math.PI * 2); ctx.fillStyle = it.c; ctx.fill();
    ctx.fillStyle = C.ink; ctx.font = `700 22px ${MONO}`;
    ctx.fillText(it.ipa, x + 42, y + 42);
    
    // Label
    ctx.fillStyle = C.ink4; ctx.font = `700 10px ${MONO}`;
    ctx.fillText(it.name.toUpperCase(), x + mgw - 20 - ctx.measureText(it.name.toUpperCase()).width, y + 42);
    
    // Examples
    drawRun(ctx, it.ex1, x + 22, y + 110, 36, INTER, 500, C.ink);
    drawRun(ctx, it.ex2, x + 22, y + 170, 32, INTER, 500, C.ink);
  }

  drawBadge(ctx, W - 260, H - 90);
}

const ASSETS = [
  { id: 'marquee-promo-1400x560', name: 'Marquee promo', dim: '1400 × 560', build: buildMarquee, desc: 'For featured category placements' },
  { id: 'small-promo-440x280', name: 'Small promo', dim: '440 × 280', build: buildSmallPromo, desc: 'Shown in search results' },
  { id: 'screenshot-1-1280x800', name: 'Screenshot 1 — Before / After', dim: '1280 × 800', build: buildScreenshot1, desc: 'Hero · the value prop' },
  { id: 'screenshot-2-1280x800', name: 'Screenshot 2 — Six colors', dim: '1280 × 800', build: buildScreenshot2, desc: 'The phoneme system' },
  { id: 'screenshot-3-1280x800', name: 'Screenshot 3 — AI pop-up', dim: '1280 × 800', build: buildScreenshot3, desc: 'Signature feature' },
  { id: 'screenshot-4-1280x800', name: 'Screenshot 4 — Settings', dim: '1280 × 800', build: buildScreenshot4, desc: 'Customization depth' },
  { id: 'screenshot-5-1280x800', name: 'Screenshot 5 — Works everywhere', dim: '1280 × 800', build: buildScreenshot5, desc: 'Scope of coverage' },
  { id: 'screenshot-6-1280x800', name: 'Screenshot 6 — Modifications', dim: '1280 × 800', build: buildScreenshot6, desc: 'Phonetic adjustments' },
];

function AssetStudio() {
  const [status, setStatus] = useState('Ready');
  const canvasesRef = useRef({});

  const flashStatus = (s) => {
    setStatus(s);
  };

  const renderOne = async (id) => {
    const a = ASSETS.find(x => x.id === id);
    if (!a) return;
    flashStatus('Rendering ' + a.name + '…');
    await a.build(canvasesRef.current[id]);
    flashStatus('Rendered ' + a.name);
  };

  const renderAll = async () => {
    flashStatus('Rendering all 7 assets…');
    try { await document.fonts.ready; } catch { }
    for (const a of ASSETS) {
      await a.build(canvasesRef.current[a.id]);
    }
    flashStatus('All assets rendered');
  };

  const downloadOne = (id) => {
    const cv = canvasesRef.current[id];
    cv.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = id + '.png';
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      flashStatus('Downloaded ' + id + '.png');
    }, 'image/png');
  };

  const downloadAllZip = async () => {
    if (!window.JSZip) { flashStatus('JSZip not loaded'); return; }
    flashStatus('Building .zip…');
    const zip = new window.JSZip();
    for (const a of ASSETS) {
      const blob = await new Promise(r => canvasesRef.current[a.id].toBlob(r, 'image/png'));
      zip.file(a.id + '.png', blob);
    }
    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'lumen-pronunciation-store-assets.zip';
    document.body.appendChild(link); link.click(); link.remove();
    URL.revokeObjectURL(url);
    flashStatus('Downloaded .zip');
  };

  // Initial render
  useEffect(() => {
    renderAll();
  }, []);

  return (
    <>
      <div className="page-head">
        <div className="brand">
          <div className="brand-mark">
            <svg width="48" height="48" viewBox="0 0 48 48">
              <defs>
                <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stop-color="#C6D4B3" />
                  <stop offset="1" stop-color="#5B7A4B" />
                </linearGradient>
              </defs>
              <path d="M24 10 L38 32 L10 32 Z" fill="url(#bg)" />
              <text x="24" y="30" textAnchor="middle" fontFamily="Georgia, serif" fontSize="14" fontWeight="700"
                fontStyle="italic" fill="#1B1A17">a</text>
              <line x1="15" y1="37" x2="33" y2="37" stroke="#C6D4B3" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <div className="brand-name">Lumen<em> Pronunciation</em></div>
            <div className="brand-tag">Chrome Web Store · Asset Studio</div>
          </div>
        </div>
        <div className="actions">
          <button className="btn" onClick={renderAll}><span className="ic">↻</span> Render all</button>
          <button className="btn primary" onClick={downloadAllZip}><span className="ic">↓</span> Download .zip</button>
        </div>
      </div>

      <div className="hint">
        Click <strong>Render all</strong>. Download the .zip to upload to Chrome Web Store.
        This React version uses your static <code>real-popup.png</code> for Screenshot 4!
      </div>

      <div className="grid">
        {ASSETS.map(a => (
          <div key={a.id} className="card">
            <div className="card-head">
              <div className="card-title">
                <h2>{a.name}</h2>
                <span className="dim">{a.dim}</span>
              </div>
              <div className="card-actions">
                <button className="btn" onClick={() => renderOne(a.id)}><span className="ic">↻</span></button>
                <button className="btn" onClick={() => downloadOne(a.id)}><span className="ic">↓</span></button>
              </div>
            </div>
            <div className="card-body">
              <canvas className="preview" ref={el => canvasesRef.current[a.id] = el} />
            </div>
          </div>
        ))}
      </div>

      {status !== 'Ready' && <div className="status show">{status}</div>}
    </>
  );
}

createRoot(document.getElementById('root')).render(<AssetStudio />);
