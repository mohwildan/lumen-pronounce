import { LogoMark } from "@/ui/logo-mark";
import { currentYear } from "@/consts";
import Link from "next/link";

const cols = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "How it works", href: "#how" },
      { label: "Install", href: "#browsers" },
      { label: "Pricing", href: "#pricing" },
      { label: "Changelog", href: "#" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "IPA Alphabet guide", href: "#" },
      { label: "Pronunciation tips", href: "#" },
      { label: "FAQ", href: "#faq" },
      { label: "Blog", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
];

export default function LumenFooter() {
  return (
    <footer style={{ background: "var(--ink)", color: "var(--paper)" }} className="px-8 pt-16 pb-10">
      <div className="mx-auto max-w-[1240px]">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand column */}
          <div>
            <Link
              href="/"
              className="flex items-center gap-2.5 font-fraunces text-[19px] font-bold tracking-tight"
              style={{ color: "var(--paper)" }}
            >
              <div
                className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-[9px]"
                style={{ background: "var(--moss)" }}
              >
                <LogoMark />
              </div>
              <span>
                Lumen
                <em className="not-italic font-bold" style={{ color: "var(--moss-soft)" }}>Pronunciation</em>
              </span>
            </Link>
            <p className="mt-4 max-w-[280px] text-[13.5px] leading-[1.55]" style={{ color: "rgba(251,247,236,0.6)" }}>
              Part of the LumenVerse — small, focused tools for the unglamorous parts of learning a language.
            </p>
          </div>

          {/* Link columns */}
          {cols.map(({ title, links }) => (
            <div key={title}>
              <h4 className="mb-4 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-mosssoft">
                {title}
              </h4>
              <ul className="space-y-0">
                {links.map(({ label, href }) => (
                  <li key={label} className="py-[5px] text-[14px]" style={{ color: "rgba(251,247,236,0.75)" }}>
                    <Link href={href} className="transition-colors hover:text-mosssoft">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Legal */}
        <div
          className="mt-12 flex flex-wrap items-center justify-between gap-2.5 border-t pt-5 font-mono text-[11px] uppercase tracking-[0.14em]"
          style={{ borderColor: "rgba(255,255,255,0.1)", color: "rgba(251,247,236,0.5)" }}
        >
          <div>© {currentYear} LumenVerse · Made for ears that read</div>
          <div>v1.0.0 · Last updated May 2026</div>
        </div>
      </div>
    </footer>
  );
}
