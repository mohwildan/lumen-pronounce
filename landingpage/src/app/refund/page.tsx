'use client';

import { useState } from 'react';
import Link from 'next/link';

type Step = 'form' | 'submitting' | 'done' | 'error';
type Reason = 'not_useful' | 'too_expensive' | 'technical_issue' | 'accidental' | 'other';

const REASONS: { value: Reason; label: string; emoji: string }[] = [
  { value: 'not_useful',      label: "The features aren't useful for me",  emoji: '😐' },
  { value: 'too_expensive',   label: "It's too expensive",                  emoji: '💸' },
  { value: 'technical_issue', label: "I had a technical issue",             emoji: '🐛' },
  { value: 'accidental',      label: "I subscribed by accident",            emoji: '🙈' },
  { value: 'other',           label: "Other reason",                        emoji: '✍️' },
];

export default function RefundPage() {
  const [step, setStep] = useState<Step>('form');
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState<Reason | ''>('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const canSubmit = email.includes('@') && reason !== '';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setStep('submitting');
    setError('');

    try {
      const res = await fetch('/api/refund-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, reason, note }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? 'Server error');
      }
      setStep('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setStep('error');
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        background: '#1a1915',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
        color: '#fdfbf6',
        padding: '48px 24px 80px',
      }}
    >
      <div style={{ width: '100%', maxWidth: '500px' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: '#5c5a52',
              fontSize: '.85rem',
              textDecoration: 'none',
              marginBottom: '28px',
            }}
          >
            ← Back to Lumen
          </Link>
          <h1
            style={{
              fontSize: '2rem',
              fontWeight: 900,
              color: '#fdfbf6',
              letterSpacing: '-.03em',
              marginBottom: '8px',
            }}
          >
            Request a refund
          </h1>
          <p style={{ color: '#8c887a', lineHeight: 1.6, fontSize: '.95rem' }}>
            We offer a <strong style={{ color: '#c7c3b5' }}>full refund within 7 days</strong> of
            your purchase, no questions asked. Fill the form below and we'll process it within 1–2
            business days.
          </p>
        </div>

        {/* Policy box */}
        <div
          style={{
            background: 'rgba(218,137,43,.06)',
            border: '1px solid rgba(218,137,43,.2)',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '28px',
            display: 'flex',
            gap: '14px',
            alignItems: 'flex-start',
          }}
        >
          <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>🛡️</span>
          <div>
            <p style={{ fontWeight: 700, color: '#da892b', fontSize: '.88rem', marginBottom: '4px' }}>
              7-day money-back guarantee
            </p>
            <p style={{ color: '#8c887a', fontSize: '.83rem', lineHeight: 1.6 }}>
              If you subscribed within the last 7 days, you're eligible for a full refund — even if
              you used the Pro features during your trial. After 7 days, we can still cancel your
              subscription so you won't be charged again.
            </p>
          </div>
        </div>

        {/* ─── Step: FORM ─── */}
        {(step === 'form' || step === 'error') && (
          <form
            onSubmit={handleSubmit}
            style={{
              background: '#22211c',
              border: '1px solid #3e3c33',
              borderRadius: '16px',
              padding: '28px 28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                style={{ display: 'block', fontSize: '.8rem', fontWeight: 700, color: '#8c887a', marginBottom: '7px', letterSpacing: '.04em', textTransform: 'uppercase' }}
              >
                Email address used for purchase
              </label>
              <input
                id="email"
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  background: '#1a1915',
                  border: '1px solid #3e3c33',
                  borderRadius: '10px',
                  color: '#fdfbf6',
                  fontSize: '.92rem',
                  padding: '12px 14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color .15s',
                }}
                onFocus={e => (e.target.style.borderColor = '#da892b')}
                onBlur={e => (e.target.style.borderColor = '#3e3c33')}
              />
            </div>

            {/* Reason */}
            <div>
              <label
                style={{ display: 'block', fontSize: '.8rem', fontWeight: 700, color: '#8c887a', marginBottom: '10px', letterSpacing: '.04em', textTransform: 'uppercase' }}
              >
                Reason for refund
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {REASONS.map(r => (
                  <label
                    key={r.value}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      background: reason === r.value ? 'rgba(218,137,43,.1)' : '#1a1915',
                      border: `1px solid ${reason === r.value ? 'rgba(218,137,43,.4)' : '#3e3c33'}`,
                      borderRadius: '10px',
                      padding: '12px 14px',
                      cursor: 'pointer',
                      transition: 'all .15s',
                    }}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={r.value}
                      checked={reason === r.value}
                      onChange={() => setReason(r.value)}
                      style={{ accentColor: '#da892b', width: '16px', height: '16px', flexShrink: 0 }}
                    />
                    <span style={{ fontSize: '1.1rem' }}>{r.emoji}</span>
                    <span style={{ fontSize: '.88rem', color: reason === r.value ? '#fdfbf6' : '#8c887a', fontWeight: reason === r.value ? 600 : 400, transition: 'color .15s' }}>
                      {r.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Optional note */}
            <div>
              <label
                htmlFor="note"
                style={{ display: 'block', fontSize: '.8rem', fontWeight: 700, color: '#8c887a', marginBottom: '7px', letterSpacing: '.04em', textTransform: 'uppercase' }}
              >
                Additional notes <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
              </label>
              <textarea
                id="note"
                rows={3}
                placeholder="Tell us more so we can improve..."
                value={note}
                onChange={e => setNote(e.target.value)}
                style={{
                  width: '100%',
                  background: '#1a1915',
                  border: '1px solid #3e3c33',
                  borderRadius: '10px',
                  color: '#fdfbf6',
                  fontSize: '.9rem',
                  padding: '12px 14px',
                  outline: 'none',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  transition: 'border-color .15s',
                }}
                onFocus={e => (e.target.style.borderColor = '#da892b')}
                onBlur={e => (e.target.style.borderColor = '#3e3c33')}
              />
            </div>

            {/* Error */}
            {step === 'error' && (
              <p style={{ color: '#fca5a5', fontSize: '.85rem', background: 'rgba(244,63,94,.1)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(244,63,94,.2)' }}>
                ⚠️ {error || 'Something went wrong. Please try again or email us directly.'}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!canSubmit}
              style={{
                background: canSubmit ? '#da892b' : '#3e3c33',
                color: canSubmit ? '#fff' : '#5c5a52',
                border: 'none',
                borderRadius: '12px',
                fontSize: '.95rem',
                fontWeight: 800,
                padding: '14px 24px',
                cursor: canSubmit ? 'pointer' : 'not-allowed',
                transition: 'all .15s',
                boxShadow: canSubmit ? '0 4px 18px rgba(218,137,43,.3)' : 'none',
              }}
            >
              Submit refund request →
            </button>

            <p style={{ fontSize: '.77rem', color: '#5c5a52', textAlign: 'center' }}>
              Or email us directly at{' '}
              <a href="mailto:support@lumenpronunciation.com" style={{ color: '#8c887a', textDecoration: 'underline' }}>
                support@lumenpronunciation.com
              </a>
            </p>
          </form>
        )}

        {/* ─── Step: SUBMITTING ─── */}
        {step === 'submitting' && (
          <div
            style={{
              background: '#22211c',
              border: '1px solid #3e3c33',
              borderRadius: '16px',
              padding: '48px 28px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '2rem', marginBottom: '16px' }}>⏳</div>
            <p style={{ color: '#8c887a', fontSize: '.95rem' }}>Sending your request…</p>
          </div>
        )}

        {/* ─── Step: DONE ─── */}
        {step === 'done' && (
          <div
            style={{
              background: '#22211c',
              border: '1px solid #3e3c33',
              borderRadius: '16px',
              padding: '48px 32px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>✅</div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fdfbf6', marginBottom: '12px', letterSpacing: '-.02em' }}>
              Request received!
            </h2>
            <p style={{ color: '#8c887a', lineHeight: 1.7, marginBottom: '24px', fontSize: '.9rem' }}>
              We've received your refund request for <strong style={{ color: '#c7c3b5' }}>{email}</strong>.
              We'll process it and send a confirmation to your email within{' '}
              <strong style={{ color: '#c7c3b5' }}>1–2 business days</strong>.
            </p>
            <div
              style={{
                background: 'rgba(74,222,128,.07)',
                border: '1px solid rgba(74,222,128,.2)',
                borderRadius: '10px',
                padding: '14px 18px',
                marginBottom: '28px',
                fontSize: '.84rem',
                color: '#86efac',
                lineHeight: 1.6,
              }}
            >
              Your subscription will be cancelled at the end of the current billing period so
              you won't be charged again.
            </div>
            <Link
              href="/"
              style={{
                display: 'inline-block',
                color: '#5c5a52',
                fontSize: '.88rem',
                textDecoration: 'none',
              }}
            >
              ← Back to home
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
