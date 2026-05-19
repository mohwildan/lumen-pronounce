import 'webextension-polyfill';
import { createClient, type User } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.CEB_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = process.env.CEB_SUPABASE_ANON_KEY as string;

// Chrome storage adapter — service workers don't have localStorage
const chromeStorageAdapter = {
  getItem: (key: string): Promise<string | null> =>
    new Promise(resolve => {
      chrome.storage.local.get(`_sb_${key}`, r => resolve(r[`_sb_${key}`] ?? null));
    }),
  setItem: (key: string, value: string): Promise<void> =>
    new Promise(resolve => {
      chrome.storage.local.set({ [`_sb_${key}`]: value }, resolve);
    }),
  removeItem: (key: string): Promise<void> =>
    new Promise(resolve => {
      chrome.storage.local.remove(`_sb_${key}`, resolve);
    }),
};

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: chromeStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ── Profile helpers ──────────────────────────────────────────────

type Profile = { id: string; email: string; name: string; avatar_url: string; tier: 'free' | 'pro' };

async function upsertProfile(user: User): Promise<Profile> {
  // Always fetch fresh from DB to get latest tier
  const { data: existing } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (existing) return existing as Profile;

  // First time — insert new profile
  const { data } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      email: user.email ?? '',
      name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email ?? '',
      avatar_url: user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? '',
      tier: 'free',
    })
    .select()
    .single();

  return (data as Profile) ?? {
    id: user.id,
    email: user.email ?? '',
    name: user.user_metadata?.full_name ?? '',
    avatar_url: user.user_metadata?.avatar_url ?? '',
    tier: 'free',
  };
}

async function saveAuthState(user: User, profile: Profile): Promise<void> {
  await chrome.storage.local.set({
    'ipa-auth': {
      isLoggedIn: true,
      user: {
        id: user.id,
        email: profile.email || user.email || '',
        name: profile.name,
        picture: profile.avatar_url,
        tier: profile.tier ?? 'free',
      },
      token: null,
    },
  });
}

async function clearAuthState(): Promise<void> {
  await chrome.storage.local.set({ 'ipa-auth': { isLoggedIn: false, user: null, token: null } });
}

// ── Auth handlers ────────────────────────────────────────────────

function notConfigured(): boolean {
  return !SUPABASE_URL || SUPABASE_URL.includes('your-project');
}

async function handleSignIn(
  msg: { email: string; password: string },
  sendResponse: (r: object) => void,
): Promise<void> {
  try {
    if (notConfigured()) { sendResponse({ error: 'Supabase not configured' }); return; }
    const { data, error } = await supabase.auth.signInWithPassword({ email: msg.email, password: msg.password });
    if (error || !data.user) { sendResponse({ error: error?.message ?? 'Sign-in failed' }); return; }
    const profile = await upsertProfile(data.user);
    await saveAuthState(data.user, profile);
    sendResponse({ user: { id: data.user.id, email: profile.email, name: profile.name, picture: profile.avatar_url, tier: profile.tier } });
  } catch (e) { sendResponse({ error: String(e) }); }
}

async function handleSignUp(
  msg: { email: string; password: string; name?: string },
  sendResponse: (r: object) => void,
): Promise<void> {
  try {
    if (notConfigured()) { sendResponse({ error: 'Supabase not configured' }); return; }
    const { data, error } = await supabase.auth.signUp({
      email: msg.email,
      password: msg.password,
      options: { data: { full_name: msg.name ?? msg.email.split('@')[0] } },
    });
    if (error) { sendResponse({ error: error.message }); return; }
    if (!data.user) { sendResponse({ error: 'Check your email to confirm sign-up' }); return; }
    const profile = await upsertProfile(data.user);
    await saveAuthState(data.user, profile);
    sendResponse({ user: { id: data.user.id, email: profile.email, name: profile.name, picture: profile.avatar_url, tier: profile.tier } });
  } catch (e) { sendResponse({ error: String(e) }); }
}

