import 'webextension-polyfill';

chrome.runtime.onInstalled.addListener(() => {
  console.log('[IPA Stylizer] Extension installed');
});
