const primaryBrowser = {
  letter: "C",
  name: "Chrome",
  ver: "v.116+ · Manifest V3",
  label: "Add to Chrome — Free",
  href: "#",
  bg: "#FFF1D4",
  color: "#C97A1E",
};

const chromiumBrowsers = [
  { letter: "E", name: "Edge", note: "Chromium-based · works now" },
  { letter: "A", name: "Arc", note: "Chromium-based · works now" },
  { letter: "B", name: "Brave", note: "Chromium-based · works now" },
  { letter: "V", name: "Vivaldi", note: "Chromium-based · works now" },
];

export default function BrowsersSection() {
  return (
    <section className="mx-auto max-w-[1240px] px-8 py-24" id="browsers">
      {/* Header */}
      <div className="mb-14 flex flex-wrap items-end justify-between gap-9">
        <div className="max-w-[620px]">
          <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-moss">— Install</div>
          <h2 className="mt-3.5 font-fraunces text-[clamp(36px,4.6vw,64px)] font-bold leading-[1.02] tracking-[-0.03em]">
            One click.<br />Be reading better
            <em className="italic text-moss"> in 30s</em>.
          </h2>
        </div>
        <p className="max-w-[540px] text-[18px] leading-[1.55] text-ink3">
          Built for Chrome and any Chromium-based browser. No account needed — install and it starts working immediately.
        </p>
      </div>

      {/* Chrome featured card */}
      <a
        href={primaryBrowser.href}
        className="mb-4 flex flex-col items-start rounded-[22px] border-2 border-moss bg-card p-8 transition-all hover:-translate-y-[2px] sm:flex-row sm:items-center sm:gap-8"
      >
        <div
          className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-[18px] border border-[var(--line)] font-fraunces text-[24px] font-bold"
          style={{ background: primaryBrowser.bg, color: primaryBrowser.color }}
        >
          {primaryBrowser.letter}
        </div>
        <div className="mt-4 flex-1 sm:mt-0">
          <div className="font-fraunces text-[22px] font-bold tracking-tight">{primaryBrowser.name}</div>
          <div className="mt-0.5 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-ink3">{primaryBrowser.ver}</div>
        </div>
        <div className="mt-5 rounded-full bg-ink px-7 py-3.5 text-[14.5px] font-semibold text-paper sm:mt-0">
          {primaryBrowser.label}
        </div>
      </a>

      {/* Chromium others */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {chromiumBrowsers.map(({ letter, name, note }) => (
          <div
            key={name}
            className="flex flex-col items-start rounded-[16px] border border-[var(--line)] bg-card p-5"
          >
            <div
              className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-[var(--line)] bg-paper font-fraunces text-[15px] font-bold text-ink2"
            >
              {letter}
            </div>
            <div className="mt-3 font-fraunces text-[16px] font-bold tracking-tight">{name}</div>
            <div className="mt-0.5 font-mono text-[9.5px] font-semibold uppercase tracking-[0.1em] text-moss">{note}</div>
          </div>
        ))}
      </div>

      <p className="mt-7 text-center font-mono text-[11.5px] font-semibold uppercase tracking-[0.16em] text-ink3">
        Firefox &amp; Safari support · coming later · <a href="#" className="underline hover:text-moss">join the waitlist</a>
      </p>
    </section>
  );
}
