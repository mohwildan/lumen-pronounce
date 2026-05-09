const MOD_KEYS = ['enabled', 'silent', 'colors', 'stress', 'consonants', 'diphthongs', 'length', 'tmark', 'zmark'];

// Tab switching
const tabLinks = document.querySelectorAll('.tab-link');
const tabContents = document.querySelectorAll('.tab-content');

tabLinks.forEach(link => {
  link.addEventListener('click', () => {
    const tabId = link.getAttribute('data-tab');
    
    tabLinks.forEach(l => l.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));
    
    link.classList.add('active');
    document.getElementById(tabId).classList.add('active');
  });
});

// Settings Management
function loadSettings() {
  chrome.storage.sync.get(['enabled', 'opts', 'blacklist'], data => {
    enabled.checked = data.enabled !== false;
    const o = data.opts ?? {};
    MOD_KEYS.slice(1).forEach(k => {
      const el = document.getElementById(k);
      if (el) el.checked = o[k] !== false;
    });
  });
}

function saveSettings() {
  const opts = {};
  MOD_KEYS.slice(1).forEach(k => {
    opts[k] = document.getElementById(k).checked;
  });

  const enabled = document.getElementById('enabled').checked;

  chrome.storage.sync.set({ enabled, opts }, () => {
    const status = document.getElementById('saveStatus');
    status.style.opacity = '1';
    setTimeout(() => status.style.opacity = '0', 2000);
  });
}

document.getElementById('saveBtnBottom').addEventListener('click', saveSettings);
document.getElementById('resetBtn').addEventListener('click', () => {
  if (confirm('Are you sure you want to reset all settings to defaults?')) {
    chrome.storage.sync.clear(() => {
      loadSettings();
      saveSettings();
    });
  }
});

// Dictionary Search
let dict = null;
const dictInput = document.getElementById('dictInput');
const dictResult = document.getElementById('dictResult');

async function loadDict() {
  try {
    const response = await fetch(chrome.runtime.getURL('pronunciation.json'));
    dict = await response.json();
    dictResult.textContent = 'Dictionary ready. Enter a word above.';
  } catch (e) {
    dictResult.textContent = 'Failed to load dictionary.';
  }
}

dictInput.addEventListener('input', () => {
  const word = dictInput.value.trim().toLowerCase();
  if (!word) {
    dictResult.textContent = 'Enter a word to test...';
    return;
  }
  if (!dict) {
    dictResult.textContent = 'Dictionary not loaded yet.';
    return;
  }
  const result = dict[word];
  if (result) {
    dictResult.textContent = `${word}: ${result}`;
    dictResult.style.color = '#7b61ff';
  } else {
    dictResult.textContent = `"${word}" not found in dictionary.`;
    dictResult.style.color = '#e06060';
  }
});

// Initialize
loadSettings();
loadDict();
