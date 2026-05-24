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

export type IpaColorMap = {
  red?: string;
  green?: string;
  purple?: string;
  pink?: string;
  teal?: string;
  orange?: string;
};

export type IpaPopupMode =
  | 'hover_or_click'
  | 'hover_only'
  | 'click_only'
  | 'option_click'
  | 'cmd_hover'
  | 'ctrl_hover'
  | 'disabled';

export type IpaShortcuts = {
  rewind: string;
  forward: string;
  playPause: string;
};

export type IpaSettingsState = {
  enabled: boolean;
  opts: IpaOpts;
  colorMap?: IpaColorMap;
  popupMode: IpaPopupMode;
  hoverDelayMs: number;
  /** Per-site overrides. true = force active, false = force disabled. Missing = follow global. */
  siteOverrides: Record<string, boolean>;
  /** @deprecated use siteOverrides */
  blacklist: string[];
  targetLanguage: string;
  translatePerSentence: boolean;
  pauseOnHover: boolean;
  ankiEnabled: boolean;
  ankiEndpoint: string;
  ankiFrontTemplate: string;
  ankiBackTemplate: string;
  ankiDeckName: string;
  ankiModelName: string;
  ankiFieldTemplates?: Record<string, string>;
  ankiAllowDuplicate?: boolean;
  ankiOfflineEnabled?: boolean;
  shortcuts: IpaShortcuts;
  pronunciationDialect: 'nAmE' | 'brE';
  enableBaseforms: boolean;
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
  popupMode: 'hover_or_click',
  hoverDelayMs: 380,
  targetLanguage: 'en',
  translatePerSentence: true,
  pauseOnHover: false,
  ankiEnabled: true,
  ankiEndpoint: 'http://localhost:8765',
  ankiFrontTemplate: '<h2>{{word}}</h2><br><i>{{word.phonetic}}</i>',
  ankiBackTemplate: '{{definitions}}',
  ankiDeckName: 'Lumen Pronunciation',
  ankiModelName: 'Basic',
  ankiFieldTemplates: {},
  ankiAllowDuplicate: false,
  ankiOfflineEnabled: true,
  shortcuts: {
    rewind: 'a',
    forward: 'd',
    playPause: 's',
  },
  pronunciationDialect: 'nAmE',
  enableBaseforms: true,
};

export type IpaSettingsStorageType = BaseStorageType<IpaSettingsState> & {
  setEnabled: (enabled: boolean) => Promise<void>;
  setOpt: (key: keyof IpaOpts, value: boolean) => Promise<void>;
  setColor: (key: keyof IpaColorMap, value: string) => Promise<void>;
  clearColorMap: () => Promise<void>;
  setPopupMode: (mode: IpaPopupMode) => Promise<void>;
  setHoverDelayMs: (delayMs: number) => Promise<void>;
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
  setAnkiFrontTemplate: (val: string) => Promise<void>;
  setAnkiBackTemplate: (val: string) => Promise<void>;
  setAnkiDeckName: (val: string) => Promise<void>;
  setAnkiModelName: (val: string) => Promise<void>;
  setAnkiFieldTemplates: (val: Record<string, string>) => Promise<void>;
  setAnkiAllowDuplicate: (val: boolean) => Promise<void>;
  setAnkiOfflineEnabled: (val: boolean) => Promise<void>;
  setShortcuts: (val: IpaShortcuts) => Promise<void>;
  setPronunciationDialect: (val: 'nAmE' | 'brE') => Promise<void>;
  setEnableBaseforms: (val: boolean) => Promise<void>;
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
  setColor: async (key: keyof IpaColorMap, value: string) => {
    await storage.set(prev => ({
      ...prev,
      colorMap: { ...(prev.colorMap ?? {}), [key]: value },
    }));
  },
  clearColorMap: async () => {
    await storage.set(prev => ({ ...prev, colorMap: undefined }));
  },
  setPopupMode: async (popupMode: IpaPopupMode) => {
    await storage.set(prev => ({ ...prev, popupMode }));
  },
  setHoverDelayMs: async (hoverDelayMs: number) => {
    await storage.set(prev => ({ ...prev, hoverDelayMs }));
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
  setAnkiFrontTemplate: async (ankiFrontTemplate: string) => {
    await storage.set(prev => ({ ...prev, ankiFrontTemplate }));
  },
  setAnkiBackTemplate: async (ankiBackTemplate: string) => {
    await storage.set(prev => ({ ...prev, ankiBackTemplate }));
  },
  setAnkiDeckName: async (ankiDeckName: string) => {
    await storage.set(prev => ({ ...prev, ankiDeckName }));
  },
  setAnkiModelName: async (ankiModelName: string) => {
    await storage.set(prev => ({ ...prev, ankiModelName }));
  },
  setAnkiFieldTemplates: async (ankiFieldTemplates: Record<string, string>) => {
    await storage.set(prev => ({ ...prev, ankiFieldTemplates }));
  },
  setAnkiAllowDuplicate: async (ankiAllowDuplicate: boolean) => {
    await storage.set(prev => ({ ...prev, ankiAllowDuplicate }));
  },
  setAnkiOfflineEnabled: async (ankiOfflineEnabled: boolean) => {
    await storage.set(prev => ({ ...prev, ankiOfflineEnabled }));
  },
  setShortcuts: async (shortcuts: IpaShortcuts) => {
    await storage.set(prev => ({ ...prev, shortcuts }));
  },
  setPronunciationDialect: async (pronunciationDialect: 'nAmE' | 'brE') => {
    await storage.set(prev => ({ ...prev, pronunciationDialect }));
  },
  setEnableBaseforms: async (enableBaseforms: boolean) => {
    await storage.set(prev => ({ ...prev, enableBaseforms }));
  },
  reset: async () => {
    await storage.set(DEFAULT_STATE);
  },
};