// Returns OAuth URL — popup calls launchWebAuthFlow directly (user gesture required)
async function handleGetOAuthUrl(sendResponse: (r: object) => void): Promise<void> {
  try {
    if (notConfigured()) { sendResponse({ error: 'Supabase not configured' }); return; }
    const redirectUrl = chrome.identity.getRedirectURL();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectUrl, skipBrowserRedirect: true },
    });
    if (error || !data.url) { sendResponse({ error: error?.message ?? 'Failed to get OAuth URL' }); return; }
    sendResponse({ oauthUrl: data.url, redirectUrl });
  } catch (e) { sendResponse({ error: String(e) }); }
}

// Receives tokens from popup after launchWebAuthFlow
async function handleSetSession(
  msg: { accessToken?: string; refreshToken?: string; code?: string },
  sendResponse: (r: object) => void,
): Promise<void> {
  try {
    let user: User | null = null;
    if (msg.accessToken) {
      const { data, error } = await supabase.auth.setSession({ access_token: msg.accessToken, refresh_token: msg.refreshToken ?? '' });
      if (error) { sendResponse({ error: error.message }); return; }
      user = data.user;
    } else if (msg.code) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(msg.code);
      if (error) { sendResponse({ error: error.message }); return; }
      user = data.user;
    }
    if (!user) { sendResponse({ error: 'No user from session' }); return; }
    const profile = await upsertProfile(user);
    await saveAuthState(user, profile);
    sendResponse({ user: { id: user.id, email: profile.email, name: profile.name, picture: profile.avatar_url, tier: profile.tier } });
  } catch (e) { sendResponse({ error: String(e) }); }
}

async function handleLogout(sendResponse: (r: object) => void): Promise<void> {
  try {
    await supabase.auth.signOut();
    await clearAuthState();
    sendResponse({ ok: true });
  } catch (e) {
    sendResponse({ error: String(e) });
  }
}

async function handleGetSession(sendResponse: (r: object) => void): Promise<void> {
  try {
    const { data } = await supabase.auth.getSession();
    if (!data.session) { sendResponse({ user: null }); return; }
    const profile = await upsertProfile(data.session.user);
    await saveAuthState(data.session.user, profile);
    sendResponse({ user: { id: data.session.user.id, email: profile.email, name: profile.name, picture: profile.avatar_url, tier: profile.tier } });
  } catch (e) {
    sendResponse({ error: String(e) });
  }
}

// ── Stripe handlers ──────────────────────────────────────────────

const SUPABASE_FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;

async function syncTierFromDb(userId: string): Promise<'free' | 'pro'> {
  const { data } = await supabase.from('profiles').select('tier').eq('id', userId).single();
  return (data?.tier as 'free' | 'pro') ?? 'free';
}

async function handleSyncTier(sendResponse: (r: object) => void): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { sendResponse({ tier: 'free' }); return; }
    // Use upsertProfile + saveAuthState — same path as login, triggers storage listeners correctly
    const profile = await upsertProfile(session.user);
    await saveAuthState(session.user, profile);
    sendResponse({ tier: profile.tier });
  } catch (e) { sendResponse({ error: String(e) }); }
}

async function handleOpenCheckout(
  msg: { interval: 'month' | 'year' },
  sendResponse: (r: object) => void,
): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { sendResponse({ error: 'Not logged in' }); return; }
    const res = await fetch(`${SUPABASE_FUNCTIONS_URL}/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ interval: msg.interval }),
    });
    const data = await res.json() as { url?: string; error?: string };
    if (!data.url) { sendResponse({ error: data.error ?? 'No checkout URL' }); return; }
    await chrome.tabs.create({ url: data.url });
    sendResponse({ ok: true });
  } catch (e) { sendResponse({ error: String(e) }); }
}

async function handleOpenPortal(sendResponse: (r: object) => void): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { sendResponse({ error: 'Not logged in' }); return; }
    const res = await fetch(`${SUPABASE_FUNCTIONS_URL}/create-portal-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
    });
    const data = await res.json() as { url?: string; error?: string };
    if (!data.url) { sendResponse({ error: data.error ?? 'No portal URL' }); return; }
    await chrome.tabs.create({ url: data.url });
    sendResponse({ ok: true });
  } catch (e) { sendResponse({ error: String(e) }); }
}

