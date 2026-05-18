import { LogoMark } from "@/ui/logo-mark";

const links = [
  { href: "#features", label: "Features" },
  { href: "#how", label: "How it works" },
  { href: "#browsers", label: "Install" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

export default function Nav() {
  return (
    <nav
      className="sticky top-0 z-50 border-b border-[var(--line)]"
      style={{
        background: "rgba(251,247,236,0.82)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
      }}
    >
      <div className="mx-auto flex max-w-[1240px] items-center gap-7 px-8 py-3.5">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2.5 font-fraunces text-[19px] font-bold tracking-tight">
          <div className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-[9px] bg-ink">
            <LogoMark />
          </div>
          <span>
            Lumen
            <em className="text-moss not-italic font-bold">Pronunciation</em>
          </span>
        </a>

        {/* Nav links */}
        <div className="hidden flex-1 items-center gap-6 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-ink2 transition-colors hover:text-moss"
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* CTA */}
        <a
          href="#browsers"
          className="ml-auto flex items-center gap-2 rounded-full bg-moss px-[18px] py-[11px] text-[13.5px] font-semibold text-white transition-all hover:-translate-y-px hover:bg-moss2"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3v12m0 0l-5-5m5 5l5-5M5 21h14" />
          </svg>
          Add to browser — Free
        </a>
      </div>
    </nav>
  );
}
