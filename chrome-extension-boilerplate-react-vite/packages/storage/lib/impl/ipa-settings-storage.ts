import { createStorage, StorageEnum } from '../base/index.js';
import type { BaseStorageType } from '../base/index.js';

export type IpaOpts = {
  silent: boolean;
  color_e: boolean;
  color_i: boolean;
  color_u_alt: boolean;
  color_a: boolean;
  color_u: boolean;
  color_o: boolean;
  stress: boolean;
  tmark: boolean;
  th_t: boolean;
  zmark: boolean;
  diph_ai: boolean;
  diph_ei_oi: boolean;
  phonemes: boolean;
  th_d: boolean;
  diph_ou_au: boolean;
  length: boolean;
};

export type IpaSettingsState = {
  enabled: boolean;
  opts: IpaOpts;
  /** Per-site overrides. true = force active, false = force disabled. Missing = follow global. */
  siteOverrides: Record<string, boolean>;
  /** @deprecated use siteOverrides */
  blacklist: string[];
  targetLanguage: string;
  translatePerSentence: boolean;
  pauseOnHover: boolean;
  ankiEnabled: boolean;
  ankiEndpoint: string;
  ankiDeckName: string;
  ankiNoteType: string;
  ankiFront: string;
  ankiBack: string;
};

const DEFAULT_OPTS: IpaOpts = {
  silent: true,
  color_e: true,
  color_i: true,
  color_u_alt: true,
  color_a: true,
  color_u: true,
  color_o: true,
  stress: true,
  tmark: true,
  th_t: true,
  zmark: true,
  diph_ai: true,
  diph_ei_oi: true,
  phonemes: true,
  th_d: true,
  diph_ou_au: true,
  length: true,
};

const DEFAULT_STATE: IpaSettingsState = {
  enabled: true,
  opts: DEFAULT_OPTS,
  siteOverrides: {},
  blacklist: [],
  targetLanguage: 'en',
  translatePerSentence: true,
  pauseOnHover: false,
  ankiEnabled: true,
  ankiEndpoint: 'http://localhost:8765',
  ankiDeckName: 'Lumen Pronunciation',
  ankiNoteType: 'Basic',
  ankiFront: '{{word}}
<br><i>{{ipa}}</i>',
  ankiBack: '{{definition}}',
};

export type IpaSettingsStorageType = BaseStorageType<IpaSettingsState> & {
  setEnabled: (enabled: boolean) => Promise<void>;
  setOpt: (key: keyof IpaOpts, value: boolean) => Promise<void>;
  /** Set explicit on/off override for a site. */
  setSiteEnabled: (host: string, enabled: boolean) => Promise<void>;
  /** Remove per-site override — site follows global again. */
  clearSiteOverride: (host: string) => Promise<void>;
  /** Effective active state for host (site override > global). */
  isActiveOnSite: (host: string) => Promise<boolean>;
  /** @deprecated use setSiteEnabled(host, false) */
  addToBlacklist: (host: string) => Promise<void>;
  /** @deprecated use clearSiteOverride(host) */
  removeFromBlacklist: (host: string) => Promise<void>;
  /** @deprecated */
  isBlacklisted: (host: string) => Promise<boolean>;
  setLanguage: (lang: string) => Promise<void>;
  setTranslatePerSentence: (val: boolean) => Promise<void>;
  setPauseOnHover: (val: boolean) => Promise<void>;
  setAnkiEnabled: (val: boolean) => Promise<void>;
  setAnkiEndpoint: (val: string) => Promise<void>;
  setAnkiDeckName: (val: string) => Promise<void>;
  setAnkiNoteType: (val: string) => Promise<void>;
  setAnkiFront: (val: string) => Promise<void>;
  setAnkiBack: (val: string) => Promise<void>;
  reset: () => Promise<void>;
};

const storage = createStorage<IpaSettingsState>('ipa-settings', DEFAULT_STATE, {
  storageEnum: StorageEnum.Sync,
  liveUpdate: true,
});

export const ipaSettingsStorage: IpaSettingsStorageType = {
  ...storage,
  setEnabled: async (enabled: boolean) => {
    await storage.set(prev => ({ ...prev, enabled }));
  },
  setOpt: async (key: keyof IpaOpts, value: boolean) => {
    await storage.set(prev => ({ ...prev, opts: { ...prev.opts, [key]: value } }));
  },
  setSiteEnabled: async (host: string, enabled: boolean) => {
    await storage.set(prev => ({
      ...prev,
      siteOverrides: { ...(prev.siteOverrides ?? {}), [host]: enabled },
    }));
  },
  clearSiteOverride: async (host: string) => {
    await storage.set(prev => {
      const { [host]: _, ...rest } = prev.siteOverrides ?? {};
      return { ...prev, siteOverrides: rest };
    });
  },
  isActiveOnSite: async (host: string) => {
    const state = await storage.get();
    const override = (state.siteOverrides ?? {})[host];
    return override !== undefined ? override : state.enabled;
  },
  addToBlacklist: async (host: string) => {
    await storage.set(prev => ({
      ...prev,
      siteOverrides: { ...(prev.siteOverrides ?? {}), [host]: false },
      blacklist: prev.blacklist.includes(host) ? prev.blacklist : [...prev.blacklist, host],
    }));
  },
  removeFromBlacklist: async (host: string) => {
    await storage.set(prev => {
      const { [host]: _, ...rest } = prev.siteOverrides ?? {};
      return { ...prev, siteOverrides: rest, blacklist: prev.blacklist.filter(h => h !== host) };
    });
  },
  isBlacklisted: async (host: string) => {
    const state = await storage.get();
    return (state.blacklist ?? []).includes(host);
  },
  setLanguage: async (targetLanguage: string) => {
    await storage.set(prev => ({ ...prev, targetLanguage }));
  },
  setTranslatePerSentence: async (translatePerSentence: boolean) => {
    await storage.set(prev => ({ ...prev, translatePerSentence }));
  },
  setPauseOnHover: async (pauseOnHover: boolean) => {
    await storage.set(prev => ({ ...prev, pauseOnHover }));
  },
  setAnkiEnabled: async (ankiEnabled: boolean) => {
    await storage.set(prev => ({ ...prev, ankiEnabled }));
  },
  setAnkiEndpoint: async (ankiEndpoint: string) => {
    await storage.set(prev => ({ ...prev, ankiEndpoint }));
  },
  setAnkiDeckName: async (ankiDeckName: string) => {
    await storage.set(prev => ({ ...prev, ankiDeckName }));
  },
  setAnkiNoteType: async (ankiNoteType: string) => {
    await storage.set(prev => ({ ...prev, ankiNoteType }));
  },
  setAnkiFront: async (ankiFront: string) => {
    await storage.set(prev => ({ ...prev, ankiFront }));
  },
  setAnkiBack: async (ankiBack: string) => {
    await storage.set(prev => ({ ...prev, ankiBack }));
  },
  reset: async () => {
    await storage.set(DEFAULT_STATE);
  },
};
