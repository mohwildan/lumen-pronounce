"use client";
import React from "react";

const defaultBrowser = {
  letter: "C",
  name: "Chrome",
  ver: "v.116+ · Manifest V3",
  label: "Add to Chrome — Free",
  href: "#",
  bg: "#FFF1D4",
  color: "#C97A1E",
};

const browserConfigs = {
  edge: {
    letter: "E",
    name: "Edge",
    ver: "v.116+ · Manifest V3",
    label: "Add to Edge — Free",
    href: "#",
    bg: "#D0E8FF",
    color: "#1A73E8",
  },
  opera: {
    letter: "O",
    name: "Opera",
    ver: "v.116+ · Manifest V3",
    label: "Add to Opera — Free",
    href: "#",
    bg: "#FFE5F0",
    color: "#FF1B6B",
  },
  firefox: {
    letter: "F",
    name: "Firefox",
    ver: "v.109+ · Manifest V3",
    label: "Add to Firefox — Free",
    href: "#",
    bg: "#FFF3E0",
    color: "#FF9500",
  },
  safari: {
    letter: "S",
    name: "Safari",
    ver: "v.17+ · Web Extensions",
    label: "Add to Safari — Free",
    href: "#",
    bg: "#F0F0F0",
    color: "#555555",
  },
  chrome: defaultBrowser,
};

const chromiumBrowsers = [
  { letter: "C", name: "Chrome and other Chromium-based browsers" },
  { letter: "F", name: "Firefox and browsers using the Gecko engine" },
];
const notSupportedBrowsers = [
  "Safari",
];

function detectBrowser(userAgent: string): string {
  if (/Edg\//.test(userAgent)) return "edge";
  if (/OPR\//.test(userAgent)) return "opera";
  if (/Firefox\//.test(userAgent)) return "firefox";
  if (/Safari\//.test(userAgent) && !/Chrome/.test(userAgent)) return "safari";
  return "chrome";
}

export default function BrowsersSection() {
  const [primaryBrowser, setPrimaryBrowser] = React.useState(defaultBrowser);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const detectedBrowser = detectBrowser(navigator.userAgent);
      setPrimaryBrowser(browserConfigs[detectedBrowser as keyof typeof browserConfigs]);
    }
  }, []);

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

      {/* Featured browser card */}
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
        {chromiumBrowsers.map(({ letter, name }) => (
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
          </div>
        ))}
      </div>

      <p className="mt-7 text-center font-mono text-[11.5px] font-semibold uppercase tracking-[0.16em] text-ink3">
        Safari support · coming later · <a href="#" className="underline hover:text-moss">join the waitlist</a>
      </p>
    </section>
  );
}
