const vowels = [
  { sound: "/ɛ/", name: "Red", color: "#e53935", example: "s", vowel: "e", rest: "cond" },
  { sound: "/i/", name: "Green", color: "#2e7d32", example: "r", vowel: "e", rest: "ceipt" },
  { sound: "/ʌ/", name: "Purple", color: "#8e24aa", example: "s", vowel: "o", rest: "me" },
  { sound: "/æ/", name: "Pink", color: "#d81b60", example: "c", vowel: "a", rest: "t" },
  { sound: "/u/", name: "Teal", color: "#00838f", example: "t", vowel: "o", rest: "mb" },
  { sound: "/ɔ/", name: "Amber", color: "#e65100", example: "qu", vowel: "a", rest: "rter" },
];

const markers = [
  { label: "Stress Accents", before: "upd", stressed: "á", after: "te", desc: "Accent mark on the stressed vowel" },
  { label: "Diphthong /aɪ/", before: "", stressed: "i", sup: "ⁱ", after: "tem", desc: "Superscript shows glide direction" },
  { label: "TH /θ/ mark", before: "th", stressed: "", sup: "ᵗ", after: "in", desc: "Voiceless TH (thin, think)" },
  { label: "DH /ð/ mark", before: "th", stressed: "", sup: "ᵈ", after: "is", desc: "Voiced TH (this, there)" },
  { label: "Long Vowels", before: "s", stressed: "oo", sup: ":", after: "n", desc: "Colon marks held vowels" },
  { label: "Z-Sound Lines", before: "vi", underline: "s", after: "it", desc: "Dotted underline for Z sounds" },
  { label: "Hidden Phonemes", before: "", ghostSup: "w", main: "one", after: "", desc: "Ghost phonemes with no letter" },
  { label: "Ghost Letters", before: "s", ghost: "w", after: "ord", desc: "Silent letters faded out" },
];

