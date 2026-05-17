// Lumen Reader — main app shell. Composes browser window + article + popup + settings.

import './chrome-mock.js';
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { LRArticle } from './article.jsx';
import { LRPopup } from './popup.jsx';
import Popup from '@src/Popup';
import { ChromeWindow } from './ChromeWindow.jsx';

const WORD_DATA = {
  colorized: {
    word: 'colorized', ipa: 'ˈkʌl·ə·raɪzd',
    def: 'Past tense of colorize — to mark something with color, usually for visual distinction.',
    why: 'Chosen over "colored" to emphasize an active process applied to text after the fact, not its inherent color.',
    alt: 'Alternatives: colored (passive), highlighted (broader), marked up (technical).',
  },
  visit: {
    word: 'visit', ipa: 'ˈvɪz·ɪt',
    def: 'To go to or stop by a place; in the web sense, to load a page in the browser.',
    why: 'Web context — chosen over "browse" because the action is singular and intentional.',
    alt: 'Alternatives: browse (multiple pages), open (technical), load (mechanical).',
  },
  English: {
    word: 'English', ipa: 'ˈɪŋ·ɡlɪʃ',
    def: 'The West Germanic language originating in England, now the global lingua franca.',
    why: 'Capitalized — refers to the language as a proper noun, not the descriptor "english" (lowercase, e.g. "english muffin").',
    alt: 'Synonyms (informal): the Queen\'s English, lingua franca.',
  },
  receipt: {
    word: 'receipt', ipa: 'rɪˈsiːt',
    def: 'A written acknowledgment of having received something; the silent "p" is a 16th-century affectation.',
    why: 'Used as a phonetic curiosity — the silent "p" makes it rhyme with "feet" despite the spelling.',
    alt: 'Related: receive (verb form, where the p resurfaces).',
  },
  solution: {
    word: 'solution', ipa: 'səˈluː·ʃən',
    def: 'The answer to a problem; also a homogeneous mixture.',
    why: 'Used to illustrate that the first "o" is pronounced /ə/ (schwa), not /o/ — a common ESL trap.',
    alt: 'Alternatives: answer (simpler), fix (informal), resolution (more formal).',
  },
  phonetic: {
    word: 'phonetic', ipa: 'fəˈnet·ɪk',
    def: 'Relating to the sounds of speech, as opposed to spelling.',
    why: 'Chosen over "phonemic" — phonetic describes the surface sounds, phonemic the abstract units.',
    alt: 'Alternatives: phonemic (more technical), pronunciation-related (informal).',
  },
  understanding: {
    word: 'understanding', ipa: 'ˌʌn·dərˈstænd·ɪŋ',
    def: 'The ability to comprehend; insight into the meaning of something.',
    why: 'Chosen over "comprehension" — understanding is warmer and more general; comprehension is academic.',
    alt: 'Alternatives: comprehension (formal), grasp (informal), insight (deeper).',
  },
};