async function handleAnkiAdd(
  msg: { word: string; ipa: string; definition: string },
  sendResponse: (response: any) => void
): Promise<void> {
  try {
    const raw = await chrome.storage.sync.get('ipa-settings');
    const settings = raw['ipa-settings'] || {};
    const ankiEnabled = settings.ankiEnabled ?? true;
    const ankiEndpoint = settings.ankiEndpoint || 'http://localhost:8765';

    if (!ankiEnabled) {
      sendResponse({ error: 'Anki sync is disabled in settings.' });
      return;
    }

    const deckName = settings.ankiDeckName || 'Lumen Pronunciation';

    // 1. Pastikan deck tersedia
    const createRes = await fetch(ankiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'createDeck', version: 6, params: { deck: deckName } })
    });
    if (!createRes.ok) throw new Error(`HTTP Error: ${createRes.status}`);

    const frontTemplate = settings.ankiFrontTemplate || '<h2>{{word}}</h2><br><i>{{word.phonetic}}</i>';
    const backTemplate = settings.ankiBackTemplate || '{{definitions}}';

    const parseTemplate = (tpl: string) => {
      return tpl
        .replace(/\{\{word\}\}/g, msg.word || '')
        .replace(/\{\{word\.phonetic\}\}/g, msg.ipa || '')
        .replace(/\{\{definitions\}\}/g, msg.definition || 'No definition saved.')
        .replace(/\{\{translations\}\}/g, '')
        .replace(/\{\{sentence\}\}/g, '')
        .replace(/\{\{sentence\.phonetic\}\}/g, '')
        .replace(/\{\{word\.audio\}\}/g, '')
        .replace(/\{\{word\.image\}\}/g, '')
        .replace(/\{\{links\}\}/g, '')
        .replace(/\{\{word\.baseform\}\}/g, '')
        .replace(/\{\{word\.parts-of-speech\}\}/g, '')
        .replace(/\{\{language\}\}/g, 'English')
        .replace(/\{\{definitions\.numbered\}\}/g, msg.definition ? `1. ${msg.definition}` : 'No definition saved.')
        .replace(/\{\{definitions\.translated\}\}/g, '')
        .replace(/\{\{screenshot\.video\}\}/g, '')
        .replace(/\{\{ai\.text\.definition\}\}/g, '')
        .replace(/\{\{ai\.word\.image\}\}/g, '');
    };

    // 2. Fetch field names
    let availableFields: string[] = ['Front', 'Back'];
    try {
      const fieldsRes = await fetch(ankiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'modelFieldNames',
          version: 6,
          params: { modelName: settings.ankiModelName || 'Basic' }
        })
      });

      if (!fieldsRes.ok) throw new Error('Failed to fetch model fields');

      const fieldsData = await fieldsRes.json() as { result: string[] | null; error: string | null };
      if (fieldsData.error) {
        sendResponse({ error: `Anki Error: ${fieldsData.error}` });
        return;
      }

      if (fieldsData.result && fieldsData.result.length > 0) {
        availableFields = fieldsData.result;
      } else {
        sendResponse({ error: 'Selected Note Type has no fields.' });
        return;
      }
    } catch (err) {
      sendResponse({ error: 'Failed to connect to Anki. Is Anki app open?' });
      return;
    }

    // 3. Susun isi kartu
    const noteFields: Record<string, string> = {};
    if (availableFields.length >= 2) {
      noteFields[availableFields[0]] = parseTemplate(frontTemplate);
      noteFields[availableFields[1]] = parseTemplate(backTemplate);

      for (let i = 2; i < availableFields.length; i++) {
        noteFields[availableFields[i]] = '';
      }
    } else if (availableFields.length === 1) {
      noteFields[availableFields[0]] = parseTemplate(frontTemplate) + '<br><br>' + parseTemplate(backTemplate);
    }

    const note = {
      deckName,
      modelName: settings.ankiModelName || 'Basic',
      fields: noteFields,
      options: { allowDuplicate: false },
      tags: ['lumen_pronunciation']
    };

    // 4. Kirim ke Anki
    const res = await fetch(ankiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'addNote', version: 6, params: { note } })
    });

    const data = await res.json() as { error: string | null };
    if (data.error) {
      if (data.error.includes('duplicate')) {
        sendResponse({ error: 'Card already exists in Anki' });
      } else {
        sendResponse({ error: data.error });
      }
      return;
    }

    sendResponse({ ok: true });
  } catch (e: any) {
    console.error("Anki Sync Error:", e);
    sendResponse({ error: `Connection failed: ${e.message || 'Is Anki open?'}` });
  }
}
// ── Message router ───────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'SUPABASE_SIGN_IN') { void handleSignIn(msg, sendResponse); return true; }
  if (msg.type === 'SUPABASE_SIGN_UP') { void handleSignUp(msg, sendResponse); return true; }
  if (msg.type === 'SUPABASE_GET_OAUTH_URL') { void handleGetOAuthUrl(sendResponse); return true; }
  if (msg.type === 'SUPABASE_SET_SESSION') { void handleSetSession(msg, sendResponse); return true; }
  if (msg.type === 'SUPABASE_LOGOUT') { void handleLogout(sendResponse); return true; }
  if (msg.type === 'SUPABASE_GET_SESSION') { void handleGetSession(sendResponse); return true; }
  if (msg.type === 'TTS_FETCH') { void handleTts(msg.word as string, sendResponse); return true; }
  if (msg.type === 'SYNC_TIER') { void handleSyncTier(sendResponse); return true; }
  if (msg.type === 'STRIPE_OPEN_CHECKOUT') { void handleOpenCheckout(msg as { interval: 'month' | 'year' }, sendResponse); return true; }
  if (msg.type === 'STRIPE_OPEN_PORTAL') { void handleOpenPortal(sendResponse); return true; }
  if (msg.type === 'ANKI_ADD_CARD') { void handleAnkiAdd(msg as { word: string; ipa: string; definition: string }, sendResponse); return true; }
  return false;
});

