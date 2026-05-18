import { useState, useEffect } from 'react';
import '@src/Popup.css';
import { useStorage, withErrorBoundary, withSuspense } from '@extension/shared';
import { ipaSettingsStorage, ipaAuthStorage } from '@extension/storage';
import type { IpaOpts } from '@extension/storage';
import { ErrorDisplay, LoadingSpinner } from '@extension/ui';

type ToggleRow = { id: keyof IpaOpts; label: string; example: string; swatch?: string };

const VISUAL_ROWS: ToggleRow[] = [
  { id: 'silent',     label: 'Ghost Letters',  example: 's<span style="opacity:0.3">w</span>ord' },
  { id: 'color_e',    label: '/ɛ/ Red',        example: 's<span style="color:#e53935">e</span>cond',   swatch: '#e53935' },
  { id: 'color_i',    label: '/i/ Green',      example: 'r<span style="color:#2e7d32">e</span>ceipt',  swatch: '#2e7d32' },
  { id: 'color_u_alt',label: '/ʌ/ Purple',     example: 's<span style="color:#8e24aa">o</span>me',     swatch: '#8e24aa' },
  { id: 'color_a',    label: '/æ/ Pink',        example: 'c<span style="color:#d81b60">a</span>t',      swatch: '#d81b60' },
  { id: 'color_u',    label: '/u/ Teal',        example: 't<span style="color:#00838f">o</span>mb',     swatch: '#00838f' },
  { id: 'color_o',    label: '/ɔ/ Amber',       example: 'qu<span style="color:#e65100">a</span>rter',  swatch: '#e65100' },
];

const MOD_ROWS: ToggleRow[] = [
  { id: 'stress',     label: 'Stress Accents',    example: 'upd<b>á</b>te' },
  { id: 'length',     label: 'Long Vowels',        example: 's<b>oo</b><span style="opacity:0.6">:</span>n' },
  { id: 'diph_ai',    label: 'Diphthong /aɪ/',    example: '<b>i</b><sup style="opacity:0.7">ⁱ</sup>tem' },
  { id: 'diph_ei_oi', label: 'Diphthongs /eɪ ɔɪ/',example: 'gr<b>e</b><sup style="opacity:0.7">ⁱ</sup>at' },
  { id: 'diph_ou_au', label: 'Diphthongs /oʊ aʊ/',example: 'r<b>o</b><sup style="opacity:0.7">ᵘ</sup>ad' },
  { id: 'th_t',       label: 'TH /θ/',            example: 'th<sup style="opacity:0.7">ᵗ</sup>in' },
  { id: 'th_d',       label: 'DH /ð/',            example: 'th<sup style="opacity:0.7">ᵈ</sup>is' },
  { id: 'tmark',      label: 'T-Sound Morph',     example: 'ask<span style="opacity:0.3">e</span>d<sup style="opacity:0.7">ᵗ</sup>' },
  { id: 'zmark',      label: 'Z-Sound Lines',     example: 'vi<u style="text-decoration:underline dotted;text-underline-offset:2px">s</u>it' },
  { id: 'phonemes',   label: 'Hidden Phonemes',   example: '<sup style="color:#e879f9">w</sup>one' },
];

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

/* ─── Icons ─── */

const IconGlobe = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
);

const IconLanguages = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 8l6 6"/>
    <path d="M4 14l6-6 2-3"/>
    <path d="M2 5h12"/>
    <path d="M7 2h1"/>
    <path d="M22 22l-5-10-5 10"/>
    <path d="M14 18h6"/>
  </svg>
);

const IconVideo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="23 7 16 12 23 17 23 7"/>
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
  </svg>
);

const IconPalette = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <circle cx="13.5" cy="6.5" r="1" fill="currentColor"/>
    <circle cx="17.5" cy="10.5" r="1" fill="currentColor"/>
    <circle cx="8.5" cy="7.5" r="1" fill="currentColor"/>
    <circle cx="6.5" cy="12.5" r="1" fill="currentColor"/>
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
  </svg>
);

const IconSparkles = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l1.912 5.813L19 12l-5.088 3.187L12 21l-1.912-5.813L5 12l5.088-3.187L12 3z"/>
  </svg>
);

/* ─── Switch ─── */
function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="ipa-switch">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="ipa-slider" />
    </label>
  );
}

const PRO_OPT_IDS = new Set<keyof IpaOpts>([
  'stress', 'length', 'diph_ai', 'diph_ei_oi', 'diph_ou_au',
  'th_t', 'th_d', 'tmark', 'zmark', 'phonemes',
]);

