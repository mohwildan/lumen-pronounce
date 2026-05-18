import { useState, type ReactNode } from 'react';
import '@src/Options.css';
import { useStorage, withErrorBoundary, withSuspense } from '@extension/shared';
import { ipaSettingsStorage, ipaAuthStorage } from '@extension/storage';
import type { IpaOpts } from '@extension/storage';
import { ErrorDisplay, LoadingSpinner } from '@extension/ui';

type Tab = 'settings' | 'translation' | 'login' | 'dictionary';

const LANGUAGES = [
  { code: 'none', name: 'Off' },
  { code: 'af', name: 'Afrikaans' },
  { code: 'sq', name: 'Albanian' },
  { code: 'am', name: 'Amharic' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hy', name: 'Armenian' },
  { code: 'az', name: 'Azerbaijani' },
  { code: 'eu', name: 'Basque' },
  { code: 'be', name: 'Belarusian' },
  { code: 'bn', name: 'Bengali' },
  { code: 'bs', name: 'Bosnian' },
  { code: 'bg', name: 'Bulgarian' },
  { code: 'ca', name: 'Catalan' },
  { code: 'ceb', name: 'Cebuano' },
  { code: 'ny', name: 'Chichewa' },
  { code: 'zh-CN', name: 'Chinese (S)' },
  { code: 'zh-TW', name: 'Chinese (T)' },
  { code: 'co', name: 'Corsican' },
  { code: 'hr', name: 'Croatian' },
  { code: 'cs', name: 'Czech' },
  { code: 'da', name: 'Danish' },
  { code: 'nl', name: 'Dutch' },
  { code: 'en', name: 'English' },
  { code: 'eo', name: 'Esperanto' },
  { code: 'et', name: 'Estonian' },
  { code: 'tl', name: 'Filipino' },
  { code: 'fi', name: 'Finnish' },
  { code: 'fr', name: 'French' },
  { code: 'fy', name: 'Frisian' },
  { code: 'gl', name: 'Galician' },
  { code: 'ka', name: 'Georgian' },
  { code: 'de', name: 'German' },
  { code: 'el', name: 'Greek' },
  { code: 'gu', name: 'Gujarati' },
  { code: 'ht', name: 'Haitian Creole' },
  { code: 'ha', name: 'Hausa' },
  { code: 'haw', name: 'Hawaiian' },
  { code: 'iw', name: 'Hebrew' },
  { code: 'hi', name: 'Hindi' },
  { code: 'hmn', name: 'Hmong' },
  { code: 'hu', name: 'Hungarian' },
  { code: 'is', name: 'Icelandic' },
  { code: 'ig', name: 'Igbo' },
  { code: 'id', name: 'Indonesian' },
  { code: 'ga', name: 'Irish' },
  { code: 'it', name: 'Italian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'jw', name: 'Javanese' },
  { code: 'kn', name: 'Kannada' },
  { code: 'kk', name: 'Kazakh' },
  { code: 'km', name: 'Khmer' },
  { code: 'rw', name: 'Kinyarwanda' },
  { code: 'ko', name: 'Korean' },
  { code: 'ku', name: 'Kurdish' },
  { code: 'ky', name: 'Kyrgyz' },
  { code: 'lo', name: 'Lao' },
  { code: 'la', name: 'Latin' },
  { code: 'lv', name: 'Latvian' },
  { code: 'lt', name: 'Lithuanian' },
  { code: 'lb', name: 'Luxembourgish' },
  { code: 'mk', name: 'Macedonian' },
  { code: 'mg', name: 'Malagasy' },
  { code: 'ms', name: 'Malay' },
  { code: 'ml', name: 'Malayalam' },
  { code: 'mt', name: 'Maltese' },
  { code: 'mi', name: 'Maori' },
  { code: 'mr', name: 'Marathi' },
  { code: 'mn', name: 'Mongolian' },
  { code: 'my', name: 'Burmese' },
  { code: 'ne', name: 'Nepali' },
  { code: 'no', name: 'Norwegian' },
  { code: 'or', name: 'Odia' },
  { code: 'ps', name: 'Pashto' },
  { code: 'fa', name: 'Persian' },
  { code: 'pl', name: 'Polish' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'pa', name: 'Punjabi' },
  { code: 'ro', name: 'Romanian' },
  { code: 'ru', name: 'Russian' },
  { code: 'sm', name: 'Samoan' },
  { code: 'gd', name: 'Scots Gaelic' },
  { code: 'sr', name: 'Serbian' },
  { code: 'st', name: 'Sesotho' },
  { code: 'sn', name: 'Shona' },
  { code: 'sd', name: 'Sindhi' },
  { code: 'si', name: 'Sinhala' },
  { code: 'sk', name: 'Slovak' },
  { code: 'sl', name: 'Slovenian' },
  { code: 'so', name: 'Somali' },
  { code: 'es', name: 'Spanish' },
  { code: 'su', name: 'Sundanese' },
  { code: 'sw', name: 'Swahili' },
  { code: 'sv', name: 'Swedish' },
  { code: 'tg', name: 'Tajik' },
  { code: 'ta', name: 'Tamil' },
  { code: 'tt', name: 'Tatar' },
  { code: 'te', name: 'Telugu' },
  { code: 'th', name: 'Thai' },
  { code: 'tr', name: 'Turkish' },
  { code: 'tk', name: 'Turkmen' },
  { code: 'uk', name: 'Ukrainian' },
  { code: 'ur', name: 'Urdu' },
  { code: 'ug', name: 'Uyghur' },
  { code: 'uz', name: 'Uzbek' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'cy', name: 'Welsh' },
  { code: 'xh', name: 'Xhosa' },
  { code: 'yi', name: 'Yiddish' },
  { code: 'yo', name: 'Yoruba' },
  { code: 'zu', name: 'Zulu' }
];

const PRO_OPT_IDS = new Set<keyof IpaOpts>([
  'stress', 'length', 'diph_ai', 'diph_ei_oi', 'diph_ou_au',
  'th_t', 'th_d', 'tmark', 'zmark', 'phonemes',
]);

type SettingRow = { id: keyof IpaOpts; label: string; desc: string };

const ALL_OPTS: SettingRow[] = [
  { id: 'silent',     label: 'Ghost Letters',       desc: 'Fade silent letters to show which characters make no sound' },
  { id: 'color_e',    label: 'Color /ɛ/ Red',       desc: 'Color the "e" vowel sound red (bed, head, said)' },
  { id: 'color_i',    label: 'Color /i/ Green',     desc: 'Color the long "ee" vowel sound green (receipt, ski)' },
  { id: 'color_u_alt',label: 'Color /ʌ/ Purple',    desc: 'Color the "uh" vowel sound purple (some, blood, love)' },
  { id: 'color_a',    label: 'Color /æ/ Pink',      desc: 'Color the "a" vowel sound pink (cat, trap, hand)' },
  { id: 'color_u',    label: 'Color /u/ Teal',      desc: 'Color the long "oo" vowel sound teal (tomb, blue, shoe)' },
  { id: 'color_o',    label: 'Color /ɔ/ Amber',     desc: 'Color the "aw" vowel sound amber (quarter, law, thought)' },
  { id: 'stress',     label: 'Stress Accents',      desc: 'Add accent marks on stressed vowels (updáte, éven)' },
  { id: 'length',     label: 'Long Vowels (:)',      desc: 'Show colon after long vowels (sŏn:, tō:mb)' },
  { id: 'diph_ai',   label: 'Diphthong /aɪ/',      desc: 'Show superscript on the /aɪ/ diphthong (item, ice)' },
  { id: 'diph_ei_oi',label: 'Diphthongs /eɪ, ɔɪ/', desc: 'Show superscript on /eɪ/ and /ɔɪ/ diphthongs (great, boy)' },
  { id: 'diph_ou_au',label: 'Diphthongs /oʊ, aʊ/', desc: 'Show superscript on /oʊ/ and /aʊ/ diphthongs (road, out)' },
  { id: 'th_t',      label: 'TH Mark /θ/',          desc: 'Mark voiceless TH with superscript ᵗ (thin, think)' },
  { id: 'th_d',      label: 'DH Mark /ð/',          desc: 'Mark voiced TH with superscript ᵈ (this, there)' },
  { id: 'tmark',     label: 'T-Sound Morph',        desc: 'Show ᵗ when T is spelled differently (asked, debt)' },
  { id: 'zmark',     label: 'Z-Sound Lines',        desc: 'Underline letters that make a Z sound (visit, dogs)' },
  { id: 'phonemes',  label: 'Hidden Phonemes',      desc: 'Show superscript for ghost phonemes that have no letter (one → wone)' },
];

/* ─── Icons ─── */

const IconSettings = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

const IconGlobe = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
);

const IconUser = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const IconBook = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
);

