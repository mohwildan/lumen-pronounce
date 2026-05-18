export default function FinalCta() {
  return (
    <div className="mx-auto max-w-[1240px] px-8 py-24 text-center">
      <h2
        className="mx-auto mb-5 max-w-[820px] font-fraunces font-bold leading-none tracking-[-0.035em]"
        style={{ fontSize: "clamp(40px, 5.4vw, 76px)" }}
      >
        The next word you read could be<br />the one you finally{" "}
        <em className="italic text-moss">say</em> right.
      </h2>
      <p className="mx-auto mb-8 max-w-[540px] text-[18px] leading-[1.55] text-ink3">
        Free on every major browser. Two clicks to install. Quiet by default.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <a
          href="#browsers"
          className="flex items-center gap-2 rounded-full bg-ink px-[22px] py-3.5 text-[14.5px] font-semibold text-paper transition-all hover:-translate-y-px hover:bg-moss2"
          style={{ color: 'white' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2z" />
          </svg>
          Add to your browser — Free
        </a>
        <a
          href="#features"
          className="flex items-center gap-2 rounded-full border border-[var(--line)] bg-card px-[22px] py-3.5 text-[14.5px] font-semibold text-ink transition-all hover:-translate-y-px"
        >
          See features again
        </a>
      </div>
    </div>
  );
}
