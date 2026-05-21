import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Checkout Cancelled',
  description: 'You cancelled the checkout. No charges were made.',
  robots: { index: false, follow: false },
};

export default function CancelPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#1a1915',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
        color: '#fdfbf6',
        textAlign: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          padding: '48px 40px',
          background: '#22211c',
          border: '1px solid #3e3c33',
          borderRadius: '20px',
          maxWidth: '460px',
          width: '100%',
          boxShadow: '0 24px 64px rgba(0,0,0,.4)',
        }}
      >
        <div style={{ fontSize: '3rem', marginBottom: '20px' }}>😕</div>
        <h1
          style={{
            fontSize: '1.75rem',
            fontWeight: 900,
            color: '#c7c3b5',
            marginBottom: '12px',
            letterSpacing: '-.02em',
          }}
        >
          Checkout cancelled
        </h1>
        <p
          style={{
            color: '#8c887a',
            lineHeight: 1.7,
            marginBottom: '28px',
            fontSize: '.95rem',
          }}
        >
          No worries — <strong style={{ color: '#c7c3b5' }}>you were not charged</strong>.
          Your plan stays on Free. You can upgrade anytime.
        </p>

        {/* Reassurance block */}
        <div
          style={{
            background: 'rgba(255,255,255,.04)',
            border: '1px solid #3e3c33',
            borderRadius: '12px',
            padding: '18px 20px',
            marginBottom: '28px',
            textAlign: 'left',
          }}
        >
          <p
            style={{
              fontSize: '.78rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '.07em',
              color: '#5c5a52',
              marginBottom: '12px',
            }}
          >
            Lumen Pro includes
          </p>
          {[
            'Stress accent markers on every vowel',
            'Diphthong markers /aɪ, eɪ, ɔɪ, oʊ, aʊ/',
            'Long vowel length marks (:)',
            'TH / DH sound disambiguation',
            'T-sound morph & Z-underline',
            'Hidden phoneme superscripts',
          ].map(f => (
            <div
              key={f}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '8px',
                fontSize: '.84rem',
                color: '#c7c3b5',
              }}
            >
              <span style={{ color: '#da892b', fontWeight: 800, flexShrink: 0 }}>✓</span>
              {f}
            </div>
          ))}
        </div>

        {/* Pricing reminder */}
        <div
          style={{
            display: 'flex',
            gap: '10px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              flex: 1,
              background: 'rgba(255,255,255,.04)',
              border: '1px solid #3e3c33',
              borderRadius: '10px',
              padding: '14px 12px',
            }}
          >
            <p style={{ fontSize: '.72rem', color: '#5c5a52', fontWeight: 600, marginBottom: '4px' }}>MONTHLY</p>
            <p style={{ fontSize: '1.4rem', fontWeight: 900, color: '#c7c3b5' }}>
              $3<span style={{ fontSize: '.75rem', fontWeight: 600, opacity: .65 }}>/mo</span>
            </p>
          </div>
          <div
            style={{
              flex: 1,
              background: 'rgba(218,137,43,.07)',
              border: '1px solid rgba(218,137,43,.25)',
              borderRadius: '10px',
              padding: '14px 12px',
              position: 'relative',
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: '-10px',
                right: '10px',
                background: '#16a34a',
                color: '#fff',
                fontSize: '.6rem',
                fontWeight: 800,
                padding: '2px 7px',
                borderRadius: '20px',
                letterSpacing: '.04em',
              }}
            >
              SAVE 25%
            </span>
            <p style={{ fontSize: '.72rem', color: '#8c887a', fontWeight: 600, marginBottom: '4px' }}>YEARLY</p>
            <p style={{ fontSize: '1.4rem', fontWeight: 900, color: '#da892b' }}>
              $2.25<span style={{ fontSize: '.75rem', fontWeight: 600, opacity: .65 }}>/mo</span>
            </p>
            <p style={{ fontSize: '.68rem', color: '#8c887a', marginTop: '2px' }}>billed $27/year</p>
          </div>
        </div>

        <p style={{ fontSize: '.8rem', color: '#5c5a52', marginBottom: '20px' }}>
          14-day free trial · Cancel anytime · No hidden fees
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Link
            href="/#pricing"
            style={{
              display: 'block',
              background: '#da892b',
              color: '#fff',
              fontSize: '.95rem',
              fontWeight: 800,
              padding: '14px 24px',
              borderRadius: '12px',
              textDecoration: 'none',
              boxShadow: '0 4px 18px rgba(218,137,43,.35)',
              transition: 'opacity .15s',
            }}
          >
            Try Pro free for 14 days →
          </Link>
          <Link
            href="/"
            style={{
              display: 'block',
              color: '#5c5a52',
              fontSize: '.85rem',
              textDecoration: 'none',
              padding: '8px',
            }}
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
