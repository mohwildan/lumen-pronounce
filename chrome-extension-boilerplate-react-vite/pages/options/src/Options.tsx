import { useEffect, useState, type ReactNode } from 'react';
import '@src/Options.css';
import { useStorage, withErrorBoundary, withSuspense } from '@extension/shared';
import { ipaSettingsStorage, ipaAuthStorage } from '@extension/storage';
import type { IpaOpts } from '@extension/storage';
import { ErrorDisplay, LoadingSpinner } from '@extension/ui';

type Tab = 'settings' | 'translation' | 'account' | 'dictionary' | 'anki' | 'shortcuts';

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
  const [testWord, setTestWord] = useState('');
  const [testSentence, setTestSentence] = useState('');
  const [wordResult, setWordResult] = useState('');
  const [sentenceResult, setSentenceResult] = useState('');
  const [loading, setLoading] = useState<'word' | 'sentence' | null>(null);

  if (!settings) return null;
  const lang = settings.targetLanguage ?? 'none';

  const translateText = async (text: string, type: 'word' | 'sentence') => {
    if (!text.trim() || lang === 'none') return;
    setLoading(type);
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${encodeURIComponent(lang)}&dt=t&q=${encodeURIComponent(text)}`;
      const r = await fetch(url);
      const data = await r.json() as unknown[][];
      const result = (data[0] as unknown[][])?.map((c: unknown[]) => c[0]).filter(Boolean).join('') ?? '';
      if (type === 'word') setWordResult(result);
      else setSentenceResult(result);
    } catch {
      if (type === 'word') setWordResult('Translation failed.');
      else setSentenceResult('Translation failed.');
    }
    setLoading(null);
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
            <div className="opt-trans-test-card">
              <label className="opt-trans-test-label">Word</label>
              <div className="opt-trans-input-row">
                <input
                  className="opt-input"
                  placeholder="e.g. pronunciation"
                  value={testWord}
                  onChange={e => { setTestWord(e.target.value); setWordResult(''); }}
                  onKeyDown={e => e.key === 'Enter' && translateText(testWord.trim(), 'word')}
                />
                <button
                  className="opt-btn-trans"
                  disabled={!testWord.trim() || loading === 'word'}
                  onClick={() => translateText(testWord.trim(), 'word')}
                >
                  {loading === 'word' ? '…' : 'Go'}
                </button>
              </div>
              {wordResult && <div className="opt-trans-result">{wordResult}</div>}
            </div>

            <div className="opt-trans-test-card">
              <label className="opt-trans-test-label">Sentence</label>
              <div className="opt-trans-input-row">
                <input
                  className="opt-input"
                  placeholder="e.g. The quick brown fox"
                  value={testSentence}
                  onChange={e => { setTestSentence(e.target.value); setSentenceResult(''); }}
                  onKeyDown={e => e.key === 'Enter' && translateText(testSentence.trim(), 'sentence')}
                />
                <button
                  className="opt-btn-trans"
                  disabled={!testSentence.trim() || loading === 'sentence'}
                  onClick={() => translateText(testSentence.trim(), 'sentence')}
                >
                  {loading === 'sentence' ? '…' : 'Go'}
                </button>
              </div>
              {sentenceResult && <div className="opt-trans-result">{sentenceResult}</div>}
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
    'Stress accents on vowels',
    'Diphthong markers /aɪ, eɪ, ɔɪ, oʊ, aʊ/',
    'Long vowel markers (:)',
    'TH / DH sound marks',
    'T-sound morph & Z-underline',
    'Hidden phoneme superscripts',
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
          <p className="opt-billing-desc">All phoneme markers are unlocked.</p>
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
          <p className="opt-billing-desc">Unlock all phoneme markers to see every sound pattern in English text.</p>
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
              Monthly · $4
            </button>
            <button
              className={`opt-interval-btn${interval === 'year' ? ' active' : ''}`}
              onClick={() => setInterval('year')}
            >
              Yearly · $36 <span className="opt-save-badge">save 25%</span>
            </button>
          </div>
          <button className="opt-btn-upgrade" onClick={handleUpgrade} disabled={billingLoading}>
            {billingLoading ? 'Opening checkout…' : 'Start free trial →'}
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Dictionary Tab ─── */
function DictionaryTab() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<{ text: string; hit: boolean } | null>(null);
  const [dict, setDict] = useState<Record<string, string> | null>(null);
  const [loadError, setLoadError] = useState(false);

  const loadDict = async () => {
    if (dict) return;
    try {
      const r = await fetch(chrome.runtime.getURL('pronunciation.json'));
      const data = await r.json() as Record<string, string>;
      setDict(data);
    } catch {
      setLoadError(true);
    }
  };

  const handleQuery = async (val: string) => {
    setQuery(val);
    if (!val.trim()) { setResult(null); return; }
    if (!dict) { await loadDict(); return; }
    const word = val.trim().toLowerCase();
    const entry = dict[word];
    setResult(entry
      ? { text: `/${entry}/`, hit: true }
      : { text: `"${word}" not found in dictionary`, hit: false }
    );
  };

  return (
    <div className="opt-section">
      <div className="opt-page-header">
        <h2>Dictionary</h2>
        <p className="opt-section-desc">Look up any English word's ARPAbet pronunciation.</p>
      </div>

      <div className="opt-dict-search">
        <input
          className="opt-input opt-dict-input"
          type="text"
          placeholder="Type a word…"
          value={query}
          onChange={e => handleQuery(e.target.value)}
          onFocus={loadDict}
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      {loadError && <div className="opt-dict-error">Failed to load dictionary file.</div>}

      {result && (
        <div className={`opt-dict-result${result.hit ? ' opt-dict-hit' : ' opt-dict-miss'}`}>
          {result.hit && <span className="opt-dict-word">{query.trim().toLowerCase()}</span>}
          <span>{result.text}</span>
        </div>
      )}

      {!dict && !loadError && !query && (
        <p className="opt-dict-hint">~134K words · ARPAbet phoneme notation</p>
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

function AnkiTab() {
  const settings = useStorage(ipaSettingsStorage);
  const auth = useStorage(ipaAuthStorage);
  const [ankiTestStatus, setAnkiTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [decks, setDecks] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);

  if (!settings || !auth) return null;
  const tier = auth.user?.tier ?? 'free';
  const isPro = tier === 'pro';

  const testAnki = async () => {
    setAnkiTestStatus('testing');
    try {
      const url = settings?.ankiEndpoint || 'http://localhost:8765';
      const res = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({ action: 'version', version: 6 })
      });
      if (res.ok) {
        setAnkiTestStatus('success');

        // Fetch decks
        const decksRes = await fetch(url, {
          method: 'POST',
          body: JSON.stringify({ action: 'deckNames', version: 6 })
        });
        const decksData = await decksRes.json();
        if (decksData.result) setDecks(decksData.result);

        // Fetch models
        const modelsRes = await fetch(url, {
          method: 'POST',
          body: JSON.stringify({ action: 'modelNames', version: 6 })
        });
        const modelsData = await modelsRes.json();
        if (modelsData.result) setModels(modelsData.result);
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
  }, []);

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
                    
                    // Fetch template for this model
                    try {
                      const url = settings.ankiEndpoint || 'http://localhost:8765';
                      const res = await fetch(url, {
                        method: 'POST',
                        body: JSON.stringify({
                          action: 'modelTemplates',
                          version: 6,
                          params: { modelName }
                        })
                      });
                      const data = await res.json();
                      if (data.result) {
                        // Get the first card template
                        const cardNames = Object.keys(data.result);
                        if (cardNames.length > 0) {
                          const firstCard = data.result[cardNames[0]];
                          if (firstCard) {
                            await ipaSettingsStorage.setAnkiFrontTemplate(firstCard.Front);
                            await ipaSettingsStorage.setAnkiBackTemplate(firstCard.Back);
                          }
                        }
                      }
                    } catch (err) {
                      console.error('Failed to fetch model template', err);
                    }
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
            <div style={{ padding: '16px' }}>
              <label className="opt-card-label" style={{ display: 'block', marginBottom: '8px' }}>Card Templates</label>

              <div style={{ marginBottom: '12px' }}>
                <label className="opt-row-name" style={{ fontSize: '0.85rem', marginBottom: '4px', display: 'block' }}>Front Template</label>
                <textarea
                  className="opt-input"
                  style={{ width: '100%', minHeight: '50px', fontFamily: 'monospace', padding: '8px' }}
                  value={settings.ankiFrontTemplate ?? '<h2>{{word}}</h2><br><i>{{word.phonetic}}</i>'}
                  onChange={e => ipaSettingsStorage.setAnkiFrontTemplate(e.target.value)}
                  disabled={!isPro}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label className="opt-row-name" style={{ fontSize: '0.85rem', marginBottom: '4px', display: 'block' }}>Back Template</label>
                <textarea
                  className="opt-input"
                  style={{ width: '100%', minHeight: '70px', fontFamily: 'monospace', padding: '8px' }}
                  value={settings.ankiBackTemplate ?? '{{definitions}}'}
                  onChange={e => ipaSettingsStorage.setAnkiBackTemplate(e.target.value)}
                  disabled={!isPro}
                />
              </div>

              <div style={{ background: '#1e1d1a', padding: '10px', borderRadius: '4px', fontSize: '0.8rem' }}>
                <strong style={{ color: '#e8a351', display: 'block', marginBottom: '4px' }}>Supported Variables:</strong>
                <div style={{ color: '#8c887a', lineHeight: '1.4' }}>
                  <code>{"{{word}}"}</code> - Word or phrasal noun/verb<br />
                  <code>{"{{word.phonetic}}"}</code> - Phonetic pronunciation (IPA)<br />
                  <code>{"{{word.baseform}}"}</code> - Base form of a word<br />
                  <code>{"{{word.parts-of-speech}}"}</code> - Parts of speech<br />
                  <code>{"{{language}}"}</code> - Language of a word (e.g., English)<br />
                  <code>{"{{definitions}}"}</code> - List of definitions<br />
                  <code>{"{{definitions.numbered}}"}</code> - Numbered list of definitions<br />
                  <code>{"{{definitions.translated}}"}</code> - Translated definitions<br />
                  <code>{"{{sentence}}"}</code> - Sentence in which word was encountered<br />
                  <code>{"{{sentence.phonetic}}"}</code> - Phonetic pronunciation of sentence<br />
                  <code>{"{{links}}"}</code> - List of external links<br />
                  <div style={{ color: '#e8a351', marginTop: '6px', marginBottom: '2px' }}><strong>Pro / AI Features (Placeholders):</strong></div>
                  <code>{"{{word.audio}}"}</code> - Audio pronunciation<br />
                  <code>{"{{word.image}}"}</code> - Image of a word<br />
                  <code>{"{{screenshot.video}}"}</code> - Screenshot of a video<br />
                  <code>{"{{ai.text.definition}}"}</code> - Contextual definition by AI<br />
                  <code>{"{{ai.word.image}}"}</code> - Stylized image by AI
                </div>
              </div>
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
        <div style={{ padding: '16px' }}>
          <div style={{ marginBottom: '16px' }}>
            <label className="opt-card-label" style={{ display: 'block', marginBottom: '4px' }}>Rewind (10s)</label>
            <input
              type="text"
              className="opt-input"
              style={{ width: '100%', background: '#1a1a1a', color: '#fff' }}
              value={shortcuts.rewind}
              onChange={e => updateShortcut('rewind', e.target.value)}
              maxLength={1}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label className="opt-card-label" style={{ display: 'block', marginBottom: '4px' }}>Forward (10s)</label>
            <input
              type="text"
              className="opt-input"
              style={{ width: '100%', background: '#1a1a1a', color: '#fff' }}
              value={shortcuts.forward}
              onChange={e => updateShortcut('forward', e.target.value)}
              maxLength={1}
            />
          </div>

          <div>
            <label className="opt-card-label" style={{ display: 'block', marginBottom: '4px' }}>Play / Pause</label>
            <input
              type="text"
              className="opt-input"
              style={{ width: '100%', background: '#1a1a1a', color: '#fff' }}
              value={shortcuts.playPause}
              onChange={e => updateShortcut('playPause', e.target.value)}
              maxLength={1}
            />
          </div>
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
  { id: 'dictionary', label: 'Dictionary', icon: <IconBook /> },
  { id: 'anki', label: 'Anki Sync', icon: <IconAnki /> },
  { id: 'shortcuts', label: 'Shortcuts', icon: <IconKeyboard /> },
];

const Options = () => {
  const [tab, setTab] = useState<Tab>('settings');

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
        {tab === 'dictionary' && <DictionaryTab />}
        {tab === 'anki' && <AnkiTab />}
        {tab === 'shortcuts' && <ShortcutsTab />}
      </div>
    </div>
  );
};

export default withErrorBoundary(withSuspense(Options, <LoadingSpinner />), ErrorDisplay);
