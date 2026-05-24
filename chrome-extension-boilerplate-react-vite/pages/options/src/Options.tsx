import React, { useEffect, useState, type ReactNode } from 'react';
import '@src/Options.css';
import '../../../chrome-extension/public/content.css';
import { useStorage, withErrorBoundary, withSuspense } from '@extension/shared';
import { ipaSettingsStorage, ipaAuthStorage } from '@extension/storage';
import type { IpaOpts } from '@extension/storage';
import { ErrorDisplay, LoadingSpinner } from '@extension/ui';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'rp-w': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { 'data-word'?: string; 'data-arpa'?: string }, HTMLElement>;
      'rp-s': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { 'data-silent'?: string; 'data-vc'?: string; 'data-st'?: string; 'data-zm'?: string }, HTMLElement>;
      'rp-c': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { 'data-type'?: string }, HTMLElement>;
      'rp-sup': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { 'data-ghost'?: string; 'data-gvc'?: string; 'data-type'?: string }, HTMLElement>;
    }
  }
}

type Tab = 'settings' | 'translation' | 'account' | 'sandbox' | 'anki' | 'shortcuts';

const LANGUAGES = [
  { code: 'none', name: 'Off' },
  { code: 'af', name: 'Afrikaans' }, { code: 'sq', name: 'Albanian' }, { code: 'am', name: 'Amharic' },
  { code: 'ar', name: 'Arabic' }, { code: 'hy', name: 'Armenian' }, { code: 'az', name: 'Azerbaijani' },
  { code: 'eu', name: 'Basque' }, { code: 'be', name: 'Belarusian' }, { code: 'bn', name: 'Bengali' },
  { code: 'bs', name: 'Bosnian' }, { code: 'bg', name: 'Bulgarian' }, { code: 'ca', name: 'Catalan' },
  { code: 'ceb', name: 'Cebuano' }, { code: 'zh-CN', name: 'Chinese (S)' }, { code: 'zh-TW', name: 'Chinese (T)' },
  { code: 'hr', name: 'Croatian' }, { code: 'cs', name: 'Czech' }, { code: 'da', name: 'Danish' },
  { code: 'nl', name: 'Dutch' }, { code: 'en', name: 'English' }, { code: 'eo', name: 'Esperanto' },
  { code: 'et', name: 'Estonian' }, { code: 'tl', name: 'Filipino' }, { code: 'fi', name: 'Finnish' },
  { code: 'fr', name: 'French' }, { code: 'gl', name: 'Galician' }, { code: 'ka', name: 'Georgian' },
  { code: 'de', name: 'German' }, { code: 'el', name: 'Greek' }, { code: 'gu', name: 'Gujarati' },
  { code: 'ht', name: 'Haitian Creole' }, { code: 'ha', name: 'Hausa' }, { code: 'haw', name: 'Hawaiian' },
  { code: 'iw', name: 'Hebrew' }, { code: 'hi', name: 'Hindi' }, { code: 'hu', name: 'Hungarian' },
  { code: 'is', name: 'Icelandic' }, { code: 'id', name: 'Indonesian' }, { code: 'ga', name: 'Irish' },
  { code: 'it', name: 'Italian' }, { code: 'ja', name: 'Japanese' }, { code: 'jw', name: 'Javanese' },
  { code: 'kn', name: 'Kannada' }, { code: 'kk', name: 'Kazakh' }, { code: 'km', name: 'Khmer' },
  { code: 'ko', name: 'Korean' }, { code: 'ku', name: 'Kurdish' }, { code: 'lo', name: 'Lao' },
  { code: 'la', name: 'Latin' }, { code: 'lv', name: 'Latvian' }, { code: 'lt', name: 'Lithuanian' },
  { code: 'mk', name: 'Macedonian' }, { code: 'ms', name: 'Malay' }, { code: 'ml', name: 'Malayalam' },
  { code: 'mt', name: 'Maltese' }, { code: 'mi', name: 'Maori' }, { code: 'mr', name: 'Marathi' },
  { code: 'mn', name: 'Mongolian' }, { code: 'my', name: 'Burmese' }, { code: 'ne', name: 'Nepali' },
  { code: 'no', name: 'Norwegian' }, { code: 'fa', name: 'Persian' }, { code: 'pl', name: 'Polish' },
  { code: 'pt', name: 'Portuguese' }, { code: 'pa', name: 'Punjabi' }, { code: 'ro', name: 'Romanian' },
  { code: 'ru', name: 'Russian' }, { code: 'sr', name: 'Serbian' }, { code: 'si', name: 'Sinhala' },
  { code: 'sk', name: 'Slovak' }, { code: 'sl', name: 'Slovenian' }, { code: 'so', name: 'Somali' },
  { code: 'es', name: 'Spanish' }, { code: 'sw', name: 'Swahili' }, { code: 'sv', name: 'Swedish' },
  { code: 'ta', name: 'Tamil' }, { code: 'te', name: 'Telugu' }, { code: 'th', name: 'Thai' },
  { code: 'tr', name: 'Turkish' }, { code: 'uk', name: 'Ukrainian' }, { code: 'ur', name: 'Urdu' },
  { code: 'uz', name: 'Uzbek' }, { code: 'vi', name: 'Vietnamese' }, { code: 'cy', name: 'Welsh' },
  { code: 'yi', name: 'Yiddish' }, { code: 'yo', name: 'Yoruba' }, { code: 'zu', name: 'Zulu' },
];

const PRO_OPT_IDS = new Set<keyof IpaOpts>([
  'stress', 'length', 'diph_ai', 'diph_ei_oi', 'diph_ou_au',
  'th_t', 'th_d', 'tmark', 'zmark', 'phonemes',
]);

type SettingRow = { id: keyof IpaOpts; label: string; desc: string; swatch?: string };

const COLOR_OPTS: SettingRow[] = [
  { id: 'silent', label: 'Ghost Letters', desc: 'Fade silent letters to show which characters are unpronounced' },
  { id: 'color_e', label: '/ɛ/ Red', desc: 'bed, head, said — short e sound', swatch: '#e53935' },
  { id: 'color_i', label: '/i/ Green', desc: 'receipt, ski — long ee sound', swatch: '#2e7d32' },
  { id: 'color_u_alt', label: '/ʌ/ Purple', desc: 'some, blood, love — uh vowel', swatch: '#8e24aa' },
  { id: 'color_a', label: '/æ/ Pink', desc: 'cat, trap, hand — short a sound', swatch: '#d81b60' },
  { id: 'color_u', label: '/u/ Teal', desc: 'tomb, blue, shoe — long oo sound', swatch: '#00838f' },
  { id: 'color_o', label: '/ɔ/ Amber', desc: 'quarter, law, thought — aw sound', swatch: '#e65100' },
];

const PHONETIC_OPTS: SettingRow[] = [
  { id: 'stress', label: 'Stress Accents', desc: 'Accent mark on stressed vowels — updáte, récord' },
  { id: 'length', label: 'Long Vowels (:)', desc: 'Colon after long vowels — soon:, tomb:' },
  { id: 'diph_ai', label: 'Diphthong /aɪ/', desc: 'Superscript on /aɪ/ — item, ice, eye' },
  { id: 'diph_ei_oi', label: 'Diphthongs /eɪ, ɔɪ/', desc: 'Superscript on /eɪ/ and /ɔɪ/ — great, boy' },
  { id: 'diph_ou_au', label: 'Diphthongs /oʊ, aʊ/', desc: 'Superscript on /oʊ/ and /aʊ/ — road, out' },
  { id: 'th_t', label: 'TH Mark /θ/', desc: 'Voiceless TH superscript — thin, think, through' },
  { id: 'th_d', label: 'DH Mark /ð/', desc: 'Voiced TH superscript — this, there, that' },
  { id: 'tmark', label: 'T-Sound Morph', desc: 'Show ᵗ when T is spelled differently — asked, debt' },
  { id: 'zmark', label: 'Z-Sound Lines', desc: 'Underline letters that make a Z sound — visit, dogs' },
  { id: 'phonemes', label: 'Hidden Phonemes', desc: 'Superscript for unpronounced letters — one → ʷone' },
];

/* ─── Icons ─── */

const IconSettings = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const IconGlobe = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const IconUser = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconBook = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

/* ─── Switch ─── */
function Switch({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label className={`opt-switch${disabled ? ' opt-switch-disabled' : ''}`}>
      <input type="checkbox" checked={checked} onChange={e => !disabled && onChange(e.target.checked)} disabled={disabled} />
      <span className="opt-slider" />
    </label>
  );
}

/* ─── Section label ─── */
function SectionLabel({ children }: { children: ReactNode }) {
  return <div className="opt-group-label">{children}</div>;
}

