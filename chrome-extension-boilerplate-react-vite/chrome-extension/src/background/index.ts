import 'webextension-polyfill';

chrome.runtime.onInstalled.addListener(() => {
  console.log('[IPA Stylizer] Extension installed');
});

const TTS_SOURCES = (word: string) => [
  `https://translate.googleapis.com/translate_tts?ie=UTF-8&client=gtx&tl=en-US&q=${encodeURIComponent(word)}&total=1&idx=0&textlen=${word.length}&prev=input`,
  `https://api.streamelements.com/kappa/v2/speech?voice=Brian&text=${encodeURIComponent(word)}`,
];

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type !== 'TTS_FETCH') return false;

  (async () => {
    for (const url of TTS_SOURCES(msg.word as string)) {
      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        const buf = await res.arrayBuffer();
        if (buf.byteLength === 0) continue;
        // convert to base64 in chunks to avoid stack overflow on large buffers
        const bytes = new Uint8Array(buf);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
        sendResponse({ base64: btoa(binary), mimeType: res.headers.get('content-type') ?? 'audio/mpeg' });
        return;
      } catch { continue; }
    }
    sendResponse({ error: 'all_failed' });
  })();

  return true; // async sendResponse
});