const Popup = () => {
  const settings = useStorage(ipaSettingsStorage);
  const auth = useStorage(ipaAuthStorage);
  const [currentHost, setCurrentHost] = useState('');
  const [domainLoading, setDomainLoading] = useState(true);
  const [loginError, setLoginError] = useState('');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [interval, setInterval] = useState<'month' | 'year'>('year');
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (tabs[0]?.url) {
        try { setCurrentHost(new URL(tabs[0].url).hostname); }
        catch { setCurrentHost(''); }
      }
      setDomainLoading(false);
    });
    // Sync tier from DB every time popup opens
    ipaAuthStorage.syncTier().catch(() => {});
  }, []);

  if (!settings || !auth) return null;

  const isBlacklisted = currentHost ? settings.blacklist.includes(currentHost) : false;

  return (
    <div className="ipa-popup">

      {/* ── Header ── */}
      <div className="ipa-header">
        <div className="ipa-brand">
          <div className="ipa-brand-icon">
            <img src={chrome.runtime.getURL('icon-128.png')} alt="Logo" style={{ width: 18, height: 18, borderRadius: 4, display: 'block' }} />
          </div>
          <div className="ipa-brand-text">
            <span className="ipa-brand-name">Lumen</span>
            <span className="ipa-brand-status">
              <span className={`ipa-status-dot ${settings.enabled ? 'on' : ''}`} />
              {settings.enabled ? 'Active' : 'Disabled'}
            </span>
          </div>
        </div>
        <div className="ipa-header-right">
          {auth.isLoggedIn && auth.user && (
            <img
              src={auth.user.picture}
              alt={auth.user.name}
              className="ipa-avatar"
              title={`${auth.user.name} — click to sign out`}
              onClick={() => ipaAuthStorage.logout()}
            />
          )}
          <Switch checked={settings.enabled} onChange={v => ipaSettingsStorage.setEnabled(v)} />
        </div>
      </div>

      {/* ── This Site ── */}
      {!domainLoading && currentHost && (
        <div className="ipa-section">
          <div className="ipa-section-title"><IconGlobe />This Site</div>
          <div className="ipa-domain">{currentHost}</div>
          <div className="ipa-row">
            <div className="ipa-row-label"><span>Enable on this domain</span></div>
            <Switch
              checked={!isBlacklisted}
              onChange={v => v
                ? ipaSettingsStorage.removeFromBlacklist(currentHost)
                : ipaSettingsStorage.addToBlacklist(currentHost)
              }
            />
          </div>
        </div>
      )}

      {/* ── Translation ── */}
      <div className="ipa-section">
        <div className="ipa-section-title"><IconLanguages />Translation</div>
        <div className="ipa-row">
          <div className="ipa-row-label"><span>Language</span></div>
          <select
            className="ipa-select"
            value={settings.targetLanguage ?? 'none'}
            onChange={e => ipaSettingsStorage.setLanguage(e.target.value)}
          >
            {LANGUAGES.map(l => (
              <option key={l.code} value={l.code}>{l.name}</option>
            ))}
          </select>
        </div>
        <div className="ipa-row">
          <div className="ipa-row-label"><span>Per-sentence <small>(text select)</small></span></div>
          <Switch
            checked={settings.translatePerSentence ?? true}
            onChange={v => ipaSettingsStorage.setTranslatePerSentence(v)}
          />
        </div>
        {(settings.targetLanguage && settings.targetLanguage !== 'none') && (
          <div className="ipa-hint">
            Hover = word translation.{settings.translatePerSentence && ' Select text = sentence.'}
          </div>
        )}
      </div>

      {/* ── Video ── */}
      <div className="ipa-section">
        <div className="ipa-section-title"><IconVideo />Video</div>
        <div className="ipa-row">
          <div className="ipa-row-label"><span>Pause on hover <small>(CC words)</small></span></div>
          <Switch
            checked={settings.pauseOnHover ?? false}
            onChange={v => ipaSettingsStorage.setPauseOnHover(v)}
          />
        </div>
      </div>

      {/* ── Visuals & Colors ── */}
      <div className="ipa-section">
        <div className="ipa-section-title"><IconPalette />Visuals &amp; Colors</div>
        {VISUAL_ROWS.map(row => (
          <div key={row.id} className="ipa-row">
            <div className="ipa-row-label">
              {row.swatch && <span className="ipa-swatch" style={{ background: row.swatch }} />}
              <span>
                {row.label}{' '}
                <small dangerouslySetInnerHTML={{ __html: `(${row.example})` }} />
              </span>
            </div>
            <Switch
              checked={settings.opts[row.id]}
              onChange={v => ipaSettingsStorage.setOpt(row.id, v)}
            />
          </div>
        ))}
      </div>

      {/* ── Modifications ── */}
      <div className="ipa-section">
        <div className="ipa-section-title"><IconSparkles />Modifications</div>
        {MOD_ROWS.map(row => {
          const isPro = PRO_OPT_IDS.has(row.id);
          const tier = auth.user?.tier ?? 'free';
          const locked = isPro && tier !== 'pro';
          return (
            <div key={row.id} className={`ipa-row${locked ? ' ipa-row-locked' : ''}`}>
              <div className="ipa-row-label">
                <span>
                  {row.label}{' '}
                  <small dangerouslySetInnerHTML={{ __html: `(${row.example})` }} />
                </span>
                {locked && <span className="ipa-pro-badge">Pro</span>}
              </div>
              {locked ? (
                <button
                  className="ipa-lock-btn"
                  onClick={async () => {
                    setUpgradeLoading(true);
                    await ipaAuthStorage.openCheckout(interval);
                    setUpgradeLoading(false);
                  }}
                  title="Upgrade to Pro"
                >
                  🔒
                </button>
              ) : (
                <Switch
                  checked={settings.opts[row.id]}
                  onChange={v => ipaSettingsStorage.setOpt(row.id, v)}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* ── Footer / Auth ── */}
      <div className="ipa-footer">
        <button className="ipa-options-link" onClick={() => chrome.runtime.openOptionsPage()}>
          All Settings →
        </button>
        {!auth.isLoggedIn ? (
          <div className="ipa-auth-form">
            <div className="ipa-auth-tabs">
              <button className={authMode === 'signin' ? 'active' : ''} onClick={() => { setAuthMode('signin'); setLoginError(''); }}>Sign In</button>
              <button className={authMode === 'signup' ? 'active' : ''} onClick={() => { setAuthMode('signup'); setLoginError(''); }}>Sign Up</button>
            </div>
            <input
              className="ipa-auth-input"
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && e.currentTarget.nextElementSibling instanceof HTMLElement && e.currentTarget.nextElementSibling.focus()}
            />
            <input
              className="ipa-auth-input"
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={async e => {
                if (e.key !== 'Enter') return;
                e.preventDefault();
                if (!email || !password || authLoading) return;
                setAuthLoading(true); setLoginError('');
                const res = authMode === 'signin'
                  ? await ipaAuthStorage.signIn(email, password)
                  : await ipaAuthStorage.signUp(email, password);
                setAuthLoading(false);
                if (res.error) setLoginError(res.error);
              }}
            />
            {loginError && <span className="ipa-login-error">{loginError}</span>}
            <button
              className="ipa-login-btn"
              disabled={authLoading || !email || !password}
              onClick={async () => {
                setAuthLoading(true); setLoginError('');
                const res = authMode === 'signin'
                  ? await ipaAuthStorage.signIn(email, password)
                  : await ipaAuthStorage.signUp(email, password);
                setAuthLoading(false);
                if (res.error) setLoginError(res.error);
              }}
            >
              {authLoading ? '…' : authMode === 'signin' ? 'Sign In' : 'Sign Up'}
            </button>
            <div className="ipa-auth-divider">or</div>
            <button
              className="ipa-google-btn"
              disabled={authLoading}
              onClick={async () => {
                setAuthLoading(true); setLoginError('');
                const res = await ipaAuthStorage.loginWithGoogle();
                setAuthLoading(false);
                if (res.error) setLoginError(res.error);
              }}
            >
              <svg width="15" height="15" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              {authLoading ? '…' : 'Continue with Google'}
            </button>
          </div>
        ) : (
          <div className="ipa-auth-user">
            <span className="ipa-user-email">
              {auth.user?.email}
              <span className={`ipa-tier-badge ipa-tier-${auth.user?.tier ?? 'free'}`}>
                {(auth.user?.tier ?? 'free').toUpperCase()}
              </span>
            </span>

            {auth.user?.tier !== 'pro' ? (
              <div className="ipa-upgrade-block">
                <div className="ipa-interval-toggle">
                  <button
                    className={interval === 'month' ? 'active' : ''}
                    onClick={() => setInterval('month')}
                  >Monthly · $4</button>
                  <button
                    className={interval === 'year' ? 'active' : ''}
                    onClick={() => setInterval('year')}
                  >Yearly · $3<small>/mo</small></button>
                </div>
                <button
                  className="ipa-upgrade-btn"
                  disabled={upgradeLoading}
                  onClick={async () => {
                    setUpgradeLoading(true);
                    await ipaAuthStorage.openCheckout(interval);
                    setUpgradeLoading(false);
                  }}
                >
                  {upgradeLoading ? '…' : '⬆ Upgrade to Pro'}
                </button>
              </div>
            ) : (
              <button
                className="ipa-manage-btn"
                onClick={async () => {
                  await ipaAuthStorage.openPortal();
                }}
              >
                Manage subscription
              </button>
            )}

            <button className="ipa-logout-btn" onClick={() => ipaAuthStorage.logout()}>Sign out</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default withErrorBoundary(withSuspense(Popup, <LoadingSpinner />), ErrorDisplay);
