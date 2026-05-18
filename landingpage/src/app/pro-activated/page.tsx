'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://sxqojqgmswxlmsjtzyce.supabase.co';

type Status = 'verifying' | 'success' | 'already_pro' | 'error';

export default function ProActivatedPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>('verifying');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (!sessionId) {
      setStatus('success');
      return;
    }

    const verifyUrl = `${SUPABASE_URL}/functions/v1/verify-checkout?session_id=${encodeURIComponent(sessionId)}`;

    fetch(verifyUrl)
      .then(r => r.json())
      .then((data: { tier?: string; error?: string }) => {
        if (data.tier === 'pro') {
          setStatus('success');
        } else {
          setErrorMsg(data.error ?? 'Verification failed');
          setStatus('error');
        }
      })
      .catch(err => {
        setErrorMsg(String(err));
        setStatus('error');
      });
  }, [searchParams]);

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
          maxWidth: '440px',
          width: '100%',
          boxShadow: '0 24px 64px rgba(0,0,0,.4)',
        }}
      >
        {status === 'verifying' && (
          <>
            <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>⏳</div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#c7c3b5', marginBottom: '8px' }}>
              Activating your Pro plan…
            </h1>
            <p style={{ color: '#8c887a', fontSize: '.9rem' }}>Just a moment</p>
          </>
        )}

        {(status === 'success' || status === 'already_pro') && (
          <>
            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🎉</div>
            <h1
              style={{
                fontSize: '2rem',
                fontWeight: 900,
                color: '#da892b',
                marginBottom: '12px',
                letterSpacing: '-.02em',
              }}
            >
              You&apos;re Pro!
            </h1>
            <p style={{ color: '#c7c3b5', lineHeight: 1.7, marginBottom: '28px', fontSize: '.95rem' }}>
              Your Lumen Pro subscription is now active. All phoneme markers are unlocked.
            </p>
            <ul
              style={{
                listStyle: 'none',
                textAlign: 'left',
                background: 'rgba(218,137,43,.06)',
                border: '1px solid rgba(218,137,43,.18)',
                borderRadius: '12px',
                padding: '16px 20px',
                marginBottom: '28px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              {[
                'Stress accents on vowels',
                'Diphthong markers /aɪ, eɪ, ɔɪ, oʊ, aʊ/',
                'Long vowel markers (:)',
                'TH / DH sound marks',
                'T-sound morph & Z-underline',
                'Hidden phoneme superscripts',
              ].map(f => (
                <li key={f} style={{ fontSize: '.85rem', color: '#c7c3b5', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: '#da892b', fontWeight: 800, flexShrink: 0 }}>✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <p
              style={{
                fontSize: '.78rem',
                color: '#8c887a',
                lineHeight: 1.6,
                padding: '12px 16px',
                background: 'rgba(255,255,255,.03)',
                borderRadius: '8px',
              }}
            >
              <strong style={{ color: '#c7c3b5' }}>Close this tab</strong> and return to the extension.
              <br />
              Tier syncs automatically when you open the popup.
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>⚠️</div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#e05252', marginBottom: '12px' }}>
              Activation failed
            </h1>
            <p style={{ color: '#c7c3b5', lineHeight: 1.7, marginBottom: '16px', fontSize: '.9rem' }}>
              {errorMsg || 'Could not verify your payment. Please contact support.'}
            </p>
            <p style={{ fontSize: '.78rem', color: '#8c887a' }}>
              If you were charged, email us and we&apos;ll fix it manually.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
