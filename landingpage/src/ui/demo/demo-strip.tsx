const sampleWords = [
  { text: "Pronunciation", parts: [
    { t: "Pr", c: null },
    { t: "o", c: "#8e24aa" },
    { t: "n", c: null },
    { t: "u", c: "#00838f" },
    { t: "nci", c: null },
    { t: "a", c: "#e53935" },
    { t: "tion", c: null },
  ]},
  { text: "colonel", parts: [
    { t: "c", c: null },
    { t: "o", c: null, ghost: true },
    { t: "l", c: null },
    { t: "o", c: "#8e24aa" },
    { t: "n", c: null },
    { t: "e", c: "#e53935" },
    { t: "l", c: null },
  ]},
  { text: "receipt", parts: [
    { t: "r", c: null },
    { t: "e", c: "#2e7d32" },
    { t: "c", c: null },
    { t: "ei", c: null, ghost: true },
    { t: "pt", c: null, ghost: true },
  ]},
  { text: "thought", parts: [
    { t: "th", c: null },
    { t: "ough", c: null, ghost: true },
    { t: "t", c: null },
  ]},
];

const colorLegend = [
  { sound: "/ɛ/", color: "#e53935", name: "Red" },
  { sound: "/i/", color: "#2e7d32", name: "Green" },
  { sound: "/ʌ/", color: "#8e24aa", name: "Purple" },
  { sound: "/æ/", color: "#d81b60", name: "Pink" },
  { sound: "/u/", color: "#00838f", name: "Teal" },
  { sound: "/ɔ/", color: "#e65100", name: "Amber" },
];

export default function DemoStrip() {
  return (
    <section className="px-8 py-20">
      <div
        className="mx-auto max-w-[1240px] rounded-[28px] border border-[var(--line)] px-14 py-16"
        style={{ background: "var(--cream)" }}
      >
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left */}
          <div>
            <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-moss">— Color in action</div>
            <h2 className="mt-3.5 mb-4 font-fraunces text-[clamp(32px,3.6vw,48px)] font-bold leading-[1.02] tracking-[-0.03em]">
              Every vowel<br />gets its own <em className="italic text-moss">color</em>.
            </h2>
            <p className="text-[16px] leading-[1.55] text-ink3 max-w-[480px]">
              English spelling hides the sound. Lumen paints it back — one color per vowel phoneme, so patterns you never noticed start jumping out.
            </p>
            <div className="mt-7 grid grid-cols-3 gap-2">
              {colorLegend.map(({ sound, color, name }) => (
                <div key={sound} className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                    style={{ background: color }}
                  />
                  <span className="font-mono text-[11px] text-ink3">
                    <span style={{ color }} className="font-semibold">{sound}</span>{" "}
                    {name}
                  </span>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full border border-[var(--line)]" />
                <span className="font-mono text-[11px] text-ink3">
                  <span className="font-semibold text-ink4">silent</span> Ghost
                </span>
              </div>
            </div>
          </div>

          {/* Right: annotated text demo */}
          <div
            className="overflow-hidden rounded-[18px] border border-[var(--line)] p-6"
            style={{ background: "var(--card)" }}
          >
            <div className="mb-4 font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-ink3">— Live on the page</div>
            <div className="space-y-6">
              {sampleWords.map(({ text, parts }) => (
                <div key={text} className="flex items-baseline gap-4">
                  <span className="w-[90px] flex-shrink-0 font-mono text-[10px] text-ink4">{text}</span>
                  <span className="font-fraunces text-[26px] leading-none tracking-tight text-ink">
                    {parts.map(({ t, c, ghost }, i) =>
                      ghost ? (
                        <span key={i} style={{ opacity: 0.22 }}>{t}</span>
                      ) : c ? (
                        <strong key={i} style={{ color: c, fontWeight: 700 }}>{t}</strong>
                      ) : (
                        <span key={i}>{t}</span>
                      )
                    )}
                  </span>
                </div>
              ))}
            </div>
            <div
              className="mt-5 border-t pt-4 font-mono text-[10px] text-ink4"
              style={{ borderColor: "var(--line)" }}
            >
              Colored letters = vowel sound · faded = silent · bold color = active phoneme
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
