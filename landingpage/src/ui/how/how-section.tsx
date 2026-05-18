const steps = [
  {
    num: "i.",
    title: "Add the extension",
    body: "One click in your browser's store. Lumen Pronunciation weighs less than a podcast ad — no account needed to start.",
  },
  {
    num: "ii.",
    title: "Open any English page",
    body: "An article, a Reddit thread, a Google Doc, your inbox. Hover any word — IPA blooms above it in tiny moss-green italics.",
  },
  {
    num: "iii.",
    title: "Hover for the full picture",
    body: "Hover any word for IPA, definition, and a translation in your language. Highlight a sentence to translate the whole thing instantly.",
  },
];

export default function HowSection() {
  return (
    <section className="mx-auto max-w-[1240px] px-8 py-6" id="how">
      <div
        className="relative overflow-hidden rounded-[32px] px-16 py-[90px]"
        style={{ background: "var(--ink)", color: "var(--paper)" }}
      >
        {/* Background gradients */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 40% at 90% 10%, rgba(198,212,179,0.10), transparent 60%), radial-gradient(ellipse 60% 40% at 10% 90%, rgba(91,122,75,0.18), transparent 60%)",
          }}
        />

        <div className="relative">
          <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-mosssoft">— How it works</div>
          <h2 className="mt-3.5 mb-12 font-fraunces text-[clamp(36px,4.6vw,64px)] font-bold leading-[1.02] tracking-[-0.03em] text-paper max-w-[720px]">
            Install once.
            <br />It just <em className="italic text-mosssoft">shows up</em>,
            <br />everywhere you read.
          </h2>

          <div className="grid gap-7 md:grid-cols-3">
            {steps.map(({ num, title, body }) => (
              <div
                key={num}
                className="border-t pt-5"
                style={{ borderColor: "rgba(255,255,255,0.14)" }}
              >
                <div className="mb-7 font-fraunces italic text-[14px] font-semibold text-mosssoft">
                  <em>{num}</em>
                </div>
                <h3 className="mb-2.5 font-fraunces text-[26px] font-bold leading-[1.15] tracking-tight">
                  {title}
                </h3>
                <p
                  className="text-[14.5px] leading-[1.55]"
                  style={{ color: "rgba(251,247,236,0.65)", textWrap: "pretty" } as React.CSSProperties}
                >
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