function ReaderApp() {
  const [popupAt, setPopupAt] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [theme, setTheme] = useState('paper'); // paper | ink
  const [showLegend, setShowLegend] = useState(true);

  useEffect(() => {
    // Set theme CSS vars
    const t = theme === 'ink' ? {
      paper: '#15140F', card: '#23211B', line: '#33302A',
      ink: '#F2EBD7', ink2: '#D6CEB9', ink3: '#9A9384', ink4: '#5F5A4F',
      amber: '#E8B547', moss: '#7FB36F',
    } : {
      paper: '#FBF7EC', card: '#FFFDF5', line: '#E4DDCB',
      ink: '#1B1A17', ink2: '#3B3832', ink3: '#6B6659', ink4: '#A39D8C',
      amber: '#C97A1E', moss: '#5B7A4B',
    };
    const r = document.documentElement.style;
    r.setProperty('--rd-paper', t.paper);
    r.setProperty('--rd-card', t.card);
    r.setProperty('--rd-line', t.line);
    r.setProperty('--rd-ink', t.ink);
    r.setProperty('--rd-ink-2', t.ink2);
    r.setProperty('--rd-ink-3', t.ink3);
    r.setProperty('--rd-ink-4', t.ink4);
    r.setProperty('--rd-amber', t.amber);
    r.setProperty('--rd-moss', t.moss);
  }, [theme]);

  const handleWord = (e, key) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const stage = document.querySelector('.chrome-stage').getBoundingClientRect();
    setPopupAt({ key, x: rect.left - stage.left, y: rect.bottom - stage.top + 10 });
  };

  const popData = popupAt ? WORD_DATA[popupAt.key] : null;

  return (
    <div style={{
      minHeight:'100vh', display:'flex', flexDirection:'column',
      alignItems:'center', padding: '28px 20px 80px',
      background: theme === 'ink' ? '#0B0A07' : '#ECE5D2',
      transition: 'background 200ms',
    }}>
      {/* Page header */}
      <div style={{
        width: '100%', maxWidth: 1280, display:'flex',
        justifyContent:'space-between', alignItems:'center', marginBottom: 18,
      }}>
        <div style={{display:'flex', alignItems:'center', gap: 12}}>
          <div style={{
            width: 38, height: 38, borderRadius: 11,
            background: theme === 'ink' ? '#F2EBD7' : '#1B1A17',
            color: theme === 'ink' ? '#1B1A17' : '#F2EBD7',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontFamily:'Fraunces, serif', fontSize: 20, fontWeight: 700,
          }}>L</div>
          <div>
            <div style={{
              fontFamily:'Fraunces, serif', fontSize: 22, fontWeight: 600,
              letterSpacing:-0.02, color: theme === 'ink' ? '#F2EBD7' : '#1B1A17',
            }}>Lumen Reader</div>
            <div style={{
              fontFamily:'JetBrains Mono', fontSize: 10, color: theme === 'ink' ? '#9A9384' : '#6B6659',
              textTransform:'uppercase', letterSpacing: 0.12, marginTop: 2,
            }}>Browser extension · IPA reading layer</div>
          </div>
        </div>

        <div style={{
          display:'flex', gap: 4, padding: 4, borderRadius: 100,
          background: theme === 'ink' ? '#1B1915' : '#FFFDF5',
          border: '1px solid ' + (theme === 'ink' ? '#33302A' : '#E4DDCB'),
        }}>
          {['paper', 'ink'].map(t => (
            <button key={t} onClick={() => setTheme(t)} style={{
              border:'none', padding: '7px 14px', borderRadius: 100,
              fontFamily:'Inter', fontSize: 12, fontWeight: 500, cursor:'pointer',
              background: theme === t ? (theme === 'ink' ? '#F2EBD7' : '#1B1A17') : 'transparent',
              color: theme === t ? (theme === 'ink' ? '#1B1A17' : '#FBF7EC') : (theme === 'ink' ? '#9A9384' : '#6B6659'),
              textTransform:'capitalize',
            }}>{t}</button>
          ))}
          <button onClick={() => setSettingsOpen(o => !o)} style={{
            border:'none', padding: '7px 12px', borderRadius: 100, cursor:'pointer',
            background: settingsOpen ? (theme === 'ink' ? '#F2EBD7' : '#1B1A17') : 'transparent',
            color: settingsOpen ? (theme === 'ink' ? '#1B1A17' : '#FBF7EC') : (theme === 'ink' ? '#9A9384' : '#6B6659'),
            fontFamily:'Inter', fontSize: 12, fontWeight: 500,
            display:'flex', alignItems:'center', gap: 5,
          }}>⚙ Settings</button>
        </div>
      </div>

      {/* Browser window stage */}
      <div className="chrome-stage" style={{position:'relative', width: 1180}}>
        <ChromeWindow
          tabs={[
            { title: 'Lumen Reader — Demo article' },
            { title: 'GPT-4 Technical Report.pdf' },
            { title: 'wikipedia.org — IPA' },
          ]}
          activeIndex={0}
          url="lumenverse.app/reader/demo"
          width={1180} height={720}
        >
          <div style={{
            background: 'var(--rd-paper)', minHeight: '100%', position:'relative',
          }} onClick={() => setPopupAt(null)}>
            <LRArticle onWordClick={handleWord}/>

            {popData && (
              <LRPopup
                word={popData.word} ipa={popData.ipa}
                def={popData.def} why={popData.why} alt={popData.alt}
                x={popupAt.x} y={popupAt.y}
                onClose={() => setPopupAt(null)}
              />
            )}

            {settingsOpen && (
              <div style={{
                position: 'absolute', right: 24, top: 24, zIndex: 90,
                boxShadow: '0 22px 60px rgba(20,18,12,0.22)',
                borderRadius: 16, overflowY: 'auto', overflowX: 'hidden',
                width: 360, maxHeight: 'calc(100% - 48px)',
                display: 'flex', flexDirection: 'column',
              }}>
                <Popup />
              </div>
            )}
          </div>
        </ChromeWindow>
      </div>

      {/* Below-the-frame: caption */}
      <div style={{
        maxWidth: 1180, width: '100%', marginTop: 18,
        display:'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12,
      }}>
        {[
          { k: 'Colorized vowels', v: '6 colors · 7 phonemes', dot: '#C7372F' },
          { k: 'Diacritics', v: 'stress · subscript t/d/θ', dot: '#2C7A4B' },
          { k: 'AI pop-up', v: 'IPA · audio · why-this-word', dot: '#2860B4' },
          { k: 'Anki integration', v: 'AnkiConnect push', dot: '#C97A1E' },
        ].map((s, i) => (
          <div key={i} style={{
            background: theme === 'ink' ? '#1B1915' : '#FFFDF5',
            border: '1px solid ' + (theme === 'ink' ? '#33302A' : '#E4DDCB'),
            borderRadius: 11, padding: '12px 14px',
          }}>
            <div style={{display:'flex', alignItems:'center', gap: 7, marginBottom: 5}}>
              <span style={{width: 8, height: 8, borderRadius: 100, background: s.dot}}/>
              <span style={{
                fontFamily:'JetBrains Mono', fontSize: 9.5, fontWeight: 700,
                color: theme === 'ink' ? '#9A9384' : '#6B6659',
                letterSpacing: 0.12, textTransform:'uppercase',
              }}>{s.k}</span>
            </div>
            <div style={{
              fontFamily:'Fraunces, serif', fontSize: 15, fontWeight: 500,
              color: theme === 'ink' ? '#F2EBD7' : '#1B1A17',
            }}>{s.v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<ReaderApp/>);