export default function FeaturesSection() {
  return (
    <section className="mx-auto max-w-[1240px] px-8 py-24" id="features">
      {/* Header */}
      <div className="mb-14 flex flex-wrap items-end justify-between gap-9">
        <div className="max-w-[620px]">
          <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-moss">— What it actually does</div>
          <h2 className="mt-3.5 mb-4 font-fraunces text-[clamp(36px,4.6vw,64px)] font-bold leading-[1.02] tracking-[-0.03em]">
            Pronunciation, <em className="italic text-moss">finally</em>
            <br />made visible.
          </h2>
        </div>
        <p className="max-w-[540px] text-[18px] leading-[1.55] text-ink3" style={{ textWrap: "pretty" } as React.CSSProperties}>
          English spelling hides how words sound. Lumen makes the phonetics visible — color, marks, and tooltips that work on every page you read.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

        {/* 1: Color-coded vowels — TALL */}
        <div
          className="flex flex-col rounded-[22px] border border-[var(--line)] bg-card p-7 md:row-span-2"
          style={{ minHeight: 320 }}
        >
          <div className="mb-3.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-moss">01 — Vowel Colors</div>
          <h3 className="mb-2 font-fraunces text-[22px] font-bold tracking-tight">Seven sounds.<br />Seven colors.</h3>
          <p className="text-[14px] leading-[1.55] text-ink3 max-w-[32ch]" style={{ textWrap: "pretty" } as React.CSSProperties}>
            Each vowel phoneme gets a unique color. Your eye starts reading sound, not just spelling — across every page.
          </p>
          <div className="mt-5 flex-1 overflow-hidden rounded-[14px] border border-[var(--line)] bg-paper p-4">
            <div className="mb-3 font-mono text-[9.5px] font-semibold uppercase tracking-[0.16em] text-ink3">Vowel → Color map</div>
            <div className="space-y-2">
              {vowels.map(({ sound, name, color, example, vowel, rest }) => (
                <div key={sound} className="flex items-center gap-3">
                  <span
                    className="flex-shrink-0 rounded-[5px] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-white"
                    style={{ background: color }}
                  >
                    {sound}
                  </span>
                  <span className="w-14 font-mono text-[10px] text-ink3">{name}</span>
                  <span className="font-fraunces text-[16px] text-ink2">
                    {example}
                    <strong style={{ color }}>{vowel}</strong>
                    {rest}
                  </span>
                </div>
              ))}
              {/* Ghost letters */}
              <div className="flex items-center gap-3">
                <span className="flex-shrink-0 rounded-[5px] border border-[var(--line)] bg-paper px-1.5 py-0.5 font-mono text-[10px] font-semibold text-ink3">
                  silent
                </span>
                <span className="w-14 font-mono text-[10px] text-ink3">Ghost</span>
                <span className="font-fraunces text-[16px] text-ink2">
                  s<span style={{ opacity: 0.22 }}>w</span>ord
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2: Phoneme Markers */}
        <div className="flex flex-col rounded-[22px] border border-[var(--line)] bg-card p-7" style={{ minHeight: 300 }}>
          <div className="mb-3.5 flex items-center gap-2">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-moss">02 — Phoneme Markers</span>
            <span className="rounded-full bg-amber px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-white">Pro</span>
          </div>
          <h3 className="mb-2 font-fraunces text-[22px] font-bold tracking-tight">Stress, glides &amp;<br />hidden sounds.</h3>
          <p className="text-[14px] leading-[1.55] text-ink3">
            Six toggleable markers for stress patterns, diphthongs, TH/DH sounds, long vowels, Z-underlines, and hidden phonemes. Pro only.
          </p>
          <div className="mt-4 flex-1 overflow-hidden rounded-[14px] border border-[var(--line)] bg-paper p-3">
            <div className="space-y-2">
              {markers.slice(0, 5).map(({ label, before, stressed, sup, after, underline, ghostSup, main, ghost, desc }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="w-[100px] flex-shrink-0 font-mono text-[9px] font-semibold text-ink3">{label}</span>
                  <span className="font-fraunces text-[15px] text-ink2">
                    {before}
                    {ghost && <span style={{ opacity: 0.22 }}>{ghost}</span>}
                    {ghostSup && <sup style={{ color: "#e879f9", fontSize: "0.65em" }}>{ghostSup}</sup>}
                    {main}
                    {underline && <span style={{ textDecoration: "underline dotted", textUnderlineOffset: 2 }}>{underline}</span>}
                    {stressed && <strong>{stressed}</strong>}
                    {sup && <sup style={{ opacity: 0.7, fontSize: "0.65em" }}>{sup}</sup>}
                    {after}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3: Translation Tooltip */}
        <div className="flex flex-col rounded-[22px] border border-[var(--line)] bg-card p-7" style={{ minHeight: 300 }}>
          <div className="mb-3.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-moss">03 — Translation Tooltip</div>
          <h3 className="mb-2 font-fraunces text-[22px] font-bold tracking-tight">Hover a word.<br />Know it fully.</h3>
          <p className="text-[14px] leading-[1.55] text-ink3">
            Popover shows IPA transcription, English definition, and translation in any of 100+ languages.
          </p>
          {/* Tooltip mockup */}
          <div
            className="mt-4 flex-1 rounded-[12px] p-4 text-paper"
            style={{ background: "var(--ink)" }}
          >
            <div className="mb-1 flex items-baseline justify-between">
              <span className="font-fraunces text-[20px] font-bold tracking-tight">colonel</span>
              <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-mosssoft">noun</span>
            </div>
            <div className="mb-2 font-fraunces italic text-[15px] text-mosssoft">/ˈkɜː.nəl/</div>
            <p className="mb-2 text-[11.5px] leading-[1.45]" style={{ color: "rgba(251,247,236,0.72)" }}>
              A senior military officer ranked above a lieutenant colonel.
            </p>
            <div className="border-t pt-2" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
              <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-mosssoft">Indonesian</div>
              <div className="mt-0.5 text-[12px]" style={{ color: "rgba(251,247,236,0.85)" }}>kolonel</div>
            </div>
          </div>
        </div>

        {/* 4: Select & Translate */}
        <div className="flex flex-col rounded-[22px] border border-[var(--line)] bg-card p-7" style={{ minHeight: 260 }}>
          <div className="mb-3.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-moss">04 — Select &amp; Translate</div>
          <h3 className="mb-2 font-fraunces text-[22px] font-bold tracking-tight">Select any text.<br />Translate it.</h3>
          <p className="text-[14px] leading-[1.55] text-ink3">
            Highlight any sentence or paragraph — a Translate button appears instantly. 100+ languages via Google Translate.
          </p>
          {/* Mockup */}
          <div className="mt-4 flex-1 overflow-hidden rounded-[14px] border border-[var(--line)] bg-paper p-3">
            <p className="font-fraunces text-[14px] leading-[1.8] text-ink2">
              The{" "}
              <span
                className="rounded-[2px] px-[1px]"
                style={{ background: "rgba(91,122,75,0.2)" }}
              >
                colonel
              </span>{" "}
              commanded the regiment with quiet precision.
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-[6px] bg-amber px-3 py-1.5 text-[11px] font-semibold text-white">
              Translate
            </div>
            <div className="mt-2 rounded-[8px] border border-[var(--line)] bg-card p-2 text-[11px] text-ink3">
              <span className="font-mono text-[9px] uppercase tracking-wide text-ink4">Translation</span>
              <p className="mt-0.5 text-ink2">Kolonel itu memimpin resimen dengan presisi yang tenang.</p>
            </div>
          </div>
        </div>

        {/* 5: Video Captions */}
        <div className="flex flex-col rounded-[22px] border border-[var(--line)] bg-card p-7" style={{ minHeight: 260 }}>
          <div className="mb-3.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-moss">05 — Video Captions</div>
          <h3 className="mb-2 font-fraunces text-[22px] font-bold tracking-tight">Any video with CC,<br />color-coded.</h3>
          <p className="text-[14px] leading-[1.55] text-ink3">
            Lumen annotates captions on YouTube, Vimeo, and any platform with closed captions. Pause-on-hover freezes the video when you inspect a word.
          </p>
          <div className="mt-4 flex-1 overflow-hidden rounded-[14px] border border-[var(--line)] bg-paper p-3">
            {/* Fake video player */}
            <div className="relative overflow-hidden rounded-[8px] bg-ink" style={{ aspectRatio: "16/7" }}>
              <div className="absolute inset-0 flex items-center justify-center opacity-20">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              </div>
              {/* CC bar */}
              <div className="absolute bottom-2 left-0 right-0 px-3">
                <div
                  className="mx-auto max-w-fit rounded-[4px] px-3 py-1 text-center font-fraunces text-[13px] text-white"
                  style={{ background: "rgba(0,0,0,0.8)" }}
                >
                  The{" "}
                  <span style={{ color: "#d81b60" }}>c</span>
                  <span style={{ opacity: 0.25 }}>o</span>
                  lonel{" "}
                  <span style={{ color: "#e53935" }}>s</span>
                  p<span style={{ color: "#8e24aa" }}>o</span>ke
                </div>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2 font-mono text-[9.5px] text-ink3">
              <span className="h-1.5 w-1.5 rounded-full bg-moss" />
              Lumen active on captions · Pause-on-hover on
            </div>
          </div>
        </div>

        {/* 6: Per-site control */}
        <div className="flex flex-col rounded-[22px] border border-[var(--line)] bg-card p-7" style={{ minHeight: 260 }}>
          <div className="mb-3.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-moss">06 — Site Control</div>
          <h3 className="mb-2 font-fraunces text-[22px] font-bold tracking-tight">Enable per-site.<br />No distractions.</h3>
          <p className="text-[14px] leading-[1.55] text-ink3">
            Toggle Lumen on or off for any domain from the popup. Use it when you want to learn — hide it when you don&apos;t.
          </p>
          {/* Popup mockup */}
          <div className="mt-4 flex-1 overflow-hidden rounded-[14px] border border-[var(--line)] bg-paper p-3">
            <div className="mb-2 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-ink3">This Site</div>
            {[
              { domain: "nytimes.com", on: true },
              { domain: "reddit.com", on: true },
              { domain: "docs.google.com", on: false },
            ].map(({ domain, on }) => (
              <div key={domain} className="flex items-center justify-between border-b border-[var(--line)] py-2 last:border-0">
                <span className="font-mono text-[10px] text-ink2">{domain}</span>
                <div
                  className="relative h-[14px] w-[26px] rounded-full transition-colors"
                  style={{ background: on ? "var(--moss)" : "var(--line)" }}
                >
                  <div
                    className="absolute top-[2px] h-[10px] w-[10px] rounded-full bg-white transition-transform"
                    style={{ left: on ? 14 : 2 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
