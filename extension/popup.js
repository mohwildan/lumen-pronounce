const MOD_KEYS = ['silent', 'colors', 'stress', 'consonants', 'diphthongs', 'length', 'tmark', 'zmark'];
const globalEnabledEl = document.getElementById('enabled');
const domainEnabledEl = document.getElementById('domainEnabled');
const domainText      = document.getElementById('currentDomain');
const saveStatus      = document.getElementById('saveStatus');

let currentHost = '';

// Get current tab domain
chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
  if (tabs[0] && tabs[0].url) {
    try {
      currentHost = new URL(tabs[0].url).hostname;
      domainText.textContent = currentHost;
    } catch (e) {
      domainText.textContent = 'Browser Page';
      domainEnabledEl.disabled = true;
    }
  }
  loadSettings();
});

function loadSettings() {
  chrome.storage.sync.get(['enabled', 'opts', 'blacklist'], data => {
    globalEnabledEl.checked = data.enabled !== false;
    
    const blacklist = data.blacklist ?? [];
    domainEnabledEl.checked = !blacklist.includes(currentHost);

    const o = data.opts ?? {};
    MOD_KEYS.forEach(k => {
      const el = document.getElementById(k);
      if (el) el.checked = o[k] !== false;
    });
  });
}

async function saveSettings() {
  const opts = {};
  MOD_KEYS.forEach(k => {
    const el = document.getElementById(k);
    if (el) opts[k] = el.checked;
  });

  const enabled = globalEnabledEl.checked;
  
  // Handle blacklist
  const data = await chrome.storage.sync.get(['blacklist']);
  let blacklist = data.blacklist ?? [];
  if (!domainEnabledEl.checked) {
    if (!blacklist.includes(currentHost)) blacklist.push(currentHost);
  } else {
    blacklist = blacklist.filter(h => h !== currentHost);
  }

  await chrome.storage.sync.set({ enabled, opts, blacklist });
  
  // Show "Saved" toast
  saveStatus.classList.add('show');
  setTimeout(() => saveStatus.classList.remove('show'), 1000);
}

// Auto-save on any change
document.querySelectorAll('input').forEach(input => {
  input.addEventListener('change', saveSettings);
});