// ── TTS ─────────────────────────────────────────────────────────

function md5(str: string): string {
  const k = [
    0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee,
    0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501,
    0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be,
    0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821,
    0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa,
    0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
    0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed,
    0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a,
    0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c,
    0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70,
    0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05,
    0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
    0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039,
    0x655b59c3, 0x8f0ccc92, 0xffeff47d, 0x85845dd1,
    0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1,
    0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391
  ];
  const s = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21
  ];

  let h0 = 0x67452301;
  let h1 = 0xefcdab89;
  let h2 = 0x98badcfe;
  let h3 = 0x10325476;

  const utf8 = unescape(encodeURIComponent(str));
  const msgLen = utf8.length;
  const words = new Uint32Array(((msgLen + 8) >> 6) * 16 + 16);
  for (let i = 0; i < msgLen; i++) {
    words[i >> 2] |= utf8.charCodeAt(i) << ((i % 4) * 8);
  }
  words[msgLen >> 2] |= 0x80 << ((msgLen % 4) * 8);
  words[words.length - 2] = msgLen * 8;

  const rotateLeft = (x: number, n: number) => (x << n) | (x >>> (32 - n));

  for (let j = 0; j < words.length; j += 16) {
    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;

    for (let i = 0; i < 64; i++) {
      let f = 0;
      let g = 0;

      if (i < 16) {
        f = (b & c) | (~b & d);
        g = i;
      } else if (i < 32) {
        f = (d & b) | (~d & c);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        f = b ^ c ^ d;
        g = (3 * i + 5) % 16;
      } else {
        f = c ^ (b | ~d);
        g = (7 * i) % 16;
      }

      const temp = d;
      d = c;
      c = b;
      b = (b + rotateLeft(a + f + k[i] + words[j + g], s[i])) | 0;
      a = temp;
    }

    h0 = (h0 + a) | 0;
    h1 = (h1 + b) | 0;
    h2 = (h2 + c) | 0;
    h3 = (h3 + d) | 0;
  }

  const toHex = (n: number) => {
    let out = '';
    for (let i = 0; i < 4; i++) {
      out += ((n >> (i * 8)) & 0xff).toString(16).padStart(2, '0');
    }
    return out;
  };

  return toHex(h0) + toHex(h1) + toHex(h2) + toHex(h3);
}

function getWikimediaUrl(filename: string): string {
  let normalized = filename.trim().replace(/ /g, '_');
  if (normalized.length > 0) {
    normalized = normalized[0].toUpperCase() + normalized.slice(1);
  }
  const hash = md5(normalized);
  const h1 = hash[0];
  const h2 = hash.substring(0, 2);
  return `https://upload.wikimedia.org/wikipedia/commons/${h1}/${h2}/${encodeURIComponent(normalized)}`;
}

