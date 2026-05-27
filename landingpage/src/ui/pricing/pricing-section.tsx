type Feature = { label: string; note?: string };

const freeFeatures: Feature[] = [
  { label: "IPA on every word, every page" },
  { label: "Color-coded vowels — 7 sounds, 7 colors" },
  { label: "Ghost letters & silent letter markers" },
  { label: "Translation tooltip — IPA + definition + 100+ languages" },
  { label: "Select-to-translate any sentence or paragraph" },
  { label: "Video captions — YouTube & all platforms with CC" },
  { label: "Per-site on/off control" },
];

const proTeaser: string[] = [
  "Stress accents & diphthong markers",
  "TH /θ/ & DH /ð/ sound marks",
  "Long vowel & Z-underline markers",
  "Settings sync across devices",
];

const proFeatures: Feature[] = [
  { label: "Everything in Reader" },
  { label: "Stress accents — updáte, compóse…" },
  { label: "Diphthong markers — iⁱtem, bóⁱl…" },
  { label: "TH /θ/ & DH /ð/ marks — thᵗin, thᵈis" },
  { label: "Long vowel markers — soo:n, fée:d" },
  { label: "Z-sound underline & hidden phonemes" },
  { label: "Sync settings across devices" },
  { label: "Early access to new features" },
];

function FeatureRow({ label, note, dark }: Feature & { dark?: boolean }) {
  return (
    <li className="flex items-start justify-between gap-2.5 py-1.5 text-[14px]">
      <span className={`flex items-start gap-2.5 ${dark ? "" : "text-ink2"}`} style={dark ? { color: "rgba(251,247,236,0.88)" } : {}}>
        <span className={`mt-[1px] flex-shrink-0 font-bold ${dark ? "text-mosssoft" : "text-moss"}`}>✓</span>
        {label}
      </span>
      {note && (
        <span
          className="flex-shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold"
          style={
            dark
              ? { background: "rgba(198,212,179,0.15)", color: "#C6D4B3" }
              : { background: "var(--moss-tint)", color: "var(--moss-2)" }
          }
        >
          {note}
        </span>
      )}
    </li>
  );
}

export default function PricingSection() {
  return (
    <section className="mx-auto max-w-[1240px] px-8 py-24" id="pricing">
      <div className="mx-auto mb-12 max-w-[720px] text-center">
        <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-moss">— Pricing</div>
        <h2 className="mt-3.5 font-fraunces text-[clamp(36px,4.6vw,64px)] font-bold leading-[1.02] tracking-[-0.03em]">
          Free for as long as
          <br />you want it. <em className="italic text-moss">Pro</em>, if you go deep.
        </h2>
        <p className="mt-4 text-[18px] leading-[1.55] text-ink3">
          Color coding, translation, and video captions — free forever. Pro adds the full phoneme marker system for serious learners.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Free */}
        <div className="rounded-[22px] border border-[var(--line)] bg-card p-8">
          <div className="mb-3.5 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-moss">— Free</div>
          <h3 className="mb-1 font-fraunces text-[30px] font-bold tracking-tight">Reader</h3>
          <div className="my-3.5 font-fraunces text-[56px] font-bold leading-none tracking-[-0.04em]">
            $0
            <span className="ml-1.5 font-sans text-[13px] font-medium text-ink3">forever</span>
          </div>
          <p className="mb-5 text-[14px] leading-[1.55] text-ink3">No account, no nags. Everything here is free forever — no daily caps.</p>
          <ul className="mb-0 space-y-0">
            {freeFeatures.map((f) => <FeatureRow key={f.label} {...f} />)}
          </ul>

          {/* Pro teaser */}
          <div className="mt-4 border-t border-[var(--line)] pt-4">
            <div className="mb-2 font-mono text-[9.5px] font-semibold uppercase tracking-[0.16em] text-ink4">Unlock with Pro</div>
            <ul className="mb-6 space-y-0">
              {proTeaser.map((label) => (
                <li key={label} className="flex items-start gap-2.5 py-1 text-[13.5px]" style={{ opacity: 0.4 }}>
                  <span className="mt-[1px] flex-shrink-0 font-mono text-[11px] text-amber">⊕</span>
                  <span className="text-ink3">{label}</span>
                </li>
              ))}
            </ul>
          </div>

          <a
            href="#browsers"
            className="flex w-full items-center justify-center rounded-full border border-[var(--line)] bg-paper py-3.5 text-[14.5px] font-semibold text-ink transition-all hover:-translate-y-px"
          >
            Install free
          </a>
        </div>

        {/* Pro */}
        <div className="rounded-[22px] p-8" style={{ background: "var(--ink)", color: "var(--paper)" }}>
          <div className="mb-3.5 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-mosssoft">— Pro</div>
          <h3 className="mb-1 font-fraunces text-[30px] font-bold tracking-tight">Lumen Pro</h3>
          <div className="my-3.5 font-fraunces text-[56px] font-bold leading-none tracking-[-0.04em]">
            <em className="italic">$4</em>
            <span className="ml-1.5 font-sans text-[13px] font-medium text-ink4">/ month · billed yearly</span>
          </div>
          <p className="mb-5 text-[14px] leading-[1.55]" style={{ color: "rgba(251,247,236,0.65)" }}>
            For serious learners. Adds the full phoneme marker system on top of everything in Reader.
          </p>
          <ul className="mb-7 space-y-0">
            {proFeatures.map((f) => <FeatureRow key={f.label} {...f} dark />)}
          </ul>
          <a
            href="https://www.patreon.com/c/pronounce/membership"
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center rounded-full bg-moss py-3.5 text-[14.5px] font-semibold text-white transition-all hover:-translate-y-px hover:bg-moss2"
          >
            Support on Patreon to Unlock
          </a>
        </div>
      </div>
    </section>
  );
}
