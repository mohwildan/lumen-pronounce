import { createStorage, StorageEnum } from '../base/index.js';
import type { BaseStorageType } from '../base/index.js';

export type IpaUser = {
  id: string;
  email: string;
  name: string;
  picture: string;
  tier: 'free' | 'pro';
};

export type IpaAuthState = {
  isLoggedIn: boolean;
  user: IpaUser | null;
  token: string | null;
};

const DEFAULT_AUTH: IpaAuthState = {
  isLoggedIn: false,
  user: null,
  token: null,
};

export type IpaAuthStorageType = BaseStorageType<IpaAuthState> & {
  signIn: (email: string, password: string) => Promise<{ user?: IpaUser; error?: string }>;
  signUp: (email: string, password: string, name?: string) => Promise<{ user?: IpaUser; error?: string }>;
  loginWithGoogle: () => Promise<{ user?: IpaUser; error?: string }>;
  logout: () => Promise<void>;
};

const storage = createStorage<IpaAuthState>('ipa-auth', DEFAULT_AUTH, {
  storageEnum: StorageEnum.Local,
  liveUpdate: true,
});

type AuthResponse = { user?: IpaUser; error?: string };
type OAuthUrlResponse = { oauthUrl?: string; error?: string };

function msg<T>(type: string, extra?: object): Promise<T> {
  return new Promise<T>(resolve => {
    chrome.runtime.sendMessage({ type, ...extra }, (res: T | undefined) => {
      if (chrome.runtime.lastError) {
        resolve({ error: chrome.runtime.lastError.message } as T);
      } else {
        resolve(res as T);
      }
    });
  });
}

export const ipaAuthStorage: IpaAuthStorageType = {
  ...storage,

  signIn: async (email, password) => {
    const res = await msg<AuthResponse>('SUPABASE_SIGN_IN', { email, password });
    return res ?? { error: 'No response from background' };
  },

  signUp: async (email, password, name) => {
    const res = await msg<AuthResponse>('SUPABASE_SIGN_UP', { email, password, name });
    return res ?? { error: 'No response from background' };
  },

  loginWithGoogle: () =>
    new Promise<AuthResponse>(resolve => {
      // Step 1: get OAuth URL from background (no user gesture needed there)
      chrome.runtime.sendMessage({ type: 'SUPABASE_GET_OAUTH_URL' }, (res: OAuthUrlResponse | undefined) => {
        if (chrome.runtime.lastError || res?.error || !res?.oauthUrl) {
          resolve({ error: res?.error ?? chrome.runtime.lastError?.message ?? 'Failed to get OAuth URL' });
          return;
        }
        // Step 2: launchWebAuthFlow in popup context — user gesture still active
        chrome.identity.launchWebAuthFlow({ url: res.oauthUrl, interactive: true }, callbackUrl => {
          if (chrome.runtime.lastError || !callbackUrl) {
            resolve({ error: chrome.runtime.lastError?.message ?? 'Auth cancelled' });
            return;
          }
          const parsed = new URL(callbackUrl);
          const hash = new URLSearchParams(parsed.hash.substring(1));
          const query = new URLSearchParams(parsed.search);
          const accessToken = hash.get('access_token') ?? query.get('access_token');
          const refreshToken = hash.get('refresh_token') ?? query.get('refresh_token');
          const code = hash.get('code') ?? query.get('code');
          // Step 3: send tokens to background to create session
          chrome.runtime.sendMessage(
            { type: 'SUPABASE_SET_SESSION', accessToken, refreshToken, code },
            (r: AuthResponse | undefined) => {
              resolve(r ?? { error: 'No response from background' });
            },
          );
        });
      });
    }),

  logout: () =>
    new Promise<void>(resolve => {
      chrome.runtime.sendMessage({ type: 'SUPABASE_LOGOUT' }, () => resolve());
    }),
};
