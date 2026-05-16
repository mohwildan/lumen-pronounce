import { useState, useEffect } from 'react';
import '@src/Popup.css';
import { useStorage, withErrorBoundary, withSuspense } from '@extension/shared';
import { ipaSettingsStorage, ipaAuthStorage } from '@extension/storage';
import type { IpaOpts } from '@extension/storage';
import { ErrorDisplay, LoadingSpinner } from '@extension/ui';

type ToggleRow = { id: keyof IpaOpts; label: string; example: string };

const VISUAL_ROWS: ToggleRow[] = [
  { id: 'silent', label: 'Ghost Letters', example: 's<span style="opacity:0.3">w</span>ord' },
  { id: 'color_e', label: 'Color /ɛ/ Red', example: 's<span style="color:#e53935">e</span>cond' },
  { id: 'color_i', label: 'Color /i/ Green', example: 'r<span style="color:#2e7d32">e</span>ceipt' },
  { id: 'color_u_alt', label: 'Color /ʌ/ Purple', example: 's<span style="color:#8e24aa">o</span>me' },
  { id: 'color_a', label: 'Color /æ/ Pink', example: 'c<span style="color:#d81b60">a</span>t' },
  { id: 'color_u', label: 'Color /u/ Teal', example: 't<span style="color:#00838f">o</span>mb' },
  { id: 'color_o', label: 'Color /ɔ/ Amber', example: 'qu<span style="color:#e65100">a</span>rter' },
];

const MOD_ROWS: ToggleRow[] = [
  { id: 'stress', label: 'Stress Accents', example: 'upd<b>á</b>te' },
  { id: 'length', label: 'Long Vowels', example: 's<b>oo</b><span style="opacity:0.6">:</span>n' },
  { id: 'diph_ai', label: 'Diphthong /aɪ/', example: '<b>i</b><sup style="opacity:0.7">ⁱ</sup>tem' },
  { id: 'diph_ei_oi', label: 'Diphthongs /eɪ, ɔɪ/', example: 'gr<b>e</b><sup style="opacity:0.7">ⁱ</sup>at' },
  { id: 'diph_ou_au', label: 'Diphthongs /oʊ, aʊ/', example: 'r<b>o</b><sup style="opacity:0.7">ᵘ</sup>ad' },
  { id: 'th_t', label: 'TH Mark /θ/', example: 'th<sup style="opacity:0.7">ᵗ</sup>in' },
  { id: 'th_d', label: 'DH Mark /ð/', example: 'th<sup style="opacity:0.7">ᵈ</sup>is' },
  { id: 'tmark', label: 'T-Sound Morph', example: 'ask<span style="opacity:0.3">e</span>d<sup style="opacity:0.7">ᵗ</sup>' },
  { id: 'zmark', label: 'Z-Sound Lines', example: 'vi<u style="text-decoration:underline dotted;text-underline-offset:2px">s</u>it' },
  { id: 'phonemes', label: 'Hidden Phonemes', example: '<sup style="color:#ff3e88">w</sup>one' },
];

const LANGUAGES = [
  { code: 'none', name: 'Off' },
  { code: 'id', name: 'Indonesian' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'zh-CN', name: 'Chinese (S)' },
  { code: 'ko', name: 'Korean' },
  { code: 'ar', name: 'Arabic' },
  { code: 'ru', name: 'Russian' },
  { code: 'hi', name: 'Hindi' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'th', name: 'Thai' },
  { code: 'tr', name: 'Turkish' },
];

function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="ipa-switch">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="ipa-slider" />
    </label>
  );
}

const Popup = () => {
  const settings = useStorage(ipaSettingsStorage);
  const auth = useStorage(ipaAuthStorage);
  const [currentHost, setCurrentHost] = useState('');
  const [domainLoading, setDomainLoading] = useState(true);

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (tabs[0]?.url) {
        try { setCurrentHost(new URL(tabs[0].url).hostname); }
        catch { setCurrentHost(''); }
      }
      setDomainLoading(false);
    });
  }, []);

  if (!settings || !auth) return null;

  const isBlacklisted = currentHost ? settings.blacklist.includes(currentHost) : false;

  return (
    <div className="ipa-popup">
      <div className="ipa-header">
        <div className="ipa-brand">
          IPA Stylizer
          <small>{settings.enabled ? 'Active' : 'Disabled'}</small>
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

      {!domainLoading && currentHost && (
        <div className="ipa-section">
          <div className="ipa-section-title">This Site</div>
          <div className="ipa-domain">{currentHost}</div>
          <div className="ipa-row">
            <span>Enable on this domain</span>
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

      {/* Translation */}
      <div className="ipa-section">
        <div className="ipa-section-title">Translation</div>
        <div className="ipa-row">
          <span>Translate language</span>
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
          <span>Per-sentence (select text)</span>
          <Switch
            checked={settings.translatePerSentence ?? true}
            onChange={v => ipaSettingsStorage.setTranslatePerSentence(v)}
          />
        </div>
        {(settings.targetLanguage && settings.targetLanguage !== 'none') && (
          <div className="ipa-hint">
            Hover word = per-word translation.
            {settings.translatePerSentence && ' Select text = sentence translation.'}
          </div>
        )}
      </div>

      <div className="ipa-section">
        <div className="ipa-section-title">Visuals &amp; Colors</div>
        {VISUAL_ROWS.map(row => (
          <div key={row.id} className="ipa-row">
            <span>
              {row.label}{' '}
              <small dangerouslySetInnerHTML={{ __html: `(${row.example})` }} />
            </span>
            <Switch
              checked={settings.opts[row.id]}
              onChange={v => ipaSettingsStorage.setOpt(row.id, v)}
            />
          </div>
        ))}
      </div>

      <div className="ipa-section">
        <div className="ipa-section-title">Modifications</div>
        {MOD_ROWS.map(row => (
          <div key={row.id} className="ipa-row">
            <span>
              {row.label}{' '}
              <small dangerouslySetInnerHTML={{ __html: `(${row.example})` }} />
            </span>
            <Switch
              checked={settings.opts[row.id]}
              onChange={v => ipaSettingsStorage.setOpt(row.id, v)}
            />
          </div>
        ))}
      </div>

      <div className="ipa-footer">
        <button className="ipa-options-link" onClick={() => chrome.runtime.openOptionsPage()}>
          All Settings →
        </button>
        {!auth.isLoggedIn ? (
          <button className="ipa-login-btn" onClick={() => ipaAuthStorage.login()}>
            Sign in
          </button>
        ) : (
          <span className="ipa-user-email">{auth.user?.email}</span>
        )}
      </div>
    </div>
  );
};

export default withErrorBoundary(withSuspense(Popup, <LoadingSpinner />), ErrorDisplay);
