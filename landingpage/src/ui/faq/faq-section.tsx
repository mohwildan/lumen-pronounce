"use client";

import { useState } from "react";

const faqs = [
  {
    q: "Does Lumen track what I read?",
    a: "No page contents leave your device. The extension processes text locally in your browser — nothing is sent to any server. The translation tooltip calls the translation API only for words you hover, and only the word itself is sent, not the surrounding page.",
  },
  {
    q: "Why the phonetic alphabet — isn't that for linguists?",
    a: "IPA is the only writing system that reflects how English actually sounds. Once you've spent an hour with it, you can read pronunciation off any dictionary without ever guessing again. Lumen drops it onto pages so the alphabet gets familiar by osmosis.",
  },
  {
    q: "What exactly does the color-coding do?",
    a: "Each English vowel phoneme gets a distinct color — Red for /ɛ/, Green for /i/, Purple for /ʌ/, Pink for /æ/, Teal for /u/, Amber for /ɔ/. Silent 'ghost' letters are faded to near-transparent. Your eye starts reading sound instead of spelling.",
  },
  {
    q: "Does it work on Google Docs, Gmail, Notion?",
    a: "Yes — anything that renders as real text in the browser. Lumen avoids interfering with editable fields by default; you can toggle it on or off per-site from the toolbar popup.",
  },
  {
    q: "How does the translation work?",
    a: "Hover any word and the tooltip shows IPA transcription, an English definition, and a translation in your chosen language — 100+ languages supported via Google Translate. You can also highlight any paragraph and click the Translate button that appears.",
  },
  {
    q: "Does it work on YouTube and other video platforms?",
    a: "Yes — Lumen color-codes captions on YouTube, Vimeo, and any platform that renders closed captions as real text. Pause-on-hover freezes the video when you move your cursor over a word, so you can inspect it without missing anything. Video captions are free with no daily limit.",
  },
];

export default function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="mx-auto max-w-[1240px] px-8 py-24" id="faq">
      <div className="mb-0">
        <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-moss">— FAQ</div>
        <h2 className="mt-3.5 font-fraunces text-[clamp(36px,4.6vw,64px)] font-bold leading-[1.02] tracking-[-0.03em]">
          Questions, <em className="italic text-moss">answered</em>.
        </h2>
      </div>

      <div className="mt-9 max-w-[820px]">
        {faqs.map(({ q, a }, i) => (
          <div
            key={q}
            className="border-t border-[var(--line)] py-5 last:border-b last:border-[var(--line)]"
          >
            <button
              className="flex w-full items-center justify-between gap-6 text-left font-fraunces text-[21px] font-semibold leading-[1.2] tracking-[-0.015em]"
              onClick={() => setOpen(open === i ? null : i)}
              aria-expanded={open === i}
            >
              <span>{q}</span>
              <span
                className="flex-shrink-0 font-mono text-[22px] font-normal text-moss transition-transform duration-200"
                style={{ transform: open === i ? "rotate(45deg)" : "rotate(0deg)" }}
              >
                +
              </span>
            </button>
            {open === i && (
              <p className="mt-3 max-w-[720px] text-[15.5px] leading-[1.6] text-ink3" style={{ textWrap: "pretty" } as React.CSSProperties}>
                {a}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
