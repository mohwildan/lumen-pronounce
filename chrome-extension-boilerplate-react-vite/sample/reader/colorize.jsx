// Lumen Reader — IPA colorize primitives
// Each component wraps a phoneme span inside a word and styles it per the
// extension's color/diacritic scheme. Designed to be readable as a sentence
// of components: <Word>r<G>ea</G>d</Word>

import React from 'react';

export const IPA_COLORS = {
  e:        '#C7372F', // red       /e/ second, solution
  i:        '#2C7A4B', // green     /i/ read, receipt
  u:        '#2860B4', // blue      /u/ tomb
  o:        '#C99411', // yellow    /ɔ/ quarter
  schwa:    '#A39D8C', // muted     /ə/ unstressed
  ah:       '#374A8C', // ultramar  /ʌ/ some
  ae:       '#B5375E', // raspberry /æ/ cat
  diphAi:   '#1B1A17',
  diphEi:   '#1B1A17',
  diphOu:   '#1B1A17',
};

export function Faded({ children }) {
  // silent letters: semi-transparent
  return <span style={{ opacity: 0.32, color: 'var(--rd-ink)' }}>{children}</span>;
}

function _vowel(c) {
  return ({ children, stress }) => (
    <span style={{
      color: c, fontWeight: 600,
      position: 'relative',
    }}>
      {children}
      {stress && (
        <span style={{
          position:'absolute', left:'50%', top:-2, transform:'translateX(-50%)',
          fontSize:'0.55em', color: c, lineHeight: 1, fontWeight: 700,
        }}>´</span>
      )}
    </span>
  );
}

export const R   = _vowel(IPA_COLORS.e);     // red /e/
export const G   = _vowel(IPA_COLORS.i);     // green /i/
export const B   = _vowel(IPA_COLORS.u);     // blue /u/
export const Y   = _vowel(IPA_COLORS.o);     // yellow /ɔ/
export const Um  = _vowel(IPA_COLORS.ah);    // ultramarine /ʌ/
export const Ra  = _vowel(IPA_COLORS.ae);    // raspberry /æ/
export const Sch = _vowel(IPA_COLORS.schwa); // schwa

// Diphthong superscript glyph (e.g. ⁱtem, cᵒycle, gr⁽ᵉ⁾at)
export function Diph({ children, sup }) {
  return (
    <span style={{position:'relative', fontWeight: 600, color: 'var(--rd-ink)'}}>
      <span style={{
        position:'absolute', left: -1, top: '-0.45em',
        fontSize: '0.55em', color: IPA_COLORS.i, fontWeight: 700,
      }}>{sup}</span>
      {children}
    </span>
  );
}

// Stressed mark on top of vowel — for /ˈ/ primary stress
export function Stress({ children, c }) {
  return (
    <span style={{position:'relative', color: c || 'inherit', fontWeight: 600}}>
      <span style={{
        position:'absolute', left:'50%', top: -3, transform:'translateX(-50%)',
        fontSize: '0.6em', fontWeight: 800, color: c || 'var(--rd-ink)',
      }}>´</span>
      {children}
    </span>
  );
}

// Subscript t under /t/, /θ/
export function SubT({ children, theta }) {
  return (
    <span style={{position:'relative', display:'inline-block'}}>
      {children}
      <span style={{
        position:'absolute', left:'50%', top:'95%', transform:'translateX(-50%)',
        fontSize:'0.55em', color: theta ? IPA_COLORS.e : 'var(--rd-ink-3)',
        fontWeight: 700, lineHeight: 1,
      }}>{theta ? 'θ' : 't'}</span>
    </span>
  );
}

// Subscript d under /ð/ — for "th" in "this", "than"
export function SubD({ children }) {
  return (
    <span style={{position:'relative', display:'inline-block'}}>
      {children}
      <span style={{
        position:'absolute', left:'50%', top:'95%', transform:'translateX(-50%)',
        fontSize:'0.55em', color: IPA_COLORS.u, fontWeight: 700, lineHeight: 1,
      }}>d</span>
    </span>
  );
}

// Long vowel colon — appended after long vowels (soo:n, fa:ther)
export function Long({ children }) {
  return (
    <span style={{position:'relative', fontWeight: 600}}>
      {children}
      <span style={{
        color:'var(--rd-ink-4)', fontWeight: 700, marginLeft: 1,
        fontSize:'0.9em',
      }}>ː</span>
    </span>
  );
}

// Underline z to indicate /z/ /ʒ/ sound
export function Zsub({ children }) {
  return (
    <span style={{
      borderBottom: '2px solid ' + IPA_COLORS.u, paddingBottom: 0,
      fontWeight: 600, color: 'var(--rd-ink)',
    }}>{children}</span>
  );
}

// A "marked" word — used to indicate this word has a popup tooltip available.
// Visually: subtle dotted underline + hover lift.
export function Marked({ children, onClick, hot }) {
  return (
    <span
      onClick={onClick}
      style={{
        borderBottom: hot ? '2px solid var(--rd-amber)' : '1.5px dotted var(--rd-ink-4)',
        cursor: 'pointer', padding: '0 1px',
        background: hot ? 'rgba(201,122,30,0.10)' : 'transparent',
        borderRadius: 3,
        transition: 'background 120ms',
      }}>{children}</span>
  );
}

