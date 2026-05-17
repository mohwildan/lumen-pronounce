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
  const { data } = await supabase
    .from('profiles')
    .upsert(
      {
        id: user.id,
        email: user.email ?? '',
        name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email ?? '',
        avatar_url: user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? '',
      },
      { onConflict: 'id', ignoreDuplicates: true },
    )
    .select()
    .single();

  if (data) return data as Profile;

  const { data: existing } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  return (existing as Profile) ?? {
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

// ── Message router ───────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'SUPABASE_SIGN_IN') { void handleSignIn(msg, sendResponse); return true; }
  if (msg.type === 'SUPABASE_SIGN_UP') { void handleSignUp(msg, sendResponse); return true; }
  if (msg.type === 'SUPABASE_GET_OAUTH_URL') { void handleGetOAuthUrl(sendResponse); return true; }
  if (msg.type === 'SUPABASE_SET_SESSION') { void handleSetSession(msg, sendResponse); return true; }
  if (msg.type === 'SUPABASE_LOGOUT') { void handleLogout(sendResponse); return true; }
  if (msg.type === 'SUPABASE_GET_SESSION') { void handleGetSession(sendResponse); return true; }
  if (msg.type === 'TTS_FETCH') { void handleTts(msg.word as string, sendResponse); return true; }
  return false;
});

// ── TTS ─────────────────────────────────────────────────────────

const TTS_SOURCES = (word: string) => [
  `https://translate.googleapis.com/translate_tts?ie=UTF-8&client=gtx&tl=en-US&q=${encodeURIComponent(word)}&total=1&idx=0&textlen=${word.length}&prev=input`,
  `https://api.streamelements.com/kappa/v2/speech?voice=Brian&text=${encodeURIComponent(word)}`,
];

async function handleTts(word: string, sendResponse: (r: object) => void): Promise<void> {
  for (const url of TTS_SOURCES(word)) {
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
    } catch { continue; }
  }
  sendResponse({ error: 'all_failed' });
}

chrome.runtime.onInstalled.addListener(() => {
  console.log('[IPA Stylizer] Extension installed');
});