/* ─── Settings Tab ─── */
function SettingsTab() {
  const settings = useStorage(ipaSettingsStorage);
  const auth = useStorage(ipaAuthStorage);
  const [confirmReset, setConfirmReset] = useState(false);

  if (!settings || !auth) return null;
  const tier = auth.user?.tier ?? 'free';

  const siteOverrideEntries = Object.entries(settings.siteOverrides ?? {});

  return (
    <div className="opt-section">
      <div className="opt-page-header">
        <h2>Settings</h2>
        <p className="opt-section-desc">Control phonetic features and per-site behavior.</p>
      </div>

      {/* Global toggle */}
      <div className={`opt-global-card${settings.enabled ? ' opt-global-on' : ' opt-global-off'}`}>
        <div className="opt-global-info">
          <span className="opt-global-name">Extension</span>
          <span className="opt-global-status">
            {settings.enabled ? 'Active — processing all pages' : 'Paused — no pages processed'}
          </span>
        </div>
        <Switch checked={settings.enabled} onChange={v => ipaSettingsStorage.setEnabled(v)} />
      </div>

      {/* Site overrides — only shown when non-empty */}
      {siteOverrideEntries.length > 0 && (
        <div className="opt-overrides">
          <SectionLabel>Site Overrides</SectionLabel>
          <div className="opt-override-pills">
            {siteOverrideEntries.map(([host, enabled]) => (
              <div key={host} className={`opt-pill${enabled ? ' opt-pill-on' : ' opt-pill-off'}`}>
                <span className="opt-pill-dot" />
                <span>{host}</span>
                <button
                  className="opt-pill-remove"
                  title="Remove override"
                  onClick={() => ipaSettingsStorage.clearSiteOverride(host)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <p className="opt-overrides-hint">
            Override set from the popup while browsing. Force a site on or off regardless of global setting.
          </p>
        </div>
      )}

      {/* Color Coding */}
      <SectionLabel>Color Coding</SectionLabel>
      <div className="opt-rows">
        {COLOR_OPTS.map(row => (
          <div key={row.id} className="opt-row">
            <div className="opt-row-body">
              {row.swatch
                ? <span className="opt-swatch" style={{ background: row.swatch }} />
                : <span className="opt-swatch opt-swatch-ghost" />
              }
              <div className="opt-row-text">
                <span className="opt-row-name">{row.label}</span>
                <small>{row.desc}</small>
              </div>
            </div>
            <Switch checked={settings.opts[row.id]} onChange={v => ipaSettingsStorage.setOpt(row.id, v)} />
          </div>
        ))}
      </div>

      {/* Phonetic Markers */}
      <SectionLabel>
        Phonetic Markers
        {tier !== 'pro' && (
          <span className="opt-group-pro-note">Pro required for some</span>
        )}
      </SectionLabel>
      <div className="opt-rows">
        {PHONETIC_OPTS.map(row => {
          const locked = PRO_OPT_IDS.has(row.id) && tier !== 'pro';
          return (
            <div
              key={row.id}
              className={`opt-row${locked ? ' opt-row-locked' : ''}`}
              onClick={locked ? () => ipaAuthStorage.openCheckout('year') : undefined}
            >
              <div className="opt-row-body">
                <span className="opt-swatch opt-swatch-ghost" />
                <div className="opt-row-text">
                  <div className="opt-row-name-wrap">
                    <span className="opt-row-name">{row.label}</span>
                    {PRO_OPT_IDS.has(row.id) && <span className="opt-pro-badge">Pro</span>}
                  </div>
                  <small>{row.desc}</small>
                </div>
              </div>
              {locked ? (
                <button
                  className="opt-upgrade-inline"
                  onClick={e => { e.stopPropagation(); void ipaAuthStorage.openCheckout('year'); }}
                >
                  Upgrade ↗
                </button>
              ) : (
                <Switch checked={settings.opts[row.id]} onChange={v => ipaSettingsStorage.setOpt(row.id, v)} />
              )}
            </div>
          );
        })}
      </div>

      {/* Behavior */}
      <SectionLabel>Behavior</SectionLabel>
      <div className="opt-rows">
        <div className="opt-row">
          <div className="opt-row-body">
            <span className="opt-swatch opt-swatch-ghost" />
            <div className="opt-row-text">
              <span className="opt-row-name">Pronunciation Dialect</span>
              <small>Accent/dialect style used for word highlight and translation</small>
            </div>
          </div>
          <select
            className="opt-select"
            value={settings.pronunciationDialect ?? 'nAmE'}
            onChange={e => ipaSettingsStorage.setPronunciationDialect(e.target.value as 'nAmE' | 'brE')}
            style={{ background: '#1a1a1a', color: '#fff', border: '1px solid #444', borderRadius: '4px', padding: '6px 8px', width: '200px' }}
          >
            <option value="nAmE">American English</option>
            <option value="brE">British English</option>
          </select>
        </div>

        <div className="opt-row">
          <div className="opt-row-body">
            <span className="opt-swatch opt-swatch-ghost" />
            <div className="opt-row-text">
              <span className="opt-row-name">Pause video on hover</span>
              <small>Pause playing video when hovering over highlighted words</small>
            </div>
          </div>
          <Switch
            checked={settings.pauseOnHover ?? false}
            onChange={v => ipaSettingsStorage.setPauseOnHover(v)}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="opt-actions">
        {confirmReset ? (
          <div className="opt-confirm-row">
            <span className="opt-confirm-text">Reset all settings to defaults?</span>
            <button
              className="opt-btn-confirm-yes"
              onClick={async () => { await ipaSettingsStorage.reset(); setConfirmReset(false); }}
            >
              Yes, reset
            </button>
            <button className="opt-btn-confirm-no" onClick={() => setConfirmReset(false)}>
              Cancel
            </button>
          </div>
        ) : (
          <button className="opt-btn-reset" onClick={() => setConfirmReset(true)}>
            Reset to Defaults
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Translation Tab ─── */
function TranslationTab() {
  const settings = useStorage(ipaSettingsStorage);
  const [testText, setTestText] = useState('');
  const [translationResult, setTranslationResult] = useState('');
  const [loading, setLoading] = useState(false);

  if (!settings) return null;
  const lang = settings.targetLanguage ?? 'none';

  const translateText = async (text: string) => {
    if (!text.trim() || lang === 'none') return;
    setLoading(true);
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${encodeURIComponent(lang)}&dt=t&q=${encodeURIComponent(text)}`;
      const r = await fetch(url);
      const data = await r.json() as unknown[][];
      const result = (data[0] as unknown[][])?.map((c: unknown[]) => c[0]).filter(Boolean).join('') ?? '';
      setTranslationResult(result);
    } catch {
      setTranslationResult('Translation failed.');
    }
    setLoading(false);
  };

  return (
    <div className="opt-section">
      <div className="opt-page-header">
        <h2>Translation</h2>
        <p className="opt-section-desc">Hover any highlighted word to see its translation in the tooltip.</p>
      </div>

      <div className="opt-card">
        <div className="opt-card-row">
          <label className="opt-card-label">Target language</label>
          <select
            className="opt-select"
            value={lang}
            onChange={e => ipaSettingsStorage.setLanguage(e.target.value)}
          >
            {LANGUAGES.map(l => (
              <option key={l.code} value={l.code}>{l.name}</option>
            ))}
          </select>
        </div>
        <div className="opt-card-divider" />
        <div className="opt-card-row">
          <div>
            <label className="opt-card-label">Text-select translation</label>
            <p className="opt-card-sublabel">Select any text on the page to translate the whole sentence</p>
          </div>
          <Switch
            checked={settings.translatePerSentence ?? true}
            onChange={v => ipaSettingsStorage.setTranslatePerSentence(v)}
          />
        </div>
      </div>

      {lang !== 'none' && (
        <>
          <SectionLabel>Test Translation</SectionLabel>
          <div className="opt-rows">
            <div className="opt-trans-test-card" style={{ width: '100%' }}>
              <label className="opt-trans-test-label">Enter text to translate</label>
              <div className="opt-trans-input-row" style={{ marginTop: '8px' }}>
                <input
                  className="opt-input"
                  placeholder="Type a word or sentence…"
                  value={testText}
                  onChange={e => { setTestText(e.target.value); setTranslationResult(''); }}
                  onKeyDown={e => e.key === 'Enter' && translateText(testText.trim())}
                  style={{ flex: 1 }}
                />
                <button
                  className="opt-btn-trans"
                  disabled={!testText.trim() || loading}
                  onClick={() => translateText(testText.trim())}
                  style={{ minWidth: '100px' }}
                >
                  {loading ? '…' : 'Translate'}
                </button>
              </div>
              {translationResult && (
                <div 
                  className="opt-trans-result" 
                  style={{ 
                    marginTop: '12px', 
                    padding: '12px', 
                    background: '#121224', 
                    borderRadius: '6px', 
                    border: '1px solid #222',
                    color: '#fff',
                    fontSize: '14px',
                    lineHeight: '1.5'
                  }}
                >
                  {translationResult}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Account Tab ─── */
function AccountTab() {
  const auth = useStorage(ipaAuthStorage);
  const [loading, setLoading] = useState(false);
  const [billingLoading, setBillingLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [interval, setInterval] = useState<'month' | 'year'>('year');
  const [error, setError] = useState('');

  if (!auth) return null;
  const tier = auth.user?.tier ?? 'free';

  const getInitials = (name: string, email: string) => {
    const source = name || email;
    if (!source) return 'U';

    if (source.includes('@')) {
      const username = source.split('@')[0];
      const parts = username.split(/[\._-]/);
      if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }

    const parts = source.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const getColorFromSource = (name: string, email: string) => {
    const source = name || email;
    if (!source) return 'var(--bg-hover)';
    let hash = 0;
    for (let i = 0; i < source.length; i++) {
      hash = source.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash) % 360;
    return `hsl(${h}, 60%, 40%)`;
  };

  const handleGoogleLogin = async () => {
    setLoading(true); setError('');
    const res = await ipaAuthStorage.loginWithGoogle();
    if (res.error) setError(res.error || 'Sign-in failed. Make sure pop-ups are allowed.');
    setLoading(false);
  };

  const handleLogout = async () => { setLoading(true); await ipaAuthStorage.logout(); setLoading(false); };
  const handleUpgrade = async () => { setBillingLoading(true); await ipaAuthStorage.openCheckout(interval); setBillingLoading(false); };
  const handleManageBilling = async () => { setBillingLoading(true); await ipaAuthStorage.openPortal(); setBillingLoading(false); };
  const handleSyncTier = async () => {
    setSyncLoading(true);
    await ipaAuthStorage.syncTier().catch(() => { });
    setSyncLoading(false);
  };

  const PRO_FEATURES = [
    'Stress accents on vowels — Shows which syllable to emphasize in pronunciation',
    'Diphthong markers (/aɪ, eɪ, ɔɪ, oʊ, aʊ/) — Highlights vowel combinations for clearer pronunciation',
    'Long vowel markers (:) — Marks extended vowel sounds so you pronounce them correctly',
    'TH / DH sound marks — Special marks for these tricky sounds that differ across dialects',
    'T-sound morph & Z-underline — Helps you understand subtle pronunciation changes in English',
    'Hidden phoneme superscripts — Shows every sound in a word, even silent or unclear ones',
  ];

  if (!auth.isLoggedIn || !auth.user) {
    return (
      <div className="opt-section">
        <div className="opt-signin-hero">
          <div className="opt-signin-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div>
            <h2>Sign In</h2>
            <p className="opt-section-desc">Sync settings across devices and unlock Pro features.</p>
          </div>
        </div>

        {error && <div className="opt-error">{error}</div>}

        <button className="opt-btn-google" onClick={handleGoogleLogin} disabled={loading}>
          {loading ? 'Signing in…' : (
            <>
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              Continue with Google
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="opt-section">
      <div className="opt-page-header">
        <h2>Account</h2>
        <p className="opt-section-desc">Settings sync across devices while signed in.</p>
      </div>

      {/* Profile */}
      <div className="opt-profile">
        <div className="opt-avatar-fallback" style={{ backgroundColor: getColorFromSource(auth.user.name, auth.user.email) }}>
          {getInitials(auth.user.name, auth.user.email)}
        </div>
        <div className="opt-profile-info">
          <strong>{auth.user.name}</strong>
          <span>{auth.user.email}</span>
        </div>
        <div className="opt-profile-actions">
          <span className={`opt-tier-badge opt-tier-${tier}`}>
            {tier === 'pro' ? '★ Pro' : 'Free'}
          </span>
          <button className="opt-btn-outline" onClick={handleLogout} disabled={loading}>
            {loading ? '…' : 'Sign out'}
          </button>
        </div>
      </div>

      {/* Billing */}
      {tier === 'pro' ? (
        <div className="opt-billing-card opt-billing-pro">
          <div className="opt-billing-header">
            <span className="opt-billing-dot" />
            <strong>Pro · Active</strong>
            <button className="opt-btn-sync" onClick={handleSyncTier} disabled={syncLoading} title="Refresh subscription status">
              {syncLoading ? '…' : '↻ Sync'}
            </button>
          </div>
          <p className="opt-billing-desc">You have access to all advanced pronunciation markers. Explore detailed phoneme breakdowns, stress patterns, vowel combinations, and special sound rules across all your reading. You're getting the complete language learning experience.</p>
          <button className="opt-btn-manage" onClick={handleManageBilling} disabled={billingLoading}>
            {billingLoading ? 'Opening…' : 'Manage Billing ↗'}
          </button>
        </div>
      ) : (
        <div className="opt-billing-card opt-billing-free">
          <div className="opt-billing-header">
            <strong>Upgrade to Pro</strong>
            <span className="opt-trial-badge">14-day free trial</span>
          </div>
          <p className="opt-billing-desc">See advanced pronunciation details including stress patterns, vowel combinations, and sound rules to master English pronunciation. Perfect for learners who want to understand exactly how to pronounce every word correctly.</p>
          <ul className="opt-pro-feature-list">
            {PRO_FEATURES.map(f => (
              <li key={f}><span className="opt-pro-check">✓</span> {f}</li>
            ))}
          </ul>
          <div className="opt-interval-toggle">
            <button
              className={`opt-interval-btn${interval === 'month' ? ' active' : ''}`}
              onClick={() => setInterval('month')}
            >
              <span className="opt-plan-label">Monthly</span>
              <span className="opt-plan-price">$3<small>/mo</small></span>
            </button>
            <button
              className={`opt-interval-btn${interval === 'year' ? ' active' : ''}`}
              onClick={() => setInterval('year')}
            >
              <span className="opt-plan-label">Yearly <span className="opt-save-badge">save 25%</span></span>
              <span className="opt-plan-price">$2.25<small>/mo</small></span>
            </button>
          </div>
          {interval === 'year' && <p className="opt-billed-note">Billed $27/year</p>}
          <button className="opt-btn-upgrade" onClick={handleUpgrade} disabled={billingLoading}>
            {billingLoading ? 'Opening checkout…' : 'Start free trial →'}
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Word preview renderer types, mappings & helpers ─── */
type Token = { phoneme: string | null; base: string | null; silent: boolean; ghost: boolean; stress: number };
type AlignedToken = Token & { char: string | null };

const VOWEL_COLORS: Record<string, string> = {
  AH: 'color_u_alt', AA: 'color_u_alt',
  AE: 'color_a',
  EH: 'color_e', ER: 'color_e',
  IH: 'color_i', IY: 'color_i',
  UH: 'color_u', UW: 'color_u',
  AO: 'color_o',
  AY: 'color_a', EY: 'color_e',
  OY: 'color_o', OW: 'color_o',
  AW: 'color_u_alt', AX: 'color_u_alt',
};

const ARPA_IPA: Record<string, string> = {
  IY: 'iː', IH: 'ɪ', EH: 'ɛ', AE: 'æ', AH: 'ʌ', AA: 'ɑː', AO: 'ɔː',
  UH: 'ʊ', UW: 'uː', ER: 'ɜː', AX: 'ə',
  AY: 'aɪ', EY: 'eɪ', OY: 'ɔɪ', AW: 'aʊ', OW: 'oʊ',
  P: 'p', B: 'b', T: 't', D: 'd', K: 'k', G: 'ɡ', F: 'f', V: 'v',
  TH: 'θ', DH: 'ð', S: 's', Z: 'z', SH: 'ʃ', ZH: 'ʒ',
  HH: 'h', M: 'm', N: 'n', NG: 'ŋ', L: 'l', R: 'r', W: 'w', Y: 'j',
  CH: 'tʃ', JH: 'dʒ', KW: 'kw', KS: 'ks', KSH: 'kʃ', KZ: 'kz',
  GZ: 'ɡz', GZH: 'ɡʒ', JHD: 'dʒ', CCC: 'k', HHH: 'h',
};

const ACUTE: Record<string, string> = {
  a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú', y: 'ý',
  A: 'Á', E: 'É', I: 'Í', O: 'Ó', U: 'Ú', Y: 'Ý',
};

const LONG_VOWELS = new Set(['IY', 'UW', 'ER', 'AO']);
const DIPH_SUPER: Record<string, string> = { AY: 'ᵃ', EY: 'ⁱ', OW: 'ᵘ', AW: 'ᵃ', OY: 'ᵒ' };
const TH_SUPER: Record<string, string> = { TH: 'ᵗ', DH: 'ᵈ' };

function parseArpabet(str: string): Token[] {
  return str.trim().split(/\s+/).map(raw => {
    if (raw === '-' || raw === '--') return { phoneme: null, base: null, silent: true, ghost: false, stress: 0 };
    if (raw.startsWith('+')) {
      const clean = raw.replace(/^\+/, '').replace(/^\.+/, '');
      const stress = parseInt(clean.match(/([012])$/)?.[1] ?? '0');
      const phoneme = clean.replace(/[012]$/, '');
      return { phoneme, base: phoneme.replace(/[^A-Z]/gi, '').toUpperCase(), silent: false, ghost: true, stress };
    }
    if (raw.startsWith('-r')) return { phoneme: null, base: null, silent: false, ghost: false, stress: 0 };
    const clean = raw.replace(/^\.+/, '');
    const stress = parseInt(clean.match(/([012])$/)?.[1] ?? '0');
    const phoneme = clean.replace(/[012]$/, '');
    return { phoneme, base: phoneme.replace(/[^A-Z]/gi, '').toUpperCase(), silent: false, ghost: false, stress };
  });
}

function alignWord(word: string, arpa: string): AlignedToken[] {
  const tokens = parseArpabet(arpa);
  const chars = [...word];
  const aligned: AlignedToken[] = [];
  let ci = 0;
  for (const t of tokens) {
    if (t.ghost) { aligned.push({ char: null, ...t }); }
    else { aligned.push({ char: chars[ci] || null, ...t }); ci++; }
  }
  for (let i = ci; i < chars.length; i++) {
    aligned.push({ char: chars[i], phoneme: null, base: null, silent: true, stress: 0, ghost: false });
  }
  return aligned;
}

function RenderedWord({ word, arpa, suffix }: { word: string; arpa: string; suffix?: string }) {
  const aligned = alignWord(word, arpa);
  return (
    <rp-w data-word={word} data-arpa={arpa} style={{ display: 'inline', float: 'none', pointerEvents: 'auto', cursor: 'pointer' }}>
      {aligned.map((item, index) => {
        const { char, base, silent, stress, ghost } = item;

        if (ghost) {
          if (base && ARPA_IPA[base]) {
            const ipaChar = ARPA_IPA[base];
            const gvc = VOWEL_COLORS[base];
            return (
              <rp-sup
                key={index}
                data-ghost="1"
                data-gvc={gvc}
                style={{
                  display: 'inline',
                  fontSize: '.48em',
                  verticalAlign: 'super',
                  opacity: 0.8,
                  marginLeft: '.5px',
                  lineHeight: 1,
                  color: 'var(--ipa-sup)',
                }}
              >
                {ipaChar}
              </rp-sup>
            );
          }
          return null;
        }

        const isFirst = index === 0 || aligned[index - 1]?.base !== base;
        const isLast = index === aligned.length - 1 || aligned[index + 1]?.base !== base;

        const sProps: Record<string, string> = {};
        if (silent) {
          if (arpa) sProps['data-silent'] = '1';
        } else if (base) {
          const vc = VOWEL_COLORS[base];
          if (vc) {
            sProps['data-vc'] = vc;
            if (stress === 1 && isFirst && char && ACUTE[char]) sProps['data-st'] = '1';
          }
          if (base === 'Z' || base === 'ZH') {
            sProps['data-zm'] = '1';
          }
        }

        return (
          <rp-s
            key={index}
            {...sProps}
            style={{ display: 'inline', float: 'none', transition: 'color 0.2s, opacity 0.2s' }}
          >
            {char ?? ''}
            {isLast && !silent && base && (
              <>
                {LONG_VOWELS.has(base) && (
                  <rp-c data-type="length" style={{ display: 'inline', opacity: 0.6, marginLeft: '1px', color: 'var(--ipa-sup)' }}>:</rp-c>
                )}
                {DIPH_SUPER[base] && (
                  <rp-sup data-type={base} style={{ display: 'inline', fontSize: '.48em', verticalAlign: 'super', opacity: 0.8, marginLeft: '.5px', lineHeight: 1, color: 'var(--ipa-sup)' }}>
                    {DIPH_SUPER[base]}
                  </rp-sup>
                )}
                {TH_SUPER[base] && (
                  <rp-sup data-type={base} style={{ display: 'inline', fontSize: '.48em', verticalAlign: 'super', opacity: 0.8, marginLeft: '.5px', lineHeight: 1, color: 'var(--ipa-sup)' }}>
                    {TH_SUPER[base]}
                  </rp-sup>
                )}
                {base === 'T' && char && !['t', 'T'].includes(char) && (
                  <rp-sup data-type="tmark" style={{ display: 'inline', fontSize: '.48em', verticalAlign: 'super', opacity: 0.8, marginLeft: '.5px', lineHeight: 1, color: 'var(--ipa-sup)' }}>ᵗ</rp-sup>
                )}
              </>
            )}
          </rp-s>
        );
      })}
      {suffix || null}
    </rp-w>
  );
}

/* ─── Sandbox Tab ─── */
interface SandboxToken {
  token: string;
  clean: string;
  word: string;
  arpa: string | null;
  isWord: boolean;
  suffix?: string;
  text?: string;
}

function guessPronunciationSandbox(word: string, dict: Record<string, string>, baseforms: Record<string, string> | null, depth = 0): string | null {
  if (depth > 2) return null;
  const w = word.toLowerCase();
  if (baseforms) {
    const base = baseforms[w];
    if (base && dict[base.toLowerCase()]) {
      return dict[base.toLowerCase()];
    }
  }
  const getStem = (s: string): string | null =>
    dict[s] ||
    (baseforms?.[s] && dict[baseforms[s].toLowerCase()]) ||
    guessPronunciationSandbox(s, dict, baseforms, depth + 1);

  if (w.endsWith('ization')) { const s = getStem(w.slice(0, -7) + 'ize'); if (s) return s.replace(/\s+-\s*$/, ' EY1 SH - AX0 N'); }
  if (w.endsWith('ation')) { const s = getStem(w.slice(0, -5) + 'ate'); if (s) return s.replace(/\s+-\s*$/, ' EY1 SH - AX0 N'); }
  if (w.endsWith('ing')) { const s = getStem(w.slice(0, -3) + 'e'); if (s) return s.replace(/\s+-\s*$/, ' IH0 NG -'); }
  if (w.endsWith('ed')) { const s = getStem(w.slice(0, -2) + 'e'); if (s) return s + ' D'; }
  if (w.endsWith('ies')) { const s = getStem(w.slice(0, -3) + 'y'); if (s) { const t = s.split(/\s+/); const l = t.pop(); return t.join(' ') + ' ' + l + ' - Z'; } }
  if (w.endsWith('ily')) { const s = getStem(w.slice(0, -3) + 'y'); if (s) { const t = s.split(/\s+/); const l = t.pop(); return t.join(' ') + ' ' + l + ' L IY0'; } }
  if (w.endsWith('able')) { const s = getStem(w.slice(0, -4) + 'e'); if (s) return s.replace(/\s+-\s*$/, ' AX0 B L -'); }
  if (w.endsWith('ible')) { const s = getStem(w.slice(0, -4) + 'e'); if (s) return s.replace(/\s+-\s*$/, ' IH0 B L -'); }
  
  const SUFFIXES = [
    { s: "'s", t: '- Z' }, { s: "'ve", t: '- V' }, { s: "'re", t: '- ER0' },
    { s: "'ll", t: '- L' }, { s: "'d", t: '- D' }, { s: "'m", t: 'M' }, { s: "'t", t: 'T' },
  ];
  const PREFIXES = [
    { p: 'un', t: 'AH0 N -' }, { p: 're', t: 'R IY0 -' }, { p: 'dis', t: 'D IH0 S -' },
    { p: 'pre', t: 'P R IY0 -' }, { p: 'non', t: 'N AA1 N -' }, { p: 'in', t: 'IH0 N -' },
  ];

  for (const suf of SUFFIXES) { if (w.endsWith(suf.s)) { const s = getStem(w.slice(0, -suf.s.length)); if (s) return s + ' ' + suf.t; } }
  for (const pre of PREFIXES) { if (w.startsWith(pre.p)) { const s = getStem(w.slice(pre.p.length)); if (s) return pre.t + ' ' + s; } }
  for (const pre of PREFIXES) {
    if (w.startsWith(pre.p)) {
      const rem = w.slice(pre.p.length);
      for (const suf of SUFFIXES) { if (rem.endsWith(suf.s)) { const s = getStem(rem.slice(0, -suf.s.length)); if (s) return pre.t + ' ' + s + ' ' + suf.t; } }
    }
  }
  return null;
}

function DictionaryTab() {
  const settings = useStorage(ipaSettingsStorage);
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<{
    tokens: SandboxToken[];
  } | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    setResult(null);
    setQuery('');
  }, [settings?.pronunciationDialect]);

  const loadDict = () => {};

  const handleQuery = async (val: string) => {
    setQuery(val);
    if (!val.trim()) { setResult(null); return; }
    try {
      const dialect = settings?.pronunciationDialect ?? 'nAmE';
      const enableBaseforms = true;

      const norm = val.replace(/[’ʼ]/g, "'");
      const tokens = norm.match(/[a-zA-Z']+|[^a-zA-Z']+/g) ?? [];

      const wordsToLookup = new Set<string>();
      for (const token of tokens) {
        if (/^[a-zA-Z']+$/i.test(token)) {
          const clean = token.replace(/^'+|'+$/g, '').toLowerCase();
          if (clean) {
            wordsToLookup.add(clean);
            if (clean.endsWith('ization')) wordsToLookup.add(clean.slice(0, -7) + 'ize');
            if (clean.endsWith('ation')) wordsToLookup.add(clean.slice(0, -5) + 'ate');
            if (clean.endsWith('ing')) wordsToLookup.add(clean.slice(0, -3) + 'e');
            if (clean.endsWith('ed')) wordsToLookup.add(clean.slice(0, -2) + 'e');
            if (clean.endsWith('ies')) wordsToLookup.add(clean.slice(0, -3) + 'y');
            if (clean.endsWith('ily')) wordsToLookup.add(clean.slice(0, -3) + 'y');
            if (clean.endsWith('able')) wordsToLookup.add(clean.slice(0, -4) + 'e');
            if (clean.endsWith('ible')) wordsToLookup.add(clean.slice(0, -4) + 'e');
            
            const SUFFIXES = [
              { s: "'s", t: '- Z' }, { s: "'ve", t: '- V' }, { s: "'re", t: '- ER0' },
              { s: "'ll", t: '- L' }, { s: "'d", t: '- D' }, { s: "'m", t: 'M' }, { s: "'t", t: 'T' },
            ];
            const PREFIXES = [
              { p: 'un', t: 'AH0 N -' }, { p: 're', t: 'R IY0 -' }, { p: 'dis', t: 'D IH0 S -' },
              { p: 'pre', t: 'P R IY0 -' }, { p: 'non', t: 'N AA1 N -' }, { p: 'in', t: 'IH0 N -' },
            ];
            for (const suf of SUFFIXES) { if (clean.endsWith(suf.s)) wordsToLookup.add(clean.slice(0, -suf.s.length)); }
            for (const pre of PREFIXES) {
              if (clean.startsWith(pre.p)) {
                const rem = clean.slice(pre.p.length);
                wordsToLookup.add(rem);
                for (const suf of SUFFIXES) { if (rem.endsWith(suf.s)) wordsToLookup.add(rem.slice(0, -suf.s.length)); }
              }
            }
          }
        }
      }

      const wordsArray = Array.from(wordsToLookup);
      let dictResult: Record<string, string> = {};
      let baseformsResult: Record<string, string> = {};

      if (wordsArray.length > 0) {
        const response = await chrome.runtime.sendMessage({
          type: 'DICT_LOOKUP',
          words: wordsArray,
          dialect,
          includeBaseforms: enableBaseforms
        });
        if (response && !response.error) {
          dictResult = response.dict || {};
          baseformsResult = response.baseforms || {};
        } else {
          setLoadError(true);
          return;
        }
      }

      const sandboxTokens: SandboxToken[] = [];
      for (const token of tokens) {
        if (!/^[a-zA-Z']+$/i.test(token)) {
          sandboxTokens.push({
            token,
            clean: '',
            word: '',
            arpa: null,
            isWord: false
          });
          continue;
        }

        const clean = token.replace(/^'+|'+$/g, '');
        const cleanLower = clean.toLowerCase();
        let arpa = clean ? (dictResult[cleanLower] ?? null) : null;
        let isBaseformFallback = false;
        let baseWordUsed = '';

        if (!arpa && clean && enableBaseforms && baseformsResult[cleanLower]) {
          const base = baseformsResult[cleanLower];
          const baseLower = base.toLowerCase();
          if (dictResult[baseLower]) {
            arpa = dictResult[baseLower];
            isBaseformFallback = true;
            baseWordUsed = base;
          }
        }

        if (!arpa && clean && (clean.length > 4 || clean.includes("'"))) {
          arpa = guessPronunciationSandbox(clean, dictResult, baseformsResult);
        }

        if (arpa) {
          if (clean.includes("'")) {
            const apostIdx = clean.indexOf("'");
            const base = clean.slice(0, apostIdx);
            const suffix = clean.slice(apostIdx);
            const baseArpa = (base && dictResult[base.toLowerCase()]) ?? arpa;
            sandboxTokens.push({
              token,
              clean,
              word: base || clean,
              arpa: baseArpa,
              isWord: true,
              suffix,
              text: isBaseformFallback ? `(baseform fallback: "${baseWordUsed}")` : undefined
            });
          } else {
            sandboxTokens.push({
              token,
              clean,
              word: isBaseformFallback ? baseWordUsed : clean,
              arpa,
              isWord: true,
              text: isBaseformFallback ? `(baseform fallback: "${baseWordUsed}")` : undefined
            });
          }
        } else {
          if (clean.includes("'")) {
            const apostIdx = clean.indexOf("'");
            const base = clean.slice(0, apostIdx);
            const suffix = clean.slice(apostIdx);
            if (base.length > 0) {
              let baseArpa = dictResult[base.toLowerCase()] ?? null;
              if (!baseArpa && base.length > 2 && base.endsWith('n')) {
                baseArpa = dictResult[base.slice(0, -1).toLowerCase()] ?? null;
              }
              if (baseArpa) {
                sandboxTokens.push({
                  token,
                  clean,
                  word: base,
                  arpa: baseArpa,
                  isWord: true,
                  suffix
                });
                continue;
              }
            }
          }

          sandboxTokens.push({
            token,
            clean,
            word: clean,
            arpa: null,
            isWord: true
          });
        }
      }

      setResult({
        tokens: sandboxTokens
      });
      setLoadError(false);
    } catch {
      setLoadError(true);
    }
  };

  if (!settings) return null;

  return (
    <div className="opt-section">
      <div className="opt-page-header">
        <h2>Pronunciation Sandbox</h2>
        <p className="opt-section-desc">Type or paste words, sentences, or paragraphs to preview pronunciation guide styling.</p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '20px', alignItems: 'center', background: 'var(--bg-card)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '14px', color: 'var(--text-3)' }}>Dialect / Accent:</label>
          <select
            className="opt-select"
            value={settings.pronunciationDialect ?? 'nAmE'}
            onChange={e => ipaSettingsStorage.setPronunciationDialect(e.target.value as 'nAmE' | 'brE')}
            style={{
              padding: '6px 12px',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            <option value="nAmE">American English (NAmE)</option>
            <option value="brE">British English (BrE)</option>
          </select>
        </div>
      </div>

      <div className="opt-sandbox-input-container" style={{ marginBottom: '20px' }}>
        <textarea
          className="opt-input"
          placeholder="Type or paste text here…"
          value={query}
          onChange={e => handleQuery(e.target.value)}
          onFocus={loadDict}
          autoComplete="off"
          spellCheck={false}
          style={{
            width: '100%',
            height: '110px',
            padding: '12px',
            fontSize: '16px',
            resize: 'vertical',
            fontFamily: 'inherit',
          }}
        />
      </div>

      {loadError && <div className="opt-dict-error">Failed to load dictionary file.</div>}

      {result && (
        <div 
          className="opt-sandbox-result"
          style={{ 
            background: 'var(--bg-deep)', 
            border: '1px solid var(--border)', 
            borderRadius: '12px', 
            padding: '20px', 
            minHeight: '100px',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)'
          }}
        >
          <h3 style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-3)', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
            Pronunciation Output
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', rowGap: '16px', columnGap: '2px', fontSize: '20px', color: 'var(--text)', lineHeight: '2' }}>
            {result.tokens.map((tok, idx) => {
              if (!tok.isWord) {
                return (
                  <span key={idx} style={{ whiteSpace: 'pre-wrap', color: '#777' }}>
                    {tok.token}
                  </span>
                );
              }
              
              const pre = tok.token.match(/^'+/)?.[0] ?? '';
              const post = tok.token.match(/'+$/)?.[0] ?? '';
              const mainWord = tok.word;

              return (
                <span 
                  key={idx} 
                  style={{ 
                    display: 'inline-flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    margin: '0 2px',
                    position: 'relative'
                  }}
                  title={tok.text ? `${tok.word} ${tok.text}` : tok.word}
                >
                  <span style={{ display: 'inline-block' }}>
                    {pre}
                    {tok.arpa ? (
                      <RenderedWord word={mainWord} arpa={tok.arpa} suffix={tok.suffix} />
                    ) : (
                      <span style={{ borderBottom: '1px dashed #555', color: '#ccc' }}>
                        {mainWord}{tok.suffix ?? ''}
                      </span>
                    )}
                    {post}
                  </span>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {!loadError && !query && (
        <p className="opt-dict-hint">Type any sentence to see word-by-word pronunciation highlights live.</p>
      )}
    </div>
  );
}

const IconAnki = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2z" />
    <path d="M12 7v10" />
    <path d="M8 12h8" />
  </svg>
);

// All supported template variables with labels
const TEMPLATE_VARS: { value: string; label: string; pro?: boolean }[] = [
  { value: '{{word}}',                  label: '{{word}} — Word' },
  { value: '{{word.phonetic}}',          label: '{{word.phonetic}} — IPA' },
  { value: '{{word.baseform}}',          label: '{{word.baseform}} — Base form' },
  { value: '{{word.parts-of-speech}}',   label: '{{word.parts-of-speech}} — Part of speech' },
  { value: '{{definitions}}',            label: '{{definitions}} — Definitions' },
  { value: '{{definitions.numbered}}',   label: '{{definitions.numbered}} — Numbered defs' },
  { value: '{{definitions.translated}}', label: '{{definitions.translated}} — Translated defs' },
  { value: '{{sentence}}',               label: '{{sentence}} — Context sentence' },
  { value: '{{sentence.phonetic}}',      label: '{{sentence.phonetic}} — Sentence IPA' },
  { value: '{{language}}',               label: '{{language}} — Language' },
  { value: '{{links}}',                  label: '{{links}} — External links' },
  { value: '{{word.audio}}',             label: '{{word.audio}} — Audio', pro: true },
  { value: '{{word.image}}',             label: '{{word.image}} — Image', pro: true },
  { value: '{{screenshot.video}}',       label: '{{screenshot.video}} — Video screenshot', pro: true },
  { value: '{{ai.text.definition}}',     label: '{{ai.text.definition}} — AI definition', pro: true },
  { value: '{{ai.word.image}}',          label: '{{ai.word.image}} — AI image', pro: true },
];

const getAutoMapping = (fieldName: string): string => {
  const n = fieldName.toLowerCase().trim().replace(/[-_+]/g, ' ');

  // Exact field matches first (common Anki note type naming)
  if (n === 'word' || n === 'vocabulary' || n === 'term' || n === 'expression') return '{{word}}';
  if (n === 'front') return '<h2>{{word}}</h2><br><i>{{word.phonetic}}</i>';
  if (n === 'back') return '{{definitions}}';
  if (n === 'ipa' || n === 'transcription' || n === 'phonetic' || n === 'pronunciation') return '{{word.phonetic}}';
  if (n === 'definition' || n === 'meaning' || n === 'translation') return '{{definitions}}';
  if (n === 'pos' || n === 'part of speech') return '{{word.parts-of-speech}}';
  if (n === 'context' || n === 'sentence' || n === 'example') return '{{sentence}}';
  if (n === 'audio') return '{{word.audio}}';
  if (n === 'image' || n === 'picture') return '{{word.image}}';

  // Substring matches (order matters — more specific first)
  if (n.includes('part') && n.includes('speech')) return '{{word.parts-of-speech}}';
  if (n.includes('phonetic') || n.includes('transcription') || n.includes('ipa') || n.includes('pronunciation')) return '{{word.phonetic}}';
  if (n.includes('definition') || n.includes('meaning')) return '{{definitions}}';
  if (n.includes('translation') || n.includes('translate')) return '{{definitions}}';
  if (n.includes('context') || n.includes('sentence') || n.includes('example')) return '{{sentence}}';
  if (n.includes('word') || n.includes('vocab') || n.includes('term')) return '{{word}}';
  if (n.includes('audio') || n.includes('sound')) return '{{word.audio}}';
  if (n.includes('image') || n.includes('picture') || n.includes('photo')) return '{{word.image}}';
  if (n.includes('additional') || n.includes('extra') || n.includes('note') || n.includes('remark')) return '';

  return '';
};

function AnkiTab() {
  const settings = useStorage(ipaSettingsStorage);
  const auth = useStorage(ipaAuthStorage);
  const [ankiTestStatus, setAnkiTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [decks, setDecks] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [modelFields, setModelFields] = useState<string[]>([]);
  const [queueCount, setQueueCount] = useState(0);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'done' | 'error'>('idle');
  const [syncResult, setSyncResult] = useState<string>('');

  if (!settings || !auth) return null;
  const tier = auth.user?.tier ?? 'free';
  const isPro = tier === 'pro';

  const fetchModelFields = async (modelName: string, forceReset = false) => {
    try {
      const url = settings?.ankiEndpoint || 'http://localhost:8765';
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'modelFieldNames',
          version: 6,
          params: { modelName }
        })
      });
      const data = await res.json();
      if (data.result) {
        const fields = data.result as string[];
        setModelFields(fields);

        // Always auto-map when switching model (forceReset) or for any missing/empty field
        const currentTemplates = forceReset ? {} : { ...(settings.ankiFieldTemplates || {}) };
        const newTemplates: Record<string, string> = { ...currentTemplates };
        fields.forEach(field => {
          if (forceReset || newTemplates[field] === undefined || newTemplates[field] === '') {
            newTemplates[field] = getAutoMapping(field);
          }
        });
        await ipaSettingsStorage.setAnkiFieldTemplates(newTemplates);
      }
    } catch (err) {
      console.error('Failed to fetch model fields', err);
    }
  };

  const testAnki = async () => {
    setAnkiTestStatus('testing');
    try {
      const url = settings?.ankiEndpoint || 'http://localhost:8765';
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'version', version: 6 })
      });
      if (res.ok) {
        setAnkiTestStatus('success');

        // Fetch decks
        const decksRes = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'deckNames', version: 6 })
        });
        const decksData = await decksRes.json();
        if (decksData.result) setDecks(decksData.result);

        // Fetch models
        const modelsRes = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'modelNames', version: 6 })
        });
        const modelsData = await modelsRes.json();
        if (modelsData.result) {
          setModels(modelsData.result);
          const currentModel = settings.ankiModelName || 'Basic';
          await fetchModelFields(currentModel);
        }
      } else {
        setAnkiTestStatus('error');
        setTimeout(() => setAnkiTestStatus('idle'), 3000);
      }
    } catch {
      setAnkiTestStatus('error');
      setTimeout(() => setAnkiTestStatus('idle'), 3000);
    }
  };

  useEffect(() => {
    if (settings.ankiEnabled) {
      testAnki();
    }
    // Load queue count on mount
    chrome.runtime.sendMessage({ type: 'ANKI_QUEUE_GET' }, (res: { queueSize?: number } | undefined) => {
      setQueueCount(res?.queueSize ?? 0);
    });
  }, []);

  const syncQueue = async () => {
    setSyncStatus('syncing');
    setSyncResult('');
    chrome.runtime.sendMessage({ type: 'ANKI_QUEUE_SYNC' }, (res: { ok?: boolean; synced?: number; remaining?: number; error?: string } | undefined) => {
      if (res?.ok) {
        setQueueCount(res.remaining ?? 0);
        setSyncStatus('done');
        setSyncResult(`✓ Synced ${res.synced} card${(res.synced ?? 0) !== 1 ? 's' : ''}${(res.remaining ?? 0) > 0 ? `, ${res.remaining} still pending` : ''}`);
      } else {
        setSyncStatus('error');
        setSyncResult(res?.error ?? 'Failed to sync');
      }
      setTimeout(() => { setSyncStatus('idle'); setSyncResult(''); }, 4000);
    });
  };

  return (
    <div className="opt-section">
      <div className="opt-page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2>Anki Integration</h2>
          {!isPro && <span className="opt-pro-badge">Pro</span>}
        </div>
        <p className="opt-section-desc">Sync saved words directly to your Anki desktop app.</p>
      </div>

      <div className="opt-card" style={{ opacity: !isPro ? 0.6 : 1, pointerEvents: !isPro ? 'none' : 'auto' }}>
        <div className="opt-card-row">
          <div>
            <label className="opt-card-label">AnkiConnect Sync</label>
            <p className="opt-card-sublabel">Enable "Save to Anki" button in tooltips</p>
          </div>
          <Switch
            checked={settings.ankiEnabled ?? true}
            onChange={v => ipaSettingsStorage.setAnkiEnabled(v)}
            disabled={!isPro}
          />
        </div>

        {(settings.ankiEnabled ?? true) && (
          <>
            <div className="opt-card-divider" />
            <div style={{ padding: '16px' }}>
              <label className="opt-card-label" style={{ display: 'block', marginBottom: '8px' }}>AnkiConnect Endpoint URL</label>
              <div style={{ display: 'flex', gap: '8px', width: '100%', marginBottom: '8px' }}>
                <input
                  type="text"
                  className="opt-input"
                  style={{ flex: 1 }}
                  value={settings.ankiEndpoint ?? 'http://localhost:8765'}
                  onChange={e => {
                    ipaSettingsStorage.setAnkiEndpoint(e.target.value);
                    setAnkiTestStatus('idle');
                  }}
                  disabled={!isPro}
                />
                <button
                  onClick={testAnki}
                  disabled={!isPro || ankiTestStatus === 'testing'}
                  style={{
                    padding: '0 12px',
                    background: ankiTestStatus === 'success' ? '#2e7d32' : ankiTestStatus === 'error' ? '#bf360c' : '#e8a351',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '.8rem',
                    opacity: (!isPro || ankiTestStatus === 'testing') ? 0.7 : 1
                  }}
                >
                  {ankiTestStatus === 'testing' ? 'Connecting...' : ankiTestStatus === 'success' ? 'Connected' : ankiTestStatus === 'error' ? 'Check Connection' : 'Connect'}
                </button>
              </div>
              <small style={{ color: '#8c887a' }}>Default is http://localhost:8765. Make sure Anki is open and AnkiConnect is installed.</small>
            </div>

            <div className="opt-card-divider" />
            <div style={{ padding: '16px' }}>
              <div style={{ marginBottom: '12px' }}>
                <label className="opt-card-label" style={{ display: 'block', marginBottom: '4px' }}>Anki - Deck Name</label>
                <select
                  className="opt-input"
                  style={{ width: '100%', background: '#1a1a1a', color: '#fff' }}
                  value={settings.ankiDeckName ?? 'Lumen Pronunciation'}
                  onChange={e => ipaSettingsStorage.setAnkiDeckName(e.target.value)}
                  disabled={!isPro}
                >
                  {decks.length > 0 ? (
                    decks.map(d => <option key={d} value={d}>{d}</option>)
                  ) : (
                    <option value={settings.ankiDeckName ?? 'Lumen Pronunciation'}>{settings.ankiDeckName ?? 'Lumen Pronunciation'}</option>
                  )}
                </select>
              </div>

              <div>
                <label className="opt-card-label" style={{ display: 'block', marginBottom: '4px' }}>Anki - Note Type</label>
                <select
                  className="opt-input"
                  style={{ width: '100%', background: '#1a1a1a', color: '#fff' }}
                  value={settings.ankiModelName ?? 'Basic'}
                  onChange={async e => {
                    const modelName = e.target.value;
                    await ipaSettingsStorage.setAnkiModelName(modelName);
                    // forceReset=true so templates auto-update for the new model
                    await fetchModelFields(modelName, true);
                  }}
                  disabled={!isPro}
                >
                  {models.length > 0 ? (
                    models.map(m => <option key={m} value={m}>{m}</option>)
                  ) : (
                    <option value={settings.ankiModelName ?? 'Basic'}>{settings.ankiModelName ?? 'Basic'}</option>
                  )}
                </select>
              </div>
            </div>

            <div className="opt-card-divider" />
            <div style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <label className="opt-card-label" style={{ display: 'block', marginBottom: '2px' }}>Allow Duplicate Cards</label>
                <small style={{ color: '#8c887a' }}>Force save words to Anki even if they already exist in the deck.</small>
              </div>
              <Switch
                checked={settings.ankiAllowDuplicate ?? false}
                onChange={v => ipaSettingsStorage.setAnkiAllowDuplicate(v)}
                disabled={!isPro}
              />
            </div>

            <div className="opt-card-divider" />
            <div style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div>
                  <label className="opt-card-label" style={{ display: 'block', marginBottom: '2px' }}>
                    Offline Queue
                    {queueCount > 0 && (
                      <span style={{
                        marginLeft: '8px',
                        background: '#e8a351',
                        color: '#1a1915',
                        borderRadius: '10px',
                        padding: '1px 7px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        verticalAlign: 'middle',
                      }}>
                        {queueCount} pending
                      </span>
                    )}
                  </label>
                  <small style={{ color: '#8c887a' }}>Save words to a local queue when Anki is offline. They sync automatically when Anki reconnects.</small>
                </div>
                <Switch
                  checked={settings.ankiOfflineEnabled ?? true}
                  onChange={v => ipaSettingsStorage.setAnkiOfflineEnabled(v)}
                  disabled={!isPro}
                />
              </div>
              {(settings.ankiOfflineEnabled ?? true) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    onClick={syncQueue}
                    disabled={!isPro || syncStatus === 'syncing' || queueCount === 0}
                    style={{
                      padding: '6px 14px',
                      background: syncStatus === 'done' ? '#2e7d32' : syncStatus === 'error' ? '#bf360c' : '#3e3c33',
                      color: syncStatus === 'done' || syncStatus === 'error' ? '#fff' : '#e8a351',
                      border: `1px solid ${syncStatus === 'done' ? '#2e7d32' : syncStatus === 'error' ? '#bf360c' : '#e8a351'}`,
                      borderRadius: '6px',
                      cursor: !isPro || syncStatus === 'syncing' || queueCount === 0 ? 'not-allowed' : 'pointer',
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      opacity: !isPro || queueCount === 0 ? 0.5 : 1,
                      transition: 'all .2s',
                    }}
                  >
                    {syncStatus === 'syncing' ? '⟳ Syncing…' : syncStatus === 'done' ? '✓ Synced' : syncStatus === 'error' ? '✗ Failed' : `↑ Sync Queue (${queueCount})`}
                  </button>
                  {syncResult && (
                    <small style={{ color: syncStatus === 'error' ? '#e34d52' : '#a3e851' }}>{syncResult}</small>
                  )}
                  {queueCount === 0 && syncStatus === 'idle' && (
                    <small style={{ color: '#8c887a' }}>Queue is empty</small>
                  )}
                </div>
              )}
            </div>

            <div className="opt-card-divider" />
            <div style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div>
                  <label className="opt-card-label" style={{ display: 'block', marginBottom: '2px' }}>Card Field Mapping</label>
                  <small style={{ color: '#8c887a' }}>
                    {modelFields.length > 0
                      ? <><span>Each field in </span><strong style={{ color: '#e8a351' }}>{settings.ankiModelName || 'Basic'}</strong><span> mapped to a Lumen variable.</span></>
                      : 'Connect to Anki first to load fields automatically.'}
                  </small>
                </div>
                {modelFields.length > 0 && (
                  <button
                    onClick={async () => { await fetchModelFields(settings.ankiModelName || 'Basic', true); }}
                    disabled={!isPro}
                    title="Re-run auto-mapping for all fields"
                    style={{
                      padding: '4px 10px', background: 'none',
                      border: '1px solid #3e3c33', borderRadius: '6px',
                      color: '#e8a351', fontSize: '0.75rem', cursor: 'pointer',
                      whiteSpace: 'nowrap', opacity: !isPro ? 0.5 : 1,
                    }}
                  >
                    ↺ Auto-map all
                  </button>
                )}
              </div>

              {modelFields.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {modelFields.map(field => {
                    const currentVal = settings.ankiFieldTemplates?.[field] ?? '';
                    const autoVal = getAutoMapping(field);
                    return (
                      <div key={field} style={{ background: '#1a1915', border: '1px solid #2e2c28', borderRadius: '10px', padding: '12px', position: 'relative' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fdfbf6', letterSpacing: '.02em' }}>{field}</span>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            {autoVal && currentVal !== autoVal && (
                              <button
                                onClick={async () => {
                                  const t = { ...(settings.ankiFieldTemplates ?? {}), [field]: autoVal };
                                  await ipaSettingsStorage.setAnkiFieldTemplates(t);
                                }}
                                disabled={!isPro}
                                title="Use suggested mapping"
                                style={{ padding: '2px 8px', background: 'none', border: '1px solid #3e3c33', borderRadius: '4px', color: '#8c887a', fontSize: '0.7rem', cursor: 'pointer' }}
                              >
                                Use suggested: <code style={{ color: '#e8a351' }}>{autoVal}</code>
                              </button>
                            )}
                            {currentVal && (
                              <button
                                onClick={async () => {
                                  const t = { ...(settings.ankiFieldTemplates ?? {}), [field]: '' };
                                  await ipaSettingsStorage.setAnkiFieldTemplates(t);
                                }}
                                disabled={!isPro}
                                title="Clear this field"
                                style={{ padding: '2px 6px', background: 'none', border: '1px solid #3e3c33', borderRadius: '4px', color: '#666', fontSize: '0.7rem', cursor: 'pointer' }}
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Quick-pick variable pills */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                          {TEMPLATE_VARS.map(v => (
                            <button
                              key={v.value}
                              onClick={async () => {
                                if (!isPro) return;
                                const t = { ...(settings.ankiFieldTemplates ?? {}), [field]: v.value };
                                await ipaSettingsStorage.setAnkiFieldTemplates(t);
                              }}
                              disabled={!isPro}
                              title={v.label}
                              style={{
                                padding: '2px 8px',
                                borderRadius: '12px',
                                border: 'none',
                                fontSize: '0.68rem',
                                fontFamily: 'monospace',
                                cursor: isPro ? 'pointer' : 'not-allowed',
                                fontWeight: currentVal === v.value ? 700 : 400,
                                background: currentVal === v.value
                                  ? '#e8a351'
                                  : v.pro ? '#2a2218' : '#2e2c28',
                                color: currentVal === v.value
                                  ? '#1a1915'
                                  : v.pro ? '#b07830' : '#c7c3b5',
                                outline: currentVal === v.value ? '2px solid #e8a351' : 'none',
                                transition: 'all .15s',
                              }}
                            >
                              {v.value}
                            </button>
                          ))}
                        </div>

                        {/* Custom textarea for advanced templates */}
                        <textarea
                          className="opt-input"
                          rows={currentVal.includes('<') || currentVal.length > 30 ? 3 : 1}
                          placeholder={autoVal ? `Suggested: ${autoVal}` : 'Leave empty to skip this field'}
                          style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.78rem', padding: '6px 8px', resize: 'vertical', background: '#111', color: currentVal ? '#fdfbf6' : '#555' }}
                          value={currentVal}
                          onChange={async e => {
                            const t = { ...(settings.ankiFieldTemplates ?? {}), [field]: e.target.value };
                            await ipaSettingsStorage.setAnkiFieldTemplates(t);
                          }}
                          disabled={!isPro}
                        />
                        {!currentVal && autoVal && (
                          <small style={{ color: '#666', fontSize: '0.68rem' }}>⚠ Empty — click a variable above or this field will be blank in Anki</small>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ background: '#1a1915', border: '1px dashed #3e3c33', borderRadius: '10px', padding: '20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>🔌</div>
                  <p style={{ color: '#8c887a', fontSize: '0.85rem', margin: 0 }}>Connect to Anki and click <strong style={{ color: '#e8a351' }}>Connect</strong> above to load note type fields automatically.</p>
                </div>
              )}

              {/* Collapsible variables reference */}
              <details style={{ marginTop: '12px' }}>
                <summary style={{ color: '#8c887a', fontSize: '0.78rem', cursor: 'pointer', userSelect: 'none', listStyle: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.7rem' }}>▶</span> All supported variables reference
                </summary>
                <div style={{ background: '#1e1d1a', padding: '10px 12px', borderRadius: '6px', fontSize: '0.78rem', marginTop: '8px', lineHeight: 1.7 }}>
                  {TEMPLATE_VARS.filter(v => !v.pro).map(v => (
                    <div key={v.value}><code style={{ color: '#e8a351' }}>{v.value}</code> <span style={{ color: '#8c887a' }}>— {v.label.split(' — ')[1]}</span></div>
                  ))}
                  <div style={{ color: '#b07830', marginTop: '8px', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '.05em' }}>Pro / AI (placeholders)</div>
                  {TEMPLATE_VARS.filter(v => v.pro).map(v => (
                    <div key={v.value}><code style={{ color: '#b07830' }}>{v.value}</code> <span style={{ color: '#6a6660' }}>— {v.label.split(' — ')[1]}</span></div>
                  ))}
                </div>
              </details>

              <div style={{ marginTop: '12px', textAlign: 'right' }}>
                <button
                  style={{
                    fontSize: '0.8rem',
                    padding: '6px 12px',
                    background: 'transparent',
                    color: '#8c887a',
                    border: '1px solid #444',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    opacity: !isPro ? 0.5 : 1
                  }}
                  onClick={async () => {
                    await ipaSettingsStorage.setAnkiEnabled(true);
                    await ipaSettingsStorage.setAnkiEndpoint('http://localhost:8765');
                    await ipaSettingsStorage.setAnkiFrontTemplate('<h2>{{word}}</h2><br><i>{{word.phonetic}}</i>');
                    await ipaSettingsStorage.setAnkiBackTemplate('{{definitions}}');
                    await ipaSettingsStorage.setAnkiFieldTemplates({});
                    await ipaSettingsStorage.setAnkiAllowDuplicate(false);
                    setAnkiTestStatus('idle');
                  }}
                  disabled={!isPro}
                >
                  Reset to Default
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {!isPro && (
        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <button className="opt-btn-upgrade" onClick={() => ipaAuthStorage.openCheckout('year')}>
            Upgrade to Pro to unlock Anki Sync →
          </button>
        </div>
      )}
    </div>
  );
}

const IconKeyboard = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
    <path d="M6 8h.01" />
    <path d="M10 8h.01" />
    <path d="M14 8h.01" />
    <path d="M18 8h.01" />
    <path d="M6 12h.01" />
    <path d="M10 12h.01" />
    <path d="M14 12h.01" />
    <path d="M18 12h.01" />
    <path d="M7 16h10" />
  </svg>
);

function getDisplayKey(shortcutStr: string) {
  if (!shortcutStr) return '';

  const ctrl = shortcutStr.includes('Ctrl+');
  const alt = shortcutStr.includes('Alt+');
  const shift = shortcutStr.includes('Shift+');
  const meta = shortcutStr.includes('Meta+');

  let mainKey = shortcutStr;
  if (ctrl) mainKey = mainKey.replace('Ctrl+', '');
  if (alt) mainKey = mainKey.replace('Alt+', '');
  if (shift) mainKey = mainKey.replace('Shift+', '');
  if (meta) mainKey = mainKey.replace('Meta+', '');

  let displayMain = mainKey;
  if (mainKey === ' ') displayMain = 'Space';
  else if (mainKey === 'ArrowLeft') displayMain = '← (Left Arrow)';
  else if (mainKey === 'ArrowRight') displayMain = '→ (Right Arrow)';
  else if (mainKey === 'ArrowUp') displayMain = '↑ (Up Arrow)';
  else if (mainKey === 'ArrowDown') displayMain = '↓ (Down Arrow)';
  else if (mainKey.length === 1) displayMain = mainKey.toUpperCase();

  const parts: string[] = [];
  if (ctrl) parts.push('Ctrl');
  if (alt) parts.push('Alt');
  if (shift) parts.push('Shift');
  if (meta) parts.push('Meta');
  parts.push(displayMain);

  return parts.join(' + ');
}

function ShortcutInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [tempKeys, setTempKeys] = useState<string>('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.key === 'Escape') {
      setIsRecording(false);
      e.currentTarget.blur();
      return;
    }

    const mods: string[] = [];
    if (e.ctrlKey) mods.push('Ctrl');
    if (e.altKey) mods.push('Alt');
    if (e.shiftKey) mods.push('Shift');
    if (e.metaKey) mods.push('Meta');

    const isModOnly = ['Control', 'Shift', 'Alt', 'Meta'].includes(e.key);

    if (isModOnly) {
      if (mods.length > 0) {
        setTempKeys(mods.join('+') + '+...');
      } else {
        setTempKeys('Press keys...');
      }
      return;
    }

    const mainKey = e.key;
    const finalShortcut = mods.length > 0 ? [...mods, mainKey].join('+') : mainKey;

    onChange(finalShortcut);
    setIsRecording(false);
    e.currentTarget.blur();
  };

  const handleFocus = () => {
    setIsRecording(true);
    setTempKeys('Press keys...');
  };

  const handleBlur = () => {
    setIsRecording(false);
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      <label className="opt-card-label" style={{ display: 'block', marginBottom: '8px' }}>
        {label}
      </label>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          type="text"
          className="opt-input"
          style={{
            width: '100%',
            background: 'var(--bg-deep)',
            color: isRecording ? 'var(--primary-lt)' : 'var(--text)',
            borderColor: isRecording ? 'var(--primary)' : 'var(--border-lt)',
            caretColor: 'transparent',
            cursor: 'pointer',
            textAlign: 'center',
            fontWeight: 'bold',
            fontSize: '15px',
            letterSpacing: '0.5px',
          }}
          value={isRecording ? tempKeys : getDisplayKey(value)}
          readOnly
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
        />
        {isRecording && (
          <span 
            style={{ 
              position: 'absolute', 
              right: '12px', 
              fontSize: '11px', 
              color: 'var(--primary-lt)', 
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            Recording
          </span>
        )}
      </div>
    </div>
  );
}

function ShortcutsTab() {
  const settings = useStorage(ipaSettingsStorage);

  if (!settings) return null;

  const shortcuts = settings.shortcuts ?? { rewind: 'a', forward: 'd', playPause: 's' };

  const updateShortcut = (key: keyof typeof shortcuts, val: string) => {
    ipaSettingsStorage.setShortcuts({ ...shortcuts, [key]: val });
  };

  return (
    <div className="opt-section">
      <div className="opt-page-header">
        <h2>Video Shortcuts</h2>
        <p className="opt-section-desc">Configure keyboard shortcuts for video playback control.</p>
      </div>

      <div className="opt-card">
        <div style={{ padding: '20px' }}>
          <ShortcutInput
            label="Rewind (10s)"
            value={shortcuts.rewind}
            onChange={val => updateShortcut('rewind', val)}
          />
          <ShortcutInput
            label="Forward (10s)"
            value={shortcuts.forward}
            onChange={val => updateShortcut('forward', val)}
          />
          <ShortcutInput
            label="Play / Pause"
            value={shortcuts.playPause}
            onChange={val => updateShortcut('playPause', val)}
          />
        </div>
      </div>
    </div>
  );
}

/* ─── Nav ─── */
const NAV: { id: Tab; label: string; icon: ReactNode }[] = [
  { id: 'settings', label: 'Settings', icon: <IconSettings /> },
  { id: 'translation', label: 'Translation', icon: <IconGlobe /> },
  { id: 'account', label: 'Account', icon: <IconUser /> },
  { id: 'sandbox', label: 'Sandbox', icon: <IconBook /> },
  { id: 'anki', label: 'Anki Sync', icon: <IconAnki /> },
  { id: 'shortcuts', label: 'Shortcuts', icon: <IconKeyboard /> },
];

const Options = () => {
  const [tab, setTab] = useState<Tab>('settings');
  const settings = useStorage(ipaSettingsStorage);

  useEffect(() => {
    if (!settings?.opts) return;
    const b = document.body;
    const map: [keyof IpaOpts, string][] = [
      ['silent', 'ipa-silent'],
      ['color_e', 'ipa-color-e'],
      ['color_i', 'ipa-color-i'],
      ['color_u_alt', 'ipa-color-u-alt'],
      ['color_a', 'ipa-color-a'],
      ['color_u', 'ipa-color-u'],
      ['color_o', 'ipa-color-o'],
      ['stress', 'ipa-st'],
      ['length', 'ipa-length'],
      ['diph_ai', 'ipa-diph-ai'],
      ['diph_ei_oi', 'ipa-diph-ei-oi'],
      ['diph_ou_au', 'ipa-diph-ou-au'],
      ['th_t', 'ipa-th-t'],
      ['th_d', 'ipa-th-d'],
      ['tmark', 'ipa-tmark'],
      ['zmark', 'ipa-zmark'],
      ['phonemes', 'ipa-phonemes'],
    ];
    for (const [key, cls] of map) {
      b.classList.toggle(cls, !!settings.opts[key]);
    }
  }, [settings?.opts]);

  return (
    <div className="opt-app">
      <div className="opt-sidebar">
        <div className="opt-logo">
          <div className="opt-logo-icon">
            <img src={chrome.runtime.getURL('icon-128.png')} alt="Logo" style={{ width: 24, height: 24, borderRadius: 6, display: 'block' }} />
          </div>
          <div className="opt-logo-text">
            <span className="opt-logo-name">Lumen</span>
            <span className="opt-logo-sub">Pronunciation</span>
          </div>
        </div>

        <nav>
          {NAV.map(n => (
            <button
              key={n.id}
              className={tab === n.id ? 'active' : ''}
              onClick={() => setTab(n.id)}
            >
              {n.icon}
              {n.label}
            </button>
          ))}
        </nav>

        <div className="opt-sidebar-footer">
          <span>v1.0 · Lumen</span>
        </div>
      </div>

      <div className="opt-content">
        {tab === 'settings' && <SettingsTab />}
        {tab === 'translation' && <TranslationTab />}
        {tab === 'account' && <AccountTab />}
        {tab === 'sandbox' && <DictionaryTab />}
        {tab === 'anki' && <AnkiTab />}
        {tab === 'shortcuts' && <ShortcutsTab />}
      </div>
    </div>
  );
};

export default withErrorBoundary(withSuspense(Options, <LoadingSpinner />), ErrorDisplay);
