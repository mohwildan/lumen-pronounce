import { useState } from 'react';
import '@src/Options.css';
import { useStorage, withErrorBoundary, withSuspense } from '@extension/shared';
import { ipaSettingsStorage, ipaAuthStorage } from '@extension/storage';
import type { IpaOpts } from '@extension/storage';
import { ErrorDisplay, LoadingSpinner } from '@extension/ui';

type Tab = 'settings' | 'translation' | 'login' | 'dictionary';

const LANGUAGES = [
  { code: 'none', name: 'Off (no translation)' },
  { code: 'id', name: 'Indonesian (Bahasa)' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'zh-CN', name: 'Chinese (Simplified)' },
  { code: 'zh-TW', name: 'Chinese (Traditional)' },
  { code: 'ko', name: 'Korean' },
  { code: 'ar', name: 'Arabic' },
  { code: 'ru', name: 'Russian' },
  { code: 'hi', name: 'Hindi' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'th', name: 'Thai' },
  { code: 'tr', name: 'Turkish' },
  { code: 'nl', name: 'Dutch' },
  { code: 'pl', name: 'Polish' },
  { code: 'sv', name: 'Swedish' },
  { code: 'uk', name: 'Ukrainian' },
];

type SettingRow = { id: keyof IpaOpts; label: string; desc: string };

const ALL_OPTS: SettingRow[] = [
  { id: 'silent', label: 'Ghost Letters', desc: 'Fade silent letters to show which characters make no sound' },
  { id: 'color_e', label: 'Color /ɛ/ Red', desc: 'Color the "e" vowel sound red (bed, head, said)' },
  { id: 'color_i', label: 'Color /i/ Green', desc: 'Color the long "ee" vowel sound green (receipt, ski)' },
  { id: 'color_u_alt', label: 'Color /ʌ/ Purple', desc: 'Color the "uh" vowel sound purple (some, blood, love)' },
  { id: 'color_a', label: 'Color /æ/ Pink', desc: 'Color the "a" vowel sound pink (cat, trap, hand)' },
  { id: 'color_u', label: 'Color /u/ Teal', desc: 'Color the long "oo" vowel sound teal (tomb, blue, shoe)' },
  { id: 'color_o', label: 'Color /ɔ/ Amber', desc: 'Color the "aw" vowel sound amber (quarter, law, thought)' },
  { id: 'stress', label: 'Stress Accents', desc: 'Add accent marks on stressed vowels (updáte, éven)' },
  { id: 'length', label: 'Long Vowels (:)', desc: 'Show colon after long vowels (sŏn:, tō:mb)' },
  { id: 'diph_ai', label: 'Diphthong /aɪ/', desc: 'Show superscript on the /aɪ/ diphthong (item, ice)' },
  { id: 'diph_ei_oi', label: 'Diphthongs /eɪ, ɔɪ/', desc: 'Show superscript on /eɪ/ and /ɔɪ/ diphthongs (great, boy)' },
  { id: 'diph_ou_au', label: 'Diphthongs /oʊ, aʊ/', desc: 'Show superscript on /oʊ/ and /aʊ/ diphthongs (road, out)' },
  { id: 'th_t', label: 'TH Mark /θ/', desc: 'Mark voiceless TH with superscript ᵗ (thin, think)' },
  { id: 'th_d', label: 'DH Mark /ð/', desc: 'Mark voiced TH with superscript ᵈ (this, there)' },
  { id: 'tmark', label: 'T-Sound Morph', desc: 'Show ᵗ when T is spelled differently (asked, debt)' },
  { id: 'zmark', label: 'Z-Sound Lines', desc: 'Underline letters that make a Z sound (visit, dogs)' },
  { id: 'phonemes', label: 'Hidden Phonemes', desc: 'Show superscript for ghost phonemes that have no letter (one -> wone)' },
];

function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="opt-switch">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="opt-slider" />
    </label>
  );
}

function SettingsTab() {
  const settings = useStorage(ipaSettingsStorage);
  if (!settings) return null;

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
      <div className="opt-section-header">
        <h2>Extension Settings</h2>
        <div className="opt-global-row">
          <span>Global Enable</span>
          <Switch
            checked={settings.enabled}
            onChange={v => ipaSettingsStorage.setEnabled(v)}
          />
        </div>
      </div>

      <div className="opt-blacklist">
        <h3>Disabled Sites</h3>
        {settings.blacklist.length === 0 ? (
          <p className="opt-empty">No sites disabled.</p>
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
        {ALL_OPTS.map(row => (
          <div key={row.id} className="opt-row">
            <div className="opt-row-text">
              <span>{row.label}</span>
              <small>{row.desc}</small>
            </div>
            <Switch checked={settings.opts[row.id]} onChange={v => handleOpt(row.id, v)} />
          </div>
        ))}
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
  const [error, setError] = useState('');

  if (!auth) return null;

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    const user = await ipaAuthStorage.login();
    if (!user) setError('Sign in failed. Make sure pop-ups are allowed.');
    setLoading(false);
  };

  const handleLogout = async () => {
    setLoading(true);
    await ipaAuthStorage.logout();
    setLoading(false);
  };

  return (
    <div className="opt-section">
      {auth.isLoggedIn && auth.user ? (
        <div className="opt-profile">
          <img src={auth.user.picture} alt={auth.user.name} className="opt-profile-img" />
          <div className="opt-profile-info">
            <strong>{auth.user.name}</strong>
            <span>{auth.user.email}</span>
          </div>
          <button className="opt-btn-outline" onClick={handleLogout} disabled={loading}>
            {loading ? 'Signing out…' : 'Sign Out'}
          </button>
        </div>
      ) : (
        <div className="opt-login">
          <div className="opt-login-icon">🔐</div>
          <h2>Sign In</h2>
          <p>Sign in with Google to sync your settings across devices and unlock future premium features.</p>
          {error && <div className="opt-error">{error}</div>}
          <button className="opt-btn-google" onClick={handleLogin} disabled={loading}>
            {loading ? 'Signing in…' : (
              <>
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                Sign in with Google
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
      <h2>Translation Settings</h2>

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

      <div className="opt-trans-row" style={{ marginTop: 12 }}>
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

          <div className="opt-trans-test" style={{ marginTop: 16 }}>
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
      <p className="opt-desc">Test any word against the ARPAbet pronunciation dictionary.</p>
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
        <p className="opt-empty">Click the input to load the dictionary ({Math.round(4240161 / 1024)}KB).</p>
      )}
    </div>
  );
}

const Options = () => {
  const [tab, setTab] = useState<Tab>('settings');

  return (
    <div className="opt-app">
      <div className="opt-sidebar">
        <div className="opt-logo">IPA Stylizer</div>
        <nav>
          <button className={tab === 'settings' ? 'active' : ''} onClick={() => setTab('settings')}>Settings</button>
          <button className={tab === 'translation' ? 'active' : ''} onClick={() => setTab('translation')}>Translation</button>
          <button className={tab === 'login' ? 'active' : ''} onClick={() => setTab('login')}>Account</button>
          <button className={tab === 'dictionary' ? 'active' : ''} onClick={() => setTab('dictionary')}>Dictionary</button>
        </nav>
      </div>
      <div className="opt-content">
        {tab === 'settings' && <SettingsTab />}
        {tab === 'translation' && <TranslationTab />}
        {tab === 'login' && <LoginTab />}
        {tab === 'dictionary' && <DictionaryTab />}
      </div>
    </div>
  );
};

export default withErrorBoundary(withSuspense(Options, <LoadingSpinner />), ErrorDisplay);