const IconLock = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

/* ─── Switch ─── */
function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="opt-switch">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="opt-slider" />
    </label>
  );
}

/* ─── Tabs ─── */
function SettingsTab() {
  const settings = useStorage(ipaSettingsStorage);
  const auth = useStorage(ipaAuthStorage);
  if (!settings || !auth) return null;

  const tier = auth.user?.tier ?? 'free';

  const handleOpt = async (key: keyof IpaOpts, val: boolean) => {
    await ipaSettingsStorage.setOpt(key, val);
  };

  const handleReset = async () => {
    if (confirm('Reset all settings to defaults?')) {
      await ipaSettingsStorage.reset();
    }
  };

  return (
    <div className="opt-section">
      <h2>Extension Settings</h2>
      <p className="opt-section-desc">Control which phonetic features are active across all websites.</p>

      <div className="opt-global-row">
        <span>Global Enable</span>
        <Switch checked={settings.enabled} onChange={v => ipaSettingsStorage.setEnabled(v)} />
      </div>

      <div className="opt-blacklist">
        <h3>Disabled Sites</h3>
        {settings.blacklist.length === 0 ? (
          <p className="opt-empty">No sites disabled — active on all pages.</p>
        ) : (
          <ul>
            {settings.blacklist.map(host => (
              <li key={host}>
                <span>{host}</span>
                <button onClick={() => ipaSettingsStorage.removeFromBlacklist(host)}>Remove</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="opt-opts">
        <h3>Feature Toggles</h3>
        {ALL_OPTS.map(row => {
          const locked = PRO_OPT_IDS.has(row.id) && tier !== 'pro';
          return (
            <div key={row.id} className={`opt-row${locked ? ' opt-row-locked' : ''}`}>
              <div className="opt-row-text">
                <span>
                  {row.label}
                  {PRO_OPT_IDS.has(row.id) && (
                    <span className="opt-pro-badge">Pro</span>
                  )}
                </span>
                <small>{row.desc}</small>
                {locked && (
                  <button
                    className="opt-unlock-btn"
                    onClick={() => ipaAuthStorage.openCheckout('year')}
                  >
                    Upgrade to unlock ↗
                  </button>
                )}
              </div>
              {locked ? (
                <span className="opt-lock-icon">🔒</span>
              ) : (
                <Switch checked={settings.opts[row.id]} onChange={v => handleOpt(row.id, v)} />
              )}
            </div>
          );
        })}
      </div>

      <div className="opt-actions">
        <button className="opt-btn-danger" onClick={handleReset}>Reset to Defaults</button>
      </div>
    </div>
  );
}

function LoginTab() {
  const auth = useStorage(ipaAuthStorage);
  const [loading, setLoading] = useState(false);
  const [billingLoading, setBillingLoading] = useState(false);
  const [interval, setInterval] = useState<'month' | 'year'>('year');
  const [error, setError] = useState('');

  if (!auth) return null;

  const tier = auth.user?.tier ?? 'free';

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    const res = await ipaAuthStorage.loginWithGoogle();
    if (res.error) setError(res.error || 'Sign in failed. Make sure pop-ups are allowed.');
    setLoading(false);
  };

  const handleLogout = async () => {
    setLoading(true);
    await ipaAuthStorage.logout();
    setLoading(false);
  };

  const handleUpgrade = async () => {
    setBillingLoading(true);
    await ipaAuthStorage.openCheckout(interval);
    setBillingLoading(false);
  };

  const handleManageBilling = async () => {
    setBillingLoading(true);
    await ipaAuthStorage.openPortal();
    setBillingLoading(false);
  };

  const PRO_FEATURES = [
    'Stress accents on vowels',
    'Diphthong markers /aɪ, eɪ, ɔɪ, oʊ, aʊ/',
    'Long vowel markers (:)',
    'TH / DH sound marks',
    'T-sound morph & Z-underline',
    'Hidden phoneme superscripts',
  ];

  return (
    <div className="opt-section">
      {auth.isLoggedIn && auth.user ? (
        <>
          <h2>Account</h2>
          <p className="opt-section-desc">Your settings sync across devices while signed in.</p>

          <div className="opt-profile">
            <img src={auth.user.picture} alt={auth.user.name} className="opt-profile-img" />
            <div className="opt-profile-info">
              <strong>{auth.user.name}</strong>
              <span>{auth.user.email}</span>
              <span className={`opt-tier-badge opt-tier-${tier}`}>{tier === 'pro' ? 'Pro · Active' : 'Free Plan'}</span>
            </div>
            <button className="opt-btn-outline" onClick={handleLogout} disabled={loading}>
              {loading ? 'Signing out…' : 'Sign Out'}
            </button>
          </div>

          {tier === 'pro' ? (
            <div className="opt-billing-card opt-billing-pro">
              <div className="opt-billing-header">
                <span className="opt-billing-status-dot" />
                <strong>Pro subscription active</strong>
              </div>
              <p className="opt-billing-desc">All phoneme markers are unlocked. Manage or cancel your subscription below.</p>
              <button className="opt-btn-manage" onClick={handleManageBilling} disabled={billingLoading}>
                {billingLoading ? 'Opening…' : 'Manage Billing ↗'}
              </button>
            </div>
          ) : (
            <div className="opt-billing-card opt-billing-free">
              <div className="opt-billing-header">
                <strong>Upgrade to Pro</strong>
                <span className="opt-billing-trial">14-day free trial</span>
              </div>
              <p className="opt-billing-desc">Unlock all phoneme markers to see every sound pattern in English text.</p>
              <ul className="opt-pro-feature-list">
                {PRO_FEATURES.map(f => (
                  <li key={f}>
                    <span className="opt-pro-check">✓</span> {f}
                  </li>
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
                {billingLoading ? 'Opening checkout…' : `Start free trial →`}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="opt-login">
          <div className="opt-login-icon"><IconLock /></div>
          <h2>Sign In to Sync</h2>
          <p>Sign in with Google to sync your settings across devices and unlock premium features.</p>
          {error && <div className="opt-error">{error}</div>}
          <button className="opt-btn-google" onClick={handleGoogleLogin} disabled={loading}>
            {loading ? 'Signing in…' : (
              <>
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                Continue with Google
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

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
      <h2>Translation</h2>
      <p className="opt-section-desc">Hover any highlighted word to see its translation. Select text for sentence translation.</p>

      <div className="opt-trans-row">
        <label className="opt-trans-label">Target Language</label>
        <select
          className="opt-trans-select"
          value={lang}
          onChange={e => ipaSettingsStorage.setLanguage(e.target.value)}
        >
          {LANGUAGES.map(l => (
            <option key={l.code} value={l.code}>{l.name}</option>
          ))}
        </select>
      </div>

      <div className="opt-trans-row">
        <label className="opt-trans-label">Per-Sentence (text selection)</label>
        <label className="opt-switch">
          <input
            type="checkbox"
            checked={settings.translatePerSentence ?? true}
            onChange={e => ipaSettingsStorage.setTranslatePerSentence(e.target.checked)}
          />
          <span className="opt-slider" />
        </label>
      </div>

      {lang !== 'none' && (
        <>
          <div className="opt-trans-info">
            <div className="opt-trans-info-item">
              <strong>Per-Word:</strong> Hover any highlighted word → translation appears in tooltip below the IPA.
            </div>
            {settings.translatePerSentence && (
              <div className="opt-trans-info-item">
                <strong>Per-Sentence:</strong> Select any text on the page → purple "Translate" button appears → click to see translation.
              </div>
            )}
          </div>

          <h3>Test Translation</h3>

          <div className="opt-trans-test">
            <label>Word</label>
            <div className="opt-trans-input-row">
              <input
                className="opt-input"
                placeholder="e.g. pronunciation"
                value={testWord}
                onChange={e => { setTestWord(e.target.value); setWordResult(''); }}
              />
              <button
                className="opt-btn-trans"
                disabled={!testWord.trim() || loading === 'word'}
                onClick={() => translateText(testWord.trim(), 'word')}
              >
                {loading === 'word' ? '…' : 'Go'}
              </button>
            </div>
            {wordResult && <div className="opt-dict-result opt-dict-hit">{wordResult}</div>}
          </div>

          <div className="opt-trans-test" style={{ marginTop: 18 }}>
            <label>Sentence</label>
            <div className="opt-trans-input-row">
              <input
                className="opt-input"
                placeholder="e.g. The quick brown fox"
                value={testSentence}
                onChange={e => { setTestSentence(e.target.value); setSentenceResult(''); }}
              />
              <button
                className="opt-btn-trans"
                disabled={!testSentence.trim() || loading === 'sentence'}
                onClick={() => translateText(testSentence.trim(), 'sentence')}
              >
                {loading === 'sentence' ? '…' : 'Go'}
              </button>
            </div>
            {sentenceResult && <div className="opt-dict-result opt-dict-hit">{sentenceResult}</div>}
          </div>
        </>
      )}
    </div>
  );
}

function DictionaryTab() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [dictReady, setDictReady] = useState(false);
  const [dict, setDict] = useState<Record<string, string> | null>(null);

  const loadDict = async () => {
    try {
      const r = await fetch(chrome.runtime.getURL('pronunciation.json'));
      const data = await r.json() as Record<string, string>;
      setDict(data);
      setDictReady(true);
    } catch {
      setResult('Failed to load dictionary.');
    }
  };

  const handleQuery = (val: string) => {
    setQuery(val);
    if (!val.trim()) { setResult(null); return; }
    if (!dict) { setResult('Dictionary loading…'); loadDict(); return; }
    const word = val.trim().toLowerCase();
    const entry = dict[word];
    setResult(entry ? `${word}: ${entry}` : `"${word}" not found.`);
  };

  return (
    <div className="opt-section">
      <h2>Dictionary Lookup</h2>
      <p className="opt-desc">Test any English word against the ARPAbet pronunciation dictionary.</p>
      <input
        className="opt-input"
        type="text"
        placeholder="Type a word…"
        value={query}
        onChange={e => handleQuery(e.target.value)}
        onFocus={() => { if (!dictReady && !dict) loadDict(); }}
      />
      {result && (
        <div className={`opt-dict-result ${result.includes('not found') || result.includes('Failed') ? 'opt-dict-miss' : 'opt-dict-hit'}`}>
          {result}
        </div>
      )}
      {!dictReady && !dict && (
        <p className="opt-empty">Click the input to load the dictionary ({Math.round(4240161 / 1024)} KB).</p>
      )}
    </div>
  );
}

const NAV: { id: Tab; label: string; icon: ReactNode }[] = [
  { id: 'settings',    label: 'Settings',    icon: <IconSettings /> },
  { id: 'translation', label: 'Translation', icon: <IconGlobe /> },
  { id: 'login',       label: 'Account',     icon: <IconUser /> },
  { id: 'dictionary',  label: 'Dictionary',  icon: <IconBook /> },
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
        {tab === 'settings'    && <SettingsTab />}
        {tab === 'translation' && <TranslationTab />}
        {tab === 'login'       && <LoginTab />}
        {tab === 'dictionary'  && <DictionaryTab />}
      </div>
    </div>
  );
};

export default withErrorBoundary(withSuspense(Options, <LoadingSpinner />), ErrorDisplay);