let loadedDialect: string | null = null;
let audioMap: Record<string, string> | null = null;

async function getAudioMap(dialect: string): Promise<Record<string, string>> {
  if (audioMap && loadedDialect === dialect) {
    return audioMap;
  }
  try {
    const file = dialect === 'brE' ? 'en-BrE-audios.txt' : 'en-NAmE-audios.txt';
    const url = chrome.runtime.getURL(file);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load ${file}`);
    audioMap = await res.json() as Record<string, string>;
    loadedDialect = dialect;
    return audioMap;
  } catch (err) {
    console.error("Failed to load audio map:", err);
    return {};
  }
}

const getTtsSources = (word: string, dialect: string) => {
  const langCode = dialect === 'brE' ? 'en-GB' : 'en-US';
  const voice = dialect === 'brE' ? 'Emma' : 'Brian';
  return [
    `https://translate.googleapis.com/translate_tts?ie=UTF-8&client=gtx&tl=${langCode}&q=${encodeURIComponent(word)}&total=1&idx=0&textlen=${word.length}&prev=input`,
    `https://api.streamelements.com/kappa/v2/speech?voice=${voice}&text=${encodeURIComponent(word)}`,
  ];
};

async function handleTts(word: string, sendResponse: (r: object) => void): Promise<void> {
  try {
    const raw = await chrome.storage.sync.get('ipa-settings');
    const settings = raw['ipa-settings'] || {};
    const activeDialect = settings.pronunciationDialect || 'nAmE';

    // 1. Try Wikimedia Commons audio map first
    const map = await getAudioMap(activeDialect);
    const filename = map[word.toLowerCase()];
    if (filename) {
      const wikimediaUrl = getWikimediaUrl(filename);
      try {
        const res = await fetch(wikimediaUrl);
        if (res.ok) {
          const buf = await res.arrayBuffer();
          if (buf.byteLength > 0) {
            const bytes = new Uint8Array(buf);
            let binary = '';
            for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
            const ext = filename.split('.').pop()?.toLowerCase();
            const mimeType = ext === 'wav' ? 'audio/x-wav' : (ext === 'flac' ? 'audio/flac' : 'audio/ogg');
            sendResponse({ base64: btoa(binary), mimeType });
            return;
          }
        }
      } catch (e) {
        console.error("Failed to fetch Wikimedia audio, falling back to TTS:", e);
      }
    }

    // 2. Fallback to Google / StreamElements TTS
    for (const url of getTtsSources(word, activeDialect)) {
      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        const buf = await res.arrayBuffer();
        if (buf.byteLength === 0) continue;
        const bytes = new Uint8Array(buf);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
        sendResponse({ base64: btoa(binary), mimeType: res.headers.get('content-type') ?? 'audio/mpeg' });
        return;
      } catch {
        continue;
      }
    }
  } catch (err) {
    console.error("Error in handleTts:", err);
  }

  sendResponse({ error: 'all_failed' });
}

chrome.runtime.onInstalled.addListener(() => {
  console.log('[IPA Stylizer] Extension installed');
});

// Sync tier from DB on service worker startup
(async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const profile = await upsertProfile(session.user);
    await saveAuthState(session.user, profile);
  } catch { /* silent */ }
})();

// Refresh tier from DB every 5 minutes
setInterval(async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;
  const tier = await syncTierFromDb(session.user.id);
  const stored = await chrome.storage.local.get('ipa-auth');
  const auth = stored['ipa-auth'];
  if (auth?.user && auth.user.tier !== tier) {
    auth.user.tier = tier;
    await chrome.storage.local.set({ 'ipa-auth': auth });
  }
}, 5 * 60 * 1000);

// Immediately sync tier when user lands on success page after checkout
const SUCCESS_URL_PATTERNS = ['localhost:3000/pro-activated', 'lumenpronunciation.com/pro-activated'];

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete') return;
  const url = tab.url ?? '';
  if (!SUCCESS_URL_PATTERNS.some(p => url.includes(p))) return;

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  const tier = await syncTierFromDb(session.user.id);
  const stored = await chrome.storage.local.get('ipa-auth');
  const auth = stored['ipa-auth'];
  if (auth?.user) {
    auth.user.tier = tier;
    await chrome.storage.local.set({ 'ipa-auth': auth });
  }
});
