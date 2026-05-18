const quotes = [
  {
    text: <>I&apos;ve read English fluently for a decade and still mispronounced <em className="italic text-moss">&apos;epitome&apos;</em> for years. Lumen caught it on day one — now every article is a little phonetics lesson.</>,
    initials: "YT",
    name: "Yuki T.",
    role: "UX researcher · Tokyo",
  },
  {
    text: <>The color-coding clicked after two days. Now <em className="italic text-moss">/θ/</em> looks different from every other &apos;th&apos; — my brain just picks it up.</>,
    initials: "MK",
    name: "Mateo K.",
    role: "PM · São Paulo",
  },
  {
    text: "It's the only extension I've kept past a month. Quiet, fast, no nags.",
    initials: "PS",
    name: "Priya S.",
    role: "Med student · Bengaluru",
  },
];

export default function TestimonialsSection() {
  return (
    <section className="mx-auto max-w-[1240px] px-8 py-24">
      <div className="mb-14">
        <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-moss">— Loved by 180k readers</div>
        <h2 className="mt-3.5 font-fraunces text-[clamp(36px,4.6vw,64px)] font-bold leading-[1.02] tracking-[-0.03em]">
          From &quot;I think I&apos;m <em className="italic text-moss">saying it right</em>&quot;
          <br />to <em className="italic text-moss">knowing</em> you are.
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {quotes.map(({ text, initials, name, role }) => (
          <div
            key={name}
            className="flex flex-col rounded-[22px] border border-[var(--line)] bg-card p-7"
          >
            <p className="mb-5 flex-1 font-fraunces text-[19px] leading-[1.4] tracking-tight text-ink" style={{ textWrap: "pretty" } as React.CSSProperties}>
              &ldquo;{text}&rdquo;
            </p>
            <div className="flex items-center gap-3">
              <div
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border font-fraunces text-[14px] font-bold text-moss2"
                style={{ background: "var(--moss-tint)", borderColor: "var(--moss-soft)" }}
              >
                {initials}
              </div>
              <div>
                <div className="text-[13.5px] font-semibold">{name}</div>
                <div className="mt-0.5 text-[12px] text-ink3">{role}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
