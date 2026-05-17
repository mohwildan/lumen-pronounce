// Lumen Reader — Sample article with phoneme markup applied inline.
// This is the "live" content the extension transforms — feels like a real
// editorial page (Lumen newsroom) so the colorization reads in context.

import React from 'react';
import { Faded, Sch, Y, Marked, G, SubT, B, R, Um, Ra, Long, SubD, Diph, Stress, Zsub, IPA_COLORS } from './colorize';

export function LRArticle({ onWordClick }) {
  return (
    <div style={{
      maxWidth: 720, margin: '0 auto', padding: '40px 32px 80px',
      fontFamily: 'Fraunces, serif',
      color: 'var(--rd-ink)',
    }}>
      {/* Eyebrow */}
      <div style={{
        fontFamily: 'JetBrains Mono', fontSize: 10.5, fontWeight: 700,
        letterSpacing: 0.16, textTransform: 'uppercase', color: 'var(--rd-amber)',
        marginBottom: 14,
      }}>Lumen Reader · Demo article · 4 min</div>

      <h1 style={{
        fontFamily: 'Fraunces, serif', fontSize: 40, fontWeight: 500,
        letterSpacing: -0.025, lineHeight: 1.08, margin: '0 0 14px',
        textWrap: 'balance',
      }}>
        Why every w<Um>o</Um>rd in this s<R>e</R>nt<R>e</R>nce
        is <Marked onClick={(e) => onWordClick(e, 'colorized')} hot>
          <span style={{color:'var(--rd-amber)'}}>c</span><Y>o</Y>
          <span style={{color:'var(--rd-amber)'}}>l</span><Sch>o</Sch>
          <span style={{color:'var(--rd-amber)'}}>r</span><G>i</G>
          <span style={{color:'var(--rd-amber)'}}>z</span>
          <span style={{color:'var(--rd-amber)', fontStyle:'italic'}}>ed</span>
        </Marked> —
        and what your brain does with it
      </h1>

      <p style={{
        fontFamily: 'Fraunces, serif', fontSize: 17, fontWeight: 400,
        color: 'var(--rd-ink-2)', lineHeight: 1.5, margin: '0 0 28px',
        fontStyle: 'italic',
      }}>
        L<Sch>u</Sch>m<Sch>e</Sch>n R<G>ea</G>d<Sch>e</Sch>r r<Sch>e</Sch>ads ev<Sch>e</Sch>ry p<Sch>a</Sch>ge
        y<Sch>ou</Sch> <Marked onClick={(e) => onWordClick(e, 'visit')}>v<Faded>i</Faded><Zsub>s</Zsub>i<SubT>t</SubT></Marked> and
        s<G>i</G>l<Sch>e</Sch>nt<Faded>l</Faded>y r<G>e</G>p<Sch>ai</Sch>nts <Sch>e</Sch>ach v<Sch>o</Sch>w<Sch>e</Sch>l
        s<B>o</B> <Sch>you</Sch> kn<B>o</B>w h<B>ow</B> t<B>o</B> say i<SubT>t</SubT>.
      </p>

      {/* Author byline */}
      <div style={{
        display:'flex', alignItems:'center', gap: 10, padding: '12px 0',
        borderTop: '1px solid var(--rd-line)', borderBottom: '1px solid var(--rd-line)',
        margin: '0 0 30px',
        fontFamily: 'JetBrains Mono', fontSize: 10.5, color:'var(--rd-ink-3)',
        letterSpacing: 0.08, textTransform: 'uppercase', fontWeight: 600,
      }}>
        <div style={{width: 24, height: 24, borderRadius: 100, background:'var(--rd-amber)'}}/>
        <span>Specialist-08 · L<Sch>i</Sch>ng<Faded>u</Faded><G>i</G>st<G>i</G>cs</span>
        <span style={{flex: 1, textAlign: 'right'}}>May 12, 2026</span>
      </div>

      {/* Body */}
      <p style={{
        fontSize: 16.5, lineHeight: 1.65, margin: '0 0 18px',
        color: 'var(--rd-ink)',
      }}>
        <span style={{
          fontFamily:'Fraunces, serif', fontSize: 56, fontWeight: 600,
          float:'left', lineHeight: 0.85, marginRight: 8, marginTop: 6,
          color: 'var(--rd-amber)',
        }}>R</span>
        <G>ea</G>d<Sch>i</Sch>ng <Marked onClick={(e) => onWordClick(e, 'English')} hot>Engl<Sch>i</Sch>sh</Marked> is h<Ra>a</Ra>rd<Sch>e</Sch>r th<Ra>a</Ra>n it l<B>oo</B>ks. About <Faded>f</Faded>orty percent of common w<Sch>o</Sch>rds c<Y>o</Y>nt<Ra>ai</Ra>n
        a s<Ra>i</Ra>l<Sch>e</Sch>nt l<Sch>e</Sch>tt<Sch>e</Sch>r or a v<Y>o</Y>w<Sch>e</Sch>l that d<Sch>oe</Sch>sn't s<B>ou</B>nd
        the way it's spelled. That's why <Marked onClick={(e) => onWordClick(e, 'receipt')}>
          <span style={{borderBottom:'1.5px dashed var(--rd-amber)'}}>r</span><Sch>e</Sch><span style={{borderBottom:'1.5px dashed var(--rd-amber)'}}>c</span><G>ei</G><Faded>p</Faded>t
        </Marked> rhymes
        with f<G>ee</G>t, why <Marked onClick={(e) => onWordClick(e, 'solution')}>
          <span style={{borderBottom:'1.5px dashed var(--rd-amber)'}}>s</span><Sch>o</Sch>l<B>u</B>t<Sch>i</Sch><Sch>o</Sch><span style={{borderBottom:'1.5px dashed var(--rd-amber)'}}>n</span>
        </Marked> hides
        an /e/, and why n<B>o</B> <Um>o</Um>ne can <Ra>a</Ra>gr<G>ee</G> on h<B>o</B>w to say c<Ra>a</Ra>r<Ra>a</Ra>m<Sch>e</Sch>l.
      </p>

      <p style={{
        fontSize: 16.5, lineHeight: 1.65, margin: '0 0 18px',
      }}>
        The extension does one job: it overlays a thin layer of phonetic information on top
        of the text you're already reading, without changing the text itself. Colors mark
        vowel sounds. Faded letters are silent. A small mark above a vowel means the
        stress falls there. The first time you hover a word, the AI tells you why this word
        was chosen in this sentence and not its near-synonym.
      </p>

      {/* Highlight callout — what the colors mean */}
      <div style={{
        background:'var(--rd-card)', border: '1px solid var(--rd-line)',
        borderRadius: 12, padding: '18px 22px', margin: '24px 0',
      }}>
        <div style={{
          fontFamily:'JetBrains Mono', fontSize: 10, fontWeight: 700, color:'var(--rd-ink-3)',
          letterSpacing: 0.16, textTransform:'uppercase', marginBottom: 12,
        }}>Color legend</div>
        <ul style={{margin: 0, padding: 0, listStyle: 'none',
          fontFamily:'Fraunces, serif', fontSize: 17, lineHeight: 1.85,
        }}>
          <li>• <R>red</R> <span style={{fontFamily:'JetBrains Mono', fontSize: 13, color:'var(--rd-ink-3)'}}>/e/</span> — sol<R>u</R>tion, sec<R>o</R>nd</li>
          <li>• <G>green</G> <span style={{fontFamily:'JetBrains Mono', fontSize: 13, color:'var(--rd-ink-3)'}}>/i/</span> — r<G>ea</G>d, rec<G>ei</G>pt</li>
          <li>• <B>blue</B> <span style={{fontFamily:'JetBrains Mono', fontSize: 13, color:'var(--rd-ink-3)'}}>/u/</span> — t<B>o</B>mb, sch<B>oo</B>l</li>
          <li>• <Y>yellow</Y> <span style={{fontFamily:'JetBrains Mono', fontSize: 13, color:'var(--rd-ink-3)'}}>/ɔ/</span> — qu<Y>a</Y>rter, c<Y>au</Y>ght</li>
          <li>• <Um>ultramarine</Um> <span style={{fontFamily:'JetBrains Mono', fontSize: 13, color:'var(--rd-ink-3)'}}>/ʌ/</span> — s<Um>o</Um>me, c<Um>u</Um>p</li>
          <li>• <Ra>raspberry</Ra> <span style={{fontFamily:'JetBrains Mono', fontSize: 13, color:'var(--rd-ink-3)'}}>/æ/</span> — c<Ra>a</Ra>t, l<Ra>au</Ra>gh</li>
        </ul>
      </div>

      <h2 style={{
        fontFamily:'Fraunces, serif', fontSize: 26, fontWeight: 500,
        letterSpacing: -0.015, margin: '32px 0 14px',
      }}>How the AI pop-up <em style={{color:'var(--rd-amber)'}}>actually</em> helps</h2>

      <p style={{fontSize: 16.5, lineHeight: 1.65, margin: '0 0 18px'}}>
        Hover any word and a card slides up with the
        <Marked onClick={(e) => onWordClick(e, 'phonetic')}> p<Sch>ho</Sch>n<R>e</R><SubT>t</SubT><G>i</G>c</Marked> tr<Sch>a</Sch>ns<Faded>c</Faded>r<G>i</G>p<SubT>t</SubT><G>i</G><Sch>o</Sch>n,
        a speaker for native audio, a contextual definition, and — crucially — an
        explanation of <em>why this word</em> was used here instead of a close synonym.
        Knowing that a <em>technical report</em> emphasizes specifications, while a
        <em> whitepaper</em> persuades, is what separates reading from
        <Marked onClick={(e) => onWordClick(e, 'understanding')}> <Sch>u</Sch>nd<Sch>e</Sch>r<Stress c="var(--rd-ink)">s</Stress>t<Sch>a</Sch>nd<G>i</G>ng</Marked>.
      </p>

      <p style={{fontSize: 16.5, lineHeight: 1.65, margin: '0 0 18px'}}>
        For long vowels we append a colon — <Long>s<B>oo</B></Long>n, <Long>fa</Long>ther —
        the same convention IPA uses. For the <em>th</em> in <SubD>th</SubD>is and <SubD>th</SubD>an,
        a small <span style={{color: IPA_COLORS.u, fontWeight: 700, fontSize: '0.7em'}}>d</span>{' '}sits underneath, distinguishing it from the
        <span style={{ marginLeft: 5 }}><SubT theta>th</SubT></span>in or <SubT theta>th</SubT>ink case.
        Diphthongs get a tiny floating glyph: <Diph sup="ⁱ">item</Diph>,&nbsp;
        <Diph sup="ᵉ">great</Diph>,&nbsp;
        <Diph sup="ᵒ">home</Diph>.
      </p>

      <p style={{fontSize: 16.5, lineHeight: 1.65, margin: '0 0 18px'}}>
        Stress marks sit on top of the vowel that carries the
        emphasis: an <em>úpdate</em> (the noun) versus to <em>upd<Stress c="var(--rd-ink)">a</Stress>te</em> (the verb).
        Two words, identical letters, completely different rhythm — and a complete
        gift to anyone learning English as a second language.
      </p>

      <h2 style={{
        fontFamily:'Fraunces, serif', fontSize: 26, fontWeight: 500,
        letterSpacing: -0.015, margin: '32px 0 14px',
      }}>What gets sent to Anki</h2>

      <p style={{fontSize: 16.5, lineHeight: 1.65, margin: '0 0 18px'}}>
        Click the <span style={{
          display:'inline-flex', alignItems:'center', justifyContent:'center',
          width: 18, height: 18, borderRadius: 5, border:'1px solid var(--rd-line)',
          fontSize: 12, color:'var(--rd-ink-3)', verticalAlign:'middle',
        }}>+</span> in any pop-up and the word, its IPA transcription, the source sentence,
        and the native-speaker audio are pushed to your Anki deck through AnkiConnect.
        Lumen Reader assumes you have it. If not, the button quietly stages the card and
        flushes the queue when AnkiConnect comes back online.
      </p>

      <p style={{fontSize: 14, color:'var(--rd-ink-3)', lineHeight: 1.6, margin: '40px 0 0',
        fontFamily: 'Inter',
      }}>
        <em>Tip — open the settings panel (top-right ⚙) to switch off any colorization
        you don't want, or to switch the pop-up trigger from hover to command-click.</em>
      </p>
    </div>
  );
}

