// Mock for Chrome APIs so extension components can run in the browser
const mockStorage = {
  'ipa-settings': {
    enabled: true,
    opts: {
      silent: true,
      color_e: true,
      color_i: true,
      color_u_alt: false, // Purple off
      color_a: false,     // Pink off
      color_u: false,     // Teal off
      color_o: false,     // Amber off
      stress: false,      // Stress off
      tmark: true,
      th_t: true,
      zmark: true,
      diph_ai: true,
      diph_ei_oi: true,
      phonemes: true,
      th_d: true,
      diph_ou_au: true,
      length: false       // Long Vowels off
    },
    blacklist: [],
    targetLanguage: 'id',
    translatePerSentence: true,
    pauseOnHover: false,
  }
};
const listeners = new Set();

window.chrome = window.chrome || {};

window.chrome.runtime = {
  getURL: (path) => '/' + path,
  openOptionsPage: () => console.log('Mock: openOptionsPage called'),
  id: 'mock-extension-id'
};

window.chrome.tabs = {
  query: (queryInfo, callback) => {
    if (callback) {
      callback([{ url: 'https://example.com/demo-article', id: 1 }]);
    } else {
      return Promise.resolve([{ url: 'https://example.com/demo-article', id: 1 }]);
    }
  }
};

window.chrome.storage = {
  onChanged: {
    addListener: (callback) => listeners.add(callback),
    removeListener: (callback) => listeners.delete(callback),
  }
};

const storageArea = {
  get: (keys) => {
    return new Promise((resolve) => {
      let result = {};
      if (keys === null) {
        result = { ...mockStorage };
      } else if (typeof keys === 'string') {
        result[keys] = mockStorage[keys];
      } else if (Array.isArray(keys)) {
        keys.forEach(k => result[k] = mockStorage[k]);
      } else if (typeof keys === 'object') {
        Object.keys(keys).forEach(k => {
          result[k] = mockStorage[k] !== undefined ? mockStorage[k] : keys[k];
        });
      }
      resolve(result);
    });
  },
  set: (items) => {
    return new Promise((resolve) => {
      const changes = {};
      Object.keys(items).forEach(k => {
        const oldValue = mockStorage[k];
        const newValue = items[k];
        if (oldValue !== newValue) {
          mockStorage[k] = newValue;
          changes[k] = { oldValue, newValue };
        }
      });
      
      if (Object.keys(changes).length > 0) {
        listeners.forEach(listener => listener(changes, 'local'));
      }
      resolve();
    });
  },
  onChanged: {
    addListener: (callback) => listeners.add(callback),
    removeListener: (callback) => listeners.delete(callback),
  }
};

window.chrome.storage.local = storageArea;
window.chrome.storage.sync = storageArea;
window.chrome.storage.session = storageArea;
