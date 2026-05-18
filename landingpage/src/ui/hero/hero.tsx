import { LogoMark } from "@/ui/logo-mark";

function IpaWord({
  children,
  ipa,
  active,
  hi,
}: {
  children: React.ReactNode;
  ipa?: string;
  active?: boolean;
  hi?: boolean;
}) {
  return (
    <span
      className="relative inline-block px-[1px]"
      style={
        active
          ? { background: "var(--moss)", color: "var(--paper)", borderRadius: 4, padding: "1px 3px" }
          : hi
            ? { background: "linear-gradient(transparent 62%, rgba(198,212,179,0.55) 62%)", borderRadius: 2, cursor: "pointer" }
            : undefined
      }
    >
      {ipa && (
        <span
          className="absolute bottom-full left-1/2 -translate-x-1/2 translate-y-0.5 whitespace-nowrap font-fraunces italic text-[11.5px] font-medium pointer-events-none"
          style={{ color: active ? "var(--moss-2)" : "var(--moss)" }}
        >
          {ipa}
        </span>
      )}
      {children}
    </span>
  );
}

export default function Hero() {
  return (
    <header className="mx-auto grid max-w-[1240px] grid-cols-1 items-center gap-14 px-8 py-16 pb-20 lg:grid-cols-2 lg:gap-14">
      {/* ── Left column ── */}
      <div>
        {/* Eyebrow */}
        <div
          className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.15em]"
          style={{ background: "var(--moss-tint)", border: "1px solid var(--moss-soft)", color: "var(--moss-2)" }}
        >
          <span
            className="h-[7px] w-[7px] rounded-full bg-moss"
            style={{ boxShadow: "0 0 0 3px rgba(91,122,75,0.18)" }}
          />
          v1.0 · IPA over every English word
        </div>

        {/* Headline */}
        <h1
          className="mt-5 font-fraunces text-[clamp(48px,6.4vw,88px)] font-bold leading-[0.96] tracking-[-0.035em]"
        >
          Read English
          <br />
          like you can{" "}
          <em className="italic text-moss">hear</em> it.
        </h1>

        {/* Lead */}
        <p className="mt-5 mb-8 max-w-[520px] text-[19px] leading-[1.55] text-ink3" style={{ textWrap: "pretty" } as React.CSSProperties}>
          A tiny browser extension that puts the phonetic alphabet above any
          English word you hover. Color-coded vowels, stress marks, translation
          in 100+ languages — on every page you read.
        </p>

        {/* CTA */}
        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href="#browsers"
            className="flex items-center gap-2 rounded-full bg-ink px-[22px] py-3.5 text-[14.5px] font-semibold transition-all hover:-translate-y-px hover:bg-moss2"
            style={{ color: 'white' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2z" /></svg>
            Add to Chrome — Free
          </a>
          <a
            href="#how"
            className="flex items-center gap-2 rounded-full border border-[var(--line)] bg-white px-[22px] py-3.5 text-[14.5px] font-semibold text-ink transition-all hover:-translate-y-px"
          >
            See it in action
          </a>
          <span className="ml-1.5 text-[12.5px] text-ink3">
            Also on <strong className="text-ink font-semibold">Edge · Arc · Brave · Vivaldi</strong>
          </span>
        </div>

        {/* Stats */}
        <div
          className="mt-11 grid max-w-[520px] grid-cols-3 gap-9 border-t pt-7"
          style={{ borderColor: "var(--line)" }}
        >
          {[
            { num: "180k+", numEm: true, lbl: "Learners installed" },
            { num: "4.9★", numEm: false, lbl: "Chrome Web Store" },
            { num: "42k", numEm: true, lbl: "Words pronounced every minute" },
          ].map(({ num, numEm, lbl }) => (
            <div key={lbl}>
              <div className="font-fraunces text-[28px] font-bold leading-none tracking-tight">
                {numEm ? <em className="italic text-moss">{num}</em> : num}
              </div>
              <div className="mt-1.5 text-[12px] text-ink3">{lbl}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right column: browser stage ── */}
      <div
        className="relative rounded-[28px] border border-[var(--line)] p-6"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 70% 30%, rgba(198,212,179,0.55), transparent 70%), radial-gradient(ellipse 80% 60% at 30% 80%, rgba(244,238,225,0.9), transparent 60%), var(--cream)",
        }}
      >
        {/* Floating chips */}
        <div className="absolute -left-4 top-[90px] z-10 flex flex-col gap-2">
          {[
            { label: "IPA ·", value: "/aɪ piː eɪ/" },
            { label: "Vowels ·", value: "7 colors" },
            { label: "Languages ·", value: "100+" },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-full border border-[var(--line)] bg-card px-3 py-1.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink2"
              style={{ boxShadow: "0 8px 18px -8px rgba(20,18,12,0.18)" }}
            >
              {label} <strong className="text-moss font-bold">{value}</strong>
            </div>
          ))}
        </div>

        {/* Browser mockup */}
        <div
          className="overflow-hidden rounded-[14px] border border-[var(--line)] bg-card"
          style={{ boxShadow: "0 1px 0 #fff inset, 0 24px 56px -20px rgba(20,18,12,0.22), 0 8px 18px -10px rgba(20,18,12,0.12)" }}
        >
          {/* Browser bar */}
          <div
            className="flex items-center gap-2.5 border-b border-[var(--line)] px-3.5 py-2.5"
            style={{ background: "linear-gradient(#FFFDF5, #F6EFDD)" }}
          >
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#E68F8F]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#E8C078]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#9CC089]" />
            </div>
            <div className="flex flex-1 items-center gap-2 rounded-full border border-[var(--line)] bg-paper px-3 py-1.5 font-mono text-[11px] text-ink3">
              <span className="text-moss">⚿</span>
              theatlantic.com/magazine/the-quiet-discipline
            </div>
            <div className="relative flex h-7 w-7 items-center justify-center rounded-[8px] bg-ink">
              <LogoMark size={16} />
              <span
                className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-moss"
                style={{ border: "2px solid var(--card)" }}
              />
            </div>
          </div>

          {/* Browser content */}
          <div className="relative bg-card p-7 pb-8">
            <div className="mb-3.5 flex gap-2.5">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-moss">Lumen on</span>
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-ink3">— Long Read · 12 min</span>
            </div>
            <h2 className="mb-1 font-fraunces text-[26px] font-bold leading-[1.12] tracking-tight text-ink">
              The Quiet Discipline of Listening Carefully
            </h2>
            <p className="mb-4 text-[12.5px] text-ink3">By Iris Hendren · September 14, 2025</p>

            {/* IPA annotated text */}
            <div className="font-fraunces text-[16.5px] leading-[2.2] text-ink2">
              <IpaWord>Pronunciation</IpaWord>{" "}
              <IpaWord ipa="/pəˈnʌn.si/" hi>is</IpaWord>{" "}
              <IpaWord>often</IpaWord>{" "}
              <IpaWord ipa="/θɔːt/" hi>thought</IpaWord>{" "}
              of as{" "}
              <IpaWord ipa="/ˈsɜː.fɪs/" hi>surface</IpaWord>{" "}
              work. It is the{" "}
              <IpaWord ipa="/ˈkwaɪ.ət/" active>quiet</IpaWord>{" "}
              <IpaWord ipa="/ˈdɪs.ə.plɪn/" hi>discipline</IpaWord>{" "}
              of{" "}
              <IpaWord ipa="/ˈlɪs.ən.ɪŋ/" hi>listening</IpaWord>{" "}
              carefully.
            </div>

            {/* Popover */}
            <div
              className="absolute bottom-[84px] right-8 z-10 w-[260px] rounded-[14px] p-4 text-paper"
              style={{ background: "var(--ink)", boxShadow: "0 18px 40px -8px rgba(20,18,12,0.4)" }}
            >
              <div className="mb-1 flex items-baseline justify-between">
                <span className="font-fraunces text-[22px] font-bold tracking-tight">quiet</span>
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-mosssoft">adj · adv · n</span>
              </div>
              <div className="mb-3 font-fraunces italic text-[18px] text-mosssoft">/ˈkwaɪ.ət/</div>
              <p className="mb-3 text-[12.5px] leading-[1.5] text-paper/75">Making little or no noise; the absence of audible disturbance.</p>
              <div
                className="flex gap-1.5 border-t pt-2.5"
                style={{ borderColor: "rgba(255,255,255,0.1)" }}
              >
                {["▶ US", "▶ UK", "▶ AU"].map((lbl) => (
                  <button
                    key={lbl}
                    className="flex flex-1 items-center justify-center rounded-full py-[7px] font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-paper transition-colors hover:bg-moss"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
