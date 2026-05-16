import { createStorage, StorageEnum } from '../base/index.js';
import type { BaseStorageType } from '../base/index.js';

export type IpaUser = {
  id: string;
  email: string;
  name: string;
  picture: string;
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
  login: () => Promise<IpaUser | null>;
  logout: () => Promise<void>;
};

const storage = createStorage<IpaAuthState>('ipa-auth', DEFAULT_AUTH, {
  storageEnum: StorageEnum.Local,
  liveUpdate: true,
});

async function fetchUserInfo(token: string): Promise<IpaUser | null> {
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      picture: data.picture,
    };
  } catch {
    return null;
  }
}

export const ipaAuthStorage: IpaAuthStorageType = {
  ...storage,
  login: async () => {
    try {
      const token = await new Promise<string>((resolve, reject) => {
        chrome.identity.getAuthToken({ interactive: true }, token => {
          if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
          else resolve(token as string);
        });
      });
      const user = await fetchUserInfo(token);
      if (!user) return null;
      await storage.set({ isLoggedIn: true, user, token });
      return user;
    } catch {
      return null;
    }
  },
  logout: async () => {
    const state = await storage.get();
    if (state.token) {
      await new Promise<void>(resolve => {
        chrome.identity.removeCachedAuthToken({ token: state.token! }, resolve);
      });
    }
    await storage.set(DEFAULT_AUTH);
  },
};
