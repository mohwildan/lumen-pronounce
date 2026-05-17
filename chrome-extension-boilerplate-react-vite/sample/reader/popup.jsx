// Lumen Reader — AI definition popup
// Matches the screenshot reference: word + IPA + speaker icon + AI bullets
// (contextual definition, why this word, alternatives) + footer actions.

import React from 'react';

export function LRPopup({ word, ipa, def, why, alt, x, y, onClose }) {
  return (
    <div style={{
      position: 'absolute', left: x, top: y, width: 410, zIndex: 60,
      background: 'var(--rd-paper)',
      border: '1px solid var(--rd-line)',
      borderRadius: 12,
      boxShadow: '0 22px 60px rgba(20,18,12,0.18), 0 2px 6px rgba(20,18,12,0.06)',
      fontFamily: 'Inter, system-ui, sans-serif',
      color: 'var(--rd-ink)',
      overflow: 'hidden',
    }}>
      {/* Header: speaker + IPA + word + close */}
      <div style={{
        padding: '12px 14px 10px',
        display: 'flex', alignItems: 'center', gap: 10,
        borderBottom: '1px solid var(--rd-line)',
        background: 'var(--rd-card)',
      }}>
        <button style={{
          width: 26, height: 26, border: 'none', borderRadius: 7,
          background: 'var(--rd-ink)', color: 'var(--rd-paper)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} title="Play pronunciation">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4z"/>
          </svg>
        </button>

        <div style={{flex: 1, minWidth: 0, display:'flex', alignItems:'baseline', gap: 10}}>
          <span style={{
            fontFamily: 'Fraunces, serif', fontSize: 19, fontWeight: 600,
            letterSpacing: -0.01, color: 'var(--rd-ink)',
          }}>{word}</span>
          <span style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 500,
            color: 'var(--rd-ink-3)', letterSpacing: 0.02,
          }}>/{ipa}/</span>
        </div>

        <button title="Add to Anki" style={{
          width: 26, height: 26, border: '1px solid var(--rd-line)',
          background: 'var(--rd-paper)', borderRadius: 7, cursor: 'pointer',
          display:'flex', alignItems:'center', justifyContent:'center',
          color:'var(--rd-ink-3)',
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14"/>
          </svg>
        </button>
        <button onClick={onClose} title="Close" style={{
          width: 26, height: 26, border: 'none', background: 'transparent',
          cursor: 'pointer', color: 'var(--rd-ink-3)', fontSize: 18, lineHeight: 1,
        }}>×</button>
      </div>

      {/* AI body — three contextual bullets */}
      <div style={{padding: '12px 14px 14px'}}>
        <div style={{display:'flex', gap: 9, alignItems:'flex-start', marginBottom: 9, lineHeight: 1.45}}>
          <span style={{
            fontFamily:'JetBrains Mono', fontSize: 11, color:'var(--rd-amber)',
            fontWeight: 700, flexShrink: 0, marginTop: 1,
          }}>◉</span>
          <span style={{fontSize: 13, color: 'var(--rd-ink-2)'}}>{def}</span>
        </div>
        <div style={{display:'flex', gap: 9, alignItems:'flex-start', marginBottom: 9, lineHeight: 1.45}}>
          <span style={{
            fontFamily:'JetBrains Mono', fontSize: 11, color:'var(--rd-amber)',
            fontWeight: 700, flexShrink: 0, marginTop: 1,
          }}>◉</span>
          <span style={{fontSize: 13, color: 'var(--rd-ink-2)'}}>{why}</span>
        </div>
        <div style={{display:'flex', gap: 9, alignItems:'flex-start', lineHeight: 1.45}}>
          <span style={{
            fontFamily:'JetBrains Mono', fontSize: 11, color:'var(--rd-amber)',
            fontWeight: 700, flexShrink: 0, marginTop: 1,
          }}>◉</span>
          <span style={{fontSize: 13, color: 'var(--rd-ink-2)'}}>{alt}</span>
        </div>
      </div>

      {/* Footer actions */}
      <div style={{
        display:'flex', justifyContent:'space-between',
        padding: '9px 14px', borderTop: '1px solid var(--rd-line)',
        background: 'var(--rd-card)',
      }}>
        <button style={{
          background:'transparent', border:'none', cursor:'pointer',
          fontFamily:'JetBrains Mono', fontSize: 10, fontWeight: 700,
          letterSpacing: 0.14, textTransform:'uppercase', color:'var(--rd-ink-3)',
        }}>Translate</button>
        <button style={{
          background:'transparent', border:'none', cursor:'pointer',
          fontFamily:'JetBrains Mono', fontSize: 10, fontWeight: 700,
          letterSpacing: 0.14, textTransform:'uppercase', color:'var(--rd-ink-3)',
        }}>Search</button>
      </div>

      {/* Pointer/tail */}
      <div style={{
        position:'absolute', top: -8, left: 36,
        width: 0, height: 0,
        borderLeft: '8px solid transparent',
        borderRight: '8px solid transparent',
        borderBottom: '8px solid var(--rd-card)',
        filter: 'drop-shadow(0 -1px 0 var(--rd-line))',
      }}/>
    </div>
  );
}

